package com.perfectjob.service.ingestion;

import com.perfectjob.dto.response.IngestionResultResponse;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobIngestionServiceTest {

    @Mock private JobSource source;
    @Mock private JobRepository jobRepository;
    @Mock private CompanyRepository companyRepository;

    private ExternalJob job(String externalId, String company) {
        return new ExternalJob("test", externalId, "Developer " + externalId, company,
                "desc", "Remote", true, "full_time", List.of("Java"), "http://x");
    }

    @Test
    void ingestAll_createsNewJobsAndSkipsDuplicates() {
        when(source.name()).thenReturn("test");
        when(source.fetch(anyInt())).thenReturn(List.of(job("1", "Acme"), job("2", "Globex")));
        when(jobRepository.existsBySourceAndExternalId("test", "1")).thenReturn(true);
        when(jobRepository.existsBySourceAndExternalId("test", "2")).thenReturn(false);
        when(companyRepository.findBySlug(anyString())).thenReturn(Optional.empty());
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> {
            Company c = inv.getArgument(0);
            c.setId(10L);
            return c;
        });

        JobIngestionService service = new JobIngestionService(List.of(source), jobRepository, companyRepository);
        IngestionResultResponse result = service.ingestAll(50);

        assertThat(result.fetched()).isEqualTo(2);
        assertThat(result.created()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(1);
        assertThat(result.bySource()).containsEntry("test", 1);

        ArgumentCaptor<Job> captor = ArgumentCaptor.forClass(Job.class);
        verify(jobRepository).save(captor.capture());
        assertThat(captor.getValue().getExternalId()).isEqualTo("2");
        assertThat(captor.getValue().getCompanyId()).isEqualTo(10L);
    }

    @Test
    void ingestAll_continuesWhenSourceThrows() {
        when(source.name()).thenReturn("test");
        when(source.fetch(anyInt())).thenThrow(new RuntimeException("network down"));

        JobIngestionService service = new JobIngestionService(List.of(source), jobRepository, companyRepository);
        IngestionResultResponse result = service.ingestAll(50);

        assertThat(result.fetched()).isZero();
        assertThat(result.created()).isZero();
        assertThat(result.bySource()).containsEntry("test", 0);
        verify(jobRepository, never()).save(any());
    }
}
