package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.AiRequestDTO;
import com.teamsync.presentation.dto.AiResponseDTO;
import com.teamsync.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AI", description = "AI assistant and insight generation")
@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @Operation(summary = "Ask TeamSync AI a question with screen context")
    @ApiResponse(responseCode = "200", description = "AI answer returned")
    @PostMapping("/chat")
    public AiResponseDTO chat(@Valid @RequestBody AiRequestDTO request, Authentication auth) {
        return aiService.chat(request, auth.getName());
    }

    @Operation(summary = "Generate AI insights from TeamSync data")
    @ApiResponse(responseCode = "200", description = "AI insights returned")
    @PostMapping("/insights")
    public AiResponseDTO insights(@Valid @RequestBody AiRequestDTO request, Authentication auth) {
        return aiService.insights(request, auth.getName());
    }
}
