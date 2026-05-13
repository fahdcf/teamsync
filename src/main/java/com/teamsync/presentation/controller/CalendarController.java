package com.teamsync.presentation.controller;

import com.teamsync.service.CalendarService;
import com.teamsync.domain.enums.TaskPriority;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Calendar", description = "Calendar task and project deadline events")
@RestController
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @Operation(summary = "Get visible task and project deadline events")
    @ApiResponse(responseCode = "200", description = "Calendar events returned")
    @GetMapping("/calendar/events")
    public List<Map<String, Object>> getEvents(Authentication auth,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                               @RequestParam(required = false) UUID workspaceId,
                                               @RequestParam(required = false) UUID projectId,
                                               @RequestParam(required = false) UUID assigneeId,
                                               @RequestParam(required = false) TaskPriority priority) {
        return calendarService.getEvents(auth.getName(), from, to, workspaceId, projectId, assigneeId, priority);
    }
}
