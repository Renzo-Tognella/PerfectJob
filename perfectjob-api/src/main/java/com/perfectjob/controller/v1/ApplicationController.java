package com.perfectjob.controller.v1;

import com.perfectjob.dto.request.SubmitApplicationRequest;
import com.perfectjob.model.Application;
import com.perfectjob.model.User;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Application> apply(@Valid @RequestBody SubmitApplicationRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(applicationService.submitApplication(user.getId(), request));
    }
}
