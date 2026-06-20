package com.perfectjob.exception;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildResponse(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Email ou senha inválidos");
    }

    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<ErrorResponse> handleExpiredJwt(ExpiredJwtException ex) {
        return buildResponseWithErrorCode(HttpStatus.UNAUTHORIZED, "Token expired", "token_expired");
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ErrorResponse> handleJwtException(JwtException ex) {
        return buildResponseWithErrorCode(HttpStatus.UNAUTHORIZED, "Invalid token", "invalid_token");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        Map<String, String> details = new HashMap<>();
        details.put("error", "forbidden");
        return buildResponseWithDetails(HttpStatus.FORBIDDEN, "Access denied", details);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage() != null ? ex.getMessage() : "Authentication required");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = error instanceof FieldError
                    ? ((FieldError) error).getField()
                    : error.getObjectName();
            String errorMessage = error.getDefaultMessage();
            errors.merge(fieldName, errorMessage == null ? "invalid" : errorMessage,
                    (a, b) -> a + "; " + b);
        });

        Map<String, String> details = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        e -> e.getDefaultMessage() == null ? "invalid" : e.getDefaultMessage(),
                        (a, b) -> a + "; " + b));

        String message = errors.values().stream()
                .findFirst()
                .orElse("Dados inválidos");

        return buildResponseWithDetails(HttpStatus.BAD_REQUEST, message, details);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocorreu um erro interno. Tente novamente mais tarde.");
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message) {
        return buildResponseInternal(status, message, null, null);
    }

    private ResponseEntity<ErrorResponse> buildResponseWithDetails(HttpStatus status, String message, Map<String, String> details) {
        return buildResponseInternal(status, message, details, null);
    }

    private ResponseEntity<ErrorResponse> buildResponseWithErrorCode(HttpStatus status, String message, String errorCode) {
        Map<String, String> details = errorCode != null ? Map.of("error", errorCode) : null;
        return buildResponseInternal(status, message, details, errorCode);
    }

    private ResponseEntity<ErrorResponse> buildResponseInternal(HttpStatus status, String message,
                                                                Map<String, String> details, String errorCode) {
        ErrorResponse error = new ErrorResponse(
                status.value(),
                message,
                details,
                errorCode,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(error, status);
    }

    public record ErrorResponse(
            int status,
            String message,
            Map<String, String> details,
            String error,
            LocalDateTime timestamp
    ) {}
}
