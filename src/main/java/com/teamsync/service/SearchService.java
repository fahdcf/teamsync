package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.presentation.dto.SearchResultResponseDTO;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
import com.teamsync.repository.WorkspaceRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class SearchService {

    private static final int LIMIT_PER_TYPE = 6;

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public SearchService(UserRepository userRepository,
                         WorkspaceRepository workspaceRepository,
                         ProjectRepository projectRepository,
                         TaskRepository taskRepository) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<SearchResultResponseDTO> search(String email, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        String needle = keyword.trim().toLowerCase(Locale.ROOT);
        List<Workspace> workspaces = visibleWorkspaces(currentUser);
        List<Project> projects = workspaces.stream()
                .flatMap(workspace -> projectRepository.findByWorkspace(workspace).stream())
                .toList();
        List<Task> tasks = projects.stream()
                .flatMap(project -> taskRepository.findByProject(project).stream())
                .toList();
        List<User> users = visibleUsers(workspaces);

        List<SearchResultResponseDTO> results = new ArrayList<>();
        workspaces.stream()
                .filter(workspace -> matches(needle, workspace.getName(), workspace.getDescription()))
                .limit(LIMIT_PER_TYPE)
                .map(this::workspaceResult)
                .forEach(results::add);
        projects.stream()
                .filter(project -> matches(needle, project.getTitle(), project.getDescription()))
                .limit(LIMIT_PER_TYPE)
                .map(this::projectResult)
                .forEach(results::add);
        tasks.stream()
                .filter(task -> matches(needle, task.getTitle(), task.getDescription(), task.getTaskIdentifier()))
                .limit(LIMIT_PER_TYPE)
                .map(this::taskResult)
                .forEach(results::add);
        users.stream()
                .filter(user -> matches(needle, user.getUsername(), user.getEmail()))
                .limit(LIMIT_PER_TYPE)
                .map(this::userResult)
                .forEach(results::add);

        return results;
    }

    private List<Workspace> visibleWorkspaces(User user) {
        Map<UUID, Workspace> visible = new LinkedHashMap<>();
        Stream.concat(
                workspaceRepository.findByOwner(user).stream(),
                workspaceRepository.findByMembersContaining(user).stream()
        ).forEach(workspace -> visible.put(workspace.getId(), workspace));
        return new ArrayList<>(visible.values());
    }

    private List<User> visibleUsers(List<Workspace> workspaces) {
        Map<UUID, User> visible = new LinkedHashMap<>();
        workspaces.forEach(workspace -> {
            visible.put(workspace.getOwner().getId(), workspace.getOwner());
            workspace.getMembers().forEach(member -> visible.put(member.getId(), member));
        });
        return new ArrayList<>(visible.values());
    }

    private boolean matches(String needle, String... values) {
        for (String value : values) {
            if (value != null && value.toLowerCase(Locale.ROOT).contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private SearchResultResponseDTO workspaceResult(Workspace workspace) {
        return SearchResultResponseDTO.builder()
                .id(workspace.getId())
                .type("WORKSPACE")
                .title(workspace.getName())
                .subtitle("Workspace")
                .route("/workspaces/" + workspace.getId())
                .workspaceId(workspace.getId())
                .build();
    }

    private SearchResultResponseDTO projectResult(Project project) {
        return SearchResultResponseDTO.builder()
                .id(project.getId())
                .type("PROJECT")
                .title(project.getTitle())
                .subtitle(project.getWorkspace().getName())
                .route("/projects/" + project.getId())
                .workspaceId(project.getWorkspace().getId())
                .projectId(project.getId())
                .build();
    }

    private SearchResultResponseDTO taskResult(Task task) {
        return SearchResultResponseDTO.builder()
                .id(task.getId())
                .type("TASK")
                .title(task.getTitle())
                .subtitle(task.getProject().getTitle())
                .route("/tasks/" + task.getId())
                .workspaceId(task.getProject().getWorkspace().getId())
                .projectId(task.getProject().getId())
                .build();
    }

    private SearchResultResponseDTO userResult(User user) {
        return SearchResultResponseDTO.builder()
                .id(user.getId())
                .type("USER")
                .title(user.getUsername())
                .subtitle(user.getEmail())
                .route("/settings")
                .build();
    }
}
