package com.teamsync.patterns.structural.proxy;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.Role;
import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.presentation.dto.TaskResponseDTO;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.context.annotation.Primary;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Primary
@Service
public class TaskServiceProxy implements TaskService {

    private final TaskService delegate;
    private final UserRepository userRepository;

    public TaskServiceProxy(com.teamsync.service.TaskService delegate,
                             UserRepository userRepository) {
        this.delegate = delegate;
        this.userRepository = userRepository;
    }

    @Override
    public TaskResponseDTO create(UUID projectId, TaskRequestDTO request) {
        return delegate.create(projectId, request);
    }

    @Override
    public TaskResponseDTO create(UUID projectId, TaskRequestDTO request, UUID userId) {
        return delegate.create(projectId, request, userId);
    }

    @Override
    public TaskResponseDTO update(UUID id, TaskRequestDTO request) {
        return delegate.update(id, request);
    }

    @Override
    public TaskResponseDTO update(UUID id, TaskRequestDTO request, UUID userId) {
        return delegate.update(id, request, userId);
    }

    @Override
    public void delete(UUID id, UUID userId) {
        User caller = getUser(userId);
        if (caller.getRole() != Role.ADMIN && caller.getRole() != Role.PROJECT_MANAGER) {
            throw new AccessDeniedException("Only ADMIN or PROJECT_MANAGER can delete tasks");
        }
        delegate.delete(id, userId);
    }

    @Override
    public TaskResponseDTO assign(UUID id, UUID assigneeId, UUID userId) {
        Task task = delegate.getTask(id);
        User caller = getUser(userId);

        boolean isMember = task.getProject().getWorkspace().getMembers().contains(caller)
                || (task.getProject().getWorkspace().getOwner() != null
                    && task.getProject().getWorkspace().getOwner().getId().equals(caller.getId()))
                || (task.getProject().getManager() != null
                    && task.getProject().getManager().getId().equals(caller.getId()));

        if (!isMember) {
            throw new AccessDeniedException("Caller is not a member of the task's project");
        }
        return delegate.assign(id, assigneeId, userId);
    }

    @Override
    public TaskResponseDTO autoAssign(UUID projectId, UUID taskId, String strategyName) {
        return delegate.autoAssign(projectId, taskId, strategyName);
    }

    @Override
    public TaskResponseDTO changeStatus(UUID id, TaskStatus targetStatus, UUID userId) {
        return delegate.changeStatus(id, targetStatus, userId);
    }

    @Override
    public void reorder(UUID projectId, List<UUID> taskIds) {
        delegate.reorder(projectId, taskIds);
    }

    @Override
    public void undo(UUID userId) {
        delegate.undo(userId);
    }

    @Override
    public List<TaskResponseDTO> findByProject(UUID projectId, TaskStatus status, TaskPriority priority,
                                               UUID assigneeId, String keyword, Boolean overdue) {
        return delegate.findByProject(projectId, status, priority, assigneeId, keyword, overdue);
    }

    @Override
    public Page<TaskResponseDTO> findVisibleTasks(String userEmail, TaskStatus status, TaskPriority priority,
                                                  UUID projectId, UUID workspaceId, UUID assigneeId,
                                                  String keyword, Boolean overdue, LocalDate dueFrom,
                                                  LocalDate dueTo, String sort, int page, int size) {
        return delegate.findVisibleTasks(userEmail, status, priority, projectId, workspaceId, assigneeId,
                keyword, overdue, dueFrom, dueTo, sort, page, size);
    }

    @Override
    public TaskResponseDTO findById(UUID id) {
        return delegate.findById(id);
    }

    @Override
    public Task getTask(UUID id) {
        return delegate.getTask(id);
    }

    @Override
    public TaskRepository getTaskRepository() {
        return delegate.getTaskRepository();
    }

    @Override
    public TaskResponseDTO toDTO(Task task) {
        return delegate.toDTO(task);
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
    }
}
