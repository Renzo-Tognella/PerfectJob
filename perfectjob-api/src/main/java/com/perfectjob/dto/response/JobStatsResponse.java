package com.perfectjob.dto.response;

public record JobStatsResponse(
    long activeJobs,
    long totalCompanies
) {}
