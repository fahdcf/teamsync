package com.teamsync.repository;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID>, JpaSpecificationExecutor<Project> {
    List<Project> findByWorkspace(Workspace workspace);
    List<Project> findByWorkspaceIn(Set<Workspace> workspaces);
    List<Project> findByWorkspaceInAndDeadlineBetween(Set<Workspace> workspaces, LocalDate start, LocalDate end);
    List<Project> findByManager(User manager);
}
