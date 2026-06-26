package com.perfectjob.dto.response;

import java.time.LocalDateTime;


public record ResumeResponse(
        Long id,
        Long jobId,
        String jobTitle,
        String pdfStoragePath,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
