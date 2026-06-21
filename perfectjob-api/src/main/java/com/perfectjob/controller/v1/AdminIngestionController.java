package com.perfectjob.controller.v1;

import com.perfectjob.dto.response.IngestionResultResponse;
import com.perfectjob.service.ingestion.JobIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only manual trigger for the external job ingestion pipeline. Useful for
 * seeding the catalogue on demand without waiting for the schedule.
 */
@RestController
@RequestMapping("/v1/admin/ingestion")
@RequiredArgsConstructor
public class AdminIngestionController {

    private final JobIngestionService ingestionService;

    @PostMapping("/run")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IngestionResultResponse> run(
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        int bounded = Math.min(Math.max(limit, 1), 200);
        return ResponseEntity.ok(ingestionService.ingestAll(bounded));
    }
}
