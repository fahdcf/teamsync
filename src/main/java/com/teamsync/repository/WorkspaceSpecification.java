package com.teamsync.repository;

import com.teamsync.domain.entity.Workspace;
import org.springframework.data.jpa.domain.Specification;

public class WorkspaceSpecification {

    public static Specification<Workspace> hasKeyword(String keyword) {
        String pattern = "%" + keyword.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
        );
    }
}
