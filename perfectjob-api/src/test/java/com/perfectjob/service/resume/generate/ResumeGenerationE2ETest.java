package com.perfectjob.service.resume.generate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.LanguageDto;
import com.perfectjob.dto.response.ProfileResponse;
import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Optional E2E test for R10.4: per-job tailoring produces visibly different
 * {@code professionalSummary} texts for the same candidate profile against two
 * different jobs.
 *
 * <p>This is a MANUAL E2E test. It:
 * <ul>
 *   <li>Requires a real {@code OPENROUTER_API_KEY} environment variable.</li>
 *   <li>Calls a real LLM (no mocks) via the {@link ResumeContentAiService} proxy.</li>
 *   <li>Skips cleanly (does not fail) when the env var is missing.</li>
 *   <li>Is slow (10-30s per LLM call) and is NOT part of the regular CI run.</li>
 * </ul>
 *
 * <p>The test short-circuits the full {@link ResumeGenerationService} pipeline
 * and calls the LLM directly. This is sufficient for R10.4 (which is about the
 * LLM producing differentiated summaries, not about LaTeX or PDF rendering) and
 * avoids needing a real user, profile, and Tectonic binary in the test JVM.
 *
 * <p>To run it locally:
 * <pre>
 *   docker exec perfectjob-api bash -c \
 *     "cd /app && ./mvnw -Dtest=ResumeGenerationE2ETest test"
 * </pre>
 */
class ResumeGenerationE2ETest {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Test
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void twoDifferentJobs_produceDifferentProfessionalSummaries() throws Exception {
        String apiKey = System.getenv("OPENROUTER_API_KEY");
        Assumptions.assumeTrue(
                apiKey != null && !apiKey.isBlank(),
                "OPENROUTER_API_KEY must be set for this E2E test"
        );

        String baseUrl = envOrDefault("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1");
        String modelName = envOrDefault("OPENROUTER_MODEL", "deepseek/deepseek-chat");

        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                .baseUrl(baseUrl)
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(0.7)
                .timeout(Duration.ofSeconds(60))
                .build();

        ResumeContentAiService aiService = AiServices.builder(ResumeContentAiService.class)
                .chatModel(chatModel)
                .build();

        String profileJson = MAPPER.writeValueAsString(sampleProfile());
        String railsJobJson = MAPPER.writeValueAsString(sampleRailsJobContext());
        String pythonJobJson = MAPPER.writeValueAsString(samplePythonJobContext());

        TailoredResumeContent railsContent = callWithOneRetry(aiService, profileJson, railsJobJson);
        TailoredResumeContent pythonContent = callWithOneRetry(aiService, profileJson, pythonJobJson);

        String summaryRails = railsContent.professionalSummary();
        String summaryPython = pythonContent.professionalSummary();

        assertThat(summaryRails)
                .as("professionalSummary for the Rails job must not be blank")
                .isNotBlank();
        assertThat(summaryPython)
                .as("professionalSummary for the Python job must not be blank")
                .isNotBlank();

        boolean wordingDiffers = !summaryRails.equals(summaryPython);
        String railsLower = summaryRails.toLowerCase(Locale.ROOT);
        String pythonLower = summaryPython.toLowerCase(Locale.ROOT);
        boolean railsMentionsRailsStack = containsAny(railsLower, "rails", "ruby");
        boolean pythonMentionsPythonStack = containsAny(pythonLower, "python", "django", "fastapi");

        assertThat(wordingDiffers || (railsMentionsRailsStack && pythonMentionsPythonStack))
                .as("R10.4 violation: two different jobs produced indistinguishable professionalSummary. "
                        + "Expected either different wording or job-specific technology mentions. "
                        + "Rails summary: <%s> | Python summary: <%s>",
                        summaryRails, summaryPython)
                .isTrue();
    }

    private static TailoredResumeContent callWithOneRetry(
            ResumeContentAiService aiService, String profileJson, String jobContext) {
        try {
            return aiService.generateTailoredContent(profileJson, jobContext);
        } catch (RuntimeException firstFailure) {
            return aiService.generateTailoredContent(profileJson, jobContext);
        }
    }

