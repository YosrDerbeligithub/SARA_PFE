package com.example.sara.dto;

import com.example.sara.model.Dataset;
import com.example.sara.model.Visibility;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;


public class DatasetResponse {
 private final Long id;
 private final String name;
 private final String description;
 private final JsonNode payload;
 private final JsonNode schema;
 private final Visibility visibility;
 private final OffsetDateTime createdAt;
 private final OffsetDateTime updatedAt;

 public DatasetResponse(Long id, String name, String description, 
                       JsonNode payload, JsonNode schema, Visibility visibility,
                       OffsetDateTime createdAt, OffsetDateTime updatedAt) {
     this.id = id;
     this.name = name;
     this.description = description;
     this.payload = payload;
     this.schema = schema;
     this.visibility = visibility;
     this.createdAt = createdAt;
     this.updatedAt = updatedAt;
 }

 // Static factory method
 public static DatasetResponse fromEntity(Dataset dataset) {
     return new DatasetResponse(
         dataset.getId(),
         dataset.getName(),
         dataset.getDescription(),
         dataset.getPayload(),
         dataset.getSchema(),
         dataset.getVisibility(),
         dataset.getCreatedAt(),
         dataset.getUpdatedAt()
     );
 }

 // Getters
 public Long getId() { return id; }
 public String getName() { return name; }
 public String getDescription() { return description; }
 public JsonNode getPayload() { return payload; }
 public JsonNode getSchema() { return schema; }
 public Visibility getVisibility() { return visibility; }
 public OffsetDateTime getCreatedAt() { return createdAt; }
 public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
