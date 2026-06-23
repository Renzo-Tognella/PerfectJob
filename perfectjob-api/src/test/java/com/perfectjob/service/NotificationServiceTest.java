package com.perfectjob.service;

import com.perfectjob.model.Notification;
import com.perfectjob.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void createForCandidate_persistsNotificationForCandidate() {
        notificationService.createForCandidate(
                7L,
                "Currículo gerado",
                "Seu currículo foi gerado com sucesso.",
                "RESUME_GENERATED");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(7L);
        assertThat(saved.getTitle()).isEqualTo("Currículo gerado");
        assertThat(saved.getType()).isEqualTo("RESUME_GENERATED");
    }

    @Test
    void createForCandidate_skipsWhenCandidateIdIsNull() {
        notificationService.createForCandidate(null, "title", "msg", "TYPE");

        verify(notificationRepository, never()).save(org.mockito.ArgumentMatchers.any(Notification.class));
    }
}
