package com.perfectjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.dto.response.ApplicationResponse;
import com.perfectjob.model.Application;
import com.perfectjob.model.enums.ApplicationStatus;
import com.perfectjob.model.enums.Role;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.service.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class ApplicationControllerSecurityTest {

    @Autowired
    private WebApplicationContext context;

    @MockBean
    private ApplicationService applicationService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private CurrentUserResolver currentUserResolver;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        CurrentUser candidate = new CurrentUser(1L, "candidate@test.com", Role.CANDIDATE);
        CurrentUser recruiter = new CurrentUser(2L, "recruiter@test.com", Role.RECRUITER);
        CurrentUser admin = new CurrentUser(3L, "admin@test.com", Role.ADMIN);
        when(currentUserResolver.resolve()).thenReturn(candidate);
        when(currentUserResolver.resolve()).thenReturn(recruiter);
        when(currentUserResolver.resolve()).thenReturn(admin);
    }

    @Test
    void listMyApplications_anonymousIsUnauthorized() throws Exception {
        mockMvc.perform(get("/v1/applications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void listMyApplications_candidateSucceeds() throws Exception {
        Page<ApplicationResponse> empty = new PageImpl<>(List.of());
        when(applicationService.getMyApplications(anyLong(), any(Pageable.class), any(CurrentUser.class)))
                .thenReturn(empty);
        mockMvc.perform(get("/v1/applications"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "recruiter@test.com", roles = {"RECRUITER"})
    void listMyApplications_recruiterSucceeds() throws Exception {
        Page<ApplicationResponse> empty = new PageImpl<>(List.of());
        when(applicationService.getMyApplications(anyLong(), any(Pageable.class), any(CurrentUser.class)))
                .thenReturn(empty);
        mockMvc.perform(get("/v1/applications"))
                .andExpect(status().isOk());
    }

    @Test
    void recent_anonymousIsUnauthorized() throws Exception {
        mockMvc.perform(get("/v1/applications/recent"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void recent_candidateIsForbidden() throws Exception {
        mockMvc.perform(get("/v1/applications/recent"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "recruiter@test.com", roles = {"RECRUITER"})
    void recent_recruiterSucceeds() throws Exception {
        mockMvc.perform(get("/v1/applications/recent"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void recent_adminSucceeds() throws Exception {
        mockMvc.perform(get("/v1/applications/recent"))
                .andExpect(status().isOk());
    }

    @Test
    void apply_anonymousIsUnauthorized() throws Exception {
        String body = "{\"jobId\":1,\"coverLetter\":\"x\"}";
        mockMvc.perform(post("/v1/applications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void apply_candidateSucceeds() throws Exception {
        when(applicationService.submitApplication(anyLong(), any())).thenReturn(
                Application.builder().id(1L).build());
        when(applicationService.getMyApplications(anyLong(), any(Pageable.class), any(CurrentUser.class)))
                .thenReturn(new PageImpl<>(List.of(
                        new ApplicationResponse(1L, 1L, "J", "C", 1L, "U",
                                "PENDING", null, null,
                                LocalDateTime.now(), LocalDateTime.now()))));

        String body = "{\"jobId\":1,\"coverLetter\":\"x\"}";
        mockMvc.perform(post("/v1/applications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void updateStatus_candidateIsForbidden() throws Exception {
        String body = "{\"status\":\"ACCEPTED\"}";
        mockMvc.perform(patch("/v1/applications/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "recruiter@test.com", roles = {"RECRUITER"})
    void updateStatus_recruiterSucceeds() throws Exception {
        when(applicationService.updateStatus(any(), any(), any())).thenReturn(
                new ApplicationResponse(1L, 1L, "J", "C", 1L, "U",
                        "ACCEPTED", null, null,
                        LocalDateTime.now(), LocalDateTime.now()));

        String body = "{\"status\":\"ACCEPTED\"}";
        mockMvc.perform(patch("/v1/applications/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }
}
