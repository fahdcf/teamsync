package com.teamsync.repository;

import com.teamsync.entity.Comment;
import com.teamsync.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByTask(Task task);
    List<Comment> findByTaskAndParentCommentIsNull(Task task);
    List<Comment> findByParentComment(Comment parentComment);
    long countByTask(Task task);
}
