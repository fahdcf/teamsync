package com.teamsync.patterns.behavioral.strategy;

import java.util.Locale;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TaskAssignmentService {

    private final WorkloadStrategy workloadStrategy;
    private final RoundRobinStrategy roundRobinStrategy;

    public TaskAssignmentService(WorkloadStrategy workloadStrategy, RoundRobinStrategy roundRobinStrategy) {
        this.workloadStrategy = workloadStrategy;
        this.roundRobinStrategy = roundRobinStrategy;
    }

    public User autoAssign(Task task, List<User> members, String name) {
        AssignmentStrategy strategy = switch (name.toLowerCase(Locale.ROOT)) {
            case "workload" -> workloadStrategy;
            case "roundrobin" -> roundRobinStrategy;
            default -> throw new IllegalArgumentException("Unknown assignment strategy");
        };
        return strategy.assign(members, task);
    }
}
