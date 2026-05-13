package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.ProjectFavorite;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.domain.enums.ProjectEventType;
import com.teamsync.domain.enums.ProjectStatus;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.patterns.behavioral.observer.ProjectEvent;
import com.teamsync.patterns.behavioral.observer.ProjectEventPublisher;
import com.teamsync.patterns.creational.singleton.AppLogger;
import com.teamsync.presentation.dto.ProjectRequestDTO;
import com.teamsync.presentation.dto.ProjectResponseDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.repository.ProjectFavoriteRepository;
import com.teamsync.repository.ProjectSpecification;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectFavoriteRepository projectFavoriteRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final WorkspaceService workspaceService;
    private final ProjectEventPublisher eventPublisher;
    private final ActivityLogService activityLogService;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectFavoriteRepository projectFavoriteRepository,
                          UserRepository userRepository,
                          TaskRepository taskRepository,
                          WorkspaceService workspaceService,
                          @Lazy ProjectEventPublisher eventPublisher,
                          ActivityLogService activityLogService) {
        this.projectRepository = projectRepository;
        this.projectFavoriteRepository = projectFavoriteRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.workspaceService = workspaceService;
        this.eventPublisher = eventPublisher;
        this.activityLogService = activityLogService;
    }

    public ProjectResponseDTO create(UUID workspaceId, ProjectRequestDTO request) {
        return create(workspaceId, request, null);
    }

    public ProjectResponseDTO create(UUID workspaceId, ProjectRequestDTO request, String actorEmail) {
        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        User manager = resolveManager(request.getManagerId());

        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .deadline(request.getDeadline())
                .progress(request.getProgress() != null ? request.getProgress() : 0)
                .workspace(workspace)
                .manager(manager)
                .build();

        Project saved = projectRepository.save(project);
        ProjectResponseDTO dto = toDTO(saved);
        activityLogService.log(resolveActor(actorEmail, manager), "PROJECT_CREATED", "PROJECT", saved.getId());
        AppLogger.getInstance().info("Project created: " + project.getTitle());
        return dto;
    }

    public ProjectResponseDTO update(UUID id, ProjectRequestDTO request) {
        return update(id, request, null);
    }

    public ProjectResponseDTO update(UUID id, ProjectRequestDTO request, String actorEmail) {
        Project project = getProject(id);

        project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getDeadline() != null) project.setDeadline(request.getDeadline());
        if (request.getProgress() != null) project.setProgress(request.getProgress());
        if (request.getManagerId() != null) project.setManager(resolveManager(request.getManagerId()));

        Project saved = projectRepository.save(project);
        ProjectResponseDTO dto = toDTO(saved);
        activityLogService.log(resolveActor(actorEmail, saved.getManager()), "PROJECT_UPDATED", "PROJECT", saved.getId());
        AppLogger.getInstance().info("Project updated: " + project.getTitle());
        eventPublisher.publish(new ProjectEvent(ProjectEventType.PROJECT_UPDATED, project.getTitle(), null));
        return dto;
    }

    public ProjectResponseDTO archive(UUID id) {
        return archive(id, null);
    }

    public ProjectResponseDTO archive(UUID id, String actorEmail) {
        Project project = getProject(id);
        project.setStatus(ProjectStatus.ARCHIVED);
        Project saved = projectRepository.save(project);
        activityLogService.log(resolveActor(actorEmail, saved.getManager()), "PROJECT_ARCHIVED", "PROJECT", saved.getId());
        return toDTO(saved);
    }

    public List<ProjectResponseDTO> findByWorkspace(UUID workspaceId) {
        return findByWorkspace(workspaceId, null, null, null, null, null, null, null);
    }

    public List<ProjectResponseDTO> findByWorkspace(UUID workspaceId, ProjectStatus status, String health,
                                                    UUID managerId, LocalDate dueFrom, LocalDate dueTo,
                                                    String keyword, String sort) {
        return findByWorkspace(workspaceId, status, health, managerId, dueFrom, dueTo, keyword, sort, null);
    }

    public List<ProjectResponseDTO> findByWorkspace(UUID workspaceId, ProjectStatus status, String health,
                                                    UUID managerId, LocalDate dueFrom, LocalDate dueTo,
                                                    String keyword, String sort, String userEmail) {
        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        User currentUser = resolveActor(userEmail, null);
        Specification<Project> spec = Specification.where(ProjectSpecification.hasWorkspace(workspace));
        if (status != null) spec = spec.and(ProjectSpecification.hasStatus(status));
        if (managerId != null) spec = spec.and(ProjectSpecification.hasManager(managerId));
        if (dueFrom != null) spec = spec.and(ProjectSpecification.deadlineFrom(dueFrom));
        if (dueTo != null) spec = spec.and(ProjectSpecification.deadlineTo(dueTo));
        if (keyword != null && !keyword.isBlank()) spec = spec.and(ProjectSpecification.hasKeyword(keyword));

        return projectRepository.findAll(spec, sortForWorkspaceProjects(sort)).stream()
                .map(project -> toDTO(project, currentUser))
                .filter(project -> health == null || health.isBlank() || health.equalsIgnoreCase(project.getHealth()))
                .collect(Collectors.toList());
    }

    public List<ProjectResponseDTO> search(ProjectStatus status, UUID managerId) {
        Specification<Project> spec = Specification.where(null);
        if (status != null) spec = spec.and(ProjectSpecification.hasStatus(status));
        if (managerId != null) spec = spec.and(ProjectSpecification.hasManager(managerId));
        return projectRepository.findAll(spec).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProjectResponseDTO findById(UUID id) {
        return toDTO(getProject(id));
    }

    public ProjectResponseDTO toggleFavorite(UUID id, String userEmail) {
        Project project = getProject(id);
        User user = resolveActor(userEmail, null);
        projectFavoriteRepository.findByProjectAndUser(project, user).ifPresentOrElse(
                projectFavoriteRepository::delete,
                () -> projectFavoriteRepository.save(ProjectFavorite.builder().project(project).user(user).build())
        );
        return toDTO(project, user);
    }

    public Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found: " + id));
    }

    private User resolveManager(UUID managerId) {
        if (managerId == null) return null;
        return userRepository.findById(managerId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + managerId));
    }

    private User resolveActor(String actorEmail, User fallback) {
        if (actorEmail == null || actorEmail.isBlank()) {
            return fallback;
        }
        return userRepository.findByEmail(actorEmail).orElse(fallback);
    }

    private UserResponseDTO userToDTO(User u) {
        if (u == null) return null;
        return UserResponseDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private ProjectResponseDTO toDTO(Project p) {
        return toDTO(p, null);
    }

    private ProjectResponseDTO toDTO(Project p, User currentUser) {
        String health = calculateHealth(p);
        return ProjectResponseDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .status(p.getStatus())
                .deadline(p.getDeadline())
                .progress(p.getProgress())
                .health(health)
                .insight(insightForHealth(health))
                .favorite(currentUser != null && projectFavoriteRepository.existsByProjectAndUser(p, currentUser))
                .workspaceId(p.getWorkspace().getId())
                .workspaceName(p.getWorkspace().getName())
                .manager(userToDTO(p.getManager()))
                .createdAt(p.getCreatedAt())
                .build();
    }

    private String calculateHealth(Project project) {
        List<Task> tasks = taskRepository.findByProject(project);
        long overdue = tasks.stream()
                .filter(task -> task.getDueDate() != null)
                .filter(task -> task.getDueDate().isBefore(LocalDate.now()))
                .filter(task -> task.getStatus() != TaskStatus.DONE)
                .count();

        if (project.getProgress() >= 70 && overdue == 0) {
            return "ON_TRACK";
        }
        if (project.getProgress() < 40 || overdue >= 3) {
            return "DELAYED";
        }
        return "AT_RISK";
    }

    private String insightForHealth(String health) {
        return switch (health) {
            case "ON_TRACK" -> "Components are ahead of schedule. Consider starting documentation early.";
            case "AT_RISK" -> "User testing results suggest reviewing the onboarding flow.";
            default -> "Significant delays detected. Schedule a team sync immediately.";
        };
    }

    private Sort sortForWorkspaceProjects(String sort) {
        if ("deadline".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("deadline").nullsLast());
        }
        if ("progress".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.desc("progress"));
        }
        if ("title".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("title"));
        }
        return Sort.by(Sort.Order.desc("createdAt"));
    }
}
