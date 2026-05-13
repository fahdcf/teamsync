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
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

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

    public Map<String, Object> getStats(String userEmail, LocalDate fromDate, LocalDate toDate) {
        User currentUser = userService.findByEmail(userEmail);
        Set<Project> userProjects = getUserProjects(currentUser);

        DateRange range = normalizeRange(fromDate, toDate);
        DateRange previousRange = previousRange(range);

        long activeTasks = taskRepository.countByAssigneeAndStatusAndUpdatedAtBetween(
                currentUser, TaskStatus.IN_PROGRESS, range.startDateTime(), range.endDateTime());
        long previousActiveTasks = taskRepository.countByAssigneeAndStatusAndUpdatedAtBetween(
                currentUser, TaskStatus.IN_PROGRESS, previousRange.startDateTime(), previousRange.endDateTime());

        long totalMyTasks = taskRepository.countByAssigneeAndUpdatedAtBetween(
                currentUser, range.startDateTime(), range.endDateTime());
        long doneMyTasks = taskRepository.countByAssigneeAndStatusAndUpdatedAtBetween(
                currentUser, TaskStatus.DONE, range.startDateTime(), range.endDateTime());
        long previousTotalMyTasks = taskRepository.countByAssigneeAndUpdatedAtBetween(
                currentUser, previousRange.startDateTime(), previousRange.endDateTime());
        long previousDoneMyTasks = taskRepository.countByAssigneeAndStatusAndUpdatedAtBetween(
                currentUser, TaskStatus.DONE, previousRange.startDateTime(), previousRange.endDateTime());

        long overdueItems = taskRepository.countByAssigneeAndStatusNotAndDueDateBetween(
                currentUser, TaskStatus.DONE, range.from(), range.to());
        long previousOverdueItems = taskRepository.countByAssigneeAndStatusNotAndDueDateBetween(
                currentUser, TaskStatus.DONE, previousRange.from(), previousRange.to());

        long teamVelocity = teamVelocity(userProjects, range);
        long previousTeamVelocity = teamVelocity(userProjects, previousRange);

        int completionRate = completionRate(doneMyTasks, totalMyTasks);
        int previousCompletionRate = completionRate(previousDoneMyTasks, previousTotalMyTasks);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("activeTasks", activeTasks);
        result.put("completionRate", completionRate);
        result.put("teamVelocity", teamVelocity);
        result.put("overdueItems", overdueItems);
        result.put("trendActiveTasks", trend(activeTasks, previousActiveTasks));
        result.put("trendCompletion", completionRate - previousCompletionRate);
        result.put("trendVelocity", trend(teamVelocity, previousTeamVelocity));
        result.put("trendOverdue", trend(overdueItems, previousOverdueItems));
        return result;
    }

    public List<Map<String, Object>> getUpcomingDeadlines(String userEmail, LocalDate fromDate, LocalDate toDate) {
        User currentUser = userService.findByEmail(userEmail);
        LocalDate today = LocalDate.now();
        LocalDate start = fromDate != null ? fromDate : today;
        LocalDate end = toDate != null ? toDate : today.plusDays(7);
        if (end.isBefore(start)) {
            end = start;
        }

        List<Task> tasks = taskRepository.findTop5ByAssigneeAndStatusNotAndDueDateBetweenOrderByDueDateAsc(
                currentUser, TaskStatus.DONE, start, end);

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

    private long teamVelocity(Set<Project> userProjects, DateRange range) {
        if (userProjects.isEmpty()) {
            return 0;
        }
        return taskRepository.findByProjectInAndStatusAndUpdatedAtBetween(
                userProjects, TaskStatus.DONE, range.startDateTime(), range.endDateTime()).size();
    }

    private int completionRate(long doneTasks, long totalTasks) {
        return totalTasks == 0 ? 0 : (int) Math.round((doneTasks * 100.0) / totalTasks);
    }

    private int trend(long current, long previous) {
        if (previous == 0) {
            return current == 0 ? 0 : 100;
        }
        return (int) Math.round(((current - previous) * 100.0) / previous);
    }

    private DateRange normalizeRange(LocalDate fromDate, LocalDate toDate) {
        LocalDate today = LocalDate.now();
        LocalDate defaultStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate defaultEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        LocalDate from = fromDate != null ? fromDate : defaultStart;
        LocalDate to = toDate != null ? toDate : defaultEnd;
        if (to.isBefore(from)) {
            to = from;
        }
        return new DateRange(from, to);
    }

    private DateRange previousRange(DateRange range) {
        long days = ChronoUnit.DAYS.between(range.from(), range.to()) + 1;
        LocalDate previousTo = range.from().minusDays(1);
        LocalDate previousFrom = previousTo.minusDays(days - 1);
        return new DateRange(previousFrom, previousTo);
    }

    private record ProjectSnapshot(Project project, LocalDateTime updatedAt, long taskCount) {}

    private record DateRange(LocalDate from, LocalDate to) {
        LocalDateTime startDateTime() {
            return LocalDateTime.of(from, LocalTime.MIN);
        }

        LocalDateTime endDateTime() {
            return LocalDateTime.of(to, LocalTime.MAX);
        }
    }
}
