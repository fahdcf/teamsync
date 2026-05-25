package com.teamsync.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamsync.infrastructure.exception.ValidationException;
import com.teamsync.patterns.creational.singleton.AppLogger;
import com.teamsync.presentation.dto.AiRequestDTO;
import com.teamsync.presentation.dto.AiResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;

@Service
public class AiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final AppLogger logger = AppLogger.getInstance();

    public AiService(
            ObjectMapper objectMapper,
            @Value("${ai.provider.base-url}") String baseUrl,
            @Value("${ai.provider.api-key}") String apiKey,
            @Value("${ai.provider.model}") String model) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10_000);
        requestFactory.setReadTimeout(90_000);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    public AiResponseDTO chat(AiRequestDTO request, String username) {
        return askProvider(request, username, request.getQuestion());
    }

    public AiResponseDTO insights(AiRequestDTO request, String username) {
        String question = "Generate 3 concise, specific TeamSync insights from this data. "
                + "Mention exact numbers when they exist and avoid generic advice.";
        return askProvider(request, username, question);
    }

    private AiResponseDTO askProvider(AiRequestDTO request, String username, String question) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ValidationException("apiKey", "AI provider API key is not configured");
        }
        if (question == null || question.isBlank()) {
            throw new ValidationException("question", "Question is required");
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt(username, request.getContext())),
                        Map.of("role", "user", "content", userPrompt(question, request.getPayload()))
                ),
                "temperature", 0.4,
                "top_p", 0.95,
                "max_tokens", 512,
                "stream", false
        );

        try {
            String response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .exchange((requestSpec, clientResponse) -> {
                        if (clientResponse.getStatusCode().isError()) {
                            throw new IllegalStateException("AI provider returned " + clientResponse.getStatusCode());
                        }
                        return StreamUtils.copyToString(clientResponse.getBody(), StandardCharsets.UTF_8);
                    });
            String answer = extractAnswer(response);
            if (answer.isBlank()) {
                throw new IllegalStateException("AI provider returned an empty response");
            }
            return new AiResponseDTO(answer.trim());
        } catch (RestClientException | IllegalStateException ex) {
            logger.error("AI provider request failed: " + ex.getMessage());
            throw new IllegalStateException("AI provider request failed. Please try again later.");
        }
    }

    private String systemPrompt(String username, String context) {
        return """
                You are TeamSync AI, a practical project management assistant.
                Give direct, data-backed recommendations for the signed-in user.
                Keep answers short, actionable, and grounded only in the supplied TeamSync data.
                If data is missing, say what data is missing instead of inventing facts.
                User: %s. Current screen: %s.
                """.formatted(username, context);
    }

    private String userPrompt(String question, Map<String, Object> payload) {
        return "Question: " + question + "\nTeamSync data:\n" + serializePayload(payload);
    }

    private String serializePayload(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return payload.toString();
        }
    }

    private String extractAnswer(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            return "";
        }
        String raw = rawResponse.trim();
        if (raw.startsWith("data:")) {
            StringBuilder answer = new StringBuilder();
            for (String line : raw.split("\\R")) {
                String trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                String payload = trimmed.substring(5).trim();
                if (payload.isBlank() || "[DONE]".equals(payload)) continue;
                answer.append(extractJsonChoice(payload, true));
            }
            return answer.toString();
        }
        return extractJsonChoice(raw, false);
    }

    private String extractJsonChoice(String json, boolean streaming) {
        try {
            JsonNode node = objectMapper.readTree(json);
            String pointer = streaming ? "/choices/0/delta/content" : "/choices/0/message/content";
            String content = node.at(pointer).asText("");
            if (content.isBlank()) {
                content = node.at("/choices/0/message/content").asText("");
            }
            return content;
        } catch (JsonProcessingException ex) {
            return "";
        }
    }
}
