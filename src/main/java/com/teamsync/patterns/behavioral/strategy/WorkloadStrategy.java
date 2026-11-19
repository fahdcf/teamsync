package com.teamsync.patterns.behavioral.strategy;

import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class WorkloadStrategy implements AssignmentStrategy {

    private final TaskRepository taskRepository;

    public WorkloadStrategy(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Override
    public User assign(List<User> projectMembers, Task task) {
        if (projectMembers.isEmpty()) throw new IllegalStateException("No members available");
        Map<UUID, Long> workloads = taskRepository.countWorkloads(
                        task.getProject().getWorkspace().getId(),
                        projectMembers.stream().map(User::getId).toList(), TaskStatus.IN_PROGRESS).stream()
                .collect(Collectors.toMap(TaskRepository.AssigneeWorkload::getAssigneeId,
                        TaskRepository.AssigneeWorkload::getTaskCount));
        return projectMembers.stream()
                .min(Comparator.comparingLong(member -> workloads.getOrDefault(member.getId(), 0L)))
                .orElseThrow(() -> new IllegalStateException("No members available"));
    }
}
