package com.perfectjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.dto.request.CreateCompanyRequest;
import com.perfectjob.model.enums.Role;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.service.CompanyService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class CompanyControllerSecurityTest {

    @Autowired
    private WebApplicationContext context;

    @MockBean
    private CompanyService companyService;

    @MockBean
    private CompanyRepository companyRepository;

    @MockBean
    private CurrentUserResolver currentUserResolver;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        CurrentUser owner = new CurrentUser(2L, "owner@test.com", Role.RECRUITER);
        CurrentUser admin = new CurrentUser(1L, "admin@test.com", Role.ADMIN);
        when(currentUserResolver.resolve()).thenReturn(owner);
        when(currentUserResolver.resolve()).thenReturn(admin);
    }

    private CreateCompanyRequest sampleRequest() {
        return new CreateCompanyRequest("Acme", "acme", "desc", null, null, null, null, 2020);
    }

    @Test
    void create_anonymousIsUnauthorized() throws Exception {
        mockMvc.perform(post("/v1/companies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void create_candidateIsForbidden() throws Exception {
        mockMvc.perform(post("/v1/companies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    @WithMockUser(username = "owner@test.com", roles = {"RECRUITER"})
    void create_recruiterSucceeds() throws Exception {
        mockMvc.perform(post("/v1/companies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void create_adminSucceeds() throws Exception {
        mockMvc.perform(post("/v1/companies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void update_candidateIsForbidden() throws Exception {
        mockMvc.perform(patch("/v1/companies/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner@test.com", roles = {"RECRUITER"})
    void update_recruiterSucceeds() throws Exception {
        mockMvc.perform(patch("/v1/companies/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = {"CANDIDATE"})
    void delete_candidateIsForbidden() throws Exception {
        mockMvc.perform(delete("/v1/companies/1")
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner@test.com", roles = {"RECRUITER"})
    void delete_recruiterSucceeds() throws Exception {
        mockMvc.perform(delete("/v1/companies/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
