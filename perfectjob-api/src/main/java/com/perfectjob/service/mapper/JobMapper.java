package com.perfectjob.service.mapper;

import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;

public final class JobMapper {

    private JobMapper() {
    }

    public static JobResponse toResponse(Job job) {
        String companyName = resolveCompanyName(job);
        return new JobResponse(
                job.getId(),
                job.getCompanyId(),
                companyName,
                job.getTitle(),
                job.getSlug(),
                job.getDescription(),
                job.getRequirements(),
                job.getBenefits(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getSalaryCurrency(),
                job.getWorkModel(),
                job.getExperienceLevel(),
                job.getJobType(),
                job.getContractType(),
                job.getLocationCity(),
                job.getLocationState(),
                job.getLocationCountry(),
                job.getSkills(),
                job.getStatus(),
                job.getViews(),
                job.getApplicationsCount(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                job.getExpiresAt(),
                job.getExternalUrl()
        );
    }

    private static String resolveCompanyName(Job job) {
        Company company = job.getCompany();
        if (company != null) {
            return company.getName();
        }
        return "Unknown";
    }
}
