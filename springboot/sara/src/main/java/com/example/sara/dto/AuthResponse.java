package com.example.sara.dto;

public record AuthResponse(String token, long expiresIn, String refreshToken, UserDto user) {}
