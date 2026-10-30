package com.teamsync.service;

import com.teamsync.entity.TaskTemplate;
import com.teamsync.repository.TaskTemplateRepository;

import com.teamsync.enums.TaskPriority;
import com.teamsync.dto.TaskRequestDTO;
import com.teamsync.dto.TaskResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class TaskTemplateService {

    private final TaskTemplateRepository templateRepository;
    private final ProjectService projectService;
    private final TaskService taskService;

    public TaskTemplateService(TaskTemplateRepository templateRepository,
                                ProjectService projectService,
                                TaskService taskService) {
        this.templateRepository = templateRepository;
        this.projectService = projectService;
        this.taskService = taskService;
    }

    @PreAuthorize("@permissions.manageProject(#projectId)")
    public TaskTemplate saveTemplate(UUID projectId, String templateName, String title,
                                      String description, TaskPriority priority, int defaultDueDays) {
        projectService.getProject(projectId);
        TaskTemplate template = TaskTemplate.builder()
                .templateName(templateName)
                .title(title)
                .description(description)
                .priority(priority != null ? priority : TaskPriority.MEDIUM)
                .defaultDueDays(defaultDueDays)
                .projectId(projectId)
                .build();
        return templateRepository.save(template);
    }

    @PreAuthorize("@permissions.readProject(#projectId)")
    public List<TaskTemplate> listTemplates(UUID projectId) {
        return templateRepository.findByProjectId(projectId);
    }

    @PreAuthorize("@permissions.manageProject(#projectId) and @permissions.readTemplate(#templateId)")
    public TaskResponseDTO createFromTemplate(UUID projectId, UUID templateId) {
        TaskTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new NoSuchElementException("Template not found: " + templateId));

        if (!projectId.equals(template.getProjectId())) throw new IllegalArgumentException("Template must belong to the destination project");
        TaskTemplate cloned = (TaskTemplate) template.cloneTask();

        TaskRequestDTO request = new TaskRequestDTO();
        request.setTitle(cloned.getTitle());
        request.setDescription(cloned.getDescription());
        request.setPriority(cloned.getPriority());
        request.setDueDate(LocalDate.now().plusDays(cloned.getDefaultDueDays()));

        return taskService.create(projectId, request);
    }
}
