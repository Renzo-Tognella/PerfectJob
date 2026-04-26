package com.perfectjob.service;

import com.perfectjob.event.ApplicationSubmittedEvent;
import com.perfectjob.model.Notification;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JobRepository jobRepository;

    @Async
    @EventListener
    public void onApplicationSubmitted(ApplicationSubmittedEvent event) {
        jobRepository.findById(event.jobId()).ifPresent(job -> {
            // TODO: replace companyId with actual company owner user ID when user-company relationship is added
            Notification notification = Notification.builder()
                    .userId(job.getCompanyId())
                    .title("Nova candidatura recebida")
                    .message("Um candidato se candidatou à vaga: " + job.getTitle())
                    .type("APPLICATION_SUBMITTED")
                    .build();
            notificationRepository.save(notification);
        });
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
