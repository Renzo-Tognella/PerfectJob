package com.perfectjob.dto.response;

public record AuthResponse(
    String accessToken,
    String tokenType,
    String email,
    String fullName,
    String role
) {}
