package com.teamsync.presentation.controller;

import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.presentation.dto.TaskResponseDTO;
import com.teamsync.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/projects/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponseDTO create(@PathVariable UUID projectId,
                                   @Valid @RequestBody TaskRequestDTO request) {
        return taskService.create(projectId, request);
    }

    @GetMapping("/projects/{projectId}/tasks")
    public List<TaskResponseDTO> listByProject(@PathVariable UUID projectId,
                                                @RequestParam(required = false) TaskStatus status) {
        return taskService.findByProject(projectId, status);
    }

    @GetMapping("/tasks/{id}")
    public TaskResponseDTO getById(@PathVariable UUID id) {
        return taskService.findById(id);
    }

    @PutMapping("/tasks/{id}")
    public TaskResponseDTO update(@PathVariable UUID id,
                                   @Valid @RequestBody TaskRequestDTO request) {
        return taskService.update(id, request);
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        taskService.delete(id);
    }

    @PutMapping("/tasks/{id}/assign")
    public TaskResponseDTO assign(@PathVariable UUID id, @RequestParam UUID userId) {
        return taskService.assign(id, userId);
    }
}
