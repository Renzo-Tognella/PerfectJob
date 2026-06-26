package com.perfectjob.controller.v1;

import com.perfectjob.dto.request.UpdateProfileRequest;
import com.perfectjob.dto.response.ProfileResponse;
import com.perfectjob.dto.response.ResumeAnalysisResponse;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;


@RestController
@RequestMapping("/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile() {
        Long userId = currentUserResolver.resolve().id();
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PatchMapping("/me")
    public ResponseEntity<ProfileResponse> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Long userId = currentUserResolver.resolve().id();
        return ResponseEntity.ok(profileService.updateProfile(userId, request));
    }

    @PostMapping(value = "/me/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeAnalysisResponse> uploadResume(@RequestParam("file") MultipartFile file)
            throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Nenhum arquivo de currículo foi enviado");
        }
        Long userId = currentUserResolver.resolve().id();
        ResumeAnalysisResponse analysis = profileService.analyzeResume(
                userId, file.getBytes(), file.getOriginalFilename(), file.getContentType());
        return ResponseEntity.ok(analysis);
    }
}
