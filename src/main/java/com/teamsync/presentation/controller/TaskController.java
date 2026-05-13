package com.teamsync.presentation.controller;

import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.patterns.creational.prototype.TaskTemplate;
import com.teamsync.patterns.creational.prototype.TaskTemplateService;
import com.teamsync.presentation.dto.AddDependencyRequestDTO;
import com.teamsync.presentation.dto.AssignTaskRequestDTO;
import com.teamsync.presentation.dto.AutoAssignRequestDTO;
import com.teamsync.presentation.dto.SaveTemplateRequestDTO;
import com.teamsync.presentation.dto.SubtaskRequestDTO;
import com.teamsync.presentation.dto.SubtaskResponseDTO;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.presentation.dto.TaskResponseDTO;
import com.teamsync.presentation.dto.TaskStatusUpdateDTO;
import com.teamsync.patterns.structural.proxy.TaskService;
import com.teamsync.service.TaskDependencyService;
import com.teamsync.service.SubtaskService;
import com.teamsync.service.UserService;
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

@Tag(name = "Tasks", description = "Task lifecycle, status transitions, dependencies, and templates")
@RestController
public class TaskController {

    private final TaskService taskService;
    private final TaskDependencyService dependencyService;
    private final SubtaskService subtaskService;
    private final TaskTemplateService templateService;
    private final UserService userService;

    public TaskController(TaskService taskService, TaskDependencyService dependencyService,
                           SubtaskService subtaskService, TaskTemplateService templateService,
                           UserService userService) {
        this.taskService = taskService;
        this.dependencyService = dependencyService;
        this.subtaskService = subtaskService;
        this.templateService = templateService;
        this.userService = userService;
    }

    @Operation(summary = "Create a task in a project")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Task created"),
        @ApiResponse(responseCode = "400", description = "Validation chain rejected the request"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @PostMapping("/projects/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponseDTO create(@PathVariable UUID projectId,
                                   @Valid @RequestBody TaskRequestDTO request,
                                   Authentication auth) {
        User currentUser = userService.findByEmail(auth.getName());
        return taskService.create(projectId, request, currentUser.getId());
    }

    @Operation(summary = "List tasks in a project with optional filters (status, priority, assigneeId, keyword, overdue)")
    @ApiResponse(responseCode = "200", description = "Task list returned")
    @GetMapping("/projects/{projectId}/tasks")
    public List<TaskResponseDTO> listByProject(@PathVariable UUID projectId,
                                                @RequestParam(required = false) TaskStatus status,
                                                @RequestParam(required = false) TaskPriority priority,
                                                @RequestParam(required = false) UUID assigneeId,
                                                @RequestParam(required = false) String keyword,
                                                @RequestParam(required = false) Boolean overdue) {
        return taskService.findByProject(projectId, status, priority, assigneeId, keyword, overdue);
    }

    @Operation(summary = "Get task details by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Task found"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @GetMapping("/tasks/{id}")
    public TaskResponseDTO getById(@PathVariable UUID id) {
        return taskService.findById(id);
    }

    @Operation(summary = "Update task fields (title, description, priority, dueDate)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Task updated"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PutMapping("/tasks/{id}")
    public TaskResponseDTO update(@PathVariable UUID id,
                                   @Valid @RequestBody TaskRequestDTO request,
                                   Authentication auth) {
        User currentUser = userService.findByEmail(auth.getName());
        return taskService.update(id, request, currentUser.getId());
    }

    @Operation(summary = "Delete a task (ADMIN or PROJECT_MANAGER only, action is undoable)")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Task deleted"),
        @ApiResponse(responseCode = "403", description = "Insufficient role"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Authentication auth) {
        User currentUser = userService.findByEmail(auth.getName());
        taskService.delete(id, currentUser.getId());
    }

    @Operation(summary = "Assign a task to a user (caller must be a project member)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Task assigned"),
        @ApiResponse(responseCode = "403", description = "Caller is not a project member"),
        @ApiResponse(responseCode = "404", description = "Task or user not found")
    })
    @PutMapping("/tasks/{id}/assign")
    public TaskResponseDTO assign(@PathVariable UUID id, @Valid @RequestBody AssignTaskRequestDTO request,
                                   Authentication auth) {
        User currentUser = userService.findByEmail(auth.getName());
        return taskService.assign(id, request.getUserId(), currentUser.getId());
    }

    @Operation(summary = "Change task status via the State Machine")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Status changed"),
        @ApiResponse(responseCode = "400", description = "Invalid state transition"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PutMapping("/tasks/{id}/status")
    public TaskResponseDTO changeStatus(@PathVariable UUID id,
                                         @Valid @RequestBody TaskStatusUpdateDTO request,
                                         Authentication auth) {
        User currentUser = userService.findByEmail(auth.getName());
        return taskService.changeStatus(id, request.getStatus(), currentUser.getId());
    }

    @Operation(summary = "Undo the last task action for the current user (Command pattern)")
    @ApiResponse(responseCode = "200", description = "Last action undone")
    @PostMapping("/tasks/undo")
    public void undo(Authentication auth) {
        User currentUser = userService.findByEmail(auth.getName());
        taskService.undo(currentUser.getId());
    }

    @Operation(summary = "Add a dependency between tasks (task must wait for dependsOnTask to be DONE)")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Dependency added"),
        @ApiResponse(responseCode = "400", description = "Circular dependency detected")
    })
    @PostMapping("/tasks/{id}/dependencies")
    @ResponseStatus(HttpStatus.CREATED)
    public void addDependency(@PathVariable UUID id,
                               @Valid @RequestBody AddDependencyRequestDTO request) {
        dependencyService.addDependency(id, request.getDependsOnTaskId());
    }

