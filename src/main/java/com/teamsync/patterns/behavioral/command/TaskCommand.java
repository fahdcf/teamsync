package com.teamsync.patterns.behavioral.command;

import java.util.UUID;
public interface TaskCommand {
    void execute();
    void undo();
    UUID projectId();
    UUID taskId();
    default UUID restoredAssigneeId() { return null; }
}
