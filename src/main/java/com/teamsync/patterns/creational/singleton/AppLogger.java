package com.teamsync.patterns.creational.singleton;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AppLogger {

    private static final Logger LOG = LoggerFactory.getLogger(AppLogger.class);
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
        LOG.info(msg);
    }

    public void warn(String msg) {
        LOG.warn(msg);
    }

    public void error(String msg) {
        LOG.error(msg);
    }
}
