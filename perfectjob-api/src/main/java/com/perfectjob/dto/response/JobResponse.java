package com.perfectjob.dto.response;

import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record JobResponse(
    Long id,
    Long companyId,
    String companyName,
    String title,
    String slug,
    String description,
    String requirements,
    String benefits,
    BigDecimal salaryMin,
    BigDecimal salaryMax,
    String salaryCurrency,
    WorkModel workModel,
    ExperienceLevel experienceLevel,
    JobType jobType,
    ContractType contractType,
    String locationCity,
    String locationState,
    String locationCountry,
    List<String> skills,
    JobStatus status,
    Integer views,
    Integer applicationsCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime expiresAt
) {}
