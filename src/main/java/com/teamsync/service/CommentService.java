package com.teamsync.service;

import com.teamsync.entity.Comment;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.enums.NotificationType;
import com.teamsync.enums.ProjectEventType;
import com.teamsync.patterns.behavioral.observer.ProjectEvent;
import org.springframework.context.ApplicationEventPublisher;
import com.teamsync.dto.CommentRequestDTO;
import com.teamsync.dto.CommentResponseDTO;
import com.teamsync.dto.UserResponseDTO;
import com.teamsync.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class CommentService {

    private final CommentRepository commentRepository;
    private final ActivityLogService activityLogService;
    private final TaskService taskService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;

    public CommentService(CommentRepository commentRepository, ActivityLogService activityLogService,
                           TaskService taskService,
                           UserService userService,
                           NotificationService notificationService,
                           ApplicationEventPublisher eventPublisher) {
        this.commentRepository = commentRepository;
        this.activityLogService = activityLogService;
        this.taskService = taskService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
    }

    @PreAuthorize("@permissions.readTask(#taskId) and @permissions.self(#authorEmail)")
    public CommentResponseDTO addComment(UUID taskId, CommentRequestDTO request, String authorEmail) {
        Task task = taskService.getTask(taskId);
        User author = userService.findByEmail(authorEmail);

        Comment comment = Comment.builder()
                .content(request.getContent())
                .author(author)
                .task(task)
                .build();

        Comment saved = commentRepository.save(comment);
        activityLogService.log(author, "COMMENT_ADDED", "TASK", task.getId());

        eventPublisher.publishEvent(new ProjectEvent(ProjectEventType.COMMENT_ADDED,
                "Comment on " + task.getTitle(), author));

        if (task.getAssignee() != null && !task.getAssignee().getId().equals(author.getId())) {
            notificationService.notify(task.getAssignee(),
                    author.getUsername() + " commented on task: " + task.getTitle(),
                    NotificationType.IN_APP);
        }

        return toDTO(saved);
    }

    @PreAuthorize("@permissions.readComment(#parentId) and @permissions.self(#authorEmail)")
    public CommentResponseDTO addReply(UUID parentId, CommentRequestDTO request, String authorEmail) {
        Comment parent = getComment(parentId);
        User author = userService.findByEmail(authorEmail);

        Comment reply = Comment.builder()
                .content(request.getContent())
                .author(author)
                .task(parent.getTask())
                .parentComment(parent)
                .build();

        activityLogService.log(author, "COMMENT_ADDED", "TASK", parent.getTask().getId());
        return toDTO(commentRepository.save(reply));
    }

    @PreAuthorize("@permissions.deleteComment(#id) and @permissions.self(#requesterEmail)")
    public void deleteComment(UUID id, String requesterEmail) {
        Comment comment = getComment(id);
        deleteTree(comment);
    }

    @PreAuthorize("@permissions.readTask(#taskId)")
    public List<CommentResponseDTO> findByTask(UUID taskId) {
        Task task = taskService.getTask(taskId);
        return commentRepository.findByTaskAndParentCommentIsNull(task).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private void deleteTree(Comment comment) {
        commentRepository.findByParentComment(comment).forEach(this::deleteTree);
        commentRepository.delete(comment);
        commentRepository.flush();
    }

    private Comment getComment(UUID id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Comment not found: " + id));
    }

    private UserResponseDTO userToDTO(User u) {
        return UserResponseDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private CommentResponseDTO toDTO(Comment c) {
        List<CommentResponseDTO> replies = commentRepository.findByParentComment(c).stream()
                .map(r -> CommentResponseDTO.builder()
                        .id(r.getId())
                        .content(r.getContent())
                        .author(userToDTO(r.getAuthor()))
                        .taskId(r.getTask().getId())
                        .parentCommentId(c.getId())
                        .replies(List.of())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return CommentResponseDTO.builder()
                .id(c.getId())
                .content(c.getContent())
                .author(userToDTO(c.getAuthor()))
                .taskId(c.getTask().getId())
                .parentCommentId(c.getParentComment() != null ? c.getParentComment().getId() : null)
                .replies(replies)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
