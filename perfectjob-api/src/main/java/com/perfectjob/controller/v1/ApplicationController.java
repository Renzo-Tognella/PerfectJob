package com.perfectjob.controller.v1;

import com.perfectjob.dto.request.SubmitApplicationRequest;
import com.perfectjob.dto.request.UpdateApplicationStatusRequest;
import com.perfectjob.dto.response.ApplicationResponse;
import com.perfectjob.model.Application;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ApplicationResponse>> listMyApplications(Pageable pageable) {
        CurrentUser currentUser = currentUserResolver.resolve();
        return ResponseEntity.ok(applicationService.getMyApplications(currentUser.id(), pageable, currentUser));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    public ResponseEntity<Page<ApplicationResponse>> listRecent(Pageable pageable) {
        return ResponseEntity.ok(applicationService.getRecentApplications(pageable));
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    public ResponseEntity<Page<ApplicationResponse>> byJob(@PathVariable Long jobId, Pageable pageable) {
        CurrentUser currentUser = currentUserResolver.resolve();
        return ResponseEntity.ok(applicationService.getApplicationsByJob(jobId, pageable, currentUser));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApplicationResponse> apply(@Valid @RequestBody SubmitApplicationRequest request) {
        CurrentUser currentUser = currentUserResolver.resolve();
        Application app = applicationService.submitApplication(currentUser.id(), request);
        return ResponseEntity.ok(applicationService.getMyApplications(currentUser.id(), Pageable.unpaged(), currentUser)
                .stream()
                .filter(a -> a.id().equals(app.getId()))
                .findFirst()
                .orElseThrow());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest request) {
        CurrentUser currentUser = currentUserResolver.resolve();
        return ResponseEntity.ok(applicationService.updateStatus(id, request.status(), currentUser));
    }
}
