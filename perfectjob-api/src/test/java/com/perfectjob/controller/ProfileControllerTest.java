package com.perfectjob.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perfectjob.controller.v1.ProfileController;
import com.perfectjob.dto.request.UpdateProfileRequest;
import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.LanguageDto;
import com.perfectjob.dto.response.ProfileResponse;
import com.perfectjob.dto.response.ResumeAnalysisResponse;
import com.perfectjob.model.enums.Role;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.security.JwtFilter;
import com.perfectjob.service.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProfileService profileService;

    @MockBean
    private CurrentUserResolver currentUserResolver;

    @MockBean
    private JwtFilter jwtFilter;

    private ProfileResponse sampleProfile() {
        return new ProfileResponse(
                1L, "cand@test.com", "João Silva", "CANDIDATE",
                "Desenvolvedor Full Stack", "11999998888", "bio", null,
                "https://linkedin.com/in/joao", "https://github.com/joao",
                "São Paulo", "SP", 5, null, LocalDateTime.now(),
                List.of("Java", "React"),
                List.of(new ExperienceDto("Dev", "Acme", "2020", null, "desc")),
                List.of(new EducationDto("USP", "BSc", "CS", 2015, 2019)),
                List.of(new LanguageDto("Inglês", "Avançado")),
                4L, 2L);
    }

    @BeforeEach
    void setUp() {
        when(currentUserResolver.resolve()).thenReturn(new CurrentUser(1L, "cand@test.com", Role.CANDIDATE));
    }

    @Test
    void getMyProfile_returnsProfile() throws Exception {
        when(profileService.getProfile(1L)).thenReturn(sampleProfile());

        mockMvc.perform(get("/v1/profile/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("João Silva"))
                .andExpect(jsonPath("$.skills[0]").value("Java"))
                .andExpect(jsonPath("$.experiences[0].company").value("Acme"))
                .andExpect(jsonPath("$.languages[0].name").value("Inglês"))
                .andExpect(jsonPath("$.languages[0].level").value("Avançado"))
                .andExpect(jsonPath("$.applicationsCount").value(4))
                .andExpect(jsonPath("$.savedJobsCount").value(2));
    }

    @Test
    void updateMyProfile_returnsUpdatedProfile() throws Exception {
        when(profileService.updateProfile(anyLong(), any(UpdateProfileRequest.class)))
                .thenReturn(sampleProfile());

        UpdateProfileRequest request = new UpdateProfileRequest(
                "João Silva", "Desenvolvedor Full Stack", null, null, null, null, null,
                null, null, 5, List.of("Java"), null, null, null);

        mockMvc.perform(patch("/v1/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("Desenvolvedor Full Stack"));
    }

    @Test
    void uploadResume_returnsAnalysis() throws Exception {
        ResumeAnalysisResponse analysis = new ResumeAnalysisResponse(
                "Dev", "a@b.com", "11999", "https://linkedin.com/in/x", "https://github.com/x",
                5, List.of("Java", "Spring Boot"),
                List.of(new ExperienceDto("Dev", "Acme", "2020", null, "d")),
                List.of(new EducationDto("USP", "BSc", "CS", 2015, 2019)),
                List.of(new LanguageDto("Inglês", "Avançado")));
        when(profileService.analyzeResume(anyLong(), any(), any(), any())).thenReturn(analysis);

        MockMultipartFile file = new MockMultipartFile(
                "file", "cv.txt", "text/plain", "meu curriculo".getBytes());

        mockMvc.perform(multipart("/v1/profile/me/resume").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills[1]").value("Spring Boot"))
                .andExpect(jsonPath("$.experiences[0].company").value("Acme"));
    }

    @Test
    void uploadResume_withEmptyFile_returnsBadRequest() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "cv.txt", "text/plain", new byte[0]);

        mockMvc.perform(multipart("/v1/profile/me/resume").file(file))
                .andExpect(status().isBadRequest());
    }
}
