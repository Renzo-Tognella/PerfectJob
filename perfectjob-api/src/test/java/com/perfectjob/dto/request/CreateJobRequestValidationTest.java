package com.perfectjob.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CreateJobRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void initValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeFactory() {
        factory.close();
    }

    private CreateJobRequest validRequest() {
        return new CreateJobRequest(
                "Senior Developer",
                1L,
                "Job description",
                "Requirements",
                "Benefits",
                new BigDecimal("5000.00"),
                new BigDecimal("10000.00"),
                com.perfectjob.model.enums.WorkModel.REMOTE,
                com.perfectjob.model.enums.ExperienceLevel.SENIOR,
                com.perfectjob.model.enums.JobType.FULL_TIME,
                com.perfectjob.model.enums.ContractType.CLT,
                "São Paulo",
                "SP",
                List.of("Java", "Spring"),
                LocalDateTime.now().plusDays(30),
                "https://example.com/job"
        );
    }

    @Test
    void salaryMaxLessThanSalaryMin_failsValidation() {
        CreateJobRequest request = new CreateJobRequest(
                "Dev",
                1L,
                "Desc",
                null,
                null,
                new BigDecimal("10000.00"),
                new BigDecimal("5000.00"),
                com.perfectjob.model.enums.WorkModel.REMOTE,
                com.perfectjob.model.enums.ExperienceLevel.JUNIOR,
                com.perfectjob.model.enums.JobType.FULL_TIME,
                com.perfectjob.model.enums.ContractType.CLT,
                null,
                null,
                null,
                LocalDateTime.now().plusDays(30),
                null
        );

        Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> v.getMessage().contains("salaryMax must be >= salaryMin"));
    }

    @Test
    void expiresAtInThePast_failsValidation() {
        CreateJobRequest request = new CreateJobRequest(
                "Dev",
                1L,
                "Desc",
                null,
                null,
                null,
                null,
                com.perfectjob.model.enums.WorkModel.REMOTE,
                com.perfectjob.model.enums.ExperienceLevel.JUNIOR,
                com.perfectjob.model.enums.JobType.FULL_TIME,
                com.perfectjob.model.enums.ContractType.CLT,
                null,
                null,
                null,
                LocalDateTime.now().minusDays(1),
                null
        );

        Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "expiresAt".equals(v.getPropertyPath().toString()));
    }

    @Test
    void blankTitle_failsValidation() {
        CreateJobRequest request = new CreateJobRequest(
                "",
                1L,
                "Desc",
                null,
                null,
                null,
                null,
                com.perfectjob.model.enums.WorkModel.REMOTE,
                com.perfectjob.model.enums.ExperienceLevel.JUNIOR,
                com.perfectjob.model.enums.JobType.FULL_TIME,
                com.perfectjob.model.enums.ContractType.CLT,
                null,
                null,
                null,
                LocalDateTime.now().plusDays(30),
                null
        );

        Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "title".equals(v.getPropertyPath().toString()));
    }

    @Test
    void validRequest_passesValidation() {
        Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(validRequest());

        assertThat(violations).isEmpty();
    }

    @Test
    void externalUrlOver2048Chars_failsValidation() {
        String longUrl = "https://example.com/" + "a".repeat(2050);
        CreateJobRequest request = new CreateJobRequest(
                "Dev",
                1L,
                "Desc",
                null,
                null,
                null,
                null,
                com.perfectjob.model.enums.WorkModel.REMOTE,
                com.perfectjob.model.enums.ExperienceLevel.JUNIOR,
                com.perfectjob.model.enums.JobType.FULL_TIME,
                com.perfectjob.model.enums.ContractType.CLT,
                null,
                null,
                null,
                LocalDateTime.now().plusDays(30),
                longUrl
        );

        Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "externalUrl".equals(v.getPropertyPath().toString()));
    }

    @Test
    void externalUrlNull_passesValidation() {
        CreateJobRequest request = new CreateJobRequest(
                "Dev",
                1L,
                "Desc",
                null,
                null,
                null,
                null,
                com.perfectjob.model.enums.WorkModel.REMOTE,
                com.perfectjob.model.enums.ExperienceLevel.JUNIOR,
                com.perfectjob.model.enums.JobType.FULL_TIME,
                com.perfectjob.model.enums.ContractType.CLT,
                null,
                null,
                null,
                LocalDateTime.now().plusDays(30),
                null
        );

        Set<ConstraintViolation<CreateJobRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }
}
