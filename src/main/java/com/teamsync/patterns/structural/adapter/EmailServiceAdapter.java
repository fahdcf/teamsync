package com.teamsync.patterns.structural.adapter;

import org.springframework.stereotype.Component;

@Component
public class EmailServiceAdapter implements EmailService {

    private final MockExternalEmailClient client = new MockExternalEmailClient();

    @Override
    public void sendEmail(String to, String subject, String body) {
        client.sendMessage(to, subject + " | " + body);
    }
}
