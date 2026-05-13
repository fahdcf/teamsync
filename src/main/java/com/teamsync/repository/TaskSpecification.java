package com.teamsync.repository;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.domain.enums.TaskStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public class TaskSpecification {

    public static Specification<Task> hasProject(Project project) {
        return (root, query, cb) -> cb.equal(root.get("project"), project);
    }

    public static Specification<Task> visibleTo(User user) {
        return (root, query, cb) -> {
            query.distinct(true);
            var project = root.join("project");
            var workspace = project.join("workspace");
            var members = workspace.join("members", JoinType.LEFT);
            return cb.or(
                    cb.equal(workspace.get("owner").get("id"), user.getId()),
                    cb.equal(members.get("id"), user.getId()),
                    cb.equal(project.get("manager").get("id"), user.getId()),
                    cb.equal(root.get("assignee").get("id"), user.getId())
            );
        };
    }

    public static Specification<Task> hasProjectId(UUID projectId) {
        return (root, query, cb) -> cb.equal(root.get("project").get("id"), projectId);
    }

    public static Specification<Task> hasWorkspaceId(UUID workspaceId) {
        return (root, query, cb) -> cb.equal(root.get("project").get("workspace").get("id"), workspaceId);
    }

    public static Specification<Task> hasStatus(TaskStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Task> hasPriority(TaskPriority priority) {
        return (root, query, cb) -> cb.equal(root.get("priority"), priority);
    }

    public static Specification<Task> hasAssignee(UUID assigneeId) {
        return (root, query, cb) -> cb.equal(root.get("assignee").get("id"), assigneeId);
    }

    public static Specification<Task> hasKeyword(String keyword) {
        String pattern = "%" + keyword.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
        );
    }

    public static Specification<Task> isOverdue() {
        return (root, query, cb) -> cb.and(
                cb.lessThan(root.get("dueDate"), LocalDate.now()),
                cb.notEqual(root.get("status"), TaskStatus.DONE)
        );
    }

    public static Specification<Task> dueFrom(LocalDate dueFrom) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dueDate"), dueFrom);
    }

    public static Specification<Task> dueTo(LocalDate dueTo) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("dueDate"), dueTo);
    }
}
