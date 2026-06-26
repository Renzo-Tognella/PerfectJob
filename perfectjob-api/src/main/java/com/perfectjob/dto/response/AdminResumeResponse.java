package com.perfectjob.dto.response;

import java.time.LocalDateTime;


public record AdminResumeResponse(
        Long id,
        String candidateName,
        String candidateEmail,
        String jobTitle,
        LocalDateTime createdAt
) {}
