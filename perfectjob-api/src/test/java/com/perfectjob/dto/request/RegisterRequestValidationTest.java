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

class RegisterRequestValidationTest {

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

    private RegisterRequest validRequest() {
        return new RegisterRequest("John Doe", "john@example.com", "password123");
    }

    @Test
    void passwordShorterThan8_failsValidation() {
        RegisterRequest request = new RegisterRequest("John Doe", "john@example.com", "123");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "password".equals(v.getPropertyPath().toString()));
    }

    @Test
    void fullNameShorterThan2_failsValidation() {
        RegisterRequest request = new RegisterRequest("J", "john@example.com", "password123");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "fullName".equals(v.getPropertyPath().toString()));
    }

    @Test
    void invalidEmail_failsValidation() {
        RegisterRequest request = new RegisterRequest("John Doe", "invalid-email", "password123");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anyMatch(v -> "email".equals(v.getPropertyPath().toString()));
    }

    @Test
    void validRequest_passesValidation() {
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(validRequest());

        assertThat(violations).isEmpty();
    }
}
