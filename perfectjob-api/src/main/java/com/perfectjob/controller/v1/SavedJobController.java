package com.perfectjob.controller.v1;

import com.perfectjob.dto.request.SaveJobRequest;
import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.dto.response.SavedJobResponse;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.service.SavedJobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/v1/saved-jobs")
@RequiredArgsConstructor
public class SavedJobController {

    private final SavedJobService savedJobService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SavedJobResponse> save(@Valid @RequestBody SaveJobRequest request) {
        CurrentUser currentUser = currentUserResolver.resolve();
        return ResponseEntity.ok(savedJobService.saveJob(request.jobId(), currentUser));
    }

    @DeleteMapping("/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unsave(@PathVariable Long jobId) {
        CurrentUser currentUser = currentUserResolver.resolve();
        savedJobService.unsaveJob(jobId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<JobResponse>> list(Pageable pageable) {
        CurrentUser currentUser = currentUserResolver.resolve();
        return ResponseEntity.ok(savedJobService.getMySavedJobs(currentUser, pageable));
    }

    @GetMapping("/{jobId}/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> check(@PathVariable Long jobId) {
        CurrentUser currentUser = currentUserResolver.resolve();
        return ResponseEntity.ok(Map.of("saved", savedJobService.isSaved(jobId, currentUser)));
    }
}
