package com.teamsync.service;

import com.teamsync.patterns.behavioral.command.TaskCommand;
import com.teamsync.patterns.behavioral.command.TaskCommandInvoker;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/** Authorize the exact command snapshot being replayed, even if history changes concurrently. */
@Service
@Transactional
public class TaskUndoService {
    private final TaskCommandInvoker commands;

    public TaskUndoService(TaskCommandInvoker commands) { this.commands = commands; }

    @PreAuthorize("@permissions.selfId(#userId) and @permissions.undoCommand(#command)")
    public void undo(UUID userId, TaskCommand command) {
        commands.undo(userId, command);
    }
}
