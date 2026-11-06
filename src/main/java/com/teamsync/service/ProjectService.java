package com.teamsync.service;

import com.teamsync.enums.Role;
import com.teamsync.entity.Project;
import com.teamsync.entity.ProjectFavorite;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.entity.Workspace;
import com.teamsync.entity.ActivityLog;
import com.teamsync.enums.ProjectEventType;
import com.teamsync.enums.ProjectStatus;
import com.teamsync.enums.TaskStatus;
import com.teamsync.patterns.behavioral.observer.ProjectEvent;
import org.springframework.context.ApplicationEventPublisher;
import com.teamsync.patterns.creational.singleton.AppLogger;
import com.teamsync.dto.ProjectRequestDTO;
import com.teamsync.dto.ProjectResponseDTO;
import com.teamsync.dto.UserResponseDTO;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.repository.ProjectFavoriteRepository;
import com.teamsync.repository.ProjectSpecification;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.teamsync.security.ResourceAuthorization;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class ProjectService {

    private final ResourceAuthorization permissions;

    private final ProjectRepository projectRepository;
    private final ProjectFavoriteRepository projectFavoriteRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final WorkspaceService workspaceService;
    private final ApplicationEventPublisher eventPublisher;
    private final ActivityLogService activityLogService;

    public ProjectService(ResourceAuthorization permissions, ProjectRepository projectRepository,
                          ProjectFavoriteRepository projectFavoriteRepository,
                          UserRepository userRepository,
                          TaskRepository taskRepository,
                          WorkspaceService workspaceService,
                          ApplicationEventPublisher eventPublisher,
                          ActivityLogService activityLogService) {
        this.permissions = permissions;
        this.projectRepository = projectRepository;
        this.projectFavoriteRepository = projectFavoriteRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.workspaceService = workspaceService;
        this.eventPublisher = eventPublisher;
        this.activityLogService = activityLogService;
    }

    @PreAuthorize("@permissions.createProject(#workspaceId)")
    public ProjectResponseDTO create(UUID workspaceId, ProjectRequestDTO request) {
        return createProject(workspaceId, request);
    }

    private ProjectResponseDTO createProject(UUID workspaceId, ProjectRequestDTO request) {
        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        User manager = resolveManager(request.getManagerId() != null ? request.getManagerId() : permissions.currentUser().getId(), workspace);

        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .deadline(request.getDeadline())
                .progress(request.getProgress() != null ? request.getProgress() : 0)
                .workspace(workspace)
                .manager(manager)
                .build();

        Project saved = projectRepository.save(project);
        ProjectResponseDTO dto = toDTO(saved, null);
        activityLogService.log(permissions.currentUser(), "PROJECT_CREATED", "PROJECT", saved.getId());
        AppLogger.getInstance().info("Project created: " + project.getTitle());
        return dto;
    }

    @PreAuthorize("@permissions.updateProject(#id, #request)")
    public ProjectResponseDTO update(UUID id, ProjectRequestDTO request) {
        Project project = getProject(id);

        project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getDeadline() != null) project.setDeadline(request.getDeadline());
        if (request.getProgress() != null) project.setProgress(request.getProgress());
        if (request.getManagerId() != null) project.setManager(resolveManager(request.getManagerId(), project.getWorkspace()));

        Project saved = projectRepository.save(project);
        ProjectResponseDTO dto = toDTO(saved, null);
        activityLogService.log(permissions.currentUser(), "PROJECT_UPDATED", "PROJECT", saved.getId());
        AppLogger.getInstance().info("Project updated: " + project.getTitle());
        eventPublisher.publishEvent(new ProjectEvent(ProjectEventType.PROJECT_UPDATED, project.getTitle(), null));
        return dto;
    }

    @PreAuthorize("@permissions.manageProject(#id)")
    public ProjectResponseDTO archive(UUID id) {
        Project project = getProject(id);
        project.setStatus(ProjectStatus.ARCHIVED);
        Project saved = projectRepository.save(project);
        activityLogService.log(permissions.currentUser(), "PROJECT_ARCHIVED", "PROJECT", saved.getId());
        return toDTO(saved, null);
    }

    @PreAuthorize("@permissions.readWorkspace(#workspaceId)")
    public List<ProjectResponseDTO> findByWorkspace(UUID workspaceId, ProjectStatus status, String health,
                                                    UUID managerId, LocalDate dueFrom, LocalDate dueTo,
                                                    String keyword, String sort) {
        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        User currentUser = permissions.currentUser();
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

    public List<ProjectResponseDTO> search(UUID workspaceId, ProjectStatus status, UUID managerId, UUID teamMemberId,
                                           LocalDate dueFrom, LocalDate dueTo, String keyword, String sort) {
        Specification<Project> spec = Specification.where(ProjectSpecification.visibleTo(permissions.currentUser()));
        if (workspaceId != null) spec = spec.and(ProjectSpecification.hasWorkspace(workspaceService.getWorkspace(workspaceId)));
        if (status != null) spec = spec.and(ProjectSpecification.hasStatus(status));
        if (managerId != null) spec = spec.and(ProjectSpecification.hasManager(managerId));
        if (teamMemberId != null) spec = spec.and(ProjectSpecification.hasManager(teamMemberId));
        if (dueFrom != null) spec = spec.and(ProjectSpecification.deadlineFrom(dueFrom));
        if (dueTo != null) spec = spec.and(ProjectSpecification.deadlineTo(dueTo));
        if (keyword != null && !keyword.isBlank()) spec = spec.and(ProjectSpecification.hasKeyword(keyword));
        User currentUser = permissions.currentUser();
        return projectRepository.findAll(spec, sortForWorkspaceProjects(sort)).stream()
                .map(project -> toDTO(project, currentUser))
                .collect(Collectors.toList());
    }

    @PreAuthorize("@permissions.readProject(#id)")
    public ProjectResponseDTO findById(UUID id) {
        return toDTO(getProject(id), null);
    }

    @PreAuthorize("@permissions.readProject(#id)")
    public ProjectResponseDTO findById(UUID id, String userEmail) {
        return toDTO(getProject(id), permissions.currentUser());
    }

    @PreAuthorize("@permissions.readProject(#id) and @permissions.self(#userEmail)")
    public ProjectResponseDTO toggleFavorite(UUID id, String userEmail) {
        Project project = getProject(id);
        User user = permissions.currentUser();
        projectFavoriteRepository.findByProjectAndUser(project, user).ifPresentOrElse(
                projectFavoriteRepository::delete,
                () -> projectFavoriteRepository.save(ProjectFavorite.builder().project(project).user(user).build())
        );
        return toDTO(project, user);
    }

    @PreAuthorize("@permissions.readProject(#id)")
    public Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found: " + id));
    }

    @PreAuthorize("@permissions.createProject(#workspaceId)")
    public ProjectResponseDTO initializeProject(UUID workspaceId, String projectTitle, String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail).orElseThrow(() -> new IllegalArgumentException("Invalid manager"));
        ProjectRequestDTO request = new ProjectRequestDTO();
        request.setTitle(projectTitle);
        request.setManagerId(manager.getId());
        return createProject(workspaceId, request);
    }

    private User resolveManager(UUID managerId, Workspace workspace) {
        if (managerId == null) return null;
        User manager = userRepository.findById(managerId).orElseThrow(() -> new IllegalArgumentException("Invalid manager"));
        if (!permissions.participant(workspace, manager)) throw new IllegalArgumentException("Manager must belong to the workspace");
        if (manager.getRole() != Role.PROJECT_MANAGER && manager.getRole() != Role.ADMIN
                && !workspace.getOwner().getId().equals(manager.getId())) throw new IllegalArgumentException("Manager must have a management role or own the workspace");
        return manager;
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

    private ProjectResponseDTO toDTO(Project p, User currentUser) {
        String health = calculateHealth(p);
        ActivityLog latestActivity = activityLogService.findLatestForEntity("PROJECT", p.getId());
        return ProjectResponseDTO.builder()
                .id(p.getId())
                .canManage(permissions.manageProject(p.getId()))
                .canChangeManager(permissions.manageWorkspace(p.getWorkspace().getId()))
                .title(p.getTitle())
                .description(p.getDescription())
                .status(p.getStatus())
                .deadline(p.getDeadline())
                .progress(p.getProgress())
                .taskCount(taskRepository.countByProject(p))
                .health(health)
                .insight(insightForHealth(health))
                .favorite(currentUser != null && projectFavoriteRepository.existsByProjectAndUser(p, currentUser))
                .workspaceId(p.getWorkspace().getId())
                .workspaceName(p.getWorkspace().getName())
                .manager(userToDTO(p.getManager()))
                .lastActivityAction(latestActivity != null ? latestActivity.getAction() : null)
                .lastActivityAt(latestActivity != null ? latestActivity.getCreatedAt() : null)
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
