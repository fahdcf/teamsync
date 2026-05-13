package com.teamsync.presentation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceSummaryResponseDTO {
    private long projectCount;
    private long activeTaskCount;
    private long completedTaskCount;
    private long overdueCount;
    private int averageProgress;
    private long onTrackCount;
    private long atRiskCount;
    private long overdueProjectCount;
    private String activityLevel;
    private String engagementLevel;
    private String progressStatus;
}
