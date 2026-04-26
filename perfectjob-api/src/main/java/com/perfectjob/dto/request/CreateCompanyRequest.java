package com.perfectjob.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCompanyRequest(
    @NotBlank @Size(max = 255) String name,
    @NotBlank String slug,
    String description,
    String logoUrl,
    String website,
    String size,
    String industry,
    Integer foundedYear
) {}
