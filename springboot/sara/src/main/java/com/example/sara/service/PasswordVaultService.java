package com.example.sara.service;

import java.security.GeneralSecurityException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Set;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.sara.model.EncryptedPasswordEntry;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Service
public class PasswordVaultService {

	private static final Logger logger = LoggerFactory.getLogger(PasswordVaultService.class);

 private static final Duration PASSWORD_TTL = Duration.ofMinutes(15);
 private final RedisTemplate<String, EncryptedPasswordEntry> redisTemplate;
 private final EncryptionService encryptionService;
 
 
 public PasswordVaultService(
		 
	        RedisTemplate<String, EncryptedPasswordEntry> redisTemplate,
	        EncryptionService encryptionService
	    ) {
	        this.redisTemplate = redisTemplate;
	        this.encryptionService = encryptionService;
	    }

 public void storePassword(String email, String plaintextPassword) {
     try {
         // Generate new data key for this storage operation
         byte[] dataKey = encryptionService.generateDataKey();
         
         // Encrypt the password with DEK
         byte[] encryptedPassword = encryptionService.encryptWithKey(dataKey, plaintextPassword);
         
         // Encrypt the DEK with master key
         byte[] encryptedDataKey = encryptionService.encryptWithMasterKey(dataKey);
         
         // Store in Redis with user-specific key
         String redisKey = "user:%s:auth".formatted(email);
         redisTemplate.opsForValue().set(
             redisKey,
             new EncryptedPasswordEntry(
                 encryptedPassword,
                 encryptedDataKey,
                 Instant.now().plus(PASSWORD_TTL)
             ),
             PASSWORD_TTL
         );
     } catch (GeneralSecurityException e) {
         throw new RuntimeException("Password storage failed", e);
     }
 }

 @Scheduled(fixedRate = (14 * 60 + 30) * 1000L)  // every 14m30s
 public void rotateKeys() {
     logger.info("Starting key rotation...");
     Set<String> keys = redisTemplate.keys("user:*:auth");
     if (keys == null || keys.isEmpty()) {
         logger.info("No keys to rotate.");
         return;
     }

     logger.info("Found {} keys to rotate", keys.size());
     for (String key : keys) {
         try {
             EncryptedPasswordEntry entry = redisTemplate.opsForValue().get(key);
             if (entry == null) {
                 logger.warn("Entry for key {} is null (may have expired)", key);
                 continue;
             }

             // Log existing encryptedDataKey and expiresAt
             logger.info("Key: {}", key);
             logger.info("Old encryptedDataKey: {}", Base64.getEncoder().encodeToString(entry.encryptedDataKey()));
             logger.info("Old expiresAt: {}", entry.expiresAt());

             // Decrypt DEK with master key
             byte[] dataKey = encryptionService.decryptWithMasterKey(entry.encryptedDataKey());
             logger.info("Decrypted DEK: {}", Base64.getEncoder().encodeToString(dataKey));

             // Decrypt password with DEK
             String password = encryptionService.decryptWithKey(dataKey, entry.encryptedPassword());
             logger.info("Decrypted password: {}", password);

             // Generate new DEK and re-encrypt
             byte[] newDataKey = encryptionService.generateDataKey();
             logger.info("New DEK: {}", Base64.getEncoder().encodeToString(newDataKey));

             // Encrypt password with new DEK
             byte[] newEncryptedPassword = encryptionService.encryptWithKey(newDataKey, password);
             logger.info("New encryptedPassword: {}", Base64.getEncoder().encodeToString(newEncryptedPassword));

             // Encrypt new DEK with master key
             byte[] newEncryptedDataKey = encryptionService.encryptWithMasterKey(newDataKey);
             logger.info("New encryptedDataKey: {}", Base64.getEncoder().encodeToString(newEncryptedDataKey));

             // Update Redis entry
             EncryptedPasswordEntry newEntry = new EncryptedPasswordEntry(
                 newEncryptedPassword,
                 newEncryptedDataKey,
                 Instant.now().plus(PASSWORD_TTL)
             );
             redisTemplate.opsForValue().set(key, newEntry, PASSWORD_TTL);
             logger.info("Rotation successful for key: {}", key);

         } catch (GeneralSecurityException e) {
             logger.error("Rotation failed for key {}: {}", key, e.getMessage());
         } catch (Exception e) {
             logger.error("Unexpected error during rotation for key {}: {}", key, e.getMessage());
         }
     }
 }
 
 public String getDecryptedPassword(String email) throws GeneralSecurityException {
	    String redisKey = "user:%s:auth".formatted(email);
	    EncryptedPasswordEntry entry = redisTemplate.opsForValue().get(redisKey);
	    
	    if (entry == null) {
	        throw new SecurityException("No stored credentials found for user: " + email);
	    }
	    
	    // Decrypt DEK with master key
	    byte[] dataKey = encryptionService.decryptWithMasterKey(entry.encryptedDataKey());
	    
	    // Decrypt password with DEK
	    return encryptionService.decryptWithKey(dataKey, entry.encryptedPassword());
	}
 
 private String extractEmailFromKey(String redisKey) {
     return redisKey.split(":")[1];
 }
}
