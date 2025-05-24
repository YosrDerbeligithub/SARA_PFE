package com.example.sara.service;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EncryptionService {
    private static final String MASTER_KEY_ENV = "ENCRYPTION_MASTER_KEY";
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128; // 128-bit authentication tag
    private static final int GCM_IV_LENGTH = 12;   // 12 bytes recommended for GCM
    private static final SecureRandom secureRandom = new SecureRandom();
    
    private final SecretKey masterKey;
    private static final Logger logger = LoggerFactory.getLogger(EncryptionService.class);

    public EncryptionService() {
        String base64Key = System.getenv(MASTER_KEY_ENV);
        logger.info("Initializing EncryptionService with master key: {}", base64Key);
        if (base64Key == null) {
            throw new IllegalStateException("Master key not found in environment!");
        }
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        this.masterKey = new SecretKeySpec(keyBytes, "AES");
    }

    public byte[] generateDataKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance("AES");
            keyGen.init(256);
            return keyGen.generateKey().getEncoded();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate DEK", e);
        }
    }

    public byte[] encryptWithKey(byte[] key, String data) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        byte[] iv = generateIv();
        
        cipher.init(Cipher.ENCRYPT_MODE, 
                   new SecretKeySpec(key, "AES"), 
                   new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        
        byte[] encrypted = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        return ByteBuffer.allocate(iv.length + encrypted.length)
                        .put(iv)
                        .put(encrypted)
                        .array();
    }

    public String decryptWithKey(byte[] key, byte[] encryptedData) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        ByteBuffer buffer = ByteBuffer.wrap(encryptedData);
        
        byte[] iv = new byte[GCM_IV_LENGTH];
        buffer.get(iv);
        
        byte[] cipherText = new byte[buffer.remaining()];
        buffer.get(cipherText);
        
        cipher.init(Cipher.DECRYPT_MODE, 
                   new SecretKeySpec(key, "AES"), 
                   new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        
        return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
    }

    public byte[] encryptWithMasterKey(byte[] data) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        byte[] iv = generateIv();
        
        cipher.init(Cipher.ENCRYPT_MODE, 
                   masterKey, 
                   new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        
        byte[] encrypted = cipher.doFinal(data);
        
        return ByteBuffer.allocate(iv.length + encrypted.length)
                        .put(iv)
                        .put(encrypted)
                        .array();
    }

    public byte[] decryptWithMasterKey(byte[] encryptedData) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        ByteBuffer buffer = ByteBuffer.wrap(encryptedData);
        
        byte[] iv = new byte[GCM_IV_LENGTH];
        buffer.get(iv);
        
        byte[] cipherText = new byte[buffer.remaining()];
        buffer.get(cipherText);
        
        cipher.init(Cipher.DECRYPT_MODE, 
                   masterKey, 
                   new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        
        return cipher.doFinal(cipherText);
    }

    private byte[] generateIv() {
        byte[] iv = new byte[GCM_IV_LENGTH];
        secureRandom.nextBytes(iv);
        return iv;
    }

    // Enhanced logging with IV information
    private void logEncryptionDetails(byte[] key, byte[] iv, String data) {
        logger.info("Encrypting with key: {}", Base64.getEncoder().encodeToString(key));
        logger.info("Using IV: {}", Base64.getEncoder().encodeToString(iv));
        logger.info("Plaintext length: {} bytes", data.getBytes(StandardCharsets.UTF_8).length);
    }

    private void logDecryptionDetails(byte[] key, byte[] iv, byte[] encryptedData) {
        logger.info("Decrypting with key: {}", Base64.getEncoder().encodeToString(key));
        logger.info("Using IV: {}", Base64.getEncoder().encodeToString(iv));
        logger.info("Ciphertext length: {} bytes", encryptedData.length);
    }
}