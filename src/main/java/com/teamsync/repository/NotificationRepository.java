package com.teamsync.repository;

import com.teamsync.domain.entity.Notification;
import com.teamsync.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientAndReadStatusFalse(User recipient);
}
