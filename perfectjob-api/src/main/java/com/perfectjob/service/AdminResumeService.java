package com.perfectjob.service;

import com.perfectjob.dto.response.AdminResumeResponse;
import com.perfectjob.dto.response.AdminResumeStatsResponse;
import com.perfectjob.dto.response.ResumeCountByJobResponse;
import com.perfectjob.model.Job;
import com.perfectjob.model.Resume;
import com.perfectjob.model.User;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.ResumeRepository;
import com.perfectjob.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Admin-only read views over all resumes (currículos) generated on the platform:
 * a paginated list (candidate + job + date) and aggregate counts for the dashboard.
 * Separate from {@link ResumeService}, which is strictly user-scoped.
 */
@Service
@RequiredArgsConstructor
public class AdminResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    @Transactional(readOnly = true)
    public Page<AdminResumeResponse> listAll(Pageable pageable) {
        Page<Resume> page = resumeRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<Long> userIds = page.getContent().stream().map(Resume::getUserId).distinct().toList();
        List<Long> jobIds = page.getContent().stream().map(Resume::getJobId).distinct().toList();

        // Batch-fetch candidates and jobs to avoid N+1 while keeping the admin list join simple.
        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Job> jobsById = jobRepository.findAllById(jobIds).stream()
                .collect(Collectors.toMap(Job::getId, Function.identity()));

        return page.map(resume -> {
            User user = usersById.get(resume.getUserId());
            Job job = jobsById.get(resume.getJobId());
            return new AdminResumeResponse(
                    resume.getId(),
                    user != null ? user.getFullName() : "(usuário removido)",
                    user != null ? user.getEmail() : null,
                    job != null ? job.getTitle() : "(vaga removida)",
                    resume.getCreatedAt()
            );
        });
    }

    @Transactional(readOnly = true)
    public AdminResumeStatsResponse stats() {
        long total = resumeRepository.count();
        long today = resumeRepository.countByCreatedAtAfter(LocalDate.now().atStartOfDay());
        return new AdminResumeStatsResponse(total, today);
    }

    @Transactional(readOnly = true)
    public List<ResumeCountByJobResponse> resumesByJob() {
        return resumeRepository.countResumesByJob().stream()
                .map(row -> new ResumeCountByJobResponse(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .toList();
    }
}
