package com.perfectjob.service;

import com.perfectjob.dto.request.GenerateResumeRequest;
import com.perfectjob.dto.response.ResumeDetailResponse;
import com.perfectjob.dto.response.ResumeResponse;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.Job;
import com.perfectjob.model.Resume;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.ResumeRepository;
import com.perfectjob.service.resume.generate.ResumeGenerationService;
import com.perfectjob.service.resume.generate.ResumePdfStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;


@Service
@Transactional
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final ResumeGenerationService resumeGenerationService;
    private final ResumePdfStorage resumePdfStorage;

    public ResumeResponse generate(Long userId, GenerateResumeRequest request) {
        Job job = jobRepository.findById(request.jobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", request.jobId()));

        ResumeGenerationService.GenerationResult result =
                resumeGenerationService.generate(userId, job);

        Resume resume = Resume.builder()
                .userId(userId)
                .jobId(job.getId())
                .latexSource(result.latexSource())
                .pdfStoragePath("")
                .build();
        Resume saved = resumeRepository.save(resume);

        Path stored = resumePdfStorage.store(userId, saved.getId(), result.pdfBytes());
        saved.setPdfStoragePath(stored.toString());
        saved = resumeRepository.save(saved);

        return toResponse(saved, job.getTitle());
    }

    @Transactional(readOnly = true)
    public Page<ResumeResponse> listByUser(Long userId, Pageable pageable) {
        return resumeRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(r -> toResponse(r, lookupJobTitle(r.getJobId())));
    }

    @Transactional(readOnly = true)
    public ResumeDetailResponse getDetail(Long userId, Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
        ensureOwner(resume, userId);
        Job job = jobRepository.findById(resume.getJobId()).orElse(null);
        return new ResumeDetailResponse(
                resume.getId(),
                resume.getJobId(),
                job != null ? job.getTitle() : "(vaga removida)",
                job != null ? job.getDescription() : null,
                resume.getPdfStoragePath(),
                resume.getLatexSource(),
                resume.getCreatedAt(),
                resume.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public Path getPdf(Long userId, Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
        ensureOwner(resume, userId);
        Path p = resumePdfStorage.resolve(resume.getPdfStoragePath());
        if (!p.toFile().isFile()) {
            throw new ResourceNotFoundException("Resume PDF file", "path", resume.getPdfStoragePath());
        }
        return p;
    }

    public void delete(Long userId, Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
        ensureOwner(resume, userId);
        resumePdfStorage.delete(resume.getPdfStoragePath());
        resumeRepository.delete(resume);
    }



    private void ensureOwner(Resume resume, Long userId) {
        if (!resume.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not own this resume");
        }
    }

    private String lookupJobTitle(Long jobId) {
        return jobRepository.findById(jobId).map(Job::getTitle).orElse("(vaga removida)");
    }

    private ResumeResponse toResponse(Resume r, String jobTitle) {
        return new ResumeResponse(
                r.getId(),
                r.getJobId(),
                jobTitle,
                r.getPdfStoragePath(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
