package com.perfectjob.dto.response;

import java.time.LocalDateTime;


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
