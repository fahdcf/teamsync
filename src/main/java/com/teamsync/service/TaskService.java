package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.patterns.behavioral.state.TaskStateMachine;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.presentation.dto.TaskResponseDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final TaskStateMachine stateMachine;

    public TaskService(TaskRepository taskRepository,
                       ProjectService projectService,
                       UserRepository userRepository,
                       TaskStateMachine stateMachine) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
        this.userRepository = userRepository;
        this.stateMachine = stateMachine;
    }

    public TaskResponseDTO create(UUID projectId, TaskRequestDTO request) {
        Project project = projectService.getProject(projectId);
        User assignee = resolveUser(request.getAssigneeId());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .project(project)
                .assignee(assignee)
                .dueDate(request.getDueDate())
                .build();

        return toDTO(taskRepository.save(task));
    }

    public TaskResponseDTO update(UUID id, TaskRequestDTO request) {
        Task task = getTask(id);

        task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getAssigneeId() != null) task.setAssignee(resolveUser(request.getAssigneeId()));

        return toDTO(taskRepository.save(task));
    }

    public void delete(UUID id) {
        Task task = getTask(id);
        taskRepository.delete(task);
    }

    public TaskResponseDTO assign(UUID id, UUID assigneeId) {
        Task task = getTask(id);
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + assigneeId));
        task.setAssignee(assignee);
        return toDTO(taskRepository.save(task));
    }

    public TaskResponseDTO changeStatus(UUID id, TaskStatus targetStatus) {
        Task task = getTask(id);
        stateMachine.transition(task, targetStatus, taskRepository);
        return toDTO(taskRepository.findById(id).orElseThrow());
    }

    public List<TaskResponseDTO> findByProject(UUID projectId, TaskStatus status) {
        Project project = projectService.getProject(projectId);
        List<Task> tasks = status != null
                ? taskRepository.findByProjectAndStatus(project, status)
                : taskRepository.findByProject(project);
        return tasks.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public TaskResponseDTO findById(UUID id) {
        return toDTO(getTask(id));
    }

    public Task getTask(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + id));
    }

    public TaskRepository getTaskRepository() {
        return taskRepository;
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

    public TaskResponseDTO toDTO(Task t) {
        return TaskResponseDTO.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .priority(t.getPriority())
                .status(t.getStatus())
                .assignee(userToDTO(t.getAssignee()))
                .projectId(t.getProject().getId())
                .dueDate(t.getDueDate())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
