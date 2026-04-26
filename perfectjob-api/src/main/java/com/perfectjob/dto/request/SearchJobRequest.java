package com.perfectjob.dto.request;

import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.WorkModel;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public record SearchJobRequest(
    Optional<String> keyword,
    Optional<WorkModel> workModel,
    Optional<ExperienceLevel> experienceLevel,
    Optional<BigDecimal> minSalary,
    Optional<List<String>> skills
) {}
