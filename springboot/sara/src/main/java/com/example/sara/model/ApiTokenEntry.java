package com.example.sara.model;


import java.time.Instant;

public record ApiTokenEntry(
    String token,
    Instant expiresAt
) {}
