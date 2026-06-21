package com.perfectjob.service;

import com.perfectjob.dto.request.UpdateProfileRequest;
import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.ProfileResponse;
import com.perfectjob.dto.response.ResumeAnalysisResponse;
import com.perfectjob.model.User;
import com.perfectjob.model.UserEducation;
import com.perfectjob.model.UserExperience;
import com.perfectjob.model.enums.Role;
import com.perfectjob.repository.ApplicationRepository;
import com.perfectjob.repository.SavedJobRepository;
import com.perfectjob.repository.UserEducationRepository;
import com.perfectjob.repository.UserExperienceRepository;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.service.resume.PdfTextExtractor;
import com.perfectjob.service.resume.ResumeAnalyzer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserExperienceRepository experienceRepository;
    @Mock private UserEducationRepository educationRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private SavedJobRepository savedJobRepository;
    @Mock private ResumeAnalyzer resumeAnalyzer;
    @Mock private PdfTextExtractor pdfTextExtractor;

    @InjectMocks private ProfileService profileService;

    private User candidate() {
        return User.builder()
                .id(1L)
                .email("cand@test.com")
                .fullName("Original Name")
                .role(Role.CANDIDATE)
                .skills(new ArrayList<>(List.of("Python")))
                .build();
    }

    @Test
    void getProfile_returnsProfileWithCountsAndCollections() {
        User user = candidate();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(experienceRepository.findByUserIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(
                UserExperience.builder().userId(1L).title("Dev").company("X")
                        .startDate("2020").endDate("2022").description("d").displayOrder(0).build()));
        when(educationRepository.findByUserIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(
                UserEducation.builder().userId(1L).institution("USP").degree("BSc")
                        .fieldOfStudy("CS").startYear(2015).endYear(2019).displayOrder(0).build()));
        when(applicationRepository.countByCandidateId(1L)).thenReturn(3L);
        when(savedJobRepository.countByUserId(1L)).thenReturn(2L);

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.email()).isEqualTo("cand@test.com");
        assertThat(response.skills()).containsExactly("Python");
        assertThat(response.experiences()).hasSize(1);
        assertThat(response.experiences().get(0).title()).isEqualTo("Dev");
        assertThat(response.education()).hasSize(1);
        assertThat(response.applicationsCount()).isEqualTo(3L);
        assertThat(response.savedJobsCount()).isEqualTo(2L);
    }

    @Test
    void updateProfile_appliesScalarFieldsDedupesSkillsAndReplacesExperiences() {
        User user = candidate();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(experienceRepository.findByUserIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());
        when(educationRepository.findByUserIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());

        UpdateProfileRequest request = new UpdateProfileRequest(
                "New Name", "Senior Developer", "11999998888", "bio", null, null, null,
                "São Paulo", "SP", 7,
                List.of("Java", "java", "Spring", "spring "),
                List.of(new ExperienceDto("Backend Dev", "Acme", "2019", "2021", "did things")),
                null);

        profileService.updateProfile(1L, request);

        assertThat(user.getFullName()).isEqualTo("New Name");
        assertThat(user.getHeadline()).isEqualTo("Senior Developer");
        assertThat(user.getPhone()).isEqualTo("11999998888");
        assertThat(user.getLocationCity()).isEqualTo("São Paulo");
        assertThat(user.getYearsExperience()).isEqualTo(7);
        assertThat(user.getSkills()).containsExactly("Java", "Spring");

        verify(experienceRepository).deleteByUserId(1L);
        ArgumentCaptor<UserExperience> captor = ArgumentCaptor.forClass(UserExperience.class);
        verify(experienceRepository).save(captor.capture());
        assertThat(captor.getValue().getTitle()).isEqualTo("Backend Dev");
        assertThat(captor.getValue().getCompany()).isEqualTo("Acme");

        // education was null -> collection left untouched
        verify(educationRepository, never()).deleteByUserId(anyLong());
    }

    @Test
    void analyzeResume_persistsExtractedDataAndMergesSkills() {
        User user = candidate(); // headline/phone null, skills [Python]
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        ResumeAnalysisResponse analysis = new ResumeAnalysisResponse(
                "Full Stack Developer", "a@b.com", "(11) 90000-0000",
                "https://linkedin.com/in/x", "https://github.com/x", 5,
                List.of("Java", "React"),
                List.of(new ExperienceDto("Dev", "Acme", "2020", null, "desc")),
                List.of(new EducationDto("USP", "BSc", "CS", 2015, 2019)));
        when(resumeAnalyzer.analyze(anyString())).thenReturn(analysis);

        byte[] content = "meu curriculo".getBytes(StandardCharsets.UTF_8);
        ResumeAnalysisResponse result = profileService.analyzeResume(1L, content, "cv.txt", "text/plain");

        assertThat(result).isSameAs(analysis);
        assertThat(user.getResumeText()).isEqualTo("meu curriculo");
        assertThat(user.getResumeUpdatedAt()).isNotNull();
        assertThat(user.getHeadline()).isEqualTo("Full Stack Developer");
        assertThat(user.getPhone()).isEqualTo("(11) 90000-0000");
        assertThat(user.getLinkedinUrl()).isEqualTo("https://linkedin.com/in/x");
        assertThat(user.getYearsExperience()).isEqualTo(5);
        assertThat(user.getSkills()).contains("Python", "Java", "React");

        verify(experienceRepository).deleteByUserId(1L);
        verify(experienceRepository).save(org.mockito.ArgumentMatchers.any(UserExperience.class));
        verify(educationRepository).deleteByUserId(1L);
        verify(educationRepository).save(org.mockito.ArgumentMatchers.any(UserEducation.class));
    }

    @Test
    void analyzeResume_usesPdfExtractorForPdfUploads() {
        User user = candidate();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(pdfTextExtractor.extract(org.mockito.ArgumentMatchers.any())).thenReturn("texto do pdf");
        when(resumeAnalyzer.analyze("texto do pdf")).thenReturn(new ResumeAnalysisResponse(
                null, null, null, null, null, null, List.of(), List.of(), List.of()));

        profileService.analyzeResume(1L, new byte[]{1, 2, 3}, "cv.pdf", "application/pdf");

        verify(pdfTextExtractor).extract(org.mockito.ArgumentMatchers.any());
        assertThat(user.getResumeText()).isEqualTo("texto do pdf");
    }

    @Test
    void analyzeResume_rejectsEmptyFile() {
        org.assertj.core.api.Assertions.assertThatThrownBy(
                        () -> profileService.analyzeResume(1L, new byte[0], "cv.pdf", "application/pdf"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
