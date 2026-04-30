package com.perfectjob.controller.v1;

import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.dto.response.JobSearchResponse;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.WorkModel;
import com.perfectjob.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final JobService jobService;

    @GetMapping("/jobs")
    public ResponseEntity<JobSearchResponse> searchJobs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) WorkModel workModel,
            @RequestParam(required = false) ExperienceLevel experienceLevel,
            Pageable pageable) {

        Page<JobResponse> page;
        if (q != null && !q.isBlank()) {
            page = jobService.searchFullText(q, pageable);
        } else {
            page = jobService.findActiveJobs(workModel, experienceLevel, pageable);
        }

        JobSearchResponse response = new JobSearchResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/suggest")
    public ResponseEntity<List<String>> suggest(@RequestParam String q) {
        return ResponseEntity.ok(jobService.suggestTitles(q));
    }
}
