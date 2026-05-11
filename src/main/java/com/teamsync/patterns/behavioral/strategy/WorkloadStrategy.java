package com.teamsync.patterns.behavioral.strategy;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;

import java.util.Comparator;
import java.util.List;

public class WorkloadStrategy implements AssignmentStrategy {

    @Override
    public User assign(List<User> projectMembers, Task task, TaskRepository taskRepository) {
        return projectMembers.stream()
                .min(Comparator.comparingLong(member ->
                        taskRepository.findByAssignee(member).stream()
                                .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS)
                                .count()))
                .orElseThrow(() -> new IllegalStateException("No members available"));
    }
}
