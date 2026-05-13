package com.teamsync.service;

import com.teamsync.domain.entity.ActivityLog;
import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.presentation.dto.ActivityLogResponseDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.repository.ActivityLogRepository;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.WorkspaceRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository,
                              WorkspaceRepository workspaceRepository,
                              ProjectRepository projectRepository,
                              TaskRepository taskRepository) {
        this.activityLogRepository = activityLogRepository;
        this.workspaceRepository = workspaceRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
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

    public List<ActivityLogResponseDTO> findWorkspaceActivityDTOs(UUID workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Workspace not found: " + workspaceId));
        List<Project> projects = projectRepository.findByWorkspace(workspace);
        Set<UUID> projectIds = new LinkedHashSet<>(projects.stream().map(Project::getId).toList());
        Set<UUID> taskIds = new LinkedHashSet<>();
        for (Project project : projects) {
            taskRepository.findByProject(project).forEach(task -> taskIds.add(task.getId()));
        }

        List<ActivityLog> entries = new java.util.ArrayList<>(
                activityLogRepository.findTop50ByEntityTypeAndEntityIdOrderByCreatedAtDesc("WORKSPACE", workspaceId));
        if (!projectIds.isEmpty()) {
            entries.addAll(activityLogRepository.findTop50ByEntityTypeAndEntityIdInOrderByCreatedAtDesc("PROJECT", projectIds));
        }
        if (!taskIds.isEmpty()) {
            entries.addAll(activityLogRepository.findTop50ByEntityTypeAndEntityIdInOrderByCreatedAtDesc("TASK", taskIds));
        }

        return entries.stream()
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

    public List<ActivityLogResponseDTO> findRecentDTOsByUserEmail(String email) {
        return activityLogRepository.findTop50ByUserEmailOrderByCreatedAtDesc(email).stream()
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
