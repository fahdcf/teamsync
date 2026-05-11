package com.teamsync.presentation.controller;

import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.patterns.creational.prototype.TaskTemplate;
import com.teamsync.patterns.creational.prototype.TaskTemplateService;
import com.teamsync.presentation.dto.AddDependencyRequestDTO;
import com.teamsync.presentation.dto.AutoAssignRequestDTO;
import com.teamsync.presentation.dto.SaveTemplateRequestDTO;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.presentation.dto.TaskResponseDTO;
import com.teamsync.presentation.dto.TaskStatusUpdateDTO;
import com.teamsync.service.TaskDependencyService;
import com.teamsync.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class TaskController {

    private final TaskService taskService;
    private final TaskDependencyService dependencyService;
    private final TaskTemplateService templateService;

    public TaskController(TaskService taskService, TaskDependencyService dependencyService,
                           TaskTemplateService templateService) {
        this.taskService = taskService;
        this.dependencyService = dependencyService;
        this.templateService = templateService;
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

    @PutMapping("/tasks/{id}/status")
    public TaskResponseDTO changeStatus(@PathVariable UUID id,
                                         @Valid @RequestBody TaskStatusUpdateDTO request) {
        return taskService.changeStatus(id, request.getStatus());
    }

    @PostMapping("/tasks/{id}/dependencies")
    @ResponseStatus(HttpStatus.CREATED)
    public void addDependency(@PathVariable UUID id,
                               @Valid @RequestBody AddDependencyRequestDTO request) {
        dependencyService.addDependency(id, request.getDependsOnTaskId());
    }

    @DeleteMapping("/tasks/{id}/dependencies/{depId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDependency(@PathVariable UUID id, @PathVariable UUID depId) {
        dependencyService.removeDependency(id, depId);
    }

    @GetMapping("/projects/{id}/tasks/blocked")
    public List<TaskResponseDTO> getBlockedTasks(@PathVariable UUID id) {
        return dependencyService.getBlockedTasks(id).stream()
                .map(taskService::toDTO)
                .toList();
    }

    @PostMapping("/projects/{projectId}/tasks/auto-assign")
    public TaskResponseDTO autoAssign(@PathVariable UUID projectId,
                                       @RequestParam(defaultValue = "workload") String strategy,
                                       @Valid @RequestBody AutoAssignRequestDTO request) {
        return taskService.autoAssign(projectId, request.getTaskId(), strategy);
    }

    @PostMapping("/projects/{id}/templates")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskTemplate saveTemplate(@PathVariable UUID id,
                                      @Valid @RequestBody SaveTemplateRequestDTO request) {
        return templateService.saveTemplate(id, request.getTemplateName(), request.getTitle(),
                request.getDescription(), request.getPriority(), request.getDefaultDueDays());
    }

    @GetMapping("/projects/{id}/templates")
    public List<TaskTemplate> listTemplates(@PathVariable UUID id) {
        return templateService.listTemplates(id);
    }

    @PostMapping("/tasks/from-template/{templateId}")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponseDTO createFromTemplate(@PathVariable UUID templateId,
                                               @RequestParam UUID projectId) {
        return templateService.createFromTemplate(projectId, templateId);
    }
}
