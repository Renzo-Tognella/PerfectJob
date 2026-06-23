package com.perfectjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.controller.v1.ResumeController;
import com.perfectjob.dto.request.GenerateResumeRequest;
import com.perfectjob.dto.response.ResumeDetailResponse;
import com.perfectjob.dto.response.ResumeResponse;
import com.perfectjob.model.Job;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.security.JwtFilter;
import com.perfectjob.service.ResumeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ResumeController.class)
@AutoConfigureMockMvc(addFilters = false)
class ResumeControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private ResumeService resumeService;
    @MockBean private CurrentUserResolver currentUserResolver;
    @MockBean private JwtFilter jwtFilter;
    @MockBean private JobRepository jobRepository;

    private com.perfectjob.security.CurrentUser currentUser() {
        return new com.perfectjob.security.CurrentUser(1L, "cand@test.com",
                com.perfectjob.model.enums.Role.CANDIDATE);
    }

    @Test
    void generate_returns201WithBody() throws Exception {
        when(currentUserResolver.resolve()).thenReturn(currentUser());
        when(resumeService.generate(eq(1L), any(GenerateResumeRequest.class)))
                .thenReturn(new ResumeResponse(1L, 10L, "Dev", "/data/1/1.pdf",
                        LocalDateTime.now(), LocalDateTime.now()));

        mockMvc.perform(post("/v1/resumes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jobId\":10}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.jobId").value(10))
                .andExpect(jsonPath("$.jobTitle").value("Dev"));
    }

    @Test
    void list_returnsPagedResults() throws Exception {
        when(currentUserResolver.resolve()).thenReturn(currentUser());
        Page<ResumeResponse> page = new PageImpl<>(List.of(
                new ResumeResponse(1L, 10L, "Dev", "/data/1/1.pdf",
                        LocalDateTime.now(), LocalDateTime.now())
        ));
        when(resumeService.listByUser(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/v1/resumes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void detail_returnsDetailWithJobDescription() throws Exception {
        when(currentUserResolver.resolve()).thenReturn(currentUser());
        when(resumeService.getDetail(1L, 5L))
                .thenReturn(new ResumeDetailResponse(5L, 10L, "Dev", "Job desc",
                        "/data/1/5.pdf", "\\documentclass...", LocalDateTime.now(), LocalDateTime.now()));

        mockMvc.perform(get("/v1/resumes/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.jobDescription").value("Job desc"));
    }

    @Test
    void detail_returns403ForOtherUser() throws Exception {
        when(currentUserResolver.resolve()).thenReturn(currentUser());
        doThrow(new AccessDeniedException("not owner"))
                .when(resumeService).getDetail(anyLong(), anyLong());

        mockMvc.perform(get("/v1/resumes/999"))
                .andExpect(status().isForbidden());
    }

    @Test
    void pdf_streamsWithApplicationPdfContentType() throws Exception {
        when(currentUserResolver.resolve()).thenReturn(currentUser());
        Path tmp = Files.createTempFile("test-resume-", ".pdf");
        Files.writeString(tmp, "%PDF-1.4 fake");
        try {
            when(resumeService.getPdf(1L, 5L)).thenReturn(tmp);

            mockMvc.perform(get("/v1/resumes/5/pdf"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Type", "application/pdf"))
                    .andExpect(header().string("Content-Disposition",
                            org.hamcrest.Matchers.containsString("resume.pdf")));
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    @Test
    void delete_returns204() throws Exception {
        when(currentUserResolver.resolve()).thenReturn(currentUser());

        mockMvc.perform(delete("/v1/resumes/5"))
                .andExpect(status().isNoContent());
    }
}
