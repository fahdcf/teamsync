package com.teamsync.repository;

import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
    List<Workspace> findByOwner(User owner);
    List<Workspace> findByMembersContaining(User member);
}
