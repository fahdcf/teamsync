package com.teamsync.patterns.creational.prototype;

import com.teamsync.domain.enums.TaskPriority;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "task_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTemplate implements CloneableTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String templateName;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(nullable = false)
    @Builder.Default
    private int defaultDueDays = 7;

    private UUID projectId;

    @Override
    public CloneableTask cloneTask() {
        return TaskTemplate.builder()
                .templateName(this.templateName)
                .title(this.title)
                .description(this.description)
                .priority(this.priority)
                .defaultDueDays(this.defaultDueDays)
                .projectId(this.projectId)
                .build();
    }
}
