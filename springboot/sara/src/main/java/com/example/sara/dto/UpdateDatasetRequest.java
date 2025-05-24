package com.example.sara.dto;


import com.example.sara.model.Visibility;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.*;

import java.util.List;

/**
* Payload for updating an existing dataset with validation rules.
*/
public class UpdateDatasetRequest {

 @NotBlank(message = "Dataset name is required")
 private String name;

 private String description;

 @NotNull(message = "Payload is required")
 private JsonNode payload;

 private JsonNode schema;

 @NotNull(message = "Visibility setting is required")
 private Visibility visibility;

 @Size(min = 1, message = "At least one collaborator required for RESTRICTED visibility")
 private List<@Email(message = "Invalid collaborator email format") String> collaborators;

 // Validation method for visibility/collaborator consistency
 @AssertTrue(message = "Collaborators required when visibility is RESTRICTED")
 private boolean isValidCollaboratorVisibility() {
     return visibility != Visibility.RESTRICTED || 
           (collaborators != null && !collaborators.isEmpty());
 }

 // Getters and Setters
 public String getName() { return name; }
 public void setName(String name) { this.name = name; }
 public String getDescription() { return description; }
 public void setDescription(String description) { this.description = description; }
 public JsonNode getPayload() { return payload; }
 public void setPayload(JsonNode payload) { this.payload = payload; }
 public JsonNode getSchema() { return schema; }
 public void setSchema(JsonNode schema) { this.schema = schema; }
 public Visibility getVisibility() { return visibility; }
 public void setVisibility(Visibility visibility) { this.visibility = visibility; }
 public List<String> getCollaborators() { return collaborators; }
 public void setCollaborators(List<String> collaborators) { this.collaborators = collaborators; }
}