package com.example.sara.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

/**
 * Incoming payload for validating user data against a schema.
 */
public class ValidateRequest {

    /** The raw data array or object to be validated. */
    @NotNull
    private JsonNode data;

    /**
     * An optional JSON Schema (draft-07 or later) to validate against.
     * If null, validation is considered a no-op (always "valid").
     */
    private JsonNode schema;

    // Getters / setters omitted for brevity (use Lombok if you like)
    public JsonNode getData() { return data; }
    public void setData(JsonNode data) { this.data = data; }
    public JsonNode getSchema() { return schema; }
    public void setSchema(JsonNode schema) { this.schema = schema; }
}