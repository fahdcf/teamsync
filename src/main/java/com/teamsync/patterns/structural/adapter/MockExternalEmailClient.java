package com.teamsync.patterns.structural.adapter;

import com.teamsync.patterns.creational.singleton.AppLogger;

public class MockExternalEmailClient {

    public void sendMessage(String recipient, String content) {
        AppLogger.getInstance().info("EXTERNAL EMAIL SENT to " + recipient + ": " + content);
    }
}
