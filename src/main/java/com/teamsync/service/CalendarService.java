package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.WorkspaceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class CalendarService {

    private final UserService userService;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public CalendarService(UserService userService,
                           WorkspaceRepository workspaceRepository,
                           ProjectRepository projectRepository,
                           TaskRepository taskRepository) {
        this.userService = userService;
        this.workspaceRepository = workspaceRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    public List<Map<String, Object>> getEvents(String userEmail, LocalDate from, LocalDate to, UUID workspaceId,
                                               UUID projectId, UUID assigneeId, TaskPriority priority) {
        User currentUser = userService.findByEmail(userEmail);
        LocalDate start = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate end = to != null ? to : start.plusMonths(1).minusDays(1);
        if (end.isBefore(start)) {
            end = start;
        }

        Set<Workspace> workspaces = visibleWorkspaces(currentUser);
        if (workspaceId != null) {
            workspaces.removeIf(workspace -> !workspace.getId().equals(workspaceId));
        }

        if (workspaces.isEmpty()) {
            return List.of();
        }

        Set<Project> visibleProjects = new LinkedHashSet<>(projectRepository.findByWorkspaceIn(workspaces));
        if (projectId != null) {
            visibleProjects.removeIf(project -> !project.getId().equals(projectId));
        }
        List<Map<String, Object>> projectEvents = projectRepository.findByWorkspaceInAndDeadlineBetween(workspaces, start, end)
                .stream()
                .filter(project -> projectId == null || project.getId().equals(projectId))
                .filter(project -> assigneeId == null && priority == null)
                .map(this::projectEvent)
                .toList();
        List<Map<String, Object>> taskEvents = visibleProjects.isEmpty()
                ? List.of()
                : taskRepository.findByProjectInAndDueDateBetween(visibleProjects, start, end)
                        .stream()
                        .filter(task -> assigneeId == null || (task.getAssignee() != null && task.getAssignee().getId().equals(assigneeId)))
                        .filter(task -> priority == null || task.getPriority() == priority)
                        .map(this::taskEvent)
                        .toList();

        return java.util.stream.Stream.concat(projectEvents.stream(), taskEvents.stream()).toList();
    }

    private Set<Workspace> visibleWorkspaces(User user) {
        Set<Workspace> workspaces = new LinkedHashSet<>();
        workspaces.addAll(workspaceRepository.findByOwner(user));
        workspaces.addAll(workspaceRepository.findByMembersContaining(user));
        return workspaces;
    }

    private Map<String, Object> taskEvent(Task task) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", task.getId());
        event.put("type", "TASK");
        event.put("title", task.getTitle());
        event.put("date", task.getDueDate());
        event.put("priority", task.getPriority());
        event.put("projectId", task.getProject().getId());
        event.put("projectTitle", task.getProject().getTitle());
        return event;
    }

    private Map<String, Object> projectEvent(Project project) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", project.getId());
        event.put("type", "PROJECT");
        event.put("title", project.getTitle());
        event.put("date", project.getDeadline());
        event.put("priority", "MEDIUM");
        event.put("projectId", project.getId());
        event.put("projectTitle", project.getTitle());
        return event;
    }
}
