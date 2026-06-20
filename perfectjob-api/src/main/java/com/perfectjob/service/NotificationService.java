package com.perfectjob.service;

import com.perfectjob.event.ApplicationSubmittedEvent;
import com.perfectjob.model.Notification;
import com.perfectjob.model.enums.ApplicationStatus;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JobRepository jobRepository;

    @Async
    @EventListener
    public void onApplicationSubmitted(ApplicationSubmittedEvent event) {
        if (event.companyOwnerUserId() == null) {
            log.warn("Skipping notification for application {}: company has no owner user",
                    event.applicationId());
            return;
        }

        jobRepository.findById(event.jobId()).ifPresent(job -> {
            Notification notification = Notification.builder()
                    .userId(event.companyOwnerUserId())
                    .title("Nova candidatura recebida")
                    .message("Um candidato se candidatou à vaga: " + event.jobTitle())
                    .type("APPLICATION_SUBMITTED")
                    .build();
            notificationRepository.save(notification);
        });
    }

    public void createForCandidate(Long candidateId, String title, String message, String type) {
        if (candidateId == null) {
            log.warn("Skipping candidate notification: candidateId is null");
            return;
        }
        Notification notification = Notification.builder()
                .userId(candidateId)
                .title(title)
                .message(message)
                .type(type)
                .build();
        notificationRepository.save(notification);
    }

    public void notifyApplicationStatusChange(Long candidateId, String jobTitle, ApplicationStatus newStatus) {
        if (candidateId == null) {
            log.warn("Skipping status change notification: candidateId is null");
            return;
        }
        String message = switch (newStatus) {
            case REVIEWING -> "Sua candidatura para '" + jobTitle + "' está em análise.";
            case ACCEPTED -> "Parabéns! Sua candidatura para '" + jobTitle + "' foi aceita.";
            case REJECTED -> "Sua candidatura para '" + jobTitle + "' foi recusada.";
            default -> "O status da sua candidatura para '" + jobTitle + "' foi atualizado para " + newStatus + ".";
        };
        createForCandidate(candidateId, "Atualização de candidatura", message, "APPLICATION_STATUS_CHANGED");
    }

    public List<Notification> getNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }
}
