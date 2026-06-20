package com.perfectjob.dto.request;

import jakarta.validation.constraints.NotNull;

public record SaveJobRequest(@NotNull Long jobId) {}
