package com.teamsync.presentation.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountOverviewResponseDTO {
    private int profileCompletion;
    private String securityStatus;
    private String securityMessage;
    private List<String> missingProfileFields;
}
