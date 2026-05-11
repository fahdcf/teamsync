package com.teamsync.presentation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class PatternsController {

    @GetMapping("/patterns")
    public List<Map<String, String>> getPatterns() {
        return List.of(
            Map.of("name", "Singleton", "category", "Creational",
                   "package", "com.teamsync.patterns.creational.singleton",
                   "purpose", "Ensures only one AppLogger instance exists across the application"),
            Map.of("name", "Factory Method", "category", "Creational",
                   "package", "com.teamsync.patterns.creational.factory",
                   "purpose", "Creates IN_APP or EMAIL notifications without exposing construction logic"),
            Map.of("name", "Builder", "category", "Creational",
                   "package", "com.teamsync.patterns.creational.builder",
                   "purpose", "Constructs Report objects step by step with a fluent API"),
            Map.of("name", "Prototype", "category", "Creational",
                   "package", "com.teamsync.patterns.creational.prototype",
                   "purpose", "Clones task templates to create new tasks with pre-filled fields"),
            Map.of("name", "Facade", "category", "Structural",
                   "package", "com.teamsync.patterns.structural.facade",
                   "purpose", "Hides workspace-validate + project-create + manager-assign behind one call"),
            Map.of("name", "Adapter", "category", "Structural",
                   "package", "com.teamsync.patterns.structural.adapter",
                   "purpose", "Translates MockExternalEmailClient.sendMessage() to our EmailService.sendEmail()"),
            Map.of("name", "Proxy", "category", "Structural",
                   "package", "com.teamsync.patterns.structural.proxy",
                   "purpose", "Guards TaskService: checks role before delete, membership before assign"),
            Map.of("name", "Decorator", "category", "Structural",
                   "package", "com.teamsync.patterns.structural.decorator",
                   "purpose", "Wraps NotificationSender to add email or urgent prefix dynamically"),
            Map.of("name", "Observer", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.observer",
                   "purpose", "Publishes project events; ActivityLogListener and NotificationListener react independently"),
            Map.of("name", "Strategy", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.strategy",
                   "purpose", "Swappable task assignment algorithms: workload-based or round-robin"),
            Map.of("name", "State", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.state",
                   "purpose", "Each TaskStatus owns its valid transitions; invalid ones throw immediately"),
            Map.of("name", "Command", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.command",
                   "purpose", "Wraps delete/assign/status-change as undoable commands with per-user history"),
            Map.of("name", "Chain of Responsibility", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.chain",
                   "purpose", "Passes task create requests through Title → Deadline → Assignee → Priority validators"),
            Map.of("name", "Template Method", "category", "Behavioral",
                   "package", "com.teamsync.patterns.behavioral.template",
                   "purpose", "ReportGenerator.generate() defines fixed steps; subclasses implement collectData/format")
        );
    }
}
