package com.teamsync.presentation.controller;

import com.teamsync.domain.entity.User;
import com.teamsync.presentation.dto.NotificationResponseDTO;
import com.teamsync.service.NotificationService;
import com.teamsync.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Notifications", description = "In-app notification management")
@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @Operation(summary = "Get current user's unread notifications")
    @ApiResponse(responseCode = "200", description = "Unread notifications returned")
    @GetMapping
    public List<NotificationResponseDTO> getUnread(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        return notificationService.getUnread(user);
    }

    @Operation(summary = "Mark a notification as read")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Notification marked as read"),
        @ApiResponse(responseCode = "404", description = "Notification not found")
    })
    @PutMapping("/{id}/read")
    public NotificationResponseDTO markRead(@PathVariable UUID id) {
        return notificationService.markRead(id);
    }
}
