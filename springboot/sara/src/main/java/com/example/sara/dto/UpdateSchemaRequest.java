package com.example.sara.dto;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotNull;

public record UpdateSchemaRequest(
	    @NotNull(message = "Schema is required")
	    JsonNode schema
	) {}
