package com.perfectjob.service;

import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {
        "spring.main.allow-bean-definition-overriding=true"
})
@ActiveProfiles("test")
@Import(JobServiceCacheTest.TestCacheConfig.class)
class JobServiceCacheTest {

    @TestConfiguration
    @EnableCaching
    static class TestCacheConfig {

        @Bean
        @Primary
        public RedisConnectionFactory redisConnectionFactory() {
            RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
            RedisConnection connection = mock(RedisConnection.class);
            when(factory.getConnection()).thenReturn(connection);
            return factory;
        }

        @Bean
        @Primary
        public CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("jobs", "companies", "stats");
        }
    }

    @Autowired
    private JobService jobService;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private com.perfectjob.repository.CompanyRepository companyRepository;

    @MockBean
    private com.perfectjob.repository.ApplicationRepository applicationRepository;

    private Job sampleJob;
    private Company sampleCompany;

    @BeforeEach
    void setUp() {
        sampleCompany = Company.builder()
                .id(1L)
                .name("TechCorp")
                .slug("techcorp")
                .build();

        sampleJob = Job.builder()
                .id(10L)
                .title("Senior Dev")
                .slug("senior-dev")
                .companyId(1L)
                .company(sampleCompany)
                .status(JobStatus.ACTIVE)
                .skills(new java.util.ArrayList<>())
                .build();

        when(jobRepository.findBySlugWithCompany("senior-dev"))
                .thenReturn(Optional.of(sampleJob));
    }

    @Test
    void findBySlug_invokesRepositoryOnceForRepeatedReads() {
        jobService.findBySlug("senior-dev");
        jobService.findBySlug("senior-dev");
        jobService.findBySlug("senior-dev");

        verify(jobRepository, times(1)).findBySlugWithCompany("senior-dev");
    }

    @Test
    void create_evictsJobsCache() {
        com.perfectjob.dto.request.CreateJobRequest req = new com.perfectjob.dto.request.CreateJobRequest(
                "New Job", 1L, "Desc", "Reqs", "Benefits",
                null, null,
                com.perfectjob.model.enums.WorkModel.REMOTE,
                com.perfectjob.model.enums.ExperienceLevel.SENIOR,
                com.perfectjob.model.enums.JobType.FULL_TIME,
                com.perfectjob.model.enums.ContractType.CLT,
                "City", "State", java.util.List.of("Java"),
                java.time.LocalDateTime.now().plusDays(30)
        );

        when(companyRepository.findById(1L)).thenReturn(Optional.of(sampleCompany));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setId(99L);
            j.setCreatedAt(java.time.LocalDateTime.now());
            j.setUpdatedAt(java.time.LocalDateTime.now());
            j.setSlug("new-job");
            j.setCompany(sampleCompany);
            return j;
        });

        com.perfectjob.security.CurrentUser admin = new com.perfectjob.security.CurrentUser(
                99L, "admin@test.com", com.perfectjob.model.enums.Role.ADMIN);
        jobService.create(req, admin);

        verify(jobRepository).save(any(Job.class));
    }

    @Test
    void getStats_isCached() {
        when(jobRepository.countByStatus(JobStatus.ACTIVE)).thenReturn(5L);
        when(applicationRepository.count()).thenReturn(100L);
        when(applicationRepository.countByCreatedAtAfter(any())).thenReturn(10L);
        when(companyRepository.count()).thenReturn(7L);

        var s1 = jobService.getStats();
        var s2 = jobService.getStats();

        assertThat(s1).isEqualTo(s2);
        verify(jobRepository, times(1)).countByStatus(JobStatus.ACTIVE);
        verify(applicationRepository, times(1)).count();
    }
}
