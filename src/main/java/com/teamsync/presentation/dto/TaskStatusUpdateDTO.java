package com.teamsync.presentation.dto;

import com.teamsync.domain.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatusUpdateDTO {

    @NotNull
    private TaskStatus status;
}
