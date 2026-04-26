# PerfectJob — Skill: Design Patterns

## Propósito
Catálogo de design patterns aplicáveis ao projeto PerfectJob, com exemplos práticos em Java/Spring Boot e TypeScript/React Native.

---

## 1. Design Patterns — Backend (Java / Spring Boot)

### 1.1 Strategy
**Quando usar:** Algoritmos intercambiáveis em runtime.
```java
// Interface
public interface JobMatchingStrategy {
    List<Job> match(User candidate, List<Job> jobs);
}

// Implementações
@Component
public class SkillBasedMatching implements JobMatchingStrategy {
    public List<Job> match(User user, List<Job> jobs) { /* matching por skills */ }
}

@Component
public class ExperienceBasedMatching implements JobMatchingStrategy {
    public List<Job> match(User user, List<Job> jobs) { /* matching por experiência */ }
}

// Contexto
@Service
public class JobMatchingService {
    private final Map<String, JobMatchingStrategy> strategies;

    public List<Job> match(User user, List<Job> jobs, String strategy) {
        return strategies.get(strategy).match(user, jobs);
    }
}
```

### 1.2 Chain of Responsibility
**Quando usar:** Pipeline de processamento com múltiplos handlers.
```java
public interface ApplicationHandler {
    void handle(Application app, HandlerChain chain);
}

public class HandlerChain {
    private final List<ApplicationHandler> handlers;
    private int index = 0;

    public void next(Application app) {
        if (index < handlers.size()) handlers.get(index++).handle(app, this);
    }
}

// Handlers concretos
public class ValidateResumeHandler implements ApplicationHandler { ... }
public class CheckDuplicateHandler implements ApplicationHandler { ... }
public class ScoreCandidateHandler implements ApplicationHandler { ... }
public class NotifyRecruiterHandler implements ApplicationHandler { ... }
```

### 1.3 Template Method
**Quando usar:** Algoritmo com estrutura fixa e passos variáveis.
```java
public abstract class JobPostingWorkflow {
    public final Job post(CreateJobRequest request) {
        validate(request);      // Template: sempre executa
        Job job = enrich(request);  // Hook: subclasse implementa
        Job saved = save(job);      // Template: sempre executa
        afterPost(saved);           // Hook: subclasse implementa
        return saved;
    }

    protected abstract void validate(CreateJobRequest request);
    protected abstract Job enrich(CreateJobRequest request);
    protected void afterPost(Job job) { } // Hook opcional
}

public class PremiumJobPosting extends JobPostingWorkflow { ... }
public class FreeJobPosting extends JobPostingWorkflow { ... }
```

### 1.4 Observer / Event-Driven
**Quando usar:** Notificar múltiplos interessados sobre um evento.
```java
// Event
public record JobPostedEvent(Long jobId, Long companyId, List<String> skills) { }

// Uso: publish evento, múltiplos listeners processam
@Component
public class JobEventListener {
    @Async
    @EventListener
    public void onJobPosted(JobPostedEvent event) {
        notificationService.notifyMatchingCandidates(event);
    }
}

@Component
public class AnalyticsListener {
    @Async
    @EventListener
    public void onJobPosted(JobPostedEvent event) {
        analyticsService.recordMetric(event);
    }
}
```

### 1.5 Decorator
**Quando usar:** Adicionar comportamento sem modificar a classe original.
```java
// Interface base
public interface Cache<K, V> {
    V get(K key);
    void put(K key, V value);
}

// Decorator que adiciona métricas
public class InstrumentedCache<K, V> implements Cache<K, V> {
    private final Cache<K, V> delegate;
    private final MeterRegistry meter;

    public V get(K key) {
        Timer.Sample sample = Timer.start();
        V value = delegate.get(key);
        sample.stop(meter.timer("cache.get"));
        return value;
    }
    // put similar...
}
```

### 1.6 Facade
**Quando usar:** Interface simplificada para subsistema complexo.
```java
@Service
public class JobApplicationFacade {
    private final JobService jobService;
    private final ApplicationService applicationService;
    private final ResumeService resumeService;
    private final NotificationService notificationService;

    public ApplicationResponse apply(Long jobId, Long userId, MultipartFile resume) {
        // Orquestra 4 serviços em uma única chamada
        Job job = jobService.validateAndGet(jobId);
        String resumeUrl = resumeService.upload(userId, resume);
        Application app = applicationService.submit(job, userId, resumeUrl);
        notificationService.notifyRecruiter(app);
        return mapper.toResponse(app);
    }
}
```

