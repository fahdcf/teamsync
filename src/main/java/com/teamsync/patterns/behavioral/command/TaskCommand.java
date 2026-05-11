package com.teamsync.patterns.behavioral.command;

public interface TaskCommand {
    void execute();
    void undo();
}
