package com.perfectjob.dto.response;

import java.time.LocalDateTime;

/**
 * Full resume detail including the associated job's title and description.
 */
public record ResumeDetailResponse(
        Long id,
        Long jobId,
        String jobTitle,
        String jobDescription,
        String pdfStoragePath,
        String latexSource,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
