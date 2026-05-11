package com.teamsync.repository;

import com.teamsync.domain.entity.Comment;
import com.teamsync.domain.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByTaskAndParentCommentIsNull(Task task);
    List<Comment> findByParentComment(Comment parentComment);
}
