package com.perfectjob.service.resume.generate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.perfectjob.dto.response.ProfileResponse;
import com.perfectjob.exception.ResumeContentException;
import com.perfectjob.model.Job;
import com.perfectjob.service.ProfileService;

/**
 * Orchestrates the resume generation pipeline:
 * 1. Serialize profile + job for the LLM
 * 2. Call LLM (with retry on parse failure) to get structured content
 * 3. Build the LaTeX template
 * 4. Compile to PDF via tectonic
 *
 * The result ({@link GenerationResult}) is persisted by the caller (ResumeService).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeGenerationService {

    private final ResumeContentAiService resumeContentAiService;
    private final LatexTemplateBuilder latexTemplateBuilder;
    private final TectonicPdfCompiler tectonicPdfCompiler;
    private final ProfileService profileService;
    private final ObjectMapper objectMapper;

    public GenerationResult generate(Long userId, Job job) {
        ProfileResponse profile = profileService.getProfile(userId);
        String profileJson = toJson(profile);
        String jobContext = toJson(job);

        TailoredResumeContent content = generateContentWithRetry(profileJson, jobContext);
        log.info("AUDIT: resume content generated userId={} jobId={} skills={} experiences={}",
                userId, job.getId(),
                content.highlightedSkills() == null ? 0 : content.highlightedSkills().size(),
                content.tailoredExperiences() == null ? 0 : content.tailoredExperiences().size());

        String latex = latexTemplateBuilder.build(content, profile);
        byte[] pdfBytes = tectonicPdfCompiler.compile(latex);
        log.info("AUDIT: resume PDF compiled userId={} jobId={} bytes={}", userId, job.getId(), pdfBytes.length);

        return new GenerationResult(latex, pdfBytes);
    }

    private TailoredResumeContent generateContentWithRetry(String profileJson, String jobContext) {
        try {
            return resumeContentAiService.generateTailoredContent(profileJson, jobContext);
        } catch (RuntimeException firstFailure) {
            log.warn("First LLM call failed, retrying once: {}", firstFailure.getMessage());
            try {
                return resumeContentAiService.generateTailoredContent(profileJson, jobContext);
            } catch (RuntimeException secondFailure) {
                log.error("LLM retry also failed: {}", secondFailure.getMessage());
                throw new ResumeContentException(
                        "Failed to generate resume content after retry: " + secondFailure.getMessage(), secondFailure);
            }
        }
    }

    public record GenerationResult(String latexSource, byte[] pdfBytes) {}

    private String toJson(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            throw new ResumeContentException("Failed to serialize input for LLM", e);
        }
    }
}
