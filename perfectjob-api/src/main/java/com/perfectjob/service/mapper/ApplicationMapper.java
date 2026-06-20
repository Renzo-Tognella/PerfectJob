package com.perfectjob.service.mapper;

import com.perfectjob.dto.response.ApplicationResponse;
import com.perfectjob.model.Application;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.User;

public final class ApplicationMapper {

    private ApplicationMapper() {
    }

    public static ApplicationResponse toResponse(Application app) {
        String jobTitle = resolveJobTitle(app);
        String companyName = resolveCompanyName(app);
        String candidateName = resolveCandidateName(app);

        return new ApplicationResponse(
                app.getId(),
                app.getJobId(),
                jobTitle,
                companyName,
                app.getCandidateId(),
                candidateName,
                app.getStatus(),
                app.getCoverLetter(),
                app.getResumeUrl(),
                app.getCreatedAt(),
                app.getUpdatedAt()
        );
    }

    private static String resolveJobTitle(Application app) {
        Job job = app.getJob();
        return job != null ? job.getTitle() : "Unknown";
    }

    private static String resolveCompanyName(Application app) {
        Job job = app.getJob();
        if (job == null) {
            return "Unknown";
        }
        Company company = job.getCompany();
        return company != null ? company.getName() : "Unknown";
    }

    private static String resolveCandidateName(Application app) {
        User candidate = app.getCandidate();
        return candidate != null ? candidate.getFullName() : "Unknown";
    }
}
