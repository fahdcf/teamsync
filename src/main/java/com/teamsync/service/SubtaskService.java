package com.teamsync.service;

import com.teamsync.entity.Subtask;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.dto.SubtaskRequestDTO;
import com.teamsync.dto.SubtaskResponseDTO;
import com.teamsync.dto.UserResponseDTO;
import com.teamsync.repository.SubtaskRepository;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
import com.teamsync.security.ResourceAuthorization;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class SubtaskService {

    private final ResourceAuthorization permissions;

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public SubtaskService(ResourceAuthorization permissions, SubtaskRepository subtaskRepository,
                          TaskRepository taskRepository,
                          UserRepository userRepository) {
        this.permissions = permissions;
        this.subtaskRepository = subtaskRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @PreAuthorize("@permissions.manageTask(#taskId)")
    public SubtaskResponseDTO createSubtask(UUID taskId, SubtaskRequestDTO request) {
        Task task = findTask(taskId);
        permissions.validateAssignee(task.getProject(), request.getAssigneeId());
        Subtask subtask = Subtask.builder()
                .title(request.getTitle())
                .task(task)
                .assignee(resolveUser(request.getAssigneeId()))
                .dueDate(request.getDueDate())
                .build();
        return toDTO(subtaskRepository.save(subtask));
    }

    @PreAuthorize("@permissions.workOnTask(#taskId)")
    public SubtaskResponseDTO toggleSubtask(UUID taskId, UUID subtaskId) {
        findTask(taskId);
        Subtask subtask = findSubtaskForTask(taskId, subtaskId);
        subtask.setCompleted(!subtask.isCompleted());
        return toDTO(subtaskRepository.save(subtask));
    }

    @PreAuthorize("@permissions.manageTask(#taskId)")
    public SubtaskResponseDTO updateSubtask(UUID taskId, UUID subtaskId, SubtaskRequestDTO request) {
        findTask(taskId);
        Subtask subtask = findSubtaskForTask(taskId, subtaskId);
        permissions.validateAssignee(subtask.getTask().getProject(), request.getAssigneeId());
        subtask.setTitle(request.getTitle());
        subtask.setAssignee(resolveUser(request.getAssigneeId()));
        subtask.setDueDate(request.getDueDate());
        return toDTO(subtaskRepository.save(subtask));
    }

    @PreAuthorize("@permissions.manageTask(#taskId)")
    public void deleteSubtask(UUID taskId, UUID subtaskId) {
        findTask(taskId);
        Subtask subtask = findSubtaskForTask(taskId, subtaskId);
        subtaskRepository.delete(subtask);
    }

    private Task findTask(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + taskId));
    }

    private Subtask findSubtaskForTask(UUID taskId, UUID subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new NoSuchElementException("Subtask not found: " + subtaskId));
        if (!subtask.getTask().getId().equals(taskId)) {
            throw new NoSuchElementException("Subtask not found for task: " + subtaskId);
        }
        return subtask;
    }

    private User resolveUser(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }

    private UserResponseDTO userToDTO(User u) {
        if (u == null) return null;
        return UserResponseDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private SubtaskResponseDTO toDTO(Subtask subtask) {
        return SubtaskResponseDTO.builder()
                .id(subtask.getId())
                .title(subtask.getTitle())
                .completed(subtask.isCompleted())
                .taskId(subtask.getTask().getId())
                .assignee(userToDTO(subtask.getAssignee()))
                .dueDate(subtask.getDueDate())
                .createdAt(subtask.getCreatedAt())
                .build();
    }
}
