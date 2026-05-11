package com.teamsync.service;

import com.teamsync.domain.entity.ActivityLog;
import com.teamsync.domain.entity.User;
import com.teamsync.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    public void log(User user, String action, String entityType, UUID entityId) {
        ActivityLog entry = ActivityLog.builder()
                .action(action)
                .user(user)
                .entityType(entityType)
                .entityId(entityId)
                .build();
        activityLogRepository.save(entry);
    }

    public List<ActivityLog> findByEntityId(UUID entityId) {
        return activityLogRepository.findByEntityId(entityId);
    }

    public List<ActivityLog> findRecent() {
        return activityLogRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
