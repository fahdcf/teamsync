package com.teamsync.service;

import com.teamsync.dto.SubtaskResponseDTO;
import java.util.Objects;
import java.util.ArrayList;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.entity.Project;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.enums.TaskPriority;
import com.teamsync.enums.TaskStatus;
import com.teamsync.enums.ProjectEventType;
import com.teamsync.patterns.behavioral.command.AssignTaskCommand;
import com.teamsync.patterns.behavioral.command.ChangeStatusCommand;
import com.teamsync.patterns.behavioral.command.DeleteTaskCommand;
import com.teamsync.patterns.behavioral.command.TaskCommandInvoker;
import com.teamsync.patterns.behavioral.observer.ProjectEvent;
import org.springframework.context.ApplicationEventPublisher;
import com.teamsync.patterns.behavioral.state.TaskStateMachine;
import com.teamsync.patterns.behavioral.strategy.TaskAssignmentService;
import com.teamsync.dto.TaskRequestDTO;
import com.teamsync.dto.TaskResponseDTO;
import com.teamsync.dto.UserResponseDTO;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.TaskSpecification;
import com.teamsync.repository.UserRepository;
import com.teamsync.repository.CommentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.teamsync.security.ResourceAuthorization;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class TaskService {

    private final ResourceAuthorization permissions;

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final TaskStateMachine stateMachine;
    private final TaskAssignmentService assignmentService;
    private final ApplicationEventPublisher eventPublisher;
    private final TaskCommandInvoker commandInvoker;
    private final TaskUndoService undoService;
    private final ActivityLogService activityLogService;

    public TaskService(ResourceAuthorization permissions, TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       ProjectService projectService,
                       UserRepository userRepository,
                       CommentRepository commentRepository,
                       TaskStateMachine stateMachine,
                       TaskAssignmentService assignmentService,
                       ApplicationEventPublisher eventPublisher,
                       TaskCommandInvoker commandInvoker,
                       TaskUndoService undoService,
                       ActivityLogService activityLogService) {
        this.permissions = permissions;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.stateMachine = stateMachine;
        this.assignmentService = assignmentService;
        this.eventPublisher = eventPublisher;
        this.commandInvoker = commandInvoker;
        this.undoService = undoService;
        this.activityLogService = activityLogService;
    }

    @PreAuthorize("@permissions.manageProject(#projectId)")
    public TaskResponseDTO create(UUID projectId, TaskRequestDTO request) {
        return create(projectId, request, null);
    }

    @PreAuthorize("@permissions.manageProject(#projectId)")
    public TaskResponseDTO create(UUID projectId, TaskRequestDTO request, UUID userId) {
        Project project = projectService.getProject(projectId);
        validateRequest(request, project);
        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now()))
            throw new IllegalArgumentException("Due date must not be in the past");
        User assignee = resolveUser(request.getAssigneeId());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .taskIdentifier(generateTaskIdentifier(project))
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .position(nextPosition(project))
                .project(project)
                .assignee(assignee)
                .dueDate(request.getDueDate())
                .build();

        if (request.getStatus() != null && request.getStatus() != TaskStatus.TODO)
            stateMachine.transition(task, request.getStatus(), taskRepository);
        Task saved = taskRepository.save(task);
        activityLogService.log(resolveActor(userId, assignee), "TASK_CREATED", "TASK", saved.getId());
        eventPublisher.publishEvent(new ProjectEvent(ProjectEventType.TASK_CREATED, saved.getTitle(), null));
        return toDTO(saved);
    }

    @PreAuthorize("@permissions.manageTask(#id)")
    public TaskResponseDTO update(UUID id, TaskRequestDTO request) {
        return update(id, request, null);
    }

    @PreAuthorize("@permissions.manageTask(#id)")
    public TaskResponseDTO update(UUID id, TaskRequestDTO request, UUID userId) {
        Task task = getTaskForUpdate(id);
        validateRequest(request, task.getProject());

        task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getAssigneeId() != null) task.setAssignee(resolveUser(request.getAssigneeId()));

        if (request.getStatus() != null && request.getStatus() != task.getStatus())
            stateMachine.transition(task, request.getStatus(), taskRepository);
        Task saved = taskRepository.save(task);
        activityLogService.log(resolveActor(userId, saved.getAssignee()), "TASK_UPDATED", "TASK", saved.getId());
        return toDTO(saved);
    }

    @PreAuthorize("@permissions.manageTask(#id) and @permissions.selfId(#userId)")
    public void delete(UUID id, UUID userId) {
        Task task = getTaskForUpdate(id);
        commandInvoker.execute(userId, new DeleteTaskCommand(task, taskRepository, commentRepository,
                projectRepository, userRepository));
    }

    @PreAuthorize("@permissions.manageTask(#id) and @permissions.selfId(#userId)")
    public TaskResponseDTO assign(UUID id, UUID assigneeId, UUID userId) {
        Task task = getTaskForUpdate(id);
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + assigneeId));
        permissions.validateAssignee(task.getProject(), assigneeId);
        commandInvoker.execute(userId, new AssignTaskCommand(task, assignee, taskRepository));
        activityLogService.log(resolveUser(userId), "TASK_ASSIGNED", "TASK", task.getId());
        eventPublisher.publishEvent(new ProjectEvent(ProjectEventType.TASK_ASSIGNED,
                task.getTitle() + " → " + assignee.getUsername(), assignee));
        return toDTO(taskRepository.findById(id).orElse(task));
    }

    @PreAuthorize("@permissions.manageProject(#projectId) and @permissions.manageTask(#taskId)")
    public TaskResponseDTO autoAssign(UUID projectId, UUID taskId, String strategyName) {
        Project project = projectService.getProject(projectId);
        Task task = getTaskForUpdate(taskId);
        if (!task.getProject().getId().equals(projectId)) throw new IllegalArgumentException("Task must belong to the project");
        List<User> members = new ArrayList<>(project.getWorkspace().getMembers());
        if (project.getWorkspace().getOwner() != null && members.stream().noneMatch(user -> user.getId().equals(project.getWorkspace().getOwner().getId()))) {
            members.add(project.getWorkspace().getOwner());
        }

        User assigned = assignmentService.autoAssign(task, members, strategyName);
        task.setAssignee(assigned);
        return toDTO(taskRepository.save(task));
    }

    @PreAuthorize("@permissions.workOnTask(#id) and @permissions.selfId(#userId)")
    public TaskResponseDTO changeStatus(UUID id, TaskStatus targetStatus, UUID userId) {
        Task task = getTaskForUpdate(id);
        commandInvoker.execute(userId, new ChangeStatusCommand(task, targetStatus, stateMachine, taskRepository));
        activityLogService.log(resolveUser(userId), "TASK_STATUS_CHANGED", "TASK", task.getId());
        eventPublisher.publishEvent(new ProjectEvent(ProjectEventType.TASK_STATUS_CHANGED,
                task.getTitle() + " → " + targetStatus, task.getAssignee()));
        return toDTO(taskRepository.findById(id).orElseThrow());
    }

    @PreAuthorize("@permissions.manageProject(#projectId)")
    public void reorder(UUID projectId, List<UUID> taskIds) {
        Project project = projectService.getProject(projectId);
        if (taskIds.stream().anyMatch(Objects::isNull) || taskIds.stream().distinct().count() != taskIds.size())
            throw new IllegalArgumentException("Task ids must be non-null and unique");
        for (int i = 0; i < taskIds.size(); i++) {
            Task task = getTaskForUpdate(taskIds.get(i));
            if (!task.getProject().getId().equals(project.getId())) {
                throw new IllegalArgumentException("Task does not belong to project: " + task.getId());
            }
            task.setPosition(i);
            taskRepository.save(task);
        }
    }

    @PreAuthorize("@permissions.selfId(#userId)")
    public void undo(UUID userId) {
        undoService.undo(userId, commandInvoker.peek(userId));
    }

    @PreAuthorize("@permissions.readProject(#projectId)")
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

    @PreAuthorize("@permissions.self(#userEmail)")
    public Page<TaskResponseDTO> findVisibleTasks(String userEmail, TaskStatus status, TaskPriority priority,
                                                  UUID projectId, UUID workspaceId, UUID assigneeId,
                                                  String keyword, Boolean overdue, LocalDate dueFrom,
                                                  LocalDate dueTo, String sort, int page, int size) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userEmail));
        Specification<Task> spec = Specification.where(TaskSpecification.visibleTo(currentUser));
        if (status != null) spec = spec.and(TaskSpecification.hasStatus(status));
        if (priority != null) spec = spec.and(TaskSpecification.hasPriority(priority));
        if (projectId != null) spec = spec.and(TaskSpecification.hasProjectId(projectId));
        if (workspaceId != null) spec = spec.and(TaskSpecification.hasWorkspaceId(workspaceId));
        if (assigneeId != null) spec = spec.and(TaskSpecification.hasAssignee(assigneeId));
        if (keyword != null && !keyword.isBlank()) spec = spec.and(TaskSpecification.hasKeyword(keyword));
        if (Boolean.TRUE.equals(overdue)) spec = spec.and(TaskSpecification.isOverdue());
        if (dueFrom != null) spec = spec.and(TaskSpecification.dueFrom(dueFrom));
        if (dueTo != null) spec = spec.and(TaskSpecification.dueTo(dueTo));

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200), sortForTaskList(sort));
        return taskRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @PreAuthorize("@permissions.readTask(#id)")
    public TaskResponseDTO findById(UUID id) {
        return toDTO(getTask(id));
    }

    @PreAuthorize("@permissions.readTask(#id)")
    public Task getTask(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + id));
    }

    private void validateRequest(TaskRequestDTO request, Project project) {
        if (request.getTitle() == null || request.getTitle().isBlank() || request.getTitle().length() > 100)
            throw new IllegalArgumentException("Task title must contain 1 to 100 characters");
        permissions.validateAssignee(project, request.getAssigneeId());
    }

    private Task getTaskForUpdate(UUID id) {
        return taskRepository.findForUpdate(id).orElseThrow(() -> new NoSuchElementException("Task not found"));
    }

    private User resolveUser(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }

    private User resolveActor(UUID userId, User fallback) {
        return permissions.currentUser();
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

    private int nextPosition(Project project) {
        Task last = taskRepository.findTopByProjectOrderByPositionDesc(project);
        if (last == null || last.getPosition() == null) {
            return (int) taskRepository.countByProject(project);
        }
        return last.getPosition() + 1;
    }

    private Sort sortForTaskList(String sort) {
        if ("dueDate".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("dueDate").nullsLast());
        }
        if ("priority".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.desc("priority"));
        }
        if ("title".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("title"));
        }
        if ("created".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.desc("createdAt"));
        }
        return Sort.by(Sort.Order.desc("updatedAt"));
    }

    public TaskResponseDTO toDTO(Task t) {
        return TaskResponseDTO.builder()
                .id(t.getId())
                .canManage(permissions.manageProject(t.getProject().getId()))
                .canChangeStatus(permissions.workOnTask(t.getId()))
                .taskIdentifier(t.getTaskIdentifier())
                .title(t.getTitle())
                .description(t.getDescription())
                .priority(t.getPriority())
                .status(t.getStatus())
                .position(t.getPosition())
                .assignee(userToDTO(t.getAssignee()))
                .projectId(t.getProject().getId())
                .projectTitle(t.getProject().getTitle())
                .workspaceId(t.getProject().getWorkspace().getId())
                .workspaceName(t.getProject().getWorkspace().getName())
                .commentCount(commentRepository.countByTask(t))
                .subtasks(t.getSubtasks().stream()
                        .map(subtask -> SubtaskResponseDTO.builder()
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
