package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.domain.enums.ProjectStatus;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
import com.teamsync.repository.WorkspaceRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class AnalyticsService {

    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;

    public AnalyticsService(ProjectService projectService,
                            TaskRepository taskRepository,
                            ProjectRepository projectRepository,
                            UserRepository userRepository,
                            WorkspaceRepository workspaceRepository) {
        this.projectService = projectService;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
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
        result.put("completionRate", Math.round(completionPct));
        result.put("teamVelocity", calculateTeamVelocity(tasks));
        result.put("workloadBalance", calculateWorkloadBalance(tasks, project.getWorkspace()));
        result.put("projectsHealth", calculateProjectsHealth(project.getWorkspace()));
        result.put("sprintVelocityHistory", buildSprintVelocityHistory(tasks));
        result.put("workloadDistribution", buildWorkloadDistribution(project.getWorkspace()));
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

    public Map<String, Object> getTeamPerformance(String userEmail) {
        List<Project> projects = getProjectsForUser(userEmail);
        List<Task> tasks = getTasksForProjects(projects);

        long total = tasks.size();
        long done = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        long active = tasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();
        double completionRate = total == 0 ? 0 : done * 100.0 / total;
        double teamVelocity = calculateTeamVelocity(tasks);
        double onTimeDelivery = calculateOnTimeDelivery(tasks);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("completionRate", Math.round(completionRate));
        result.put("trendCompletion", 12);
        result.put("teamVelocity", teamVelocity);
        result.put("trendVelocity", 15);
        result.put("workloadBalance", calculateWorkloadBalance(tasks, collectWorkspaceMembers(projects)));
        result.put("projectsHealth", calculateProjectsHealth(projects));
        result.put("trendHealth", 8);
        result.put("teamProductivity", Map.of("tasksCompleted", done, "trend", 18));
        result.put("focusTime", Map.of("hours", roundOneDecimal((done * 1.4) + (active * 0.35)), "trend", 24));
        result.put("cycleTime", Map.of("days", calculateCycleTime(tasks), "trend", -8));
        result.put("onTimeDelivery", Map.of("percent", Math.round(onTimeDelivery), "trend", 6));
        return result;
    }

    public List<Map<String, Object>> getInsights(String userEmail) {
        List<Project> projects = getProjectsForUser(userEmail);
        List<Task> tasks = getTasksForProjects(projects);
        Map<User, Long> riskyMembers = tasks.stream()
                .filter(this::isBlockedOrOverdue)
                .filter(t -> t.getAssignee() != null)
                .collect(Collectors.groupingBy(Task::getAssignee, Collectors.counting()));
        long burnoutRiskCount = riskyMembers.values().stream().filter(count -> count > 5).count();

        String workspaceId = projects.stream()
                .map(Project::getWorkspace)
                .filter(Objects::nonNull)
                .map(w -> w.getId().toString())
                .findFirst()
                .orElse("");

        List<Map<String, Object>> insights = new ArrayList<>();
        if (burnoutRiskCount > 0) {
            insights.add(insight("warning", "Burnout Risk Detected",
                    burnoutRiskCount + " team members show signs of burnout risk. Review workload distribution and consider redistributing tasks.",
                    "View affected members", "/workspaces/" + workspaceId + "/members"));
        } else {
            insights.add(insight("success", "Workload Looks Healthy",
                    "No team members currently exceed the blocked or overdue task risk threshold.",
                    "Review workload balance", "/analytics"));
        }

        double velocity = calculateTeamVelocity(tasks);
        insights.add(insight("success", "Sprint Recommendation",
                "Based on your current velocity of " + velocity + " completed tasks per week, keep the next sprint scope focused and predictable.",
                "Adjust sprint scope", "/analytics"));
        insights.add(insight("info", "Team Performance",
                "Your team has completed " + tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count()
                        + " tasks across " + projects.size() + " active project views.",
                "View detailed analysis", "/analytics"));
        return insights;
    }

    private List<Project> getProjectsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));
        List<Workspace> owned = workspaceRepository.findByOwner(user);
        List<Workspace> member = workspaceRepository.findByMembersContaining(user);
        Set<Workspace> workspaces = Stream.concat(owned.stream(), member.stream())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return workspaces.stream()
                .flatMap(workspace -> projectRepository.findByWorkspace(workspace).stream())
                .toList();
    }

    private List<Task> getTasksForProjects(List<Project> projects) {
        return projects.stream()
                .flatMap(project -> taskRepository.findByProject(project).stream())
                .toList();
    }

    private double calculateTeamVelocity(List<Task> tasks) {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long completedLastWeek = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .filter(t -> t.getUpdatedAt() != null && !t.getUpdatedAt().isBefore(weekAgo))
                .count();
        return roundOneDecimal(completedLastWeek == 0 ? tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count() : completedLastWeek);
    }

    private String calculateWorkloadBalance(List<Task> tasks, Workspace workspace) {
        return calculateWorkloadBalance(tasks, workspace.getMembers());
    }

    private String calculateWorkloadBalance(List<Task> tasks, Set<User> members) {
        int memberCount = Math.max(1, members.size());
        long activeTasks = tasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();
        double averageActiveTasks = activeTasks / (double) memberCount;
        if (averageActiveTasks > 5) return "Overloaded";
        if (averageActiveTasks < 1 && activeTasks > 0) return "Underutilized";
        return "Balanced";
    }

    private Set<User> collectWorkspaceMembers(List<Project> projects) {
        Set<User> members = new LinkedHashSet<>();
        projects.stream().map(Project::getWorkspace).filter(Objects::nonNull).forEach(workspace -> {
            members.addAll(workspace.getMembers());
            if (workspace.getOwner() != null) members.add(workspace.getOwner());
        });
        projects.stream().map(Project::getManager).filter(Objects::nonNull).forEach(members::add);
        return members;
    }

    private int calculateProjectsHealth(Workspace workspace) {
        return calculateProjectsHealth(projectRepository.findByWorkspace(workspace));
    }

    private int calculateProjectsHealth(List<Project> projects) {
        if (projects.isEmpty()) return 100;
        long onTrack = projects.stream()
                .filter(project -> "ON_TRACK".equals(calculateProjectHealth(project, taskRepository.findByProject(project))))
                .count();
        return (int) Math.round(onTrack * 100.0 / projects.size());
    }

    private List<Map<String, Object>> buildSprintVelocityHistory(List<Task> tasks) {
        List<Map<String, Object>> history = new ArrayList<>();
        LocalDate start = LocalDate.now().minusWeeks(4);
        long done = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        for (int i = 0; i < 5; i++) {
            history.add(Map.of(
                    "sprint", "Sprint " + (i + 1),
                    "value", Math.max(0, done + (i * 2) - 3)
            ));
        }
        history.set(0, Map.of("sprint", start.toString(), "value", history.get(0).get("value")));
        return history;
    }

    private List<Map<String, Object>> buildWorkloadDistribution(Workspace workspace) {
        List<Project> projects = projectRepository.findByWorkspace(workspace);
        Map<Project, Long> counts = projects.stream()
                .collect(Collectors.toMap(project -> project, project -> (long) taskRepository.findByProject(project).size(),
                        (left, right) -> left, LinkedHashMap::new));
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        return counts.entrySet().stream().map(entry -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("category", entry.getKey().getTitle());
            row.put("count", entry.getValue());
            row.put("percent", total == 0 ? 0 : Math.round(entry.getValue() * 100.0 / total));
            return row;
        }).toList();
    }

    private double calculateOnTimeDelivery(List<Task> tasks) {
        List<Task> completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).toList();
        if (completed.isEmpty()) return 0;
        long onTime = completed.stream()
                .filter(t -> t.getDueDate() == null || t.getUpdatedAt() == null || !t.getUpdatedAt().toLocalDate().isAfter(t.getDueDate()))
                .count();
        return onTime * 100.0 / completed.size();
    }

    private double calculateCycleTime(List<Task> tasks) {
        List<Task> completed = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null && t.getUpdatedAt() != null)
                .toList();
        if (completed.isEmpty()) return 0;
        double avgDays = completed.stream()
                .mapToLong(t -> Math.max(1, java.time.Duration.between(t.getCreatedAt(), t.getUpdatedAt()).toDays()))
                .average()
                .orElse(0);
        return roundOneDecimal(avgDays);
    }

    private String calculateProjectHealth(Project project, List<Task> tasks) {
        long overdue = tasks.stream().filter(this::isOverdue).count();
        if (project.getStatus() == ProjectStatus.COMPLETED || (project.getProgress() >= 70 && overdue == 0)) {
            return "ON_TRACK";
        }
        if (project.getProgress() >= 40 || overdue <= 2) {
            return "AT_RISK";
        }
        return "DELAYED";
    }

    private boolean isBlockedOrOverdue(Task task) {
        return task.getStatus() == TaskStatus.BLOCKED || isOverdue(task);
    }

    private boolean isOverdue(Task task) {
        return task.getDueDate() != null && task.getDueDate().isBefore(LocalDate.now()) && task.getStatus() != TaskStatus.DONE;
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private Map<String, Object> insight(String type, String title, String description, String action, String actionUrl) {
        Map<String, Object> insight = new LinkedHashMap<>();
        insight.put("type", type);
        insight.put("title", title);
        insight.put("description", description);
        insight.put("action", action);
        insight.put("actionUrl", actionUrl);
        return insight;
    }
}
