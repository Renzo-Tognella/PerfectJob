package com.perfectjob.dto.response;

import java.time.LocalDateTime;

/**
 * Admin-facing view of a generated resume (currículo): which candidate generated it,
 * for which job, and when. Used by the admin panel's Currículos list and dashboard.
 */
public record AdminResumeResponse(
        Long id,
        String candidateName,
        String candidateEmail,
        String jobTitle,
        LocalDateTime createdAt
) {}
