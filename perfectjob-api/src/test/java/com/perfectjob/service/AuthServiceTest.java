package com.perfectjob.service;

import com.perfectjob.dto.request.LoginRequest;
import com.perfectjob.dto.request.RegisterRequest;
import com.perfectjob.dto.response.AuthResponse;
import com.perfectjob.model.User;
import com.perfectjob.model.enums.Role;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest(
                "John Doe",
                "john@example.com",
                "password123"
        );

        loginRequest = new LoginRequest(
                "john@example.com",
                "password123"
        );

        user = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .passwordHash("encodedPassword")
                .role(Role.CANDIDATE)
                .build();
    }

    @Test
    void register_shouldCreateNewUserAndReturnAuthResponse() {
        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.password())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtProvider.generateToken(user.getEmail(), user.getRole().name())).thenReturn("jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.email()).isEqualTo("john@example.com");
        assertThat(response.fullName()).isEqualTo("John Doe");
        assertThat(response.role()).isEqualTo("CANDIDATE");

        verify(userRepository).existsByEmail(registerRequest.email());
        verify(passwordEncoder).encode(registerRequest.password());
        verify(userRepository).save(any(User.class));
        verify(jwtProvider).generateToken(user.getEmail(), user.getRole().name());
    }

    @Test
    void register_shouldThrowException_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Email already in use");

        verify(userRepository).existsByEmail(registerRequest.email());
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_shouldAuthenticateAndReturnAuthResponse() {
        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(user));
        when(jwtProvider.generateToken(user.getEmail(), user.getRole().name())).thenReturn("jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.email()).isEqualTo("john@example.com");
        assertThat(response.fullName()).isEqualTo("John Doe");
        assertThat(response.role()).isEqualTo("CANDIDATE");

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByEmail(loginRequest.email());
        verify(jwtProvider).generateToken(user.getEmail(), user.getRole().name());
    }

    @Test
    void login_shouldThrowException_whenUserNotFound() {
        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User not found");

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByEmail(loginRequest.email());
        verify(jwtProvider, never()).generateToken(any(), any());
    }

}
