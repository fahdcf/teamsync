package com.teamsync.repository;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {
    List<Task> findByProject(Project project);
    List<Task> findByAssignee(User assignee);
    List<Task> findByAssigneeAndUpdatedAtBetween(User assignee, LocalDateTime start, LocalDateTime end);
    List<Task> findByProjectAndStatus(Project project, TaskStatus status);
    List<Task> findByDependenciesContaining(Task task);
    long countByProject(Project project);
    long countByAssignee(User assignee);
    long countByAssigneeAndStatus(User assignee, TaskStatus status);
    long countByAssigneeAndUpdatedAtBetween(User assignee, LocalDateTime start, LocalDateTime end);
    long countByAssigneeAndStatusAndUpdatedAtBetween(User assignee, TaskStatus status,
                                                     LocalDateTime start, LocalDateTime end);
    List<Task> findByProjectInAndStatusAndUpdatedAtBetween(Set<Project> projects, TaskStatus status,
                                                           LocalDateTime start, LocalDateTime end);
    List<Task> findTop5ByAssigneeAndStatusNotAndDueDateBetweenOrderByDueDateAsc(User assignee, TaskStatus status,
                                                                                 LocalDate start, LocalDate end);
    long countByAssigneeAndStatusNotAndDueDateBefore(User assignee, TaskStatus status, LocalDate date);
    long countByAssigneeAndStatusNotAndDueDateBetween(User assignee, TaskStatus status, LocalDate start, LocalDate end);
    Task findTopByProjectOrderByUpdatedAtDesc(Project project);
}