### 1.7 Factory Method
**Quando usar:** Criação de objetos com lógica complexa.
```java
@Component
public class JobSearchRequestFactory {
    public SearchRequest createFromFilters(JobFilter filters) {
        return SearchRequest.of(s -> s
            .query(q -> q
                .bool(b -> {
                    b.must(m -> m.match(mm -> mm.field("title").query(filters.keyword())));
                    if (filters.workModel() != null)
                        b.filter(f -> f.term(t -> t.field("work_model").value(filters.workModel())));
                    if (filters.skills() != null)
                        b.filter(f -> f.terms(t -> t.field("skills").values(filters.skills())));
                    return b;
                })
            )
        );
    }
}
```

### 1.8 Builder
**Quando usar:** Construção de objetos complexos passo a passo.
```java
// JPA Specification Query builder (PostgreSQL full-text)
Specification<Job> spec = Specification
    .where(JobSpecifications.active())
    .and(JobSpecifications.byWorkModel(filter.getWorkModel()))
    .and(JobSpecifications.salaryAtLeast(filter.getMinSalary()))
    .and(JobSpecifications.hasSkills(filter.getSkills()));
Page<Job> results = jobRepository.findAll(spec, pageable);

// DTO builder
JobResponse response = JobResponse.builder()
    .id(job.getId())
    .title(job.getTitle())
    .company(companyMapper.toSummary(job.getCompany()))
    .salary(new SalaryRange(job.getSalaryMin(), job.getSalaryMax()))
    .skills(job.getSkills())
    .build();
```

### 1.9 Specification
**Quando usar:** Queries dinâmicas com múltiplos critérios opcionais.
```java
public class JobSpecifications {
    public static Specification<Job> active() {
        return (root, query, cb) -> cb.equal(root.get("status"), JobStatus.ACTIVE);
    }

    public static Specification<Job> byWorkModel(WorkModel model) {
        return (root, query, cb) -> model == null ? null :
            cb.equal(root.get("workModel"), model);
    }

    public static Specification<Job> salaryAtLeast(BigDecimal min) {
        return (root, query, cb) -> min == null ? null :
            cb.ge(root.get("salaryMax"), min);
    }

    public static Specification<Job> hasSkills(List<String> skills) {
        return (root, query, cb) -> {
            if (skills == null || skills.isEmpty()) return null;
            return cb.and(skills.stream()
                .map(skill -> cb.isMember(skill, root.get("skills")))
                .toArray(Predicate[]::new));
        };
    }

    // Uso combinado
    public Page<Job> search(JobFilter filter, Pageable pageable) {
        Specification<Job> spec = Specification
            .where(JobSpecifications.active())
            .and(JobSpecifications.byWorkModel(filter.getWorkModel()))
            .and(JobSpecifications.salaryAtLeast(filter.getMinSalary()))
            .and(JobSpecifications.hasSkills(filter.getSkills()));
        return jobRepository.findAll(spec, pageable);
    }
}
```

### 1.10 Repository
**Quando usar:** Abstrair acesso a dados.
```java
@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {
    @Query("""
        SELECT j FROM Job j
        WHERE j.status = 'ACTIVE'
        AND j.expiresAt > CURRENT_TIMESTAMP
        ORDER BY j.createdAt DESC
    """)
    Page<Job> findActiveJobs(Pageable pageable);

    @Query("SELECT j FROM Job j WHERE j.companyId = :companyId AND j.status = :status")
    List<Job> findByCompany(Long companyId, JobStatus status);

    @Modifying
    @Query("UPDATE Job j SET j.status = 'CLOSED' WHERE j.expiresAt < CURRENT_TIMESTAMP")
    int closeExpiredJobs();
}
```

---

## 2. Design Patterns — Frontend (React Native / TypeScript)

### 2.1 Compound Components
```tsx
// Definição
function JobCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

JobCard.Header = function Header({ logo, title, company }) { ... };
JobCard.Meta = function Meta({ salary, location, model }) { ... };
JobCard.Footer = function Footer({ onSave, postedAt }) { ... };

// Uso
<JobCard>
  <JobCard.Header logo={logo} title="Senior Dev" company="XYZ" />
  <JobCard.Meta salary="R$ 12k" location="Remoto" model="CLT" />
  <JobCard.Footer onSave={handleSave} postedAt="2h" />
</JobCard>
```

### 2.2 Higher-Order Component (HOC)
```tsx
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <LoadingScreen />;
    if (!isAuthenticated) return <LoginScreen />;
    return <Component {...props} />;
  };
}

// Uso
const ProtectedProfileScreen = withAuth(ProfileScreen);
```

