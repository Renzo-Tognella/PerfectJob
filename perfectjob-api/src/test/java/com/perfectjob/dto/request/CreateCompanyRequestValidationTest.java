package com.perfectjob.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CreateCompanyRequestValidationTest {

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

    private CreateCompanyRequest validRequest() {
        return new CreateCompanyRequest(
                "TechCorp",
                "techcorp",
                "A tech company",
                null,
                "https://techcorp.com",
                "100-500",
                "Software",
                2010
        );
    }

    @Test
    void invalidSlugUppercase_failsValidation() {
        CreateCompanyRequest request = new CreateCompanyRequest(
                "TechCorp",
                "TechCorp",
                null,
                null,
                null,
                null,
                null,
                null
        );

        Set<ConstraintViolation<CreateCompanyRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "slug".equals(v.getPropertyPath().toString()));
    }

    @Test
    void invalidSlugWithUnderscore_failsValidation() {
        CreateCompanyRequest request = new CreateCompanyRequest(
                "TechCorp",
                "tech_corp",
                null,
                null,
                null,
                null,
                null,
                null
        );

        Set<ConstraintViolation<CreateCompanyRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "slug".equals(v.getPropertyPath().toString()));
    }

    @Test
    void invalidWebsite_failsValidation() {
        CreateCompanyRequest request = new CreateCompanyRequest(
                "TechCorp",
                "techcorp",
                null,
                null,
                "ftp://techcorp.com",
                null,
                null,
                null
        );

        Set<ConstraintViolation<CreateCompanyRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "website".equals(v.getPropertyPath().toString()));
    }

    @Test
    void foundedYearTooOld_failsValidation() {
        CreateCompanyRequest request = new CreateCompanyRequest(
                "TechCorp",
                "techcorp",
                null,
                null,
                null,
                null,
                null,
                1500
        );

        Set<ConstraintViolation<CreateCompanyRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "foundedYear".equals(v.getPropertyPath().toString()));
    }

    @Test
    void foundedYearInTheFuture_failsValidation() {
        CreateCompanyRequest request = new CreateCompanyRequest(
                "TechCorp",
                "techcorp",
                null,
                null,
                null,
                null,
                null,
                2200
        );

        Set<ConstraintViolation<CreateCompanyRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "foundedYear".equals(v.getPropertyPath().toString()));
    }

    @Test
    void validRequest_passesValidation() {
        Set<ConstraintViolation<CreateCompanyRequest>> violations = validator.validate(validRequest());

        assertThat(violations).isEmpty();
    }
}
