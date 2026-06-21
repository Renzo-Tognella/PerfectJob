package com.perfectjob.dto.response;

/**
 * Academic background entry. Used both in the candidate profile and as a result
 * of CV analysis.
 */
public record EducationDto(
        String institution,
        String degree,
        String fieldOfStudy,
        Integer startYear,
        Integer endYear
) {
}
