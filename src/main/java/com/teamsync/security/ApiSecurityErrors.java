package com.teamsync.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Component
public class ApiSecurityErrors {
    private final ObjectMapper mapper;

    public ApiSecurityErrors(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public void write(HttpServletRequest request, HttpServletResponse response, int status) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        if (status == 401) response.setHeader("WWW-Authenticate", "Bearer");
        mapper.writeValue(response.getOutputStream(), Map.of(
                "timestamp", LocalDateTime.now(), "status", status,
                "error", status == 401 ? "Unauthorized" : "Forbidden",
                "message", status == 401 ? "Authentication required" : "Access denied",
                "path", request.getRequestURI()));
    }
}
