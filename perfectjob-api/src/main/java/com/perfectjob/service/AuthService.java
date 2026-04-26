package com.perfectjob.service;

import com.perfectjob.dto.request.LoginRequest;
import com.perfectjob.dto.request.RegisterRequest;
import com.perfectjob.dto.response.AuthResponse;
import com.perfectjob.model.User;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        userRepository.save(user);

        String token = jwtProvider.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(
                token,
                "Bearer",
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        );
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtProvider.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(
                token,
                "Bearer",
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        );
    }
}
