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

class SubmitApplicationRequestValidationTest {

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

    private SubmitApplicationRequest validRequest() {
        return new SubmitApplicationRequest(1L, "I would like to apply.", "https://example.com/resume.pdf");
    }

    @Test
    void invalidResumeUrl_failsValidation() {
        SubmitApplicationRequest request = new SubmitApplicationRequest(
                1L,
                "I would like to apply.",
                "ftp://example.com/resume.pdf"
        );

        Set<ConstraintViolation<SubmitApplicationRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "resumeUrl".equals(v.getPropertyPath().toString()));
    }

    @Test
    void coverLetterTooLong_failsValidation() {
        String longCoverLetter = "a".repeat(5001);

        SubmitApplicationRequest request = new SubmitApplicationRequest(
                1L,
                longCoverLetter,
                "https://example.com/resume.pdf"
        );

        Set<ConstraintViolation<SubmitApplicationRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "coverLetter".equals(v.getPropertyPath().toString()));
    }

    @Test
    void nullJobId_failsValidation() {
        SubmitApplicationRequest request = new SubmitApplicationRequest(
                null,
                "I would like to apply.",
                "https://example.com/resume.pdf"
        );

        Set<ConstraintViolation<SubmitApplicationRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "jobId".equals(v.getPropertyPath().toString()));
    }

    @Test
    void validRequest_passesValidation() {
        Set<ConstraintViolation<SubmitApplicationRequest>> violations = validator.validate(validRequest());

        assertThat(violations).isEmpty();
    }
}
