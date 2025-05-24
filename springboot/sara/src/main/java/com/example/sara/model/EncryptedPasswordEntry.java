package com.example.sara.model;

import java.time.Instant;

public record EncryptedPasswordEntry(
		 byte[] encryptedPassword,
		 byte[] encryptedDataKey,
		 Instant expiresAt
		) {}

