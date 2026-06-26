package com.perfectjob.dto.response;

import java.time.LocalDateTime;
import java.util.List;


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
        List<LanguageDto> languages,
        long savedJobsCount
) {
}
