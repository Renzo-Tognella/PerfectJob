package com.perfectjob.controller.v1;

import com.perfectjob.model.Notification;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.security.CurrentUserResolver;
import com.perfectjob.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> listNotifications() {
        CurrentUser currentUser = currentUserResolver.resolve();
        return ResponseEntity.ok(notificationService.getNotifications(currentUser.id()));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }
}
