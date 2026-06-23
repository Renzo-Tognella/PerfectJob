package com.perfectjob.dto.request;

import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CreateJobRequest(
    @NotBlank @Size(max = 255) String title,
    @NotNull Long companyId,
    @NotBlank @Size(max = 5000) String description,
    @Size(max = 5000) String requirements,
    @Size(max = 5000) String benefits,
    @DecimalMin("0.0") BigDecimal salaryMin,
    @DecimalMin("0.0") BigDecimal salaryMax,
    @NotNull WorkModel workModel,
    @NotNull ExperienceLevel experienceLevel,
    @NotNull JobType jobType,
    @NotNull ContractType contractType,
    @Size(max = 1000) String locationCity,
    @Size(max = 1000) String locationState,
    @Size(max = 20) List<@Size(max = 100) String> skills,
    @NotNull @Future LocalDateTime expiresAt,
    @Size(max = 2048) String externalUrl
) {
    @AssertTrue(message = "salaryMax must be >= salaryMin")
    public boolean isValidSalaryRange() {
        if (salaryMin == null || salaryMax == null) return true;
        return salaryMax.compareTo(salaryMin) >= 0;
    }
}
