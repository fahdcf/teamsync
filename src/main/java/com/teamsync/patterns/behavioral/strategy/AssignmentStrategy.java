package com.teamsync.patterns.behavioral.strategy;

import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.repository.TaskRepository;

import java.util.List;

public interface AssignmentStrategy {
    User assign(List<User> projectMembers, Task task, TaskRepository taskRepository);
}
