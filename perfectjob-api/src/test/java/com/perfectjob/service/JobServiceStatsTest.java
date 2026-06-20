package com.perfectjob.service;

import com.perfectjob.dto.response.JobStatsResponse;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.repository.ApplicationRepository;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceStatsTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private JobService jobService;

    @Test
    void getStats_returnsValuesFromRepositories() {
        when(jobRepository.countByStatus(JobStatus.ACTIVE)).thenReturn(5L);
        when(applicationRepository.count()).thenReturn(100L);
        when(applicationRepository.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(10L);
        when(companyRepository.count()).thenReturn(7L);

        JobStatsResponse stats = jobService.getStats();

        assertThat(stats.activeJobs()).isEqualTo(5L);
        assertThat(stats.totalApplications()).isEqualTo(100L);
        assertThat(stats.applicationsToday()).isEqualTo(10L);
        assertThat(stats.totalCompanies()).isEqualTo(7L);
    }

    @Test
    void getStats_returnsZerosWhenRepositoriesAreEmpty() {
        when(jobRepository.countByStatus(JobStatus.ACTIVE)).thenReturn(0L);
        when(applicationRepository.count()).thenReturn(0L);
        when(applicationRepository.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(0L);
        when(companyRepository.count()).thenReturn(0L);

        JobStatsResponse stats = jobService.getStats();

        assertThat(stats.activeJobs()).isZero();
        assertThat(stats.totalApplications()).isZero();
        assertThat(stats.applicationsToday()).isZero();
        assertThat(stats.totalCompanies()).isZero();
    }

    @Test
    void getStats_usesStartOfDayForTodayQuery() {
        when(jobRepository.countByStatus(JobStatus.ACTIVE)).thenReturn(0L);
        when(applicationRepository.count()).thenReturn(0L);
        when(applicationRepository.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(0L);
        when(companyRepository.count()).thenReturn(0L);

        jobService.getStats();

        org.mockito.ArgumentCaptor<LocalDateTime> captor =
                org.mockito.ArgumentCaptor.forClass(LocalDateTime.class);
        org.mockito.Mockito.verify(applicationRepository).countByCreatedAtAfter(captor.capture());
        LocalDateTime passed = captor.getValue();
        assertThat(passed.toLocalTime()).isEqualTo(java.time.LocalTime.MIN);
        assertThat(passed.toLocalDate()).isEqualTo(java.time.LocalDate.now());
    }
}
