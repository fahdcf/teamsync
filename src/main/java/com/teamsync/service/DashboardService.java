package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.WorkspaceRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DashboardService {

    private final UserService userService;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final WorkspaceRepository workspaceRepository;

    public DashboardService(UserService userService,
                            ProjectRepository projectRepository,
                            TaskRepository taskRepository,
                            WorkspaceRepository workspaceRepository) {
        this.userService = userService;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.workspaceRepository = workspaceRepository;
    }

    public Map<String, Object> getStats(String userEmail) {
        User currentUser = userService.findByEmail(userEmail);
        Set<Project> userProjects = getUserProjects(currentUser);

        long activeTasks = taskRepository.countByAssigneeAndStatus(currentUser, TaskStatus.IN_PROGRESS);
        long totalMyTasks = taskRepository.countByAssignee(currentUser);
        long doneMyTasks = taskRepository.countByAssigneeAndStatus(currentUser, TaskStatus.DONE);
        long overdueItems = taskRepository.countByAssigneeAndStatusNotAndDueDateBefore(
                currentUser, TaskStatus.DONE, LocalDate.now());

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        LocalDateTime from = LocalDateTime.of(weekStart, LocalTime.MIN);
        LocalDateTime to = LocalDateTime.of(weekEnd, LocalTime.MAX);

        long teamVelocity = 0;
        if (!userProjects.isEmpty()) {
            teamVelocity = taskRepository.findByProjectInAndStatusAndUpdatedAtBetween(
                    userProjects, TaskStatus.DONE, from, to).size();
        }

        int completionRate = totalMyTasks == 0 ? 0 : (int) Math.round((doneMyTasks * 100.0) / totalMyTasks);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("activeTasks", activeTasks);
        result.put("completionRate", completionRate);
        result.put("teamVelocity", teamVelocity);
        result.put("overdueItems", overdueItems);
        result.put("trendActiveTasks", randomTrend());
        result.put("trendCompletion", randomTrend());
        result.put("trendVelocity", randomTrend());
        result.put("trendOverdue", randomTrend());
        return result;
    }

    public List<Map<String, Object>> getUpcomingDeadlines(String userEmail) {
        User currentUser = userService.findByEmail(userEmail);
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);

        List<Task> tasks = taskRepository.findTop5ByAssigneeAndStatusNotAndDueDateBetweenOrderByDueDateAsc(
                currentUser, TaskStatus.DONE, today, nextWeek);

        return tasks.stream().map(task -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", task.getId());
            dto.put("title", task.getTitle());
            dto.put("dueDate", task.getDueDate());
            dto.put("priority", task.getPriority());
            dto.put("project", Map.of("title", task.getProject().getTitle()));
            return dto;
        }).toList();
    }

    public List<Map<String, Object>> getProjectsOverview(String userEmail) {
        User currentUser = userService.findByEmail(userEmail);
        Set<Project> projects = getUserProjects(currentUser);

        List<ProjectSnapshot> snapshots = new ArrayList<>();
        for (Project project : projects) {
            Task latestTask = taskRepository.findTopByProjectOrderByUpdatedAtDesc(project);
            LocalDateTime updatedAt = latestTask != null && latestTask.getUpdatedAt() != null
                    ? latestTask.getUpdatedAt()
                    : project.getCreatedAt();
            long taskCount = taskRepository.countByProject(project);
            snapshots.add(new ProjectSnapshot(project, updatedAt, taskCount));
        }

        return snapshots.stream()
                .sorted(Comparator.comparing(ProjectSnapshot::updatedAt).reversed())
                .limit(5)
                .map(snapshot -> {
                    Map<String, Object> dto = new LinkedHashMap<>();
                    dto.put("id", snapshot.project().getId());
                    dto.put("title", snapshot.project().getTitle());
                    dto.put("progress", snapshot.project().getProgress());
                    dto.put("status", snapshot.project().getStatus());
                    dto.put("taskCount", snapshot.taskCount());
                    return dto;
                })
                .toList();
    }

    private Set<Project> getUserProjects(User user) {
        Set<Workspace> workspaces = new LinkedHashSet<>();
        workspaces.addAll(workspaceRepository.findByOwner(user));
        workspaces.addAll(workspaceRepository.findByMembersContaining(user));

        Set<Project> projects = new LinkedHashSet<>();
        for (Workspace workspace : workspaces) {
            projects.addAll(projectRepository.findByWorkspace(workspace));
        }
        return projects;
    }

    private int randomTrend() {
        return ThreadLocalRandom.current().nextInt(-20, 21);
    }

    private record ProjectSnapshot(Project project, LocalDateTime updatedAt, long taskCount) {}
}
