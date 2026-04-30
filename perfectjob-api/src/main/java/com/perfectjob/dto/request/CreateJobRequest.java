package com.perfectjob.dto.request;

import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CreateJobRequest(
    @NotBlank String title,
    @NotNull Long companyId,
    @NotBlank String description,
    String requirements,
    String benefits,
    BigDecimal salaryMin,
    BigDecimal salaryMax,
    @NotNull WorkModel workModel,
    @NotNull ExperienceLevel experienceLevel,
    @NotNull JobType jobType,
    @NotNull ContractType contractType,
    String locationCity,
    String locationState,
    List<String> skills,
    @NotNull LocalDateTime expiresAt
) {}
