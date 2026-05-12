package com.teamsync.repository;

import com.teamsync.domain.entity.Subtask;
import com.teamsync.domain.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubtaskRepository extends JpaRepository<Subtask, UUID> {
    List<Subtask> findByTaskOrderByCreatedAtAsc(Task task);
}
