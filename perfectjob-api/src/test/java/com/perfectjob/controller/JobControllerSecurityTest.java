package com.perfectjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.dto.request.CreateJobRequest;
import com.perfectjob.model.Company;
import com.perfectjob.model.enums.*;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.service.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class JobControllerSecurityTest {

    @Autowired
    private WebApplicationContext context;

    @MockBean
    private JobService jobService;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private CompanyRepository companyRepository;

    @MockBean
    private CurrentUserResolver currentUserResolver;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        CurrentUser owner = new CurrentUser(2L, "owner@test.com", Role.RECRUITER);
        CurrentUser admin = new CurrentUser(1L, "admin@test.com", Role.ADMIN);
        when(currentUserResolver.resolve()).thenReturn(owner);
        when(currentUserResolver.resolve()).thenReturn(admin);

        Company company = Company.builder().id(10L).name("Co").slug("co").ownerUserId(2L).build();
        when(companyRepository.findById(10L)).thenReturn(Optional.of(company));
    }

    private CreateJobRequest sampleRequest() {
        return new CreateJobRequest(
                "Dev", 10L, "desc", null, null, null, null,
                WorkModel.REMOTE, ExperienceLevel.JUNIOR, JobType.FULL_TIME, ContractType.CLT,
                null, null, List.of("Java"), LocalDateTime.now().plusDays(30)
        );
    }

    @Test
    void create_anonymousIsUnauthorized() throws Exception {
        mockMvc.perform(post("/v1/jobs")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void create_candidateIsForbidden() throws Exception {
        mockMvc.perform(post("/v1/jobs")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    @WithMockUser(username = "owner@test.com", roles = {"RECRUITER"})
    void create_recruiterSucceeds() throws Exception {
        mockMvc.perform(post("/v1/jobs")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void create_adminSucceeds() throws Exception {
        mockMvc.perform(post("/v1/jobs")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void update_candidateIsForbidden() throws Exception {
        mockMvc.perform(patch("/v1/jobs/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner@test.com", roles = {"RECRUITER"})
    void update_recruiterSucceeds() throws Exception {
        when(jobService.update(anyLong(), any(), any())).thenReturn(null);

        mockMvc.perform(patch("/v1/jobs/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());
    }

    @Test
    void update_anonymousIsForbidden() throws Exception {
        mockMvc.perform(patch("/v1/jobs/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void close_candidateIsForbidden() throws Exception {
        mockMvc.perform(post("/v1/jobs/1/close")
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner@test.com", roles = {"RECRUITER"})
    void close_recruiterSucceeds() throws Exception {
        when(jobService.closeJob(anyLong(), any())).thenReturn(null);

        mockMvc.perform(post("/v1/jobs/1/close")
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void close_anonymousIsUnauthorized() throws Exception {
        mockMvc.perform(post("/v1/jobs/1/close")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }
}
