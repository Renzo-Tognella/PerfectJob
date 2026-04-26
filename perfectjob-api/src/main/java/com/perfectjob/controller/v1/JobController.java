package com.perfectjob.controller.v1;

import com.perfectjob.dto.request.CreateJobRequest;
import com.perfectjob.dto.request.SearchJobRequest;
import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.WorkModel;
import com.perfectjob.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public ResponseEntity<Page<JobResponse>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) WorkModel workModel,
            @RequestParam(required = false) ExperienceLevel experienceLevel,
            @RequestParam(required = false) BigDecimal minSalary,
            @RequestParam(required = false) List<String> skills,
            Pageable pageable) {

        SearchJobRequest request = new SearchJobRequest(
                Optional.ofNullable(keyword),
                Optional.ofNullable(workModel),
                Optional.ofNullable(experienceLevel),
                Optional.ofNullable(minSalary),
                Optional.ofNullable(skills)
        );

        return ResponseEntity.ok(jobService.search(request, pageable));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<JobResponse> getJob(@PathVariable String slug) {
        return ResponseEntity.ok(jobService.findBySlug(slug));
    }

    @PostMapping
    public ResponseEntity<JobResponse> createJob(@Valid @RequestBody CreateJobRequest request) {
        return ResponseEntity.ok(jobService.create(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<JobResponse> updateJob(
            @PathVariable Long id,
            @Valid @RequestBody CreateJobRequest request) {
        return ResponseEntity.ok(jobService.update(id, request));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<JobResponse> closeJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.closeJob(id));
    }
}
