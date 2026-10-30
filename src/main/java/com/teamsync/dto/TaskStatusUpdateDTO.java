package com.teamsync.dto;

import com.teamsync.enums.TaskStatus;
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
