package com.perfectjob.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCompanyRequest(
    @NotBlank @Size(min = 2, max = 255) String name,
    @NotBlank @Size(max = 255)
    @Pattern(regexp = "^[a-z0-9][a-z0-9-]*$", message = "slug deve conter apenas letras minúsculas, números e hífens, começando com letra ou número")
    String slug,
    @Size(max = 5000) String description,
    String logoUrl,
    @Pattern(regexp = "^(https?://).*", message = "website deve ser uma URL válida") String website,
    @Size(max = 100) String industry,
    @Size(max = 50) String size,
    @Min(1800) @Max(2100) Integer foundedYear
) {}
