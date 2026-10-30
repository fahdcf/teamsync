package com.teamsync.service;

import com.teamsync.dto.TaskResponseDTO;
import com.teamsync.entity.Task;
import com.teamsync.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.*;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class TaskDependencyService {

    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final ProjectService projectService;

    public TaskDependencyService(TaskRepository taskRepository,
                                  TaskService taskService,
                                  ProjectService projectService) {
        this.taskRepository = taskRepository;
        this.taskService = taskService;
        this.projectService = projectService;
    }

    @PreAuthorize("@permissions.manageTask(#taskId) and @permissions.readTask(#dependsOnId)")
    public void addDependency(UUID taskId, UUID dependsOnId) {
        if (taskId.equals(dependsOnId)) {
            throw new IllegalArgumentException("A task cannot depend on itself");
        }

        Task task = taskService.getTask(taskId);
        Task dependsOn = taskService.getTask(dependsOnId);

        if (!task.getProject().getId().equals(dependsOn.getProject().getId()))
            throw new IllegalArgumentException("Dependencies must belong to the same project");
        if (hasCircularDependency(dependsOn, taskId)) {
            throw new IllegalArgumentException("Circular dependency detected");
        }

        task.getDependencies().add(dependsOn);
        taskRepository.save(task);
    }

    @PreAuthorize("@permissions.manageTask(#taskId)")
    public void removeDependency(UUID taskId, UUID depId) {
        Task task = taskService.getTask(taskId);
        task.getDependencies().removeIf(d -> d.getId().equals(depId));
        taskRepository.save(task);
    }

    public boolean canStart(Task task) {
        return task.getDependencies().stream()
                .allMatch(dep -> dep.getStatus() == TaskStatus.DONE);
    }

    @PreAuthorize("@permissions.readProject(#projectId)")
    public List<TaskResponseDTO> getBlockedTasks(UUID projectId) {
        List<Task> all = taskRepository.findByProject(projectService.getProject(projectId));
        return all.stream()
                .filter(t -> !t.getDependencies().isEmpty() && !canStart(t))
                .map(taskService::toDTO)
                .toList();
    }

    private boolean hasCircularDependency(Task start, UUID targetId) {
        Set<UUID> visited = new HashSet<>();
        Queue<Task> queue = new LinkedList<>();
        queue.add(start);

        while (!queue.isEmpty()) {
            Task current = queue.poll();
            if (current.getId().equals(targetId)) return true;
            if (visited.contains(current.getId())) continue;
            visited.add(current.getId());
            queue.addAll(current.getDependencies());
        }
        return false;
    }
}