    @Operation(summary = "Remove a task dependency")
    @ApiResponse(responseCode = "204", description = "Dependency removed")
    @DeleteMapping("/tasks/{id}/dependencies/{depId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDependency(@PathVariable UUID id, @PathVariable UUID depId) {
        dependencyService.removeDependency(id, depId);
    }

    @Operation(summary = "Create a subtask under a task")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Subtask created"),
        @ApiResponse(responseCode = "404", description = "Task or assignee not found")
    })
    @PostMapping("/tasks/{id}/subtasks")
    @ResponseStatus(HttpStatus.CREATED)
    public SubtaskResponseDTO createSubtask(@PathVariable UUID id,
                                            @Valid @RequestBody SubtaskRequestDTO request) {
        return subtaskService.createSubtask(id, request);
    }

    @Operation(summary = "Toggle subtask completion")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Subtask toggled"),
        @ApiResponse(responseCode = "404", description = "Task or subtask not found")
    })
    @PutMapping("/tasks/{id}/subtasks/{sid}/toggle")
    public SubtaskResponseDTO toggleSubtask(@PathVariable UUID id, @PathVariable UUID sid) {
        return subtaskService.toggleSubtask(id, sid);
    }

    @Operation(summary = "Delete a subtask")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Subtask deleted"),
        @ApiResponse(responseCode = "404", description = "Task or subtask not found")
    })
    @DeleteMapping("/tasks/{id}/subtasks/{sid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSubtask(@PathVariable UUID id, @PathVariable UUID sid) {
        subtaskService.deleteSubtask(id, sid);
    }

    @Operation(summary = "List tasks that cannot start yet due to unfinished dependencies")
    @ApiResponse(responseCode = "200", description = "Blocked task list returned")
    @GetMapping("/projects/{id}/tasks/blocked")
    public List<TaskResponseDTO> getBlockedTasks(@PathVariable UUID id) {
        return dependencyService.getBlockedTasks(id).stream()
                .map(taskService::toDTO)
                .toList();
    }

    @Operation(summary = "Auto-assign a task using Strategy pattern (workload or roundrobin)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Task assigned"),
        @ApiResponse(responseCode = "404", description = "Task or project not found")
    })
    @PostMapping("/projects/{projectId}/tasks/auto-assign")
    public TaskResponseDTO autoAssign(@PathVariable UUID projectId,
                                       @RequestParam(defaultValue = "workload") String strategy,
                                       @Valid @RequestBody AutoAssignRequestDTO request) {
        return taskService.autoAssign(projectId, request.getTaskId(), strategy);
    }

    @Operation(summary = "Save a task structure as a reusable template (Prototype pattern)")
    @ApiResponse(responseCode = "201", description = "Template saved")
    @PostMapping("/projects/{id}/templates")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskTemplate saveTemplate(@PathVariable UUID id,
                                      @Valid @RequestBody SaveTemplateRequestDTO request) {
        return templateService.saveTemplate(id, request.getTemplateName(), request.getTitle(),
                request.getDescription(), request.getPriority(), request.getDefaultDueDays());
    }

    @Operation(summary = "List task templates for a project")
    @ApiResponse(responseCode = "200", description = "Template list returned")
    @GetMapping("/projects/{id}/templates")
    public List<TaskTemplate> listTemplates(@PathVariable UUID id) {
        return templateService.listTemplates(id);
    }

    @Operation(summary = "Create a task by cloning a template (Prototype pattern)")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Task created from template"),
        @ApiResponse(responseCode = "404", description = "Template not found")
    })
    @PostMapping("/tasks/from-template/{templateId}")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponseDTO createFromTemplate(@PathVariable UUID templateId,
                                               @RequestParam UUID projectId) {
        return templateService.createFromTemplate(projectId, templateId);
    }
}
