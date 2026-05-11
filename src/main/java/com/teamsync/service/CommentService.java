package com.teamsync.service;

import com.teamsync.domain.entity.Comment;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.NotificationType;
import com.teamsync.domain.enums.ProjectEventType;
import com.teamsync.patterns.behavioral.observer.ProjectEvent;
import com.teamsync.patterns.behavioral.observer.ProjectEventPublisher;
import com.teamsync.patterns.structural.proxy.TaskService;
import com.teamsync.presentation.dto.CommentRequestDTO;
import com.teamsync.presentation.dto.CommentResponseDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.repository.CommentRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskService taskService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final ProjectEventPublisher eventPublisher;

    public CommentService(CommentRepository commentRepository,
                           TaskService taskService,
                           UserService userService,
                           NotificationService notificationService,
                           ProjectEventPublisher eventPublisher) {
        this.commentRepository = commentRepository;
        this.taskService = taskService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
    }

    public CommentResponseDTO addComment(UUID taskId, CommentRequestDTO request, String authorEmail) {
        Task task = taskService.getTask(taskId);
        User author = userService.findByEmail(authorEmail);

        Comment comment = Comment.builder()
                .content(request.getContent())
                .author(author)
                .task(task)
                .build();

        Comment saved = commentRepository.save(comment);

        eventPublisher.publish(new ProjectEvent(ProjectEventType.COMMENT_ADDED,
                "Comment on " + task.getTitle(), author));

        if (task.getAssignee() != null && !task.getAssignee().getId().equals(author.getId())) {
            notificationService.notify(task.getAssignee(),
                    author.getUsername() + " commented on task: " + task.getTitle(),
                    NotificationType.IN_APP);
        }

        return toDTO(saved);
    }

    public CommentResponseDTO addReply(UUID parentId, CommentRequestDTO request, String authorEmail) {
        Comment parent = getComment(parentId);
        User author = userService.findByEmail(authorEmail);

        Comment reply = Comment.builder()
                .content(request.getContent())
                .author(author)
                .task(parent.getTask())
                .parentComment(parent)
                .build();

        return toDTO(commentRepository.save(reply));
    }

    public void deleteComment(UUID id, String requesterEmail) {
        Comment comment = getComment(id);
        User requester = userService.findByEmail(requesterEmail);

        if (!comment.getAuthor().getId().equals(requester.getId())
                && requester.getRole() != com.teamsync.domain.enums.Role.ADMIN) {
            throw new AccessDeniedException("Only the author or ADMIN can delete a comment");
        }
        commentRepository.delete(comment);
    }

    public List<CommentResponseDTO> findByTask(UUID taskId) {
        Task task = taskService.getTask(taskId);
        return commentRepository.findByTaskAndParentCommentIsNull(task).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
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
