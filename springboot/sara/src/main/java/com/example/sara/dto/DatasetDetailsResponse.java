package com.example.sara.dto;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.example.sara.model.Dataset;
import com.example.sara.model.Visibility;
import com.fasterxml.jackson.databind.JsonNode;

public record DatasetDetailsResponse(
	    Long id,
	    String name,
	    String description,
	    JsonNode payload,
	    JsonNode schema,
	    Visibility visibility,
	    String ownerEmail,
	    List<String> collaborators,
	    OffsetDateTime createdAt,
	    OffsetDateTime updatedAt,
	    int rowCount,
	    int columnCount,
	    List<String> tags
	) {
	    public static DatasetDetailsResponse fromEntity(Dataset dataset) {
	        return new DatasetDetailsResponse(
	            dataset.getId(),
	            dataset.getName(),
	            dataset.getDescription(),
	            dataset.getPayload(),
	            dataset.getSchema(),
	            dataset.getVisibility(),
	            dataset.getOwner().getEmail(),
	            dataset.getCollaborators().stream()
	                .map(c -> c.getId().getCollaboratorEmail())
	                .collect(Collectors.toList()),
	            dataset.getCreatedAt(),
	            dataset.getUpdatedAt(),
	            dataset.getRowCount(),
	            dataset.getColumnCount(),
	            Collections.emptyList()  // Add tags if needed
	        );
	    }
}