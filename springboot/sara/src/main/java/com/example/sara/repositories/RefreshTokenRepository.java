package com.example.sara.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.sara.model.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.expiryDate < CURRENT_TIMESTAMP")
    void deleteExpiredTokens();
}
