package com.teamsync.patterns.creational.prototype;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.Task;
import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.patterns.structural.proxy.TaskService;
import com.teamsync.service.ProjectService;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.presentation.dto.TaskResponseDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
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

    public List<TaskTemplate> listTemplates(UUID projectId) {
        return templateRepository.findByProjectId(projectId);
    }

    public TaskResponseDTO createFromTemplate(UUID projectId, UUID templateId) {
        TaskTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new NoSuchElementException("Template not found: " + templateId));

        TaskTemplate cloned = (TaskTemplate) template.cloneTask();

        TaskRequestDTO request = new TaskRequestDTO();
        request.setTitle(cloned.getTitle());
        request.setDescription(cloned.getDescription());
        request.setPriority(cloned.getPriority());
        request.setDueDate(LocalDate.now().plusDays(cloned.getDefaultDueDays()));

        return taskService.create(projectId, request);
    }
}
