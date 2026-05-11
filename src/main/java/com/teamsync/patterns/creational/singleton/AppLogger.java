package com.teamsync.patterns.creational.singleton;

import java.time.LocalDateTime;

public class AppLogger {

    private static volatile AppLogger instance;

    private AppLogger() {}

    public static AppLogger getInstance() {
        if (instance == null) {
            synchronized (AppLogger.class) {
                if (instance == null) {
                    instance = new AppLogger();
                }
            }
        }
        return instance;
    }

    public void info(String msg) {
        System.out.println("[INFO]  " + LocalDateTime.now() + " — " + msg);
    }

    public void warn(String msg) {
        System.out.println("[WARN]  " + LocalDateTime.now() + " — " + msg);
    }

    public void error(String msg) {
        System.out.println("[ERROR] " + LocalDateTime.now() + " — " + msg);
    }
}
