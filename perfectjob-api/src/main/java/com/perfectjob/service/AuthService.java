package com.perfectjob.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.perfectjob.dto.request.LoginRequest;
import com.perfectjob.dto.request.RegisterRequest;
import com.perfectjob.dto.response.AuthResponse;
import com.perfectjob.exception.DuplicateResourceException;
import com.perfectjob.model.User;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.security.JwtProvider;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Este email já está cadastrado");
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

        String email = authentication.getName(); // email autenticado
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

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
