package com.teamsync.repository;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.domain.enums.ProjectStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public class ProjectSpecification {

    public static Specification<Project> hasWorkspace(Workspace workspace) {
        return (root, query, cb) -> cb.equal(root.get("workspace"), workspace);
    }

    public static Specification<Project> hasStatus(ProjectStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Project> hasManager(UUID managerId) {
        return (root, query, cb) -> cb.equal(root.get("manager").get("id"), managerId);
    }

    public static Specification<Project> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            String value = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), value),
                    cb.like(cb.lower(root.get("description")), value)
            );
        };
    }

    public static Specification<Project> deadlineFrom(LocalDate from) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("deadline"), from);
    }

    public static Specification<Project> deadlineTo(LocalDate to) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("deadline"), to);
    }
}
