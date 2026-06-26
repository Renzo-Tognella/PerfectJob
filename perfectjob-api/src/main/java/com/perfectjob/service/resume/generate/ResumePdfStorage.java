package com.perfectjob.service.resume.generate;

import com.perfectjob.exception.ResumeGenerationException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;


@Slf4j
@Component
public class ResumePdfStorage {

    private final Path baseDir;

    public ResumePdfStorage(@Value("${perfectjob.resume.storage-dir:data/resumes}") String storageDir) {
        this.baseDir = Paths.get(storageDir);
    }

    @PostConstruct
    void ensureBaseDir() {
        try {
            Files.createDirectories(baseDir);
            log.info("Resume storage base directory ready: {}", baseDir.toAbsolutePath());
        } catch (IOException e) {
            throw new ResumeGenerationException("Failed to create resume storage base dir: " + baseDir, e);
        }
    }

    
    public Path store(Long userId, Long resumeId, byte[] pdfBytes) {
        try {
            Path userDir = baseDir.resolve(String.valueOf(userId));
            Files.createDirectories(userDir);
            Path target = userDir.resolve(resumeId + ".pdf");
            Files.write(target, pdfBytes);
            return target;
        } catch (IOException e) {
            throw new ResumeGenerationException(
                    "Failed to store PDF for userId=" + userId + " resumeId=" + resumeId, e);
        }
    }

    
    public boolean delete(String relativeOrAbsolutePath) {
        try {
            Path p = Paths.get(relativeOrAbsolutePath);
            return Files.deleteIfExists(p);
        } catch (IOException | RuntimeException e) {
            log.warn("Failed to delete resume PDF at {}: {}", relativeOrAbsolutePath, e.getMessage());
            return false;
        }
    }

    public Path resolve(String relativeOrAbsolutePath) {
        return Paths.get(relativeOrAbsolutePath);
    }
}
