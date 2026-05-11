package com.teamsync.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddMemberRequestDTO {

    @NotBlank
    @Email
    private String email;
}
