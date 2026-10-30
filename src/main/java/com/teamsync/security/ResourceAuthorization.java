package com.teamsync.security;

import com.teamsync.dto.ProjectRequestDTO;
import com.teamsync.dto.UpdateProfileRequestDTO;
import com.teamsync.patterns.behavioral.command.DeleteTaskCommand;
import com.teamsync.patterns.behavioral.command.ChangeStatusCommand;
import com.teamsync.patterns.behavioral.command.TaskCommand;
import com.teamsync.entity.*;
import com.teamsync.enums.Role;
import com.teamsync.exception.EntityNotFoundException;
import com.teamsync.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/** Database-backed resource policy used by service @PreAuthorize annotations. */
@Component("permissions")
@Transactional(readOnly = true)
public class ResourceAuthorization {
    private final UserRepository users;
    private final WorkspaceRepository workspaces;
    private final ProjectRepository projects;
    private final TaskRepository tasks;
    private final CommentRepository comments;
    private final NotificationRepository notifications;
    private final TaskTemplateRepository templates;

    public ResourceAuthorization(UserRepository users, WorkspaceRepository workspaces, ProjectRepository projects,
                                 TaskRepository tasks, CommentRepository comments, NotificationRepository notifications,
                                 TaskTemplateRepository templates) {
        this.users = users; this.workspaces = workspaces; this.projects = projects; this.tasks = tasks;
        this.comments = comments; this.notifications = notifications; this.templates = templates;
    }

    public User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new AccessDeniedException("Access denied");
        return users.findByEmail(auth.getName()).orElseThrow(() -> new AccessDeniedException("Access denied"));
    }

    public boolean self(String email) { return currentUser().getEmail().equals(email); }
    public boolean selfId(UUID id) { return currentUser().getId().equals(id); }
    public boolean admin() { return currentUser().getRole() == Role.ADMIN; }

    public boolean participant(Workspace workspace, User user) {
        return workspace.getOwner().getId().equals(user.getId())
                || workspace.getMembers().stream().anyMatch(member -> member.getId().equals(user.getId()));
    }

    private Workspace workspace(UUID id) {
        return workspaces.findById(id).orElseThrow(() -> new EntityNotFoundException("Resource not found"));
    }

    public boolean readWorkspace(UUID id) {
        Workspace workspace = workspace(id);
        if (!admin() && !participant(workspace, currentUser())) throw new EntityNotFoundException("Resource not found");
        return true;
    }

    public boolean manageWorkspace(UUID id) {
        readWorkspace(id);
        return admin() || workspace(id).getOwner().getId().equals(currentUser().getId());
    }

    public boolean createProject(UUID workspaceId) {
        readWorkspace(workspaceId);
        return manageWorkspace(workspaceId) || currentUser().getRole() == Role.PROJECT_MANAGER;
    }

    public boolean readProject(UUID id) {
        Project project = projects.findById(id).orElseThrow(() -> new EntityNotFoundException("Resource not found"));
        return readWorkspace(project.getWorkspace().getId());
    }

    public boolean manageProject(UUID id) {
        readProject(id);
        Project project = projects.findById(id).orElseThrow();
        User user = currentUser();
        return manageWorkspace(project.getWorkspace().getId())
                || user.getRole() == Role.PROJECT_MANAGER && project.getManager() != null
                && project.getManager().getId().equals(user.getId());
    }

    public boolean updateProject(UUID id, ProjectRequestDTO request) {
        if (!manageProject(id)) return false;
        Project project = projects.findById(id).orElseThrow();
        boolean changesManager = request.getManagerId() != null
                && (project.getManager() == null || !request.getManagerId().equals(project.getManager().getId()));
        return !changesManager || manageWorkspace(project.getWorkspace().getId());
    }

    public boolean profileRoleUnchanged(UpdateProfileRequestDTO request) {
        return request.getRole() == null || request.getRole() == currentUser().getRole();
    }

    public boolean readTask(UUID id) {
        Task task = tasks.findById(id).orElseThrow(() -> new EntityNotFoundException("Resource not found"));
        return readProject(task.getProject().getId());
    }

    public boolean manageTask(UUID id) {
        readTask(id);
        return manageProject(tasks.findById(id).orElseThrow().getProject().getId());
    }

    public boolean workOnTask(UUID id) {
        readTask(id);
        Task task = tasks.findById(id).orElseThrow();
        return manageProject(task.getProject().getId())
                || task.getAssignee() != null && task.getAssignee().getId().equals(currentUser().getId());
    }

    public boolean readComment(UUID id) {
        Comment comment = comments.findById(id).orElseThrow(() -> new EntityNotFoundException("Resource not found"));
        return readTask(comment.getTask().getId());
    }

    public boolean deleteComment(UUID id) {
        readComment(id);
        return admin() || comments.findById(id).orElseThrow().getAuthor().getId().equals(currentUser().getId());
    }

    public boolean ownNotification(UUID id) {
        Notification notification = notifications.findById(id).orElseThrow(() -> new EntityNotFoundException("Resource not found"));
        if (!notification.getRecipient().getId().equals(currentUser().getId())) throw new EntityNotFoundException("Resource not found");
        return true;
    }

    public boolean readTemplate(UUID id) {
        TaskTemplate template = templates.findById(id).orElseThrow(() -> new EntityNotFoundException("Resource not found"));
        return readProject(template.getProjectId());
    }

    public boolean undoCommand(TaskCommand command) {
        boolean allowed = command instanceof ChangeStatusCommand
                ? workOnTask(command.taskId()) : manageProject(command.projectId());
        if (allowed && command.restoredAssigneeId() != null)
            validateAssignee(projects.findById(command.projectId()).orElseThrow(), command.restoredAssigneeId());
        if (allowed && command instanceof DeleteTaskCommand deletion)
            deletion.restoredSubtaskAssignees().forEach(id -> validateAssignee(projects.findById(command.projectId()).orElseThrow(), id));
        return allowed;
    }

    /** Assignment eligibility is a data invariant, independent of administrative privileges. */
    public void validateAssignee(Project project, UUID assigneeId) {
        if (assigneeId == null) return;
        User assignee = users.findById(assigneeId).orElseThrow(() -> new IllegalArgumentException("Invalid assignee"));
        if (!participant(project.getWorkspace(), assignee)) throw new IllegalArgumentException("Assignee must belong to the workspace");
    }
}
