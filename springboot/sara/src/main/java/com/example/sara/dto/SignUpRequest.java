package com.example.sara.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SignUpRequest(
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    String email,
    
    @NotBlank(message = "Password is required")
    String password,
    
    @NotBlank(message = "Username is required")
    String username,
    
    @NotBlank(message = "Role is required")
    String role
) {}