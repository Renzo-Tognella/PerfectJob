package com.perfectjob.controller.v1;

import com.perfectjob.dto.request.GenerateResumeRequest;
import com.perfectjob.dto.response.ResumeDetailResponse;
import com.perfectjob.dto.response.ResumeResponse;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;

@RestController
@RequestMapping("/v1/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResumeResponse> generate(@Valid @RequestBody GenerateResumeRequest request) {
        Long userId = currentUserResolver.resolve().id();
        return ResponseEntity.ok(resumeService.generate(userId, request));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ResumeResponse>> list(Pageable pageable) {
        Long userId = currentUserResolver.resolve().id();
        return ResponseEntity.ok(resumeService.listByUser(userId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResumeDetailResponse> detail(@PathVariable Long id) {
        Long userId = currentUserResolver.resolve().id();
        return ResponseEntity.ok(resumeService.getDetail(userId, id));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> pdf(@PathVariable Long id) {
        Long userId = currentUserResolver.resolve().id();
        Path path = resumeService.getPdf(userId, id);
        Resource resource = new PathResource(path);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"resume.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = currentUserResolver.resolve().id();
        resumeService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
