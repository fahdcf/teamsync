package com.teamsync.patterns.structural.decorator;

import com.teamsync.domain.entity.Notification;
import com.teamsync.patterns.structural.adapter.EmailService;

public class EmailDecorator implements NotificationSender {

    private final NotificationSender wrapped;
    private final EmailService emailService;

    public EmailDecorator(NotificationSender wrapped, EmailService emailService) {
        this.wrapped = wrapped;
        this.emailService = emailService;
    }

    @Override
    public void send(Notification notification) {
        wrapped.send(notification);
        emailService.sendEmail(notification.getRecipient().getEmail(),
                "TeamSync Notification", notification.getMessage());
    }
}
