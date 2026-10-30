package com.teamsync.patterns.behavioral.strategy;

import java.util.Locale;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.repository.TaskRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TaskAssignmentService {

    private final TaskRepository taskRepository;

    public TaskAssignmentService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public User autoAssign(Task task, List<User> members, String name) {
        AssignmentStrategy strategy = switch (name.toLowerCase(Locale.ROOT)) {
            case "workload" -> new WorkloadStrategy();
            case "roundrobin" -> new RoundRobinStrategy();
            default -> throw new IllegalArgumentException("Unknown assignment strategy");
        };
        return strategy.assign(members, task, taskRepository);
    }
}
