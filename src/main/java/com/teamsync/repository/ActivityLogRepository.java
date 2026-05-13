package com.teamsync.repository;

import com.teamsync.domain.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findByEntityId(UUID entityId);
    List<ActivityLog> findTop50ByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);
    List<ActivityLog> findTop50ByEntityTypeAndEntityIdInOrderByCreatedAtDesc(String entityType, Collection<UUID> entityIds);
    List<ActivityLog> findTop50ByOrderByCreatedAtDesc();
    List<ActivityLog> findTop50ByUserEmailOrderByCreatedAtDesc(String email);
}
