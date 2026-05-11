package com.teamsync.service;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TaskDependencyService {

    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final ProjectService projectService;

    public TaskDependencyService(TaskRepository taskRepository,
                                  @Lazy TaskService taskService,
                                  ProjectService projectService) {
        this.taskRepository = taskRepository;
        this.taskService = taskService;
        this.projectService = projectService;
    }

    public void addDependency(UUID taskId, UUID dependsOnId) {
        if (taskId.equals(dependsOnId)) {
            throw new IllegalArgumentException("A task cannot depend on itself");
        }

        Task task = taskService.getTask(taskId);
        Task dependsOn = taskService.getTask(dependsOnId);

        if (hasCircularDependency(dependsOn, taskId)) {
            throw new IllegalArgumentException("Circular dependency detected");
        }

        task.getDependencies().add(dependsOn);
        taskRepository.save(task);
    }

    public void removeDependency(UUID taskId, UUID depId) {
        Task task = taskService.getTask(taskId);
        task.getDependencies().removeIf(d -> d.getId().equals(depId));
        taskRepository.save(task);
    }

    public boolean canStart(Task task) {
        return task.getDependencies().stream()
                .allMatch(dep -> dep.getStatus() == TaskStatus.DONE);
    }

    public List<Task> getBlockedTasks(UUID projectId) {
        List<Task> all = taskRepository.findByProject(projectService.getProject(projectId));
        return all.stream()
                .filter(t -> !t.getDependencies().isEmpty() && !canStart(t))
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
