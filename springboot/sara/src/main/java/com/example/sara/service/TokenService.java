package com.example.sara.service;

import com.example.sara.model.ApiTokenEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;

@Service
public class TokenService {
    private static final Logger logger = LoggerFactory.getLogger(TokenService.class);
    private static final long REFRESH_INTERVAL_MS = 270000L; // 4.5 minutes in milliseconds
    private static final Duration TOKEN_TTL = Duration.ofMinutes(5);
    
    private final WebClient webClient;
    private final PasswordVaultService passwordVaultService;
    private final RedisTemplate<String, ApiTokenEntry> redisTemplate;

    public TokenService(WebClient.Builder webClientBuilder,
                       PasswordVaultService passwordVaultService,
                       RedisTemplate<String, ApiTokenEntry> redisTemplate) {
        this.webClient = webClientBuilder.build();
        this.passwordVaultService = passwordVaultService;
        this.redisTemplate = redisTemplate;
    }

    @Scheduled(fixedRate = REFRESH_INTERVAL_MS)
    public void refreshTokens() {
        logger.debug("Starting token refresh cycle");
        try {
            Set<String> keys = redisTemplate.keys("user:*:auth");
            if (keys == null || keys.isEmpty()) {
                logger.info("No active users found for token refresh");
                return;
            }

            logger.info("Refreshing tokens for {} users", keys.size());
            for (String key : keys) {
                try {
                    String email = extractEmailFromKey(key);
                    logger.debug("Processing user: {}", email);
                    
                    String password = passwordVaultService.getDecryptedPassword(email);
                    fetchAndStoreToken(email, password);
                } catch (Exception e) {
                    logger.error("Failed to refresh token for key {}: {}", key, e.getMessage());
                }
            }
            logger.debug("Completed token refresh cycle");
        } catch (Exception e) {
            logger.error("Critical error in token refresh cycle: {}", e.getMessage());
        }
    }

    void fetchAndStoreToken(String email, String password) {
        logger.debug("Initiating token fetch for: {}", email);
        webClient.post()
            .uri("https://teamapps.u-aizu.ac.jp/sense/auth/token")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .bodyValue("username=" + email + "&password=" + password + "&grant_type=password")
            .retrieve()
            .bodyToMono(String.class)
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                .doAfterRetry(retry -> logger.warn("Retry attempt {} for {}", retry.totalRetries(), email))
            )
            .doOnSuccess(token -> {
                logger.info("Successfully fetched token for {}", email);
                storeToken(email, token);
            })
            .doOnError(e -> logger.error("Failed to fetch token for {}: {}", email, e.getMessage()))
            .subscribe();
    }
    
    

    private void storeToken(String email, String token) {
        try {
            String tokenKey = "user:" + email + ":token";
            ApiTokenEntry entry = new ApiTokenEntry(token, Instant.now().plus(TOKEN_TTL));
            redisTemplate.opsForValue().set(tokenKey, entry, TOKEN_TTL);
            logger.debug("Stored new token for {} with TTL {}", email, TOKEN_TTL);
        } catch (Exception e) {
            logger.error("Failed to store token for {}: {}", email, e.getMessage());
        }
    }

    public String getCurrentToken(String email) {
        try {
            ApiTokenEntry entry = redisTemplate.opsForValue().get("user:" + email + ":token");
            if (entry == null) {
                logger.warn("No token found for user: {}", email);
                return null;
            }
            
            if (entry.expiresAt().isBefore(Instant.now())) {
                logger.warn("Expired token for user: {}", email);
                return null;
            }
            
            return entry.token();
        } catch (Exception e) {
            logger.error("Error retrieving token for {}: {}", email, e.getMessage());
            return null;
        }
    }

    private String extractEmailFromKey(String redisKey) {
        try {
            return redisKey.split(":")[1];
        } catch (Exception e) {
            logger.error("Invalid Redis key format: {}", redisKey);
            throw new IllegalArgumentException("Malformed Redis key: " + redisKey);
        }
    }
}