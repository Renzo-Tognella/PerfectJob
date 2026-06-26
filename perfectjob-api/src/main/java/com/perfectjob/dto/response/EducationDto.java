package com.perfectjob.dto.response;


public record EducationDto(
        String institution,
        String degree,
        String fieldOfStudy,
        Integer startYear,
        Integer endYear
) {
}
