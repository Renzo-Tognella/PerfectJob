package com.perfectjob.service;

import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.dto.response.SavedJobResponse;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.SavedJob;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.Role;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.SavedJobRepository;
import com.perfectjob.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavedJobServiceTest {

    @Mock
    private SavedJobRepository savedJobRepository;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private SavedJobService savedJobService;

    private CurrentUser candidate;
    private Job job;
    private Company company;

    @BeforeEach
    void setUp() {
        candidate = new CurrentUser(1L, "cand@test.com", Role.CANDIDATE);

        company = Company.builder()
                .id(10L)
                .name("MyCo")
                .slug("myco")
                .build();

        job = Job.builder()
                .id(50L)
                .companyId(10L)
                .company(company)
                .title("Dev Java")
                .slug("dev-java-123")
                .status(JobStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void saveJob_newSavedIsCreated() {
        when(jobRepository.findById(50L)).thenReturn(Optional.of(job));
        when(savedJobRepository.findByUserIdAndJobId(1L, 50L)).thenReturn(Optional.empty());
        when(savedJobRepository.save(any(SavedJob.class))).thenAnswer(inv -> {
            SavedJob s = inv.getArgument(0);
            s.setId(100L);
            s.setCreatedAt(LocalDateTime.now());
            return s;
        });

        SavedJobResponse response = savedJobService.saveJob(50L, candidate);

        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.userId()).isEqualTo(1L);
        assertThat(response.jobId()).isEqualTo(50L);
        assertThat(response.jobSlug()).isEqualTo("dev-java-123");
        assertThat(response.createdAt()).isNotNull();
    }

    @Test
    void saveJob_existingSavedIsReturnedIdempotent() {
        SavedJob existing = SavedJob.builder()
                .id(100L)
                .userId(1L)
                .jobId(50L)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();

        when(jobRepository.findById(50L)).thenReturn(Optional.of(job));
        when(savedJobRepository.findByUserIdAndJobId(1L, 50L)).thenReturn(Optional.of(existing));

        SavedJobResponse response = savedJobService.saveJob(50L, candidate);

        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.jobSlug()).isEqualTo("dev-java-123");
        verify(savedJobRepository, never()).save(any(SavedJob.class));
    }

    @Test
    void saveJob_jobNotFoundThrows() {
        when(jobRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> savedJobService.saveJob(99L, candidate))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(savedJobRepository, never()).save(any(SavedJob.class));
    }

    @Test
    void unsaveJob_deletesByUserAndJob() {
        savedJobService.unsaveJob(50L, candidate);

        verify(savedJobRepository).deleteByUserIdAndJobId(1L, 50L);
    }

    @Test
    void isSaved_returnsTrueWhenExists() {
        when(savedJobRepository.existsByUserIdAndJobId(1L, 50L)).thenReturn(true);

        assertThat(savedJobService.isSaved(50L, candidate)).isTrue();
    }

    @Test
    void isSaved_returnsFalseWhenNotExists() {
        when(savedJobRepository.existsByUserIdAndJobId(1L, 50L)).thenReturn(false);

        assertThat(savedJobService.isSaved(50L, candidate)).isFalse();
    }

    @Test
    void getMySavedJobs_returnsPageOfJobs() {
        SavedJob saved = SavedJob.builder()
                .id(1L)
                .userId(1L)
                .jobId(50L)
                .createdAt(LocalDateTime.now())
                .build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<SavedJob> page = new PageImpl<>(List.of(saved), pageable, 1);

        when(savedJobRepository.findByUserId(1L, pageable)).thenReturn(page);
        when(jobRepository.findByIdWithCompany(50L)).thenReturn(Optional.of(job));

        Page<JobResponse> result = savedJobService.getMySavedJobs(candidate, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).id()).isEqualTo(50L);
        assertThat(result.getContent().get(0).title()).isEqualTo("Dev Java");
        assertThat(result.getContent().get(0).slug()).isEqualTo("dev-java-123");
    }
}
