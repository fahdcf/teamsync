package com.teamsync.presentation.controller;

import com.teamsync.domain.entity.User;
import com.teamsync.presentation.dto.NotificationResponseDTO;
import com.teamsync.service.NotificationService;
import com.teamsync.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping
    public List<NotificationResponseDTO> getUnread(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        return notificationService.getUnread(user);
    }

    @PutMapping("/{id}/read")
    public NotificationResponseDTO markRead(@PathVariable UUID id) {
        return notificationService.markRead(id);
    }
}
