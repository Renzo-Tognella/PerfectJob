package com.perfectjob.dto.response;

public record UserResponse(
    Long id,
    String email,
    String fullName,
    String role
) {}
