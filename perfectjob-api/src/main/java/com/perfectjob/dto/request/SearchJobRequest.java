package com.perfectjob.dto.request;

import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.WorkModel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public record SearchJobRequest(
    Optional<@Size(max = 255) String> keyword,
    Optional<WorkModel> workModel,
    Optional<ExperienceLevel> experienceLevel,
    Optional<@DecimalMin("0.0") BigDecimal> minSalary,
    Optional<List<@Size(max = 100) String>> skills
) {}
