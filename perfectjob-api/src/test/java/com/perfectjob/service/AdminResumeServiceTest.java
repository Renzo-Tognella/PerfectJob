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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminResumeServiceTest {

    @Mock private ResumeRepository resumeRepository;
    @Mock private UserRepository userRepository;
    @Mock private JobRepository jobRepository;
    @InjectMocks private AdminResumeService adminResumeService;

    @Test
    void listAll_joinsCandidateAndJobOntoEachResume() {
        Pageable pageable = PageRequest.of(0, 20);
        Resume resume = Resume.builder()
                .id(7L).userId(5L).jobId(9L)
                .pdfStoragePath("/x.pdf")
                .createdAt(LocalDateTime.of(2026, 6, 25, 10, 0))
                .build();
        when(resumeRepository.findAllByOrderByCreatedAtDesc(pageable))
                .thenReturn(new PageImpl<>(List.of(resume), pageable, 1));
        when(userRepository.findAllById(List.of(5L)))
                .thenReturn(List.of(User.builder().id(5L).fullName("Maria Silva").email("maria@example.com").build()));
        when(jobRepository.findAllById(List.of(9L)))
                .thenReturn(List.of(Job.builder().id(9L).title("Backend Developer").build()));

        Page<AdminResumeResponse> result = adminResumeService.listAll(pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        AdminResumeResponse r = result.getContent().get(0);
        assertThat(r.id()).isEqualTo(7L);
        assertThat(r.candidateName()).isEqualTo("Maria Silva");
        assertThat(r.candidateEmail()).isEqualTo("maria@example.com");
        assertThat(r.jobTitle()).isEqualTo("Backend Developer");
        assertThat(r.createdAt()).isEqualTo(LocalDateTime.of(2026, 6, 25, 10, 0));
    }

    @Test
    void stats_returnsTotalAndTodayCounts() {
        when(resumeRepository.count()).thenReturn(42L);
        when(resumeRepository.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(3L);

        AdminResumeStatsResponse stats = adminResumeService.stats();

        assertThat(stats.totalResumes()).isEqualTo(42L);
        assertThat(stats.resumesToday()).isEqualTo(3L);
    }

    @Test
    void resumesByJob_mapsGroupedRowsToDtosPreservingOrder() {
        when(resumeRepository.countResumesByJob()).thenReturn(List.<Object[]>of(
                new Object[]{9L, "Backend Developer", 5L},
                new Object[]{3L, "iOS Developer", 2L}
        ));

        List<ResumeCountByJobResponse> result = adminResumeService.resumesByJob();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).jobId()).isEqualTo(9L);
        assertThat(result.get(0).jobTitle()).isEqualTo("Backend Developer");
        assertThat(result.get(0).resumeCount()).isEqualTo(5L);
        assertThat(result.get(1).jobTitle()).isEqualTo("iOS Developer");
        assertThat(result.get(1).resumeCount()).isEqualTo(2L);
    }
}
