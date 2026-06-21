package com.perfectjob.dto.request;

import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.LanguageDto;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Partial update of a candidate profile. All fields are optional; a {@code null}
 * value leaves the corresponding field unchanged. Lists, when provided (non-null),
 * fully replace the existing collection.
 */
public record UpdateProfileRequest(
        @Size(max = 255) String fullName,
        @Size(max = 255) String headline,
        @Size(max = 50) String phone,
        @Size(max = 2000) String bio,
        @Size(max = 500) String avatarUrl,
        @Size(max = 500) String linkedinUrl,
        @Size(max = 500) String githubUrl,
        @Size(max = 100) String locationCity,
        @Size(max = 100) String locationState,
        @Min(0) @Max(80) Integer yearsExperience,
        @Size(max = 60) List<@Size(max = 100) String> skills,
        @Size(max = 50) List<ExperienceDto> experiences,
        @Size(max = 50) List<EducationDto> education,
        @Size(max = 30) List<LanguageDto> languages
) {
}
