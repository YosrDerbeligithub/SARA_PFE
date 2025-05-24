package com.example.sara.dto;

import java.util.List;

import com.example.sara.model.DatasetCollaborator;
import com.example.sara.model.Visibility;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public record UpdateVisibilityRequest(
	    @NotNull(message = "Visibility is required")
	    Visibility visibility,
	    List<@Email(message = "Invalid email format") String> collaborators
	) {}