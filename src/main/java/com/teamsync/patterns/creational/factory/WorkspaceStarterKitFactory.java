package com.teamsync.patterns.creational.factory;

import com.teamsync.exception.ValidationException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WorkspaceStarterKitFactory {
    public List<StarterProject> create(String kit) {
        if (kit == null) return List.of();

        return switch (kit) {
            case "SOFTWARE_DEVELOPMENT" -> List.of(
                    new StarterProject("Product Development", List.of("Define the first release", "Set up the repository", "Build the first feature")),
                    new StarterProject("Release Readiness", List.of("Write the smoke test checklist", "Prepare release notes")));
            case "UNIVERSITY_PROJECT" -> List.of(
                    new StarterProject("Research and Delivery", List.of("Confirm the rubric and deadline", "Gather sources", "Draft the report", "Rehearse the presentation")));
            case "EVENT_PLANNING" -> List.of(
                    new StarterProject("Event Logistics", List.of("Confirm the date and venue", "Draft the budget", "Plan the event schedule")),
                    new StarterProject("Guest Communications", List.of("Prepare invitations", "Track RSVPs")));
            default -> throw new ValidationException("starterKit", "Choose a supported workspace starter kit");
        };
    }

    public record StarterProject(String title, List<String> tasks) {}
}