### 2.3 Render Props
```tsx
type Props = {
  query: UseQueryResult<T>;
  loading?: ReactNode;
  error?: ReactNode;
  children: (data: T) => ReactNode;
};

function QueryLoader<T>({ query, loading, error, children }: Props) {
  if (query.isLoading) return loading ?? <Skeleton />;
  if (query.isError) return error ?? <ErrorState onRetry={query.refetch} />;
  return <>{children(query.data!)}</>;
}
```

### 2.4 Custom Hook Pattern
```typescript
// useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// useJobSearch
function useJobSearch() {
  const filters = useFilterStore();
  const debouncedKeyword = useDebounce(filters.keyword, 300);

  return useInfiniteQuery({
    queryKey: ['jobs', 'search', { ...filters, keyword: debouncedKeyword }],
    queryFn: ({ pageParam }) => jobApi.search({ ...filters, page: pageParam }),
    getNextPageParam: (last) => last.last ? undefined : last.page + 1,
    enabled: debouncedKeyword.length >= 2 || hasAdvancedFilters(filters),
  });
}
```

### 2.5 Observer (Zustand Store)
```typescript
// Filtros são observados por múltiplos componentes
const useFilterStore = create<FilterState>((set) => ({
  workModel: undefined,
  experienceLevel: undefined,
  minSalary: undefined,
  skills: [],

  setWorkModel: (model) => set({ workModel: model }),
  toggleSkill: (skill) => set((state) => ({
    skills: state.skills.includes(skill)
      ? state.skills.filter(s => s !== skill)
      : [...state.skills, skill],
  })),
  reset: () => set({ workModel: undefined, experienceLevel: undefined, ... }),
}));
```

### 2.6 Provider Pattern
```tsx
const queryClient = new QueryClient({ ... });
const theme = useColorScheme();

function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <SafeAreaProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SafeAreaProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### 2.7 Adapter Pattern
```typescript
// Adapta dados da API para o formato da UI
class JobAdapter {
  static toViewModel(apiJob: ApiJob): JobViewModel {
    return {
      id: apiJob.id,
      title: apiJob.title,
      company: apiJob.company.name,
      logo: apiJob.company.logo_url,
      salary: this.formatSalary(apiJob.salary_min, apiJob.salary_max),
      location: this.formatLocation(apiJob),
      tags: [apiJob.work_model, apiJob.experience_level, apiJob.job_type],
      skills: apiJob.skills.slice(0, 3),
      postedAt: this.formatTimeAgo(apiJob.created_at),
      matchScore: apiJob.match_score,
    };
  }

  private static formatSalary(min: number, max: number): string {
    return `R$ ${min / 1000}k - ${max / 1000}k`;
  }
}
```

### 2.8 Singleton (via Módulo ES6)
```typescript
// services/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: 10000,
});

// Singleton: importado em qualquer arquivo, mesma instância
```

### 2.9 Module Pattern
```typescript
// services/api/jobApi.ts
export const jobApi = {
  search: (filters: JobFilters, page: number = 0) =>
    apiClient.get<PageResponse<Job>>('/v1/jobs', { params: { ...filters, page } }),

  getById: (id: string) =>
    apiClient.get<Job>(`/v1/jobs/${id}`),

  apply: (jobId: string, data: ApplyData) =>
    apiClient.post(`/v1/jobs/${jobId}/apply`, data),

  save: (jobId: string) =>
    apiClient.post(`/v1/jobs/${jobId}/save`),

  unsave: (jobId: string) =>
    apiClient.delete(`/v1/jobs/${jobId}/save`),
};
```

---

## 3. Anti-Patterns a Evitar

### Backend
- ❌ **God Service:** Service com 1000+ linhas responsável por múltiplos domínios
- ❌ **Anemic Domain Model:** Entidades sem lógica, toda lógica nos services
- ❌ **Stringly Typed:** Usar strings ao invés de enums para status/modelos
- ❌ **Fat Controller:** Controller com lógica de negócio
- ❌ **JFDI Exception Handling:** `catch (Exception e) { e.printStackTrace(); }`

### Frontend
- ❌ **Props Drilling:** Passar props por 5+ níveis de componentes
- ❌ **Everything in Redux/Zustand:** Colocar estado de form input no store global
- ❌ **Inline Styles Complexos:** Objetos de estilo inline gigantes
- ❌ **Uncontrolled → Controlled Input:** Mudar de uncontrolled para controlled em runtime
- ❌ **Missing Keys:** Não usar `keyExtractor`/`key` em listas
