package com.perfectjob.controller.v1;

import com.perfectjob.dto.response.AdminResumeResponse;
import com.perfectjob.dto.response.AdminResumeStatsResponse;
import com.perfectjob.dto.response.ResumeCountByJobResponse;
import com.perfectjob.service.AdminResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/v1/admin/resumes")
@RequiredArgsConstructor
public class AdminResumeController {

    private final AdminResumeService adminResumeService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminResumeResponse>> list(Pageable pageable) {
        return ResponseEntity.ok(adminResumeService.listAll(pageable));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminResumeStatsResponse> stats() {
        return ResponseEntity.ok(adminResumeService.stats());
    }

    @GetMapping("/by-job")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ResumeCountByJobResponse>> byJob() {
        return ResponseEntity.ok(adminResumeService.resumesByJob());
    }
}
