package com.perfectjob.service.resume.generate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.dto.response.ProfileResponse;
import com.perfectjob.exception.PdfCompilationException;
import com.perfectjob.exception.ResumeContentException;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;
import com.perfectjob.service.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResumeGenerationServiceTest {

    @Mock private ResumeContentAiService aiService;
    @Mock private LatexTemplateBuilder latexBuilder;
    @Mock private TectonicPdfCompiler tectonicCompiler;
    @Mock private ProfileService profileService;
    @Mock private JobContextMapper jobContextMapper;

    private ResumeGenerationService service;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Job job = sampleJob();

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        // jobContextMapper mock returns null by default; toJson(null) returns "null"
        // which the LLM mock receives as anyString().
        service = new ResumeGenerationService(
                aiService, latexBuilder, tectonicCompiler, profileService, objectMapper, jobContextMapper);
    }

    @Test
    void generate_happyPath_returnsLatexAndPdf() {
        when(profileService.getProfile(1L)).thenReturn(sampleProfile());
        TailoredResumeContent content = new TailoredResumeContent(
                "summary", List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(new TailoredResumeContent.TailoredExperience("Dev", "X", "Jan/2022", "Atual", List.of("feito")))
        );
        when(aiService.generateTailoredContent(anyString(), anyString())).thenReturn(content);
        when(latexBuilder.build(any(), any())).thenReturn("\\documentclass{article}...");
        when(tectonicCompiler.compile(anyString())).thenReturn(new byte[]{0x25, 0x50, 0x44, 0x46});

        ResumeGenerationService.GenerationResult result = service.generate(1L, job);

        assertThat(result.latexSource()).contains("documentclass");
        assertThat(result.pdfBytes()).containsExactly(0x25, 0x50, 0x44, 0x46);
        verify(aiService, times(1)).generateTailoredContent(anyString(), anyString());
    }

    @Test
    void generate_retriesOnFirstFailure_succeedsOnSecondAttempt() {
        when(profileService.getProfile(1L)).thenReturn(sampleProfile());
        TailoredResumeContent content = new TailoredResumeContent(
                "summary", List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(new TailoredResumeContent.TailoredExperience("Dev", "X", "Jan/2022", "Atual", List.of("feito")))
        );
        when(aiService.generateTailoredContent(anyString(), anyString()))
                .thenThrow(new RuntimeException("malformed response"))
                .thenReturn(content);
        when(latexBuilder.build(any(), any())).thenReturn("\\documentclass{article}...");
        when(tectonicCompiler.compile(anyString())).thenReturn(new byte[]{0x25});

        ResumeGenerationService.GenerationResult result = service.generate(1L, job);

        assertThat(result.latexSource()).contains("documentclass");
        verify(aiService, times(2)).generateTailoredContent(anyString(), anyString());
    }

    @Test
    void generate_throwsResumeContentExceptionWhenBothAttemptsFail() {
        when(profileService.getProfile(1L)).thenReturn(sampleProfile());
        when(aiService.generateTailoredContent(anyString(), anyString()))
                .thenThrow(new RuntimeException("first failure"))
                .thenThrow(new RuntimeException("second failure"));

        assertThatThrownBy(() -> service.generate(1L, job))
                .isInstanceOf(ResumeContentException.class)
                .hasMessageContaining("after retry");

        verify(aiService, times(2)).generateTailoredContent(anyString(), anyString());
    }

    @Test
    void generate_propagatesPdfCompilationExceptionWithoutRetry() {
        when(profileService.getProfile(1L)).thenReturn(sampleProfile());
        TailoredResumeContent content = new TailoredResumeContent(
                "summary", List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(new TailoredResumeContent.TailoredExperience("Dev", "X", "Jan/2022", "Atual", List.of("feito")))
        );
        when(aiService.generateTailoredContent(anyString(), anyString())).thenReturn(content);
        when(latexBuilder.build(any(), any())).thenReturn("\\documentclass{article}...");
        when(tectonicCompiler.compile(anyString()))
                .thenThrow(new PdfCompilationException("tectonic failed"));

        assertThatThrownBy(() -> service.generate(1L, job))
                .isInstanceOf(PdfCompilationException.class);

        verify(tectonicCompiler, times(1)).compile(anyString());
    }

    @Test
    void generate_passesBothProfileAndJobToLlm() {
        when(profileService.getProfile(1L)).thenReturn(sampleProfile());
        JobContextMapper.JobContext jobContext = new JobContextMapper.JobContext(
                job.getId(), job.getTitle(), "Acme",
                job.getDescription(), job.getRequirements(), null,
                List.of("Java"), job.getWorkModel().name(),
                job.getExperienceLevel().name(), job.getJobType().name(), job.getContractType().name(),
                job.getLocationCity(), job.getLocationState(), job.getLocationCountry(),
                job.getSalaryMin(), job.getSalaryMax(), null, null
        );
        when(jobContextMapper.toContext(job)).thenReturn(jobContext);
        TailoredResumeContent content = new TailoredResumeContent(
                "summary", List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(new TailoredResumeContent.TailoredExperience("Dev", "X", "Jan/2022", "Atual", List.of("feito")))
        );
        when(aiService.generateTailoredContent(anyString(), anyString())).thenReturn(content);
        when(latexBuilder.build(any(), any())).thenReturn("\\documentclass{article}...");
        when(tectonicCompiler.compile(anyString())).thenReturn(new byte[]{0x25, 0x50, 0x44, 0x46});

        service.generate(1L, job);

        ArgumentCaptor<String> profileCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> jobCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiService).generateTailoredContent(profileCaptor.capture(), jobCaptor.capture());

        String profileArg = profileCaptor.getValue();
        String jobArg = jobCaptor.getValue();

        assertThat(profileArg).isNotNull().isNotBlank();
        assertThat(jobArg).isNotNull().isNotBlank();
        assertThat(jobArg).contains("Senior Developer");
    }

    private Job sampleJob() {
        return Job.builder()
                .id(10L)
                .companyId(1L)
                .title("Senior Developer")
                .slug("senior-developer")
                .description("Job description")
                .requirements("Requirements")
                .salaryMin(new BigDecimal("5000"))
                .salaryMax(new BigDecimal("10000"))
                .workModel(WorkModel.REMOTE)
                .experienceLevel(ExperienceLevel.SENIOR)
                .jobType(JobType.FULL_TIME)
                .contractType(ContractType.CLT)
                .locationCity("São Paulo")
                .locationState("SP")
                .locationCountry("Brasil")
                .status(JobStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private ProfileResponse sampleProfile() {
        return new ProfileResponse(
                1L, "cand@test.com", "João", "CANDIDATE",
                "Dev", null, null, null, null, null, null, null, null, null, null,
                List.of("Java"), List.of(), List.of(), List.of(), 0L
        );
    }
}
