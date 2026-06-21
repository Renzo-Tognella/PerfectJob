package com.perfectjob.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full candidate profile, including CV-derived data and activity counters.
 */
public record ProfileResponse(
        Long id,
        String email,
        String fullName,
        String role,
        String headline,
        String phone,
        String bio,
        String avatarUrl,
        String linkedinUrl,
        String githubUrl,
        String locationCity,
        String locationState,
        Integer yearsExperience,
        String resumeUrl,
        LocalDateTime resumeUpdatedAt,
        List<String> skills,
        List<ExperienceDto> experiences,
        List<EducationDto> education,
        long applicationsCount,
        long savedJobsCount
) {
}
