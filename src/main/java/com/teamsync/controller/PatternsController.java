package com.teamsync.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "Patterns", description = "Academic catalogue of retained supporting design patterns")
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
            Map.of("id", 2, "name", "Factory Method", "category", "Creational",
                   "package", "com.teamsync.patterns.creational.factory",
                   "keyClasses", List.of("NotificationFactory", "InAppNotificationFactory", "EmailNotificationFactory"),
                   "purpose", "Creates IN_APP or EMAIL notifications without exposing construction logic"),
            Map.of("id", 4, "name", "Prototype", "category", "Creational",
                   "package", "com.teamsync.entity",
                   "keyClasses", List.of("CloneableTask", "TaskTemplate"),
                   "purpose", "Clones task templates to create new tasks with pre-filled fields"),
            Map.of("id", 6, "name", "Adapter", "category", "Structural",
                   "package", "com.teamsync.patterns.structural.adapter",
                   "keyClasses", List.of("EmailService", "EmailServiceAdapter", "MockExternalEmailClient"),
                   "purpose", "Translates MockExternalEmailClient.sendMessage() to our EmailService.sendEmail()"),
            Map.of("id", 8, "name", "Decorator", "category", "Structural",
                   "package", "com.teamsync.patterns.structural.decorator",
                   "keyClasses", List.of("NotificationSender", "InAppSender", "EmailDecorator", "UrgentDecorator"),
                   "purpose", "Wraps NotificationSender to add email or urgent prefix dynamically"),
            Map.of("id", 9, "name", "Observer", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.observer",
                   "keyClasses", List.of("ApplicationEventPublisher", "NotificationListener"),
                   "purpose", "Publishes project events; listeners react independently without coupling"),
            Map.of("id", 10, "name", "Strategy", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.strategy",
                   "keyClasses", List.of("AssignmentStrategy", "WorkloadStrategy", "RoundRobinStrategy"),
                   "purpose", "Swappable task assignment algorithms: workload-based or round-robin"),
            Map.of("id", 11, "name", "State", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.state",
                   "keyClasses", List.of("TaskStateMachine", "TodoState", "InProgressState", "InReviewState", "BlockedState", "DoneState"),
                   "purpose", "Each TaskStatus owns its valid transitions; invalid ones throw immediately"),
            Map.of("id", 12, "name", "Command", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.command",
                   "keyClasses", List.of("TaskCommandInvoker", "DeleteTaskCommand", "AssignTaskCommand", "ChangeStatusCommand"),
                   "purpose", "Wraps delete/assign/status-change as undoable commands with per-user history"),
            Map.of("id", 14, "name", "Template Method", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.template",
                   "keyClasses", List.of("ReportGenerator", "JsonReportGenerator", "CsvReportGenerator", "PdfReportGenerator"),
                   "purpose", "ReportGenerator formats authorized service data without accessing repositories or services")
        );
    }
}
