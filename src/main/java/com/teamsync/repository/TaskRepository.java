package com.teamsync.repository;

import org.springframework.data.repository.query.Param;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import com.teamsync.entity.Project;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Task t where t.id = :id")
    Optional<Task> findForUpdate(@Param("id") UUID id);
    List<Task> findByProject(Project project);
    List<Task> findByAssignee(User assignee);
    long countByAssigneeAndProjectInAndStatusAndUpdatedAtBetween(User user, Set<Project> projects, TaskStatus status, LocalDateTime start, LocalDateTime end);
    long countByAssigneeAndProjectInAndUpdatedAtBetween(User user, Set<Project> projects, LocalDateTime start, LocalDateTime end);
    long countByAssigneeAndProjectInAndStatusNotAndDueDateBetween(User user, Set<Project> projects, TaskStatus status, LocalDate from, LocalDate to);
    List<Task> findByAssigneeAndStatus(User assignee, TaskStatus status);
    List<Task> findByProjectAndStatus(Project project, TaskStatus status);
    List<Task> findByDependenciesContaining(Task task);
    long countByProject(Project project);
    Task findTopByProjectOrderByPositionDesc(Project project);
    long countByAssignee(User assignee);
    long countByAssigneeAndStatus(User assignee, TaskStatus status);
    long countByAssigneeAndUpdatedAtBetween(User assignee, LocalDateTime start, LocalDateTime end);
    long countByAssigneeAndStatusAndUpdatedAtBetween(User assignee, TaskStatus status,
                                                     LocalDateTime start, LocalDateTime end);
    List<Task> findByProjectInAndStatusAndUpdatedAtBetween(Set<Project> projects, TaskStatus status,
                                                           LocalDateTime start, LocalDateTime end);
    List<Task> findByProjectInAndDueDateBetween(Set<Project> projects, LocalDate start, LocalDate end);
    long countByProjectInAndStatus(Set<Project> projects, TaskStatus status);
    long countByProjectInAndStatusNot(Set<Project> projects, TaskStatus status);
    long countByProjectInAndStatusNotAndDueDateBefore(Set<Project> projects, TaskStatus status, LocalDate date);
    List<Task> findTop5ByAssigneeAndStatusNotAndDueDateBetweenOrderByDueDateAsc(User assignee, TaskStatus status,
                                                                                 LocalDate start, LocalDate end);
    long countByAssigneeAndStatusNotAndDueDateBefore(User assignee, TaskStatus status, LocalDate date);
    long countByAssigneeAndStatusNotAndDueDateBetween(User assignee, TaskStatus status, LocalDate start, LocalDate end);
    Task findTopByProjectOrderByUpdatedAtDesc(Project project);
}
