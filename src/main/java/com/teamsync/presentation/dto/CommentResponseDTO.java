package com.teamsync.presentation.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {
    private UUID id;
    private String content;
    private UserResponseDTO author;
    private UUID taskId;
    private UUID parentCommentId;
    private List<CommentResponseDTO> replies;
    private LocalDateTime createdAt;
}
