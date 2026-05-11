package com.teamsync.infrastructure.exception;

import java.util.List;

public class ValidationException extends RuntimeException {

    public record FieldError(String field, String message) {}

    private final List<FieldError> errors;

    public ValidationException(String field, String message) {
        super(message);
        this.errors = List.of(new FieldError(field, message));
    }

    public ValidationException(List<FieldError> errors) {
        super("Validation failed");
        this.errors = errors;
    }

    public List<FieldError> getErrors() {
        return errors;
    }
}
