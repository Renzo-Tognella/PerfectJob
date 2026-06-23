package com.perfectjob.service.resume.generate;

import com.perfectjob.model.Job;
import com.perfectjob.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Lightweight, serialization-safe view of a {@link Job} for LLM context.
 * Built explicitly (no reflection into lazy proxies) to avoid Jackson
 * failing on Hibernate lazy collections.
 */
@Component
@RequiredArgsConstructor
public class JobContextMapper {

    private final CompanyRepository companyRepository;

    public JobContext toContext(Job job) {
        String companyName = companyRepository.findById(job.getCompanyId())
                .map(c -> c.getName())
                .orElse(null);
        return new JobContext(
                job.getId(),
                job.getTitle(),
                companyName,
                job.getDescription(),
                job.getRequirements(),
                job.getBenefits(),
                job.getSkills() == null ? List.of() : List.copyOf(job.getSkills()),
                job.getWorkModel() == null ? null : job.getWorkModel().name(),
                job.getExperienceLevel() == null ? null : job.getExperienceLevel().name(),
                job.getJobType() == null ? null : job.getJobType().name(),
                job.getContractType() == null ? null : job.getContractType().name(),
                job.getLocationCity(),
                job.getLocationState(),
                job.getLocationCountry(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getSalaryCurrency(),
                job.getExternalUrl()
        );
    }

    public record JobContext(
            Long id,
            String title,
            String companyName,
            String description,
            String requirements,
            String benefits,
            List<String> skills,
            String workModel,
            String experienceLevel,
            String jobType,
            String contractType,
            String locationCity,
            String locationState,
            String locationCountry,
            java.math.BigDecimal salaryMin,
            java.math.BigDecimal salaryMax,
            String salaryCurrency,
            String externalUrl
    ) {}
}
