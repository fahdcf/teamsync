package com.teamsync.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "Patterns", description = "Design patterns supporting current application behavior")
@RestController
public class PatternsController {

    @Operation(summary = "List retained design patterns with their key classes and purpose")
    @ApiResponse(responseCode = "200", description = "Pattern catalogue returned")
    @GetMapping("/patterns")
    public List<Map<String, Object>> getPatterns() {
        return List.of(
            Map.of("id", 1, "name", "Singleton", "category", "Creational",
                   "package", "com.teamsync.patterns.creational.singleton",
                   "keyClasses", List.of("AppLogger"),
                   "purpose", "Ensures one shared logger instance exists across the application"),
            Map.of("id", 2, "name", "Simple Factory", "category", "Creational",
                   "package", "com.teamsync.patterns.creational.factory",
                   "keyClasses", List.of("WorkspaceStarterKitFactory", "StarterProject"),
                   "purpose", "Builds the project and task plan for a workspace starter kit"),
            Map.of("id", 4, "name", "Prototype", "category", "Creational",
                   "package", "com.teamsync.entity",
                   "keyClasses", List.of("CloneableTask", "TaskTemplate"),
                   "purpose", "Clones task templates to create new tasks with pre-filled fields"),
            Map.of("id", 9, "name", "Observer", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.observer",
                   "keyClasses", List.of("ApplicationEventPublisher", "ProjectEvent", "NotificationListener"),
                   "purpose", "Creates recipient notifications through synchronous Spring events in the publishing transaction"),
            Map.of("id", 10, "name", "Strategy", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.strategy",
                   "keyClasses", List.of("AssignmentStrategy", "WorkloadStrategy", "RoundRobinStrategy"),
                   "purpose", "Swappable task assignment algorithms: workload-based or round-robin"),
            Map.of("id", 11, "name", "State", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.state",
                   "keyClasses", List.of("TaskStateMachine", "TaskState"),
                   "purpose", "Validates lifecycle changes using the rules of the task's current status"),
            Map.of("id", 12, "name", "Command", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.command",
                   "keyClasses", List.of("TaskCommandInvoker", "DeleteTaskCommand", "AssignTaskCommand", "ChangeStatusCommand"),
                   "purpose", "Wraps delete/assign/status-change as undoable commands with per-user history"),
            Map.of("id", 13, "name", "Builder", "category", "Creational",
                   "package", "com.teamsync.report",
                   "keyClasses", List.of("ProjectReportBuilder", "ReportSection"),
                   "purpose", "Assembles the selected project report sections for export")
        );
    }
}
