package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.patterns.creational.singleton.AppLogger;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.presentation.dto.WorkspaceRequestDTO;
import com.teamsync.presentation.dto.WorkspaceResponseDTO;
import com.teamsync.presentation.dto.WorkspaceSummaryResponseDTO;
import com.teamsync.repository.ProjectRepository;
import com.teamsync.repository.TaskRepository;
import com.teamsync.repository.UserRepository;
import com.teamsync.repository.WorkspaceRepository;
import com.teamsync.repository.WorkspaceSpecification;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ActivityLogService activityLogService;

    public WorkspaceService(WorkspaceRepository workspaceRepository,
                            UserRepository userRepository,
                            ProjectRepository projectRepository,
                            TaskRepository taskRepository,
                            ActivityLogService activityLogService) {
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.activityLogService = activityLogService;
    }

    public WorkspaceResponseDTO create(WorkspaceRequestDTO request, String ownerEmail) {
        User owner = findUserByEmail(ownerEmail);
        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();
        Workspace saved = workspaceRepository.save(workspace);
        WorkspaceResponseDTO dto = toDTO(saved);
        activityLogService.log(owner, "WORKSPACE_CREATED", "WORKSPACE", saved.getId());
        AppLogger.getInstance().info("Workspace created: " + workspace.getName());
        return dto;
    }

    public WorkspaceResponseDTO findById(UUID id) {
        return toDTO(getWorkspace(id));
    }

    public WorkspaceResponseDTO update(UUID workspaceId, WorkspaceRequestDTO request, String requesterEmail) {
        Workspace workspace = getWorkspace(workspaceId);
        requireOwner(workspace, requesterEmail);
        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());
        Workspace saved = workspaceRepository.save(workspace);
        activityLogService.log(findUserByEmail(requesterEmail), "WORKSPACE_UPDATED", "WORKSPACE", saved.getId());
        return toDTO(saved);
    }

    public WorkspaceSummaryResponseDTO getSummary(UUID workspaceId) {
        Workspace workspace = getWorkspace(workspaceId);
        List<Project> projects = projectRepository.findByWorkspace(workspace);
        Set<Project> projectSet = new LinkedHashSet<>(projects);
        long activeTaskCount = projectSet.isEmpty()
                ? 0
                : taskRepository.countByProjectInAndStatusNot(projectSet, TaskStatus.DONE);
        long completedTaskCount = projectSet.isEmpty()
                ? 0
                : taskRepository.countByProjectInAndStatus(projectSet, TaskStatus.DONE);
        long overdueCount = projectSet.isEmpty()
                ? 0
                : taskRepository.countByProjectInAndStatusNotAndDueDateBefore(projectSet, TaskStatus.DONE, LocalDate.now());
        int averageProgress = projects.isEmpty()
                ? 0
                : (int) Math.round(projects.stream().mapToInt(Project::getProgress).average().orElse(0));
        HealthBuckets healthBuckets = calculateHealthBuckets(projects);
        long recentActivityCount = activityLogService.findWorkspaceActivityDTOs(workspaceId).stream()
                .filter(activity -> activity.getCreatedAt() != null)
                .filter(activity -> activity.getCreatedAt().isAfter(LocalDateTime.now().minusDays(14)))
                .count();

        return WorkspaceSummaryResponseDTO.builder()
                .projectCount(projects.size())
                .activeTaskCount(activeTaskCount)
                .completedTaskCount(completedTaskCount)
                .overdueCount(overdueCount)
                .averageProgress(averageProgress)
                .onTrackCount(healthBuckets.onTrack())
                .atRiskCount(healthBuckets.atRisk())
                .overdueProjectCount(healthBuckets.overdue())
                .activityLevel(levelFromCount(recentActivityCount, 8, 3))
                .engagementLevel(levelFromCount(memberCount(workspace) + activeTaskCount, 8, 3))
                .progressStatus(progressStatus(projects.size(), averageProgress, overdueCount))
                .build();
    }

    public List<WorkspaceResponseDTO> getMyWorkspaces(String email, String keyword) {
        User user = findUserByEmail(email);
        List<Workspace> owned = workspaceRepository.findByOwner(user);
        List<Workspace> member = workspaceRepository.findByMembersContaining(user);
        Set<UUID> myIds = Stream.concat(owned.stream(), member.stream())
                .map(Workspace::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (keyword == null || keyword.isBlank()) {
            return Stream.concat(owned.stream(), member.stream())
                    .distinct()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }

        Specification<Workspace> inMyIds = (root, query, cb) -> root.get("id").in(myIds);
        Specification<Workspace> spec = Specification.where(inMyIds)
                .and(WorkspaceSpecification.hasKeyword(keyword));
        return workspaceRepository.findAll(spec).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public WorkspaceResponseDTO addMember(UUID workspaceId, String memberEmail, String requesterEmail) {
        Workspace workspace = getWorkspace(workspaceId);
        User member = findUserByEmail(memberEmail);
        workspace.getMembers().add(member);
        Workspace saved = workspaceRepository.save(workspace);
        activityLogService.log(findUserByEmail(requesterEmail), "WORKSPACE_MEMBER_ADDED", "WORKSPACE", saved.getId());
        return toDTO(saved);
    }

    public void removeMember(UUID workspaceId, UUID userId, String requesterEmail) {
        Workspace workspace = getWorkspace(workspaceId);
        workspace.getMembers().removeIf(u -> u.getId().equals(userId));
        workspaceRepository.save(workspace);
        activityLogService.log(findUserByEmail(requesterEmail), "WORKSPACE_MEMBER_REMOVED", "WORKSPACE", workspace.getId());
    }

    public Workspace getWorkspace(UUID id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Workspace not found: " + id));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private void requireOwner(Workspace workspace, String requesterEmail) {
        if (workspace.getOwner() == null || !workspace.getOwner().getEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("Only the workspace owner can update this workspace");
        }
    }

    private UserResponseDTO userToDTO(User u) {
        return UserResponseDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private WorkspaceResponseDTO toDTO(Workspace w) {
        return WorkspaceResponseDTO.builder()
                .id(w.getId())
                .name(w.getName())
                .description(w.getDescription())
                .owner(userToDTO(w.getOwner()))
                .members(new ArrayList<>(w.getMembers().stream().map(this::userToDTO).collect(Collectors.toList())))
                .createdAt(w.getCreatedAt())
                .build();
    }

    private HealthBuckets calculateHealthBuckets(List<Project> projects) {
        long onTrack = 0;
        long atRisk = 0;
        long overdue = 0;
        LocalDate today = LocalDate.now();

        for (Project project : projects) {
            long overdueTasks = taskRepository.findByProject(project).stream()
                    .filter(task -> task.getDueDate() != null)
                    .filter(task -> task.getDueDate().isBefore(today))
                    .filter(task -> task.getStatus() != TaskStatus.DONE)
                    .count();
            boolean projectOverdue = overdueTasks > 0
                    || (project.getDeadline() != null && project.getDeadline().isBefore(today) && project.getProgress() < 100);

            if (projectOverdue || project.getProgress() < 40) {
                overdue++;
            } else if (project.getProgress() >= 70) {
                onTrack++;
            } else {
                atRisk++;
            }
        }

        return new HealthBuckets(onTrack, atRisk, overdue);
    }

    private long memberCount(Workspace workspace) {
        Set<UUID> memberIds = new LinkedHashSet<>(workspace.getMembers().stream().map(User::getId).toList());
        if (workspace.getOwner() != null) {
            memberIds.add(workspace.getOwner().getId());
        }
        return memberIds.size();
    }

    private String levelFromCount(long count, long highThreshold, long mediumThreshold) {
        if (count >= highThreshold) return "High";
        if (count >= mediumThreshold) return "Medium";
        return "Low";
    }

    private String progressStatus(long projectCount, int averageProgress, long overdueCount) {
        if (projectCount == 0) return "No data";
        if (overdueCount > 0 || averageProgress < 40) return "At risk";
        if (averageProgress >= 70) return "On track";
        return "Steady";
    }

    private record HealthBuckets(long onTrack, long atRisk, long overdue) {}
}
