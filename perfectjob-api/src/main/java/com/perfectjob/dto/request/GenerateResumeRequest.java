package com.perfectjob.dto.request;

import jakarta.validation.constraints.NotNull;


public record GenerateResumeRequest(
        @NotNull Long jobId
) {}
