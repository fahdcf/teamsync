package com.teamsync.patterns.behavioral.strategy;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.repository.TaskRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TaskAssignmentService {

    private AssignmentStrategy strategy;
    private final TaskRepository taskRepository;

    public TaskAssignmentService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
        this.strategy = new WorkloadStrategy();
    }

    public void setStrategy(AssignmentStrategy strategy) {
        this.strategy = strategy;
    }

    public User autoAssign(Task task, List<User> members) {
        return strategy.assign(members, task, taskRepository);
    }
}
