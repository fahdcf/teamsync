package com.teamsync.patterns.behavioral.command;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class TaskCommandInvoker {

    private static final int MAX_HISTORY = 10;
    private final Map<UUID, Deque<TaskCommand>> history = new HashMap<>();

    public void execute(UUID userId, TaskCommand command) {
        command.execute();
        Deque<TaskCommand> stack = history.computeIfAbsent(userId, id -> new ArrayDeque<>());
        stack.push(command);
        if (stack.size() > MAX_HISTORY) {
            ((ArrayDeque<TaskCommand>) stack).removeLast();
        }
    }

    public void undo(UUID userId) {
        Deque<TaskCommand> stack = history.get(userId);
        if (stack == null || stack.isEmpty()) {
            throw new IllegalStateException("No commands to undo for user: " + userId);
        }
        stack.pop().undo();
    }
}
