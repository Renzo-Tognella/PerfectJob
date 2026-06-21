package com.perfectjob.dto.response;

import java.util.List;

/**
 * Structured data extracted from a candidate's resume (curriculo) by the
 * {@code ResumeAnalyzer}. Returned to the client after an upload so the user can
 * review/edit before it is persisted into the profile.
 */
public record ResumeAnalysisResponse(
        String headline,
        String email,
        String phone,
        String linkedinUrl,
        String githubUrl,
        Integer yearsExperience,
        List<String> skills,
        List<ExperienceDto> experiences,
        List<EducationDto> education
) {
}
