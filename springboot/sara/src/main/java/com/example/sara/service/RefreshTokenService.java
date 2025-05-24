package com.example.sara.service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.sara.exception.TokenRefreshException;
import com.example.sara.model.RefreshToken;
import com.example.sara.repositories.RefreshTokenRepository;
import com.example.sara.repositories.UserRepository;

@Service
public class RefreshTokenService {

    @Value("${app.jwt.refreshExpirationDays}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }
    /**
     * Creates a new refresh token for the specified user ID.
     * 
     * @param userId The ID of the user for whom the refresh token is created.
     * @return The created RefreshToken object.
     */

    public RefreshToken createRefreshToken(Long userId) {
        deleteByUserId(userId); // Delete existing refresh token for the user if any
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(userRepository.findById(userId).get());
        long durationMs = refreshTokenDurationMs * 24 * 60 * 60 * 1000; // Convert days → ms

        refreshToken.setExpiryDate(Instant.now().plusMillis(durationMs));
        refreshToken.setToken(UUID.randomUUID().toString());
        
        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Deletes the refresh token associated with the specified user ID.
     * 
     * @param userId The ID of the user whose refresh token is to be deleted.
     */
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }
    public void deleteByUserId(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
    /**
     * Deletes the specified refresh token from the repository.
     * 
     * @param token The RefreshToken object to be deleted.
     */

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException("Refresh token was expired. Please make a new login request");
        }
        return token;
    }
}
