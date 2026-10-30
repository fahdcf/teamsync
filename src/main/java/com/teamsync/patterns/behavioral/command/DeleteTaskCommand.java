package com.teamsync.patterns.behavioral.command;

import com.teamsync.entity.*;
import com.teamsync.enums.*;
import com.teamsync.repository.*;
import java.time.LocalDate;
import java.util.*;

/** Snapshot values rather than retaining a deleted Hibernate entity graph. */
public class DeleteTaskCommand implements TaskCommand {
    private final UUID id, projectId, assigneeId;
    private final String title, description, identifier;
    private final TaskPriority priority;
    private final TaskStatus status;
    private final Integer position;
    private final LocalDate dueDate;
    private final List<UUID> dependencies, dependents;
    private final List<SubtaskSnapshot> subtasks;
    private final List<CommentSnapshot> comments;
    private final TaskRepository tasks;
    private final CommentRepository commentRepository;
    private final ProjectRepository projects;
    private final UserRepository users;

    public DeleteTaskCommand(Task task, TaskRepository tasks, CommentRepository comments,
                             ProjectRepository projects, UserRepository users) {
        this.tasks = tasks; this.commentRepository = comments; this.projects = projects; this.users = users;
        id = task.getId(); projectId = task.getProject().getId(); assigneeId = userId(task.getAssignee());
        title = task.getTitle(); description = task.getDescription(); identifier = task.getTaskIdentifier();
        priority = task.getPriority(); status = task.getStatus(); position = task.getPosition(); dueDate = task.getDueDate();
        dependencies = task.getDependencies().stream().map(Task::getId).toList();
        dependents = tasks.findByDependenciesContaining(task).stream().map(Task::getId).toList();
        subtasks = task.getSubtasks().stream().map(s -> new SubtaskSnapshot(s.getTitle(), s.isCompleted(), userId(s.getAssignee()), s.getDueDate())).toList();
        this.comments = comments.findByTask(task).stream().map(c -> new CommentSnapshot(c.getId(), c.getContent(), c.getAuthor().getId(),
                c.getParentComment() == null ? null : c.getParentComment().getId())).toList();
    }

    public void execute() {
        Task task = tasks.findById(id).orElseThrow();
        for (Task dependent : tasks.findByDependenciesContaining(task))
            dependent.getDependencies().removeIf(t -> t.getId().equals(id));
        List<Comment> all = commentRepository.findByTask(task);
        all.forEach(c -> c.setParentComment(null));
        commentRepository.saveAllAndFlush(all);
        commentRepository.deleteAll(all);
        commentRepository.flush();
        task.getDependencies().clear();
        tasks.delete(task);
        tasks.flush();
    }

    public void undo() {
        Task restored = Task.builder().title(title).description(description).taskIdentifier(identifier)
                .priority(priority).status(status).position(position).dueDate(dueDate)
                .project(projects.findById(projectId).orElseThrow()).assignee(user(assigneeId))
                .dependencies(new HashSet<>(tasks.findAllById(dependencies))).build();
        for (SubtaskSnapshot s : subtasks) restored.getSubtasks().add(Subtask.builder().title(s.title())
                .completed(s.completed()).assignee(user(s.assignee())).dueDate(s.dueDate()).task(restored).build());
        tasks.saveAndFlush(restored);
        Map<UUID, Comment> copies = new HashMap<>();
        for (CommentSnapshot c : comments) copies.put(c.id(), commentRepository.save(Comment.builder()
                .content(c.content()).author(user(c.author())).task(restored).build()));
        for (CommentSnapshot c : comments) if (c.parent() != null) copies.get(c.id()).setParentComment(copies.get(c.parent()));
        commentRepository.saveAll(copies.values());
        for (Task dependent : tasks.findAllById(dependents)) dependent.getDependencies().add(restored);
    }

    public UUID projectId() { return projectId; }
    public UUID taskId() { return id; }
    public UUID restoredAssigneeId() { return assigneeId; }
    public List<UUID> restoredSubtaskAssignees() { return subtasks.stream().map(SubtaskSnapshot::assignee).filter(Objects::nonNull).toList(); }
    private UUID userId(User user) { return user == null ? null : user.getId(); }
    private User user(UUID id) { return id == null ? null : users.findById(id).orElse(null); }
    private record SubtaskSnapshot(String title, boolean completed, UUID assignee, LocalDate dueDate) {}
    private record CommentSnapshot(UUID id, String content, UUID author, UUID parent) {}
}
