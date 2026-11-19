package com.teamsync.service;

import com.teamsync.entity.Notification;
import com.teamsync.entity.User;
import com.teamsync.enums.NotificationType;
import com.teamsync.dto.NotificationResponseDTO;
import com.teamsync.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /** Stores a notification record only; EMAIL is a stored type, not proof of delivery. */
    public void notify(User recipient, String message, NotificationType type) {
        notificationRepository.save(Notification.builder()
                .type(type == NotificationType.EMAIL ? NotificationType.EMAIL : NotificationType.IN_APP)
                .message(message)
                .recipient(recipient)
                .build());
    }

    @PreAuthorize("@permissions.selfId(#user.id)")
    public List<NotificationResponseDTO> getUnread(User user) {
        return notificationRepository.findByRecipientAndReadStatusFalse(user).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @PreAuthorize("@permissions.ownNotification(#id)")
    public NotificationResponseDTO markRead(UUID id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Notification not found: " + id));
        n.setReadStatus(true);
        return toDTO(notificationRepository.save(n));
    }

    private NotificationResponseDTO toDTO(Notification n) {
        return NotificationResponseDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .message(n.getMessage())
                .readStatus(n.isReadStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
