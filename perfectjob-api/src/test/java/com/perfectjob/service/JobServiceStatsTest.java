package com.perfectjob.service;

import com.perfectjob.dto.response.JobStatsResponse;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceStatsTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private JobService jobService;

    @Test
    void getStats_returnsValuesFromRepositories() {
        when(jobRepository.countByStatus(JobStatus.ACTIVE)).thenReturn(5L);
        when(companyRepository.count()).thenReturn(7L);

        JobStatsResponse stats = jobService.getStats();

        assertThat(stats.activeJobs()).isEqualTo(5L);
        assertThat(stats.totalCompanies()).isEqualTo(7L);
    }

    @Test
    void getStats_returnsZerosWhenRepositoriesAreEmpty() {
        when(jobRepository.countByStatus(JobStatus.ACTIVE)).thenReturn(0L);
        when(companyRepository.count()).thenReturn(0L);

        JobStatsResponse stats = jobService.getStats();

        assertThat(stats.activeJobs()).isZero();
        assertThat(stats.totalCompanies()).isZero();
    }
}
