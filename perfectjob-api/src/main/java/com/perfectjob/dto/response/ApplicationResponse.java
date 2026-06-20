package com.perfectjob.dto.response;

import java.time.LocalDateTime;

public record ApplicationResponse(
    Long id,
    Long jobId,
    String jobTitle,
    String companyName,
    Long candidateId,
    String candidateName,
    String status,
    String coverLetter,
    String resumeUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
