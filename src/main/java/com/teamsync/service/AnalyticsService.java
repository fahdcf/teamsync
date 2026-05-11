package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ProjectService projectService;
    private final TaskRepository taskRepository;

    public AnalyticsService(ProjectService projectService, TaskRepository taskRepository) {
        this.projectService = projectService;
        this.taskRepository = taskRepository;
    }

    public Map<String, Object> getProjectStats(UUID projectId) {
        Project project = projectService.getProject(projectId);
        List<Task> tasks = taskRepository.findByProject(project);

        long total = tasks.size();
        Map<String, Long> byStatus = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));
        Map<String, Long> byPriority = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));
        long overdue = tasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now())
                        && t.getStatus() != TaskStatus.DONE)
                .count();
        long done = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        double completionPct = total == 0 ? 0 : (done * 100.0 / total);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("projectId", projectId);
        result.put("totalTasks", total);
        result.put("byStatus", byStatus);
        result.put("byPriority", byPriority);
        result.put("overdueCount", overdue);
        result.put("completionPercent", Math.round(completionPct));
        return result;
    }

    public List<Map<String, Object>> getTeamWorkload(UUID projectId) {
        Project project = projectService.getProject(projectId);
        List<Task> tasks = taskRepository.findByProject(project);

        Map<User, Long> active = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS && t.getAssignee() != null)
                .collect(Collectors.groupingBy(Task::getAssignee, Collectors.counting()));

        Map<User, Long> completed = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE && t.getAssignee() != null)
                .collect(Collectors.groupingBy(Task::getAssignee, Collectors.counting()));

        Set<User> allAssignees = new HashSet<>();
        allAssignees.addAll(active.keySet());
        allAssignees.addAll(completed.keySet());

        return allAssignees.stream().map(user -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", user.getId());
            m.put("name", user.getUsername());
            m.put("activeTaskCount", active.getOrDefault(user, 0L));
            m.put("completedTaskCount", completed.getOrDefault(user, 0L));
            return m;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getProjectHealth(UUID projectId) {
        Project project = projectService.getProject(projectId);
        List<Task> tasks = taskRepository.findByProject(project);

        long overdue = tasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now())
                        && t.getStatus() != TaskStatus.DONE)
                .count();

        int progress = project.getProgress();
        String health;
        if (progress >= 70 && overdue == 0) {
            health = "ON_TRACK";
        } else if (progress >= 40 || overdue <= 2) {
            health = "AT_RISK";
        } else {
            health = "DELAYED";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("projectId", projectId);
        result.put("progress", progress);
        result.put("overdueCount", overdue);
        result.put("health", health);
        return result;
    }
}
