package com.perfectjob.dto.response;

import java.util.List;


public record ResumeAnalysisResponse(
        String headline,
        String email,
        String phone,
        String linkedinUrl,
        String githubUrl,
        Integer yearsExperience,
        List<String> skills,
        List<ExperienceDto> experiences,
        List<EducationDto> education,
        List<LanguageDto> languages
) {
}
