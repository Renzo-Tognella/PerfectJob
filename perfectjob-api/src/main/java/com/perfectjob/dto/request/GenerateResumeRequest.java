package com.perfectjob.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for {@code POST /v1/resumes}. Only the job ID is required;
 * the candidate is identified via the authenticated session.
 */
public record GenerateResumeRequest(
        @NotNull Long jobId
) {}