    private static String envOrDefault(String key, String def) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? def : v;
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String n : needles) {
            if (haystack.contains(n)) {
                return true;
            }
        }
        return false;
    }

    private static ProfileResponse sampleProfile() {
        return new ProfileResponse(
                1L,
                "joao@example.com",
                "João Silva",
                "CANDIDATE",
                "Desenvolvedor Backend Sênior",
                "11999998888",
                "Engenheiro de software com 5 anos de experiência em Java, Spring Boot e Python.",
                null,
                "https://linkedin.com/in/joao",
                "https://github.com/joao",
                "São Paulo", "SP", 5, null, LocalDateTime.now(),
                List.of(
                        "Java", "Spring Boot", "Python", "Django",
                        "PostgreSQL", "Docker", "AWS", "REST APIs",
                        "Ruby on Rails", "RSpec"
                ),
                List.of(
                        new ExperienceDto(
                                "Backend Developer",
                                "Acme",
                                "Jan/2022",
                                "Atual",
                                "Desenvolveu APIs REST com Java/Spring Boot e serviços Python/Django. "
                                        + "Trabalhou com PostgreSQL, Docker e AWS (ECS, S3)."
                        ),
                        new ExperienceDto(
                                "Full Stack Developer",
                                "Beta Tech",
                                "Mar/2020",
                                "Dez/2021",
                                "Desenvolveu aplicações web com Ruby on Rails e Python. "
                                        + "Modelou bancos relacionais e escreveu testes RSpec."
                        )
                ),
                List.of(new EducationDto("USP", "BSc", "CS", 2018, 2022)),
                List.of(new LanguageDto("Inglês", "Avançado")),
                0L
        );
    }

    private static JobContextMapper.JobContext sampleRailsJobContext() {
        return new JobContextMapper.JobContext(
                1001L,
                "Engenheiro Ruby on Rails Sênior",
                "Acme Tech",
                "Procuramos um Engenheiro Ruby on Rails Sênior para liderar o desenvolvimento "
                        + "de aplicações web escaláveis. Você trabalhará com nossa equipe de plataforma "
                        + "para construir novas funcionalidades em Rails 7, otimizar queries do "
                        + "ActiveRecord e melhorar a performance do nosso SaaS B2B.",
                "Experiência sólida com Ruby on Rails (5+ anos), ActiveRecord, PostgreSQL, RSpec e "
                        + "Sidekiq. Conhecimento de Hotwire, Stimulus e arquiteturas de microserviços. "
                        + "Experiência com AWS (S3, ECS) é um diferencial.",
                "Trabalho remoto, vale-refeição, plano de saúde",
                List.of("Ruby", "Ruby on Rails", "PostgreSQL", "RSpec", "Sidekiq", "Hotwire", "AWS"),
                WorkModel.REMOTE.name(),
                ExperienceLevel.SENIOR.name(),
                JobType.FULL_TIME.name(),
                ContractType.CLT.name(),
                "São Paulo", "SP", "Brasil",
                new BigDecimal("12000"), new BigDecimal("20000"),
                "BRL",
                "https://example.com/jobs/rails-senior"
        );
    }

    private static JobContextMapper.JobContext samplePythonJobContext() {
        return new JobContextMapper.JobContext(
                1002L,
                "Senior Python Backend Engineer",
                "DataCorp",
                "Buscamos um Senior Python Backend Engineer para desenvolver serviços de data "
                        + "pipeline e APIs de alta vazão. Você liderará a migração de serviços legados "
                        + "para FastAPI, desenhará arquiteturas assíncronas com Celery e trabalhará "
                        + "próximo ao time de dados em projetos de machine learning.",
                "Experiência avançada com Python (5+ anos), FastAPI ou Django, Celery, PostgreSQL, "
                        + "Redis e Docker. Forte conhecimento de async/await, observabilidade "
                        + "(Prometheus/Grafana) e CI/CD. Experiência com AWS ou GCP é desejável.",
                "Stock options, trabalho remoto, horário flexível",
                List.of("Python", "FastAPI", "Django", "Celery", "PostgreSQL", "Redis", "Docker", "AWS"),
                WorkModel.REMOTE.name(),
                ExperienceLevel.SENIOR.name(),
                JobType.FULL_TIME.name(),
                ContractType.CLT.name(),
                "Rio de Janeiro", "RJ", "Brasil",
                new BigDecimal("14000"), new BigDecimal("22000"),
                "BRL",
                "https://example.com/jobs/python-senior"
        );
    }
}
