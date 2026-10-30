package com.teamsync.repository;

import com.teamsync.entity.Project;
import com.teamsync.entity.ProjectFavorite;
import com.teamsync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProjectFavoriteRepository extends JpaRepository<ProjectFavorite, UUID> {
    Optional<ProjectFavorite> findByProjectAndUser(Project project, User user);
    boolean existsByProjectAndUser(Project project, User user);
}
