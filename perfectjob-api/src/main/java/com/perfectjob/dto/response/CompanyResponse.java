package com.perfectjob.dto.response;

public record CompanyResponse(
    Long id,
    String name,
    String slug,
    String description,
    String logoUrl,
    String website,
    String size,
    String industry,
    Integer foundedYear,
    Double rating,
    Integer ratingCount
) {}
