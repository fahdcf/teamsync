package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.CommentRequestDTO;
import com.teamsync.presentation.dto.CommentResponseDTO;
import com.teamsync.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Comments", description = "Threaded comments on tasks")
@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @Operation(summary = "Add a comment to a task")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Comment added"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PostMapping("/tasks/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponseDTO addComment(@PathVariable UUID id,
                                          @Valid @RequestBody CommentRequestDTO request,
                                          Authentication auth) {
        return commentService.addComment(id, request, auth.getName());
    }

    @Operation(summary = "List comments for a task with nested replies")
    @ApiResponse(responseCode = "200", description = "Comment list returned")
    @GetMapping("/tasks/{id}/comments")
    public List<CommentResponseDTO> listComments(@PathVariable UUID id) {
        return commentService.findByTask(id);
    }

    @Operation(summary = "Reply to an existing comment")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Reply added"),
        @ApiResponse(responseCode = "404", description = "Parent comment not found")
    })
    @PostMapping("/comments/{id}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponseDTO addReply(@PathVariable UUID id,
                                        @Valid @RequestBody CommentRequestDTO request,
                                        Authentication auth) {
        return commentService.addReply(id, request, auth.getName());
    }

    @Operation(summary = "Delete a comment (author or ADMIN only)")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Comment deleted"),
        @ApiResponse(responseCode = "403", description = "Not the author or ADMIN")
    })
    @DeleteMapping("/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable UUID id, Authentication auth) {
        commentService.deleteComment(id, auth.getName());
    }
}
