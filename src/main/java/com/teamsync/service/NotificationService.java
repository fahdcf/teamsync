package com.teamsync.service;

import com.teamsync.domain.entity.Notification;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.NotificationType;
import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.patterns.creational.factory.EmailNotificationFactory;
import com.teamsync.patterns.creational.factory.InAppNotificationFactory;
import com.teamsync.patterns.structural.decorator.EmailDecorator;
import com.teamsync.patterns.structural.decorator.InAppSender;
import com.teamsync.patterns.structural.decorator.NotificationSender;
import com.teamsync.patterns.structural.decorator.UrgentDecorator;
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
    private final InAppSender inAppSender;

    public NotificationService(NotificationRepository notificationRepository,
                                InAppNotificationFactory inAppFactory,
                                EmailNotificationFactory emailFactory,
                                InAppSender inAppSender) {
        this.notificationRepository = notificationRepository;
        this.inAppFactory = inAppFactory;
        this.emailFactory = emailFactory;
        this.inAppSender = inAppSender;
    }

    public void notify(User recipient, String message, NotificationType type) {
        if (type == NotificationType.EMAIL) {
            emailFactory.notifyUser(recipient, message);
        } else {
            inAppFactory.notifyUser(recipient, message);
        }
    }

    public void notifyWithPriority(User recipient, String message, TaskPriority priority) {
        Notification notification = inAppFactory.createNotification(recipient, message);
        notificationRepository.save(notification);

        NotificationSender sender;
        if (priority == TaskPriority.HIGH || priority == TaskPriority.CRITICAL) {
            sender = new UrgentDecorator(new EmailDecorator(inAppSender));
        } else {
            sender = inAppSender;
        }
        sender.send(notification);
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
