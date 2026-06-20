package com.perfectjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.controller.v1.ApplicationController;
import com.perfectjob.dto.request.SubmitApplicationRequest;
import com.perfectjob.dto.response.ApplicationResponse;
import com.perfectjob.model.Application;
import com.perfectjob.model.User;
import com.perfectjob.model.enums.Role;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.security.JwtFilter;
import com.perfectjob.service.ApplicationService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ApplicationService applicationService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private CurrentUserResolver currentUserResolver;

    @MockBean
    private JwtFilter jwtFilter;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .id(1L).email("john@example.com").fullName("John").role(Role.CANDIDATE)
                .build();
        CurrentUser currentUser = new CurrentUser(1L, "john@example.com", Role.CANDIDATE);
        when(currentUserResolver.resolve()).thenReturn(currentUser);
        when(userRepository.findByEmail("john@example.com")).thenReturn(java.util.Optional.of(user));
    }

    @Test
    @WithMockUser(username = "john@example.com")
    void listMyApplications_shouldReturnApplications() throws Exception {
        Page<ApplicationResponse> page = new PageImpl<>(List.of(
                new ApplicationResponse(
                        1L, 10L, "Dev Job", "TechCorp", 1L, "John",
                        "PENDING", "Cover letter", null,
                        LocalDateTime.now(), LocalDateTime.now()
                )));
        when(applicationService.getMyApplications(anyLong(), any(Pageable.class), any(CurrentUser.class)))
                .thenReturn(page);

        mockMvc.perform(get("/v1/applications")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].jobTitle").value("Dev Job"))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "john@example.com")
    void recent_shouldReturnPaginatedApplications() throws Exception {
        Page<ApplicationResponse> page = new PageImpl<>(List.of(
                new ApplicationResponse(
                        1L, 10L, "Dev Job", "TechCorp", 1L, "John",
                        "PENDING", null, null,
                        LocalDateTime.now(), LocalDateTime.now()
                )));
        when(applicationService.getRecentApplications(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/v1/applications/recent")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].jobTitle").value("Dev Job"));
    }

    @Test
    @WithMockUser(username = "john@example.com")
    void apply_shouldCreateApplication() throws Exception {
        Application app = Application.builder()
                .id(1L).jobId(10L).candidateId(1L).status("PENDING").coverLetter("Cover")
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
        when(applicationService.submitApplication(anyLong(), any())).thenReturn(app);

        Page<ApplicationResponse> page = new PageImpl<>(List.of(
                new ApplicationResponse(
                        1L, 10L, "Dev Job", "TechCorp", 1L, "John",
                        "PENDING", "Cover", null,
                        LocalDateTime.now(), LocalDateTime.now()
                )));
        when(applicationService.getMyApplications(anyLong(), any(Pageable.class), any(CurrentUser.class)))
                .thenReturn(page);

        SubmitApplicationRequest request = new SubmitApplicationRequest(10L, "Cover", null);

        mockMvc.perform(post("/v1/applications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle").value("Dev Job"));
    }
}
