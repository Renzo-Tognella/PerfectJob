package com.perfectjob.service.resume.generate;

import java.util.List;


public record TailoredResumeContent(
        String professionalSummary,
        List<CategorizedSkill> categorizedSkills,
        List<TailoredExperience> tailoredExperiences,
        List<ValidatedLanguage> validatedLanguages
) {
    public record CategorizedSkill(
            String category,
            List<String> items
    ) {}

    public record TailoredExperience(
            String title,
            String company,
            String startDate,
            String endDate,
            List<String> bulletPoints
    ) {}

    public record ValidatedLanguage(
            String name,
            String level
    ) {}
}
