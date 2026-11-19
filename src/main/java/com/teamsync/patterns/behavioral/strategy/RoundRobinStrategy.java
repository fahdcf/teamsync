package com.teamsync.patterns.behavioral.strategy;

import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RoundRobinStrategy implements AssignmentStrategy {

    private final Map<UUID, AtomicInteger> counters = new ConcurrentHashMap<>();

    @Override
    public User assign(List<User> projectMembers, Task task) {
        if (projectMembers.isEmpty()) {
            throw new IllegalStateException("No members available");
        }
        UUID projectId = task.getProject().getId();
        AtomicInteger counter = counters.computeIfAbsent(projectId, id -> new AtomicInteger(0));
        int index = Math.floorMod(counter.getAndIncrement(), projectMembers.size());
        return projectMembers.get(index);
    }
}
