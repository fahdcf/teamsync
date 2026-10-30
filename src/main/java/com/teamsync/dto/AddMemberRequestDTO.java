package com.teamsync.dto;

import jakarta.validation.constraints.Email;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddMemberRequestDTO {

    @Email
    private String email;

    private UUID userId;
}
