package com.perfectjob.dto.response;

public record JobStatsResponse(
    long activeJobs,
    long totalApplications,
    long applicationsToday,
    long totalCompanies
) {}
