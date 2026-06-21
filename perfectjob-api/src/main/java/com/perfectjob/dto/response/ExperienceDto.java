package com.perfectjob.dto.response;

/**
 * Professional experience entry. Used both in the candidate profile and as a
 * result of CV analysis. Dates are kept as free-form strings ("2020", "Jan 2020",
 * "03/2021", "Atual") because resumes express them inconsistently.
 */
public record ExperienceDto(
        String title,
        String company,
        String startDate,
        String endDate,
        String description
) {
}
