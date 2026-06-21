package com.perfectjob.service;

import com.perfectjob.dto.request.UpdateProfileRequest;
import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.LanguageDto;
import com.perfectjob.dto.response.ProfileResponse;
import com.perfectjob.dto.response.ResumeAnalysisResponse;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.User;
import com.perfectjob.model.UserEducation;
import com.perfectjob.model.UserExperience;
import com.perfectjob.model.UserLanguage;
import com.perfectjob.repository.ApplicationRepository;
import com.perfectjob.repository.SavedJobRepository;
import com.perfectjob.repository.UserEducationRepository;
import com.perfectjob.repository.UserExperienceRepository;
import com.perfectjob.repository.UserLanguageRepository;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.service.resume.PdfTextExtractor;
import com.perfectjob.service.resume.ResumeAnalyzer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Manages the candidate profile: reading it (with activity counters), partial
 * updates and ingestion of CV-derived data produced by {@link ResumeAnalyzer}.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ProfileService {

    private static final int MAX_SKILLS = 60;

    private final UserRepository userRepository;
    private final UserExperienceRepository experienceRepository;
    private final UserEducationRepository educationRepository;
    private final UserLanguageRepository languageRepository;
    private final ApplicationRepository applicationRepository;
    private final SavedJobRepository savedJobRepository;
    private final ResumeAnalyzer resumeAnalyzer;
    private final PdfTextExtractor pdfTextExtractor;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        User user = findUser(userId);
        return toResponse(user);
    }

    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().strip());
        }
        if (request.headline() != null) {
            user.setHeadline(blankToNull(request.headline()));
        }
        if (request.phone() != null) {
            user.setPhone(blankToNull(request.phone()));
        }
        if (request.bio() != null) {
            user.setBio(blankToNull(request.bio()));
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(blankToNull(request.avatarUrl()));
        }
        if (request.linkedinUrl() != null) {
            user.setLinkedinUrl(blankToNull(request.linkedinUrl()));
        }
        if (request.githubUrl() != null) {
            user.setGithubUrl(blankToNull(request.githubUrl()));
        }
        if (request.locationCity() != null) {
            user.setLocationCity(blankToNull(request.locationCity()));
        }
        if (request.locationState() != null) {
            user.setLocationState(blankToNull(request.locationState()));
        }
        if (request.yearsExperience() != null) {
            user.setYearsExperience(request.yearsExperience());
        }
        if (request.skills() != null) {
            user.setSkills(dedupeSkills(request.skills()));
        }
        userRepository.save(user);

        if (request.experiences() != null) {
            replaceExperiences(userId, request.experiences());
        }
        if (request.education() != null) {
            replaceEducation(userId, request.education());
        }
        if (request.languages() != null) {
            replaceLanguages(userId, request.languages());
        }

        return toResponse(findUser(userId));
    }

    /**
     * Extracts structured data from an uploaded resume, persists it into the
     * profile (replacing experiences/education, merging skills, filling empty
     * scalar fields) and returns the analysis for the client to review.
     */
    public ResumeAnalysisResponse analyzeResume(Long userId, byte[] content, String filename, String contentType) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Arquivo de currículo vazio");
        }
        String text = extractText(content, filename, contentType);
        ResumeAnalysisResponse analysis = resumeAnalyzer.analyze(text);

        User user = findUser(userId);
        user.setResumeText(text);
        user.setResumeUpdatedAt(LocalDateTime.now());
        if (isBlank(user.getHeadline()) && analysis.headline() != null) {
            user.setHeadline(analysis.headline());
        }
        if (isBlank(user.getPhone()) && analysis.phone() != null) {
            user.setPhone(analysis.phone());
        }
        if (isBlank(user.getLinkedinUrl()) && analysis.linkedinUrl() != null) {
            user.setLinkedinUrl(analysis.linkedinUrl());
        }
        if (isBlank(user.getGithubUrl()) && analysis.githubUrl() != null) {
            user.setGithubUrl(analysis.githubUrl());
        }
        if (user.getYearsExperience() == null && analysis.yearsExperience() != null) {
            user.setYearsExperience(analysis.yearsExperience());
        }
        user.setSkills(mergeSkills(user.getSkills(), analysis.skills()));
        userRepository.save(user);

        replaceExperiences(userId, analysis.experiences());
        replaceEducation(userId, analysis.education());
        replaceLanguages(userId, analysis.languages());

        log.info("AUDIT: resume analyzed for userId={} skills={} experiences={} education={} languages={}",
                userId, analysis.skills().size(), analysis.experiences().size(),
                analysis.education().size(), analysis.languages().size());

        return analysis;
    }

    // ------------------------------------------------------------------

    private String extractText(byte[] content, String filename, String contentType) {
        boolean isPdf = (contentType != null && contentType.toLowerCase().contains("pdf"))
                || (filename != null && filename.toLowerCase().endsWith(".pdf"));
        if (isPdf) {
            return pdfTextExtractor.extract(content);
        }
        return new String(content, StandardCharsets.UTF_8);
    }

    private void replaceExperiences(Long userId, List<ExperienceDto> items) {
        experienceRepository.deleteByUserId(userId);
        if (items == null) {
            return;
        }
        int order = 0;
        for (ExperienceDto e : items) {
            if (e == null || isBlank(e.title())) {
                continue;
            }
            experienceRepository.save(UserExperience.builder()
                    .userId(userId)
                    .title(e.title().strip())
                    .company(blankToNull(e.company()))
                    .startDate(blankToNull(e.startDate()))
                    .endDate(blankToNull(e.endDate()))
                    .description(blankToNull(e.description()))
                    .displayOrder(order++)
                    .build());
        }
    }

    private void replaceEducation(Long userId, List<EducationDto> items) {
        educationRepository.deleteByUserId(userId);
        if (items == null) {
            return;
        }
        int order = 0;
        for (EducationDto e : items) {
            if (e == null || isBlank(e.institution())) {
                continue;
            }
            educationRepository.save(UserEducation.builder()
                    .userId(userId)
                    .institution(e.institution().strip())
                    .degree(blankToNull(e.degree()))
                    .fieldOfStudy(blankToNull(e.fieldOfStudy()))
                    .startYear(e.startYear())
                    .endYear(e.endYear())
                    .displayOrder(order++)
                    .build());
        }
    }

    private void replaceLanguages(Long userId, List<LanguageDto> items) {
        languageRepository.deleteByUserId(userId);
        if (items == null) {
            return;
        }
        int order = 0;
        for (LanguageDto l : items) {
            if (l == null || isBlank(l.name())) {
                continue;
            }
            languageRepository.save(UserLanguage.builder()
                    .userId(userId)
                    .language(l.name().strip())
                    .level(blankToNull(l.level()))
                    .displayOrder(order++)
                    .build());
        }
    }

    private ProfileResponse toResponse(User user) {
        List<ExperienceDto> experiences = experienceRepository
                .findByUserIdOrderByDisplayOrderAsc(user.getId())
                .stream()
                .map(e -> new ExperienceDto(e.getTitle(), e.getCompany(), e.getStartDate(),
                        e.getEndDate(), e.getDescription()))
                .toList();

        List<EducationDto> education = educationRepository
                .findByUserIdOrderByDisplayOrderAsc(user.getId())
                .stream()
                .map(e -> new EducationDto(e.getInstitution(), e.getDegree(), e.getFieldOfStudy(),
                        e.getStartYear(), e.getEndYear()))
                .toList();

        List<LanguageDto> languages = languageRepository
                .findByUserIdOrderByDisplayOrderAsc(user.getId())
                .stream()
                .map(l -> new LanguageDto(l.getLanguage(), l.getLevel()))
                .toList();

        long applicationsCount = applicationRepository.countByCandidateId(user.getId());
        long savedJobsCount = savedJobRepository.countByUserId(user.getId());

        return new ProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getHeadline(),
                user.getPhone(),
                user.getBio(),
                user.getAvatarUrl(),
                user.getLinkedinUrl(),
                user.getGithubUrl(),
                user.getLocationCity(),
                user.getLocationState(),
                user.getYearsExperience(),
                user.getResumeUrl(),
                user.getResumeUpdatedAt(),
                new ArrayList<>(user.getSkills() == null ? List.of() : user.getSkills()),
                experiences,
                education,
                languages,
                applicationsCount,
                savedJobsCount
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private static List<String> dedupeSkills(List<String> skills) {
        Set<String> seen = new LinkedHashSet<>();
        List<String> result = new ArrayList<>();
        for (String skill : skills) {
            if (skill == null) {
                continue;
            }
            String clean = skill.strip();
            String key = clean.toLowerCase();
            if (!clean.isEmpty() && seen.add(key)) {
                result.add(clean);
            }
            if (result.size() >= MAX_SKILLS) {
                break;
            }
        }
        return result;
    }

    private static List<String> mergeSkills(List<String> existing, List<String> incoming) {
        List<String> merged = new ArrayList<>();
        if (existing != null) {
            merged.addAll(existing);
        }
        if (incoming != null) {
            merged.addAll(incoming);
        }
        return dedupeSkills(merged);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String s = value.strip();
        return s.isEmpty() ? null : s;
    }
}
