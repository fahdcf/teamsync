package com.teamsync.patterns.behavioral.strategy;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.repository.TaskRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class RoundRobinStrategy implements AssignmentStrategy {

    private static final Map<UUID, AtomicInteger> counters = new ConcurrentHashMap<>();

    @Override
    public User assign(List<User> projectMembers, Task task, TaskRepository taskRepository) {
        if (projectMembers.isEmpty()) {
            throw new IllegalStateException("No members available");
        }
        UUID projectId = task.getProject().getId();
        AtomicInteger counter = counters.computeIfAbsent(projectId, id -> new AtomicInteger(0));
        int index = counter.getAndIncrement() % projectMembers.size();
        return projectMembers.get(index);
    }
}
