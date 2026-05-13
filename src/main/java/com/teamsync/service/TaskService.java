package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.domain.enums.ProjectEventType;
import com.teamsync.patterns.behavioral.chain.ValidationChainFactory;
import com.teamsync.patterns.behavioral.command.AssignTaskCommand;
import com.teamsync.patterns.behavioral.command.ChangeStatusCommand;
import com.teamsync.patterns.behavioral.command.DeleteTaskCommand;
import com.teamsync.patterns.behavioral.command.TaskCommandInvoker;
import com.teamsync.patterns.behavioral.observer.ProjectEvent;
import com.teamsync.patterns.behavioral.observer.ProjectEventPublisher;
import com.teamsync.patterns.behavioral.state.TaskStateMachine;
import com.teamsync.patterns.behavioral.strategy.RoundRobinStrategy;
import com.teamsync.patterns.behavioral.strategy.TaskAssignmentService;
import com.teamsync.patterns.behavioral.strategy.WorkloadStrategy;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.presentation.dto.TaskResponseDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.TaskSpecification;
import com.teamsync.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskService implements com.teamsync.patterns.structural.proxy.TaskService {

    private final TaskRepository taskRepository;
    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final TaskStateMachine stateMachine;
    private final TaskAssignmentService assignmentService;
    private final ProjectEventPublisher eventPublisher;
    private final TaskCommandInvoker commandInvoker;
    private final ValidationChainFactory validationChainFactory;
    private final ActivityLogService activityLogService;

    public TaskService(TaskRepository taskRepository,
                       ProjectService projectService,
                       UserRepository userRepository,
                       TaskStateMachine stateMachine,
                       TaskAssignmentService assignmentService,
                       ProjectEventPublisher eventPublisher,
                       TaskCommandInvoker commandInvoker,
                       ValidationChainFactory validationChainFactory,
                       ActivityLogService activityLogService) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
        this.userRepository = userRepository;
        this.stateMachine = stateMachine;
        this.assignmentService = assignmentService;
        this.eventPublisher = eventPublisher;
        this.commandInvoker = commandInvoker;
        this.validationChainFactory = validationChainFactory;
        this.activityLogService = activityLogService;
    }

    public TaskResponseDTO create(UUID projectId, TaskRequestDTO request) {
        return create(projectId, request, null);
    }

    public TaskResponseDTO create(UUID projectId, TaskRequestDTO request, UUID userId) {
        Project project = projectService.getProject(projectId);
        validationChainFactory.buildChain().validate(request, project);
        User assignee = resolveUser(request.getAssigneeId());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .taskIdentifier(generateTaskIdentifier(project))
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .project(project)
                .assignee(assignee)
                .dueDate(request.getDueDate())
                .build();

        Task saved = taskRepository.save(task);
        activityLogService.log(resolveActor(userId, assignee), "TASK_CREATED", "TASK", saved.getId());
        eventPublisher.publish(new ProjectEvent(ProjectEventType.TASK_CREATED, saved.getTitle(), null));
        return toDTO(saved);
    }

    public TaskResponseDTO update(UUID id, TaskRequestDTO request) {
        return update(id, request, null);
    }

    public TaskResponseDTO update(UUID id, TaskRequestDTO request, UUID userId) {
        Task task = getTask(id);

        task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getAssigneeId() != null) task.setAssignee(resolveUser(request.getAssigneeId()));

        Task saved = taskRepository.save(task);
        activityLogService.log(resolveActor(userId, saved.getAssignee()), "TASK_UPDATED", "TASK", saved.getId());
        return toDTO(saved);
    }

    public void delete(UUID id, UUID userId) {
        Task task = getTask(id);
        commandInvoker.execute(userId, new DeleteTaskCommand(task, taskRepository));
    }

    public TaskResponseDTO assign(UUID id, UUID assigneeId, UUID userId) {
        Task task = getTask(id);
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + assigneeId));
        commandInvoker.execute(userId, new AssignTaskCommand(task, assignee, taskRepository));
        activityLogService.log(resolveUser(userId), "TASK_ASSIGNED", "TASK", task.getId());
        eventPublisher.publish(new ProjectEvent(ProjectEventType.TASK_ASSIGNED,
                task.getTitle() + " → " + assignee.getUsername(), assignee));
        return toDTO(taskRepository.findById(id).orElse(task));
    }

    public TaskResponseDTO autoAssign(UUID projectId, UUID taskId, String strategyName) {
        Project project = projectService.getProject(projectId);
        Task task = getTask(taskId);
        List<User> members = new java.util.ArrayList<>(project.getWorkspace().getMembers());
        if (members.isEmpty() && project.getManager() != null) members.add(project.getManager());

        if ("roundrobin".equalsIgnoreCase(strategyName)) {
            assignmentService.setStrategy(new RoundRobinStrategy());
        } else {
            assignmentService.setStrategy(new WorkloadStrategy());
        }

        User assigned = assignmentService.autoAssign(task, members);
        task.setAssignee(assigned);
        return toDTO(taskRepository.save(task));
    }

    public TaskResponseDTO changeStatus(UUID id, TaskStatus targetStatus, UUID userId) {
        Task task = getTask(id);
        commandInvoker.execute(userId, new ChangeStatusCommand(task, targetStatus, stateMachine, taskRepository));
        activityLogService.log(resolveUser(userId), "TASK_STATUS_CHANGED", "TASK", task.getId());
        eventPublisher.publish(new ProjectEvent(ProjectEventType.TASK_STATUS_CHANGED,
                task.getTitle() + " → " + targetStatus, task.getAssignee()));
        return toDTO(taskRepository.findById(id).orElseThrow());
    }

    public void undo(UUID userId) {
        commandInvoker.undo(userId);
    }

    public List<TaskResponseDTO> findByProject(UUID projectId, TaskStatus status, TaskPriority priority,
                                              UUID assigneeId, String keyword, Boolean overdue) {
        Project project = projectService.getProject(projectId);
        Specification<Task> spec = Specification.where(TaskSpecification.hasProject(project));
        if (status != null) spec = spec.and(TaskSpecification.hasStatus(status));
        if (priority != null) spec = spec.and(TaskSpecification.hasPriority(priority));
        if (assigneeId != null) spec = spec.and(TaskSpecification.hasAssignee(assigneeId));
        if (keyword != null && !keyword.isBlank()) spec = spec.and(TaskSpecification.hasKeyword(keyword));
        if (Boolean.TRUE.equals(overdue)) spec = spec.and(TaskSpecification.isOverdue());
        return taskRepository.findAll(spec).stream().map(this::toDTO).collect(Collectors.toList());
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

    private User resolveActor(UUID userId, User fallback) {
        if (userId == null) return fallback;
        return resolveUser(userId);
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

    private String generateTaskIdentifier(Project project) {
        String prefix = project.getTitle().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        if (prefix.length() >= 3) {
            prefix = prefix.substring(0, 3);
        } else {
            prefix = String.format("%-3s", prefix).replace(' ', 'X');
        }
        long nextNumber = taskRepository.countByProject(project) + 1;
        return prefix + "-" + nextNumber;
    }

    public TaskResponseDTO toDTO(Task t) {
        return TaskResponseDTO.builder()
                .id(t.getId())
                .taskIdentifier(t.getTaskIdentifier())
                .title(t.getTitle())
                .description(t.getDescription())
                .priority(t.getPriority())
                .status(t.getStatus())
                .assignee(userToDTO(t.getAssignee()))
                .projectId(t.getProject().getId())
                .projectTitle(t.getProject().getTitle())
                .workspaceId(t.getProject().getWorkspace().getId())
                .workspaceName(t.getProject().getWorkspace().getName())
                .subtasks(t.getSubtasks().stream()
                        .map(subtask -> com.teamsync.presentation.dto.SubtaskResponseDTO.builder()
                                .id(subtask.getId())
                                .title(subtask.getTitle())
                                .completed(subtask.isCompleted())
                                .taskId(t.getId())
                                .assignee(userToDTO(subtask.getAssignee()))
                                .dueDate(subtask.getDueDate())
                                .createdAt(subtask.getCreatedAt())
                                .build())
                        .toList())
                .dueDate(t.getDueDate())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
