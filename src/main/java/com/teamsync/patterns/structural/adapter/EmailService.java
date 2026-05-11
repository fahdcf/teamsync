package com.teamsync.patterns.structural.adapter;

public interface EmailService {
    void sendEmail(String to, String subject, String body);
}
