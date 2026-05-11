package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.CommentRequestDTO;
import com.teamsync.presentation.dto.CommentResponseDTO;
import com.teamsync.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/tasks/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponseDTO addComment(@PathVariable UUID id,
                                          @Valid @RequestBody CommentRequestDTO request,
                                          Authentication auth) {
        return commentService.addComment(id, request, auth.getName());
    }

    @GetMapping("/tasks/{id}/comments")
    public List<CommentResponseDTO> listComments(@PathVariable UUID id) {
        return commentService.findByTask(id);
    }

    @PostMapping("/comments/{id}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponseDTO addReply(@PathVariable UUID id,
                                        @Valid @RequestBody CommentRequestDTO request,
                                        Authentication auth) {
        return commentService.addReply(id, request, auth.getName());
    }

    @DeleteMapping("/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable UUID id, Authentication auth) {
        commentService.deleteComment(id, auth.getName());
    }
}
