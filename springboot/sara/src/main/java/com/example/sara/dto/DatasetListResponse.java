package com.example.sara.dto;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

import com.example.sara.model.Dataset;
import com.example.sara.model.Visibility;

public record DatasetListResponse(
	    Long id,
	    String name,
	    String description,
	    String ownerEmail,
	    Visibility visibility,
	    OffsetDateTime createdAt,
	    int rowCount,
	    int columnCount,
	    List<String> tags  // Add if needed in your frontend
	) {
	    public static DatasetListResponse fromEntity(Dataset dataset) {
	        return new DatasetListResponse(
	            dataset.getId(),
	            dataset.getName(),
	            dataset.getDescription(),
	            dataset.getOwner().getEmail(),
	            dataset.getVisibility(),
	            dataset.getCreatedAt(),
	            dataset.getRowCount(),
	            dataset.getColumnCount(),
	            Collections.emptyList()  // Populate if you have tags
	        );
	    }
	}