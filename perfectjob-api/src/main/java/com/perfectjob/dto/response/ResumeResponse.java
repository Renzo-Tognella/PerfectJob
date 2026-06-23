package com.perfectjob.dto.response;

import java.time.LocalDateTime;

/**
 * Resume metadata returned in list and create endpoints.
 */
public record ResumeResponse(
        Long id,
        Long jobId,
        String jobTitle,
        String pdfStoragePath,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
