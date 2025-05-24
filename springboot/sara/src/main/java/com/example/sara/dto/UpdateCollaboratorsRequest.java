package com.example.sara.dto;


import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record UpdateCollaboratorsRequest(
    @NotEmpty(message = "At least one collaborator is required")
    List<@Email(message = "Invalid email format") String> collaborators
) {}
