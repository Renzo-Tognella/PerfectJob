package com.perfectjob.service;

import com.perfectjob.event.ApplicationSubmittedEvent;
import com.perfectjob.model.Job;
import com.perfectjob.model.Notification;
import com.perfectjob.model.enums.ApplicationStatus;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void onApplicationSubmitted_usesCompanyOwnerUserIdNotCompanyId() {
        Job job = Job.builder()
                .id(50L).companyId(99L).title("Dev Java").slug("dev-java").status(JobStatus.ACTIVE)
                .build();
        when(jobRepository.findById(50L)).thenReturn(Optional.of(job));
        ApplicationSubmittedEvent event = new ApplicationSubmittedEvent(
                100L, 50L, 7L, 42L, "Dev Java", "TechCorp");

        notificationService.onApplicationSubmitted(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(42L);
        assertThat(saved.getType()).isEqualTo("APPLICATION_SUBMITTED");
    }

    @Test
    void onApplicationSubmitted_skipsWhenCompanyHasNoOwner() {
        ApplicationSubmittedEvent event = new ApplicationSubmittedEvent(
                100L, 50L, 7L, null, "Dev Java", "TechCorp");

        notificationService.onApplicationSubmitted(event);

        verify(notificationRepository, never()).save(org.mockito.ArgumentMatchers.any(Notification.class));
        verify(jobRepository, never()).findById(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void onApplicationSubmitted_skipsWhenJobNotFound() {
        ApplicationSubmittedEvent event = new ApplicationSubmittedEvent(
                100L, 50L, 7L, 42L, "Dev Java", "TechCorp");
        when(jobRepository.findById(50L)).thenReturn(Optional.empty());

        notificationService.onApplicationSubmitted(event);

        verify(notificationRepository, never()).save(org.mockito.ArgumentMatchers.any(Notification.class));
    }

    @Test
    void createForCandidate_persistsNotificationForCandidate() {
        notificationService.createForCandidate(
                7L,
                "Candidatura enviada",
                "Sua candidatura foi enviada.",
                "APPLICATION_SUBMITTED");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(7L);
        assertThat(saved.getTitle()).isEqualTo("Candidatura enviada");
        assertThat(saved.getType()).isEqualTo("APPLICATION_SUBMITTED");
    }

    @Test
    void createForCandidate_skipsWhenCandidateIdIsNull() {
        notificationService.createForCandidate(null, "title", "msg", "TYPE");

        verify(notificationRepository, never()).save(org.mockito.ArgumentMatchers.any(Notification.class));
    }

    @Test
    void notifyApplicationStatusChange_accepted_createsAcceptedMessage() {
        notificationService.notifyApplicationStatusChange(7L, "Dev Java", ApplicationStatus.ACCEPTED);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(7L);
        assertThat(saved.getMessage()).contains("aceita");
        assertThat(saved.getType()).isEqualTo("APPLICATION_STATUS_CHANGED");
    }

    @Test
    void notifyApplicationStatusChange_rejected_createsRejectedMessage() {
        notificationService.notifyApplicationStatusChange(7L, "Dev Java", ApplicationStatus.REJECTED);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getMessage()).contains("recusada");
    }

    @Test
    void notifyApplicationStatusChange_skipsWhenCandidateIdIsNull() {
        notificationService.notifyApplicationStatusChange(null, "Dev Java", ApplicationStatus.ACCEPTED);

        verify(notificationRepository, never()).save(org.mockito.ArgumentMatchers.any(Notification.class));
    }
}
