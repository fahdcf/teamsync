package com.teamsync.patterns.structural.proxy;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.presentation.dto.TaskResponseDTO;
import com.teamsync.repository.TaskRepository;

import java.util.List;
import java.util.UUID;

public interface TaskService {
    TaskResponseDTO create(UUID projectId, TaskRequestDTO request);
    TaskResponseDTO update(UUID id, TaskRequestDTO request);
    void delete(UUID id, UUID userId);
    TaskResponseDTO assign(UUID id, UUID assigneeId, UUID userId);
    TaskResponseDTO autoAssign(UUID projectId, UUID taskId, String strategyName);
    TaskResponseDTO changeStatus(UUID id, TaskStatus targetStatus, UUID userId);
    void undo(UUID userId);
    List<TaskResponseDTO> findByProject(UUID projectId, TaskStatus status);
    TaskResponseDTO findById(UUID id);
    Task getTask(UUID id);
    TaskRepository getTaskRepository();
    TaskResponseDTO toDTO(Task task);
}
