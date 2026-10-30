package com.teamsync.repository;

import com.teamsync.entity.User;
import com.teamsync.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID>, JpaSpecificationExecutor<Workspace> {
    List<Workspace> findByOwner(User owner);
    List<Workspace> findByMembersContaining(User member);
}
