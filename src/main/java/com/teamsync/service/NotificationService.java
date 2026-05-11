package com.teamsync.service;

import com.teamsync.domain.entity.Notification;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.NotificationType;
import com.teamsync.patterns.creational.factory.EmailNotificationFactory;
import com.teamsync.patterns.creational.factory.InAppNotificationFactory;
import com.teamsync.presentation.dto.NotificationResponseDTO;
import com.teamsync.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final InAppNotificationFactory inAppFactory;
    private final EmailNotificationFactory emailFactory;

    public NotificationService(NotificationRepository notificationRepository,
                                InAppNotificationFactory inAppFactory,
                                EmailNotificationFactory emailFactory) {
        this.notificationRepository = notificationRepository;
        this.inAppFactory = inAppFactory;
        this.emailFactory = emailFactory;
    }

    public void notify(User recipient, String message, NotificationType type) {
        if (type == NotificationType.EMAIL) {
            emailFactory.notifyUser(recipient, message);
        } else {
            inAppFactory.notifyUser(recipient, message);
        }
    }

    public List<NotificationResponseDTO> getUnread(User user) {
        return notificationRepository.findByRecipientAndReadStatusFalse(user).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

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
