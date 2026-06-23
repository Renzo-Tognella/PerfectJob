package com.perfectjob.service.resume.generate;

import java.util.List;

/**
 * Structured content produced by the LLM for a tailored resume.
 * The LLM must NEVER produce LaTeX syntax — only these content fields.
 */
public record TailoredResumeContent(
        String professionalSummary,
        List<String> highlightedSkills,
        List<TailoredExperience> tailoredExperiences
) {
    public record TailoredExperience(
            String title,
            String company,
            String startDate,
            String endDate,
            List<String> bulletPoints
    ) {}
}
