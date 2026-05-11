package com.teamsync.repository;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.enums.ProjectStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class ProjectSpecification {

    public static Specification<Project> hasStatus(ProjectStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Project> hasManager(UUID managerId) {
        return (root, query, cb) -> cb.equal(root.get("manager").get("id"), managerId);
    }
}
