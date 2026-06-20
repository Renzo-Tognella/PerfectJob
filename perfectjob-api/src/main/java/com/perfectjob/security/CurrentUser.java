package com.perfectjob.security;

import com.perfectjob.model.enums.Role;

public record CurrentUser(Long id, String email, Role role) {
    public boolean isAdmin() { return role == Role.ADMIN; }
    public boolean isRecruiter() { return role == Role.RECRUITER; }
    public boolean isCandidate() { return role == Role.CANDIDATE; }
}
