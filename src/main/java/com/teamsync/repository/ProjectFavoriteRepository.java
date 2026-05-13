package com.teamsync.repository;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.ProjectFavorite;
import com.teamsync.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProjectFavoriteRepository extends JpaRepository<ProjectFavorite, UUID> {
    Optional<ProjectFavorite> findByProjectAndUser(Project project, User user);
    boolean existsByProjectAndUser(Project project, User user);
}
