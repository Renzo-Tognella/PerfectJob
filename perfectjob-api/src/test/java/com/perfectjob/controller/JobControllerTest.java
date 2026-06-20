package com.perfectjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.controller.v1.JobController;
import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.dto.response.JobStatsResponse;
import com.perfectjob.model.enums.*;
import com.perfectjob.repository.ApplicationRepository;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.security.JwtFilter;
import com.perfectjob.service.JobService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(JobController.class)
@AutoConfigureMockMvc(addFilters = false)
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JobService jobService;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private ApplicationRepository applicationRepository;

    @MockBean
    private JwtFilter jwtFilter;

    @MockBean
    private CurrentUserResolver currentUserResolver;

    @Test
    void featured_shouldReturnPageOfJobs() throws Exception {
        JobResponse job = new JobResponse(
                1L, 1L, "TechCorp", "Dev Job", "dev-job-123",
                "Description", "Requirements", "Benefits",
                BigDecimal.valueOf(5000), BigDecimal.valueOf(10000), "BRL",
                WorkModel.REMOTE, ExperienceLevel.MID, JobType.FULL_TIME, ContractType.CLT,
                "São Paulo", "SP", "BR",
                List.of("Java", "Spring"),
                JobStatus.ACTIVE, 10, 3,
                LocalDateTime.now(), LocalDateTime.now(), null
        );
        Page<JobResponse> page = new PageImpl<>(List.of(job));

        when(jobService.findActiveJobs(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/v1/jobs/featured")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Dev Job"))
                .andExpect(jsonPath("$.content[0].companyName").value("TechCorp"));
    }

    @Test
    void suggest_shouldReturnSuggestions() throws Exception {
        when(jobService.suggestTitles("dev")).thenReturn(List.of("Dev Java", "Dev React"));

        mockMvc.perform(get("/v1/jobs/suggest")
                        .param("q", "dev")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("Dev Java"));
    }

    @Test
    void stats_shouldReturnStats() throws Exception {
        when(jobService.getStats()).thenReturn(new JobStatsResponse(0L, 42L, 0L, 0L));

        mockMvc.perform(get("/v1/jobs/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeJobs").value(0))
                .andExpect(jsonPath("$.totalApplications").value(42))
                .andExpect(jsonPath("$.applicationsToday").value(0));
    }
}
