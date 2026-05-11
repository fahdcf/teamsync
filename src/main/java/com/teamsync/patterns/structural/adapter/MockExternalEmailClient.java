package com.teamsync.patterns.structural.adapter;

public class MockExternalEmailClient {

    public void sendMessage(String recipient, String content) {
        System.out.println("EXTERNAL EMAIL SENT to " + recipient + ": " + content);
    }
}
