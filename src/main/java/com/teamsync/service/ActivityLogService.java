package com.teamsync.service;

import com.teamsync.domain.entity.ActivityLog;
import com.teamsync.domain.entity.User;
import com.teamsync.presentation.dto.ActivityLogResponseDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
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

    public List<ActivityLogResponseDTO> findDTOsByEntityId(UUID entityId) {
        return activityLogRepository.findByEntityId(entityId).stream()
                .sorted(Comparator.comparing(ActivityLog::getCreatedAt).reversed())
                .limit(50)
                .map(this::toDTO)
                .toList();
    }

    public List<ActivityLogResponseDTO> findRecentDTOs() {
        return activityLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .toList();
    }

    public List<ActivityLog> findRecent() {
        return activityLogRepository.findTop50ByOrderByCreatedAtDesc();
    }

    private ActivityLogResponseDTO toDTO(ActivityLog entry) {
        return ActivityLogResponseDTO.builder()
                .id(entry.getId())
                .user(userToDTO(entry.getUser()))
                .action(entry.getAction())
                .entityType(entry.getEntityType())
                .entityId(entry.getEntityId())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private UserResponseDTO userToDTO(User user) {
        if (user == null) {
            return null;
        }
        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
