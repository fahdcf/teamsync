package com.teamsync.patterns.behavioral.command;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.*;

/** Bounded, process-local undo history. Publish history only after the database commits. */
@Component
public class TaskCommandInvoker {
    private static final int MAX_HISTORY = 10;
    private final Map<UUID, Deque<TaskCommand>> history = new HashMap<>();
    private final Set<UUID> undoInProgress = new HashSet<>();

    public void execute(UUID userId, TaskCommand command) {
        command.execute();
        afterCommit(() -> {
            synchronized (this) {
                Deque<TaskCommand> stack = history.computeIfAbsent(userId, id -> new ArrayDeque<>());
                stack.push(command);
                if (stack.size() > MAX_HISTORY) stack.removeLast();
            }
        });
    }

    public synchronized TaskCommand peek(UUID userId) {
        Deque<TaskCommand> stack = history.get(userId);
        if (stack == null || stack.isEmpty()) throw new IllegalStateException("No actions to undo");
        return stack.peek();
    }

    public void undo(UUID userId, TaskCommand command) {
        synchronized (this) {
            if (peek(userId) != command || !undoInProgress.add(userId))
                throw new IllegalStateException("Undo history changed or an undo is already in progress");
        }
        boolean transactional = TransactionSynchronizationManager.isSynchronizationActive();
        if (transactional) TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                synchronized (TaskCommandInvoker.this) { undoInProgress.remove(userId); }
            }
        });
        try {
            command.undo();
        } catch (RuntimeException ex) {
            if (!transactional) synchronized (this) { undoInProgress.remove(userId); }
            throw ex;
        }
        afterCommit(() -> {
            synchronized (this) {
                history.get(userId).removeFirstOccurrence(command);
                if (history.get(userId).isEmpty()) history.remove(userId);
                if (!transactional) undoInProgress.remove(userId);
            }
        });
    }

    private void afterCommit(Runnable callback) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            callback.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { callback.run(); }
        });
    }
}
