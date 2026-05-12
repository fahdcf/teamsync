package com.teamsync.service;

import com.teamsync.domain.entity.Project;
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
import com.teamsync.repository.ProjectSpecification;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final WorkspaceService workspaceService;
    private final ProjectEventPublisher eventPublisher;

    public ProjectService(ProjectRepository projectRepository,
                          UserRepository userRepository,
                          TaskRepository taskRepository,
                          WorkspaceService workspaceService,
                          @Lazy ProjectEventPublisher eventPublisher) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.workspaceService = workspaceService;
        this.eventPublisher = eventPublisher;
    }

    public ProjectResponseDTO create(UUID workspaceId, ProjectRequestDTO request) {
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

        ProjectResponseDTO dto = toDTO(projectRepository.save(project));
        AppLogger.getInstance().info("Project created: " + project.getTitle());
        return dto;
    }

    public ProjectResponseDTO update(UUID id, ProjectRequestDTO request) {
        Project project = getProject(id);

        project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getDeadline() != null) project.setDeadline(request.getDeadline());
        if (request.getProgress() != null) project.setProgress(request.getProgress());
        if (request.getManagerId() != null) project.setManager(resolveManager(request.getManagerId()));

        ProjectResponseDTO dto = toDTO(projectRepository.save(project));
        AppLogger.getInstance().info("Project updated: " + project.getTitle());
        eventPublisher.publish(new ProjectEvent(ProjectEventType.PROJECT_UPDATED, project.getTitle(), null));
        return dto;
    }

    public ProjectResponseDTO archive(UUID id) {
        Project project = getProject(id);
        project.setStatus(ProjectStatus.ARCHIVED);
        return toDTO(projectRepository.save(project));
    }

    public List<ProjectResponseDTO> findByWorkspace(UUID workspaceId) {
        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        return projectRepository.findByWorkspace(workspace).stream()
                .map(this::toDTO)
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

    public Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found: " + id));
    }

    private User resolveManager(UUID managerId) {
        if (managerId == null) return null;
        return userRepository.findById(managerId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + managerId));
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
                .workspaceId(p.getWorkspace().getId())
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
}
