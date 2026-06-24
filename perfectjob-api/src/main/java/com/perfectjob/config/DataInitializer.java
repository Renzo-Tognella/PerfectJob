package com.perfectjob.config;

import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.User;
import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.Role;
import com.perfectjob.model.enums.WorkModel;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("admin@perfectjob.com", "Administrador", Role.ADMIN, "Admin@123");
        seedUser("recruiter@perfectjob.com", "Recrutador Demo", Role.RECRUITER, "Recruiter@123");
        seedUser("joao@email.com", "João Silva", Role.CANDIDATE, "Candidato@123");
        seedUser("maria@email.com", "Maria Santos", Role.CANDIDATE, "Candidato@123");

        Long companyId = seedCompany();
        seedJob(
                "desenvolvedor-react-native",
                "Desenvolvedor React Native",
                companyId,
                JobStatus.ACTIVE,
                "Desenvolvimento de aplicativos mobile com React Native e TypeScript.",
                List.of("React Native", "TypeScript", "Expo"),
                new BigDecimal("8000"),
                new BigDecimal("12000")
        );
        seedJob(
                "product-designer",
                "Product Designer",
                companyId,
                JobStatus.ACTIVE,
                "Criação de interfaces e protótipos para produtos digitais.",
                List.of("Figma", "UX Research", "UI Design"),
                new BigDecimal("7000"),
                new BigDecimal("10000")
        );
    }

    private void seedUser(String email, String fullName, Role role, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        userRepository.save(User.builder()
                .email(email)
                .fullName(fullName)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .build());

        log.info("Usuário padrão criado: {} ({})", email, role);
    }

    private Long seedCompany() {
        if (companyRepository.existsBySlug("techcorp")) {
            return companyRepository.findBySlug("techcorp")
                    .map(Company::getId)
                    .orElseThrow();
        }

        Company company = companyRepository.save(Company.builder()
                .name("TechCorp")
                .slug("techcorp")
                .description("Empresa de tecnologia focada em produtos digitais.")
                .industry("Tecnologia")
                .size("51-200")
                .build());

        log.info("Empresa padrão criada: {}", company.getName());
        return company.getId();
    }

    private void seedJob(
            String slug,
            String title,
            Long companyId,
            JobStatus status,
            String description,
            List<String> skills,
            BigDecimal salaryMin,
            BigDecimal salaryMax
    ) {
        if (jobRepository.existsBySlug(slug)) {
            return;
        }

        jobRepository.save(Job.builder()
                .slug(slug)
                .title(title)
                .companyId(companyId)
                .status(status)
                .description(description)
                .requirements("Experiência comprovada na área e boa comunicação.")
                .benefits("Vale refeição, plano de saúde e trabalho remoto.")
                .salaryMin(salaryMin)
                .salaryMax(salaryMax)
                .workModel(WorkModel.REMOTE)
                .experienceLevel(ExperienceLevel.MID)
                .jobType(JobType.FULL_TIME)
                .contractType(ContractType.CLT)
                .locationCity("São Paulo")
                .locationState("SP")
                .skills(skills)
                .applicationsCount(0)
                .build());

        log.info("Vaga padrão criada: {} ({})", title, status);
    }
}
