package com.perfectjob.dto.response;

import java.time.LocalDateTime;

public record SavedJobResponse(
    Long id,
    Long userId,
    Long jobId,
    String jobSlug,
    LocalDateTime createdAt
) {}
