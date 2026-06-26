package com.perfectjob.dto.response;


public record ExperienceDto(
        String title,
        String company,
        String startDate,
        String endDate,
        String description
) {
}
