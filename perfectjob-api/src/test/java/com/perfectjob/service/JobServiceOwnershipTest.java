package com.perfectjob.service;

import com.perfectjob.dto.request.CreateJobRequest;
import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.*;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceOwnershipTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private com.perfectjob.repository.ApplicationRepository applicationRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private JobService jobService;

    private CurrentUser admin;
    private CurrentUser owner;
    private CurrentUser other;

    private Company ownedCompany;

    @BeforeEach
    void setUp() {
        admin = new CurrentUser(1L, "admin@test.com", Role.ADMIN);
        owner = new CurrentUser(2L, "owner@test.com", Role.RECRUITER);
        other = new CurrentUser(3L, "other@test.com", Role.RECRUITER);

        ownedCompany = Company.builder().id(10L).name("MyCo").slug("myco").ownerUserId(owner.id()).build();
    }

    private CreateJobRequest sampleRequest() {
        return new CreateJobRequest(
                "Dev",
                10L,
                "Teste",
                "requirements",
                "benefits",
                null, null,
                WorkModel.REMOTE,
                ExperienceLevel.JUNIOR,
                JobType.FULL_TIME,
                ContractType.CLT,
                "São Paulo", "SP",
                java.util.List.of("Java"),
                LocalDateTime.now().plusDays(30)
        );
    }

    @Test
    void create_adminCanCreateJobInAnyCompany() {
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setId(100L);
            return j;
        });

        JobResponse response = jobService.create(sampleRequest(), admin);
        assertThat(response.companyId()).isEqualTo(10L);
    }

    @Test
    void create_ownerCanCreateJobInOwnCompany() {
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setId(101L);
            return j;
        });

        JobResponse response = jobService.create(sampleRequest(), owner);
        assertThat(response.companyId()).isEqualTo(10L);
    }

    @Test
    void create_otherRecruiterCannotCreateJobInForeignCompany() {
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));

        assertThatThrownBy(() -> jobService.create(sampleRequest(), other))
                .isInstanceOf(AccessDeniedException.class);

        verify(jobRepository, never()).save(any());
    }

    @Test
    void update_ownerCanUpdateOwnJob() {
        Job existing = Job.builder()
                .id(50L).companyId(10L).title("Old").slug("old").status(JobStatus.ACTIVE)
                .build();
        when(jobRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.update(50L, sampleRequest(), owner);
        assertThat(response.id()).isEqualTo(50L);
    }

    @Test
    void update_otherRecruiterCannotUpdateForeignJob() {
        Job existing = Job.builder()
                .id(50L).companyId(10L).title("Old").slug("old").status(JobStatus.ACTIVE)
                .build();
        when(jobRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));

        assertThatThrownBy(() -> jobService.update(50L, sampleRequest(), other))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void update_adminCanUpdateAnyJob() {
        Job existing = Job.builder()
                .id(50L).companyId(10L).title("Old").slug("old").status(JobStatus.ACTIVE)
                .build();
        when(jobRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.update(50L, sampleRequest(), admin);
        assertThat(response.id()).isEqualTo(50L);
    }

    @Test
    void closeJob_ownerCanCloseOwnJob() {
        Job existing = Job.builder()
                .id(50L).companyId(10L).title("X").slug("x").status(JobStatus.ACTIVE)
                .build();
        when(jobRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.closeJob(50L, owner);
        assertThat(response.status()).isEqualTo(JobStatus.CLOSED);
    }

    @Test
    void closeJob_otherRecruiterIsDenied() {
        Job existing = Job.builder()
                .id(50L).companyId(10L).title("X").slug("x").status(JobStatus.ACTIVE)
                .build();
        when(jobRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));

        assertThatThrownBy(() -> jobService.closeJob(50L, other))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void closeJob_adminCanCloseAnyJob() {
        Job existing = Job.builder()
                .id(50L).companyId(10L).title("X").slug("x").status(JobStatus.ACTIVE)
                .build();
        when(jobRepository.findById(50L)).thenReturn(Optional.of(existing));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.closeJob(50L, admin);
        assertThat(response.status()).isEqualTo(JobStatus.CLOSED);
    }
}
