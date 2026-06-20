package com.perfectjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.controller.v1.SavedJobController;
import com.perfectjob.dto.request.SaveJobRequest;
import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.dto.response.SavedJobResponse;
import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.Role;
import com.perfectjob.model.enums.WorkModel;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.SavedJobRepository;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.security.JwtFilter;
import com.perfectjob.service.SavedJobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SavedJobController.class)
@AutoConfigureMockMvc(addFilters = false)
class SavedJobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SavedJobService savedJobService;

    @MockBean
    private CurrentUserResolver currentUserResolver;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private SavedJobRepository savedJobRepository;

    @MockBean
    private JwtFilter jwtFilter;

    private final CurrentUser candidate = new CurrentUser(1L, "cand@test.com", Role.CANDIDATE);

    @BeforeEach
    void setUp() {
        when(currentUserResolver.resolve()).thenReturn(candidate);
    }

    @Test
    @WithMockUser(username = "cand@test.com")
    void save_shouldReturnSavedJobResponse() throws Exception {
        SavedJobResponse response = new SavedJobResponse(
                100L, 1L, 50L, "dev-java-123", LocalDateTime.now()
        );
        when(savedJobService.saveJob(anyLong(), any(CurrentUser.class))).thenReturn(response);

        SaveJobRequest request = new SaveJobRequest(50L);

        mockMvc.perform(post("/v1/saved-jobs")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.jobId").value(50))
                .andExpect(jsonPath("$.jobSlug").value("dev-java-123"));
    }

    @Test
    @WithMockUser(username = "cand@test.com")
    void unsave_shouldReturnNoContent() throws Exception {
        doNothing().when(savedJobService).unsaveJob(anyLong(), any(CurrentUser.class));

        mockMvc.perform(delete("/v1/saved-jobs/50")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(savedJobService).unsaveJob(50L, candidate);
    }

    @Test
    @WithMockUser(username = "cand@test.com")
    void list_shouldReturnPageOfJobs() throws Exception {
        JobResponse job = new JobResponse(
                50L, 10L, "TechCorp", "Dev Java", "dev-java-123",
                "Description", "Requirements", "Benefits",
                BigDecimal.valueOf(5000), BigDecimal.valueOf(10000), "BRL",
                WorkModel.REMOTE, ExperienceLevel.MID, JobType.FULL_TIME, ContractType.CLT,
                "São Paulo", "SP", "BR",
                List.of("Java"),
                JobStatus.ACTIVE, 10, 0,
                LocalDateTime.now(), LocalDateTime.now(), null
        );
        Page<JobResponse> page = new PageImpl<>(List.of(job));
        when(savedJobService.getMySavedJobs(any(CurrentUser.class), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/v1/saved-jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(50))
                .andExpect(jsonPath("$.content[0].title").value("Dev Java"));
    }

    @Test
    @WithMockUser(username = "cand@test.com")
    void check_shouldReturnSavedFlag() throws Exception {
        when(savedJobService.isSaved(anyLong(), any(CurrentUser.class))).thenReturn(true);

        mockMvc.perform(get("/v1/saved-jobs/50/check"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saved").value(true));
    }
}
