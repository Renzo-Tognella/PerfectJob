package com.perfectjob.service;

import com.perfectjob.dto.response.ApplicationResponse;
import com.perfectjob.model.Application;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ApplicationStatus;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.Role;
import com.perfectjob.repository.ApplicationRepository;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.UserRepository;
import com.perfectjob.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationStatusUpdateTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ApplicationService applicationService;

    private CurrentUser admin;
    private CurrentUser owner;
    private CurrentUser other;

    private Application application;
    private Job job;
    private Company ownedCompany;

    @BeforeEach
    void setUp() {
        admin = new CurrentUser(1L, "admin@test.com", Role.ADMIN);
        owner = new CurrentUser(2L, "owner@test.com", Role.RECRUITER);
        other = new CurrentUser(3L, "other@test.com", Role.RECRUITER);

        application = Application.builder()
                .id(500L).jobId(50L).candidateId(99L)
                .status(ApplicationStatus.PENDING.name())
                .build();
        job = Job.builder()
                .id(50L).companyId(10L).title("Dev").slug("dev").status(JobStatus.ACTIVE)
                .build();
        ownedCompany = Company.builder()
                .id(10L).name("MyCo").slug("myco").ownerUserId(owner.id())
                .build();
    }

    @Test
    void updateStatus_adminCanUpdateAnyApplication() {
        when(applicationRepository.findById(500L)).thenReturn(Optional.of(application));
        when(jobRepository.findById(50L)).thenReturn(Optional.of(job));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.updateStatus(500L, ApplicationStatus.ACCEPTED, admin);
        assertThat(response.status()).isEqualTo("ACCEPTED");
    }

    @Test
    void updateStatus_ownerCanUpdateOwnApplication() {
        when(applicationRepository.findById(500L)).thenReturn(Optional.of(application));
        when(jobRepository.findById(50L)).thenReturn(Optional.of(job));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.updateStatus(500L, ApplicationStatus.REVIEWING, owner);
        assertThat(response.status()).isEqualTo("REVIEWING");
    }

    @Test
    void updateStatus_otherRecruiterIsDenied() {
        when(applicationRepository.findById(500L)).thenReturn(Optional.of(application));
        when(jobRepository.findById(50L)).thenReturn(Optional.of(job));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(ownedCompany));

        assertThatThrownBy(() -> applicationService.updateStatus(500L, ApplicationStatus.ACCEPTED, other))
                .isInstanceOf(AccessDeniedException.class);

        verify(applicationRepository, never()).save(any());
    }
}
