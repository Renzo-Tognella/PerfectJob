package com.perfectjob.dto.response;

/** Aggregate resume (currículo) counts for the admin dashboard. */
public record AdminResumeStatsResponse(
        long totalResumes,
        long resumesToday
) {}
