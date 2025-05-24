package com.example.sara.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.example.sara.model.User;

import javax.crypto.spec.SecretKeySpec;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64; // Add this import

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.accessExpirationMs}")
    private int accessExpirationMs;

    @Value("${app.jwt.refreshExpirationDays}")
    private int refreshExpirationDays;

    /**
     * Generates an access token for the given user.
     *
     * @param user The user for which the token is generated.
     * @return The generated JWT access token.
     */
    public String generateAccessToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail()) // Use email or another unique identifier
                .claim("id", user.getId())
                .claim("role", user.getRole())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Generates a refresh token for the given user details.
     *
     * @param userDetails The user details for which the token is generated.
     * @return The generated JWT refresh token.
     */
    /**
     * public String generateRefreshToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + refreshExpirationDays * 24 * 60 * 60 * 1000L))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }
     */
    

    /**
     * Validates the given JWT token.
     *
     * @param authToken The JWT token to validate.
     * @return True if the token is valid, false otherwise.
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Extracts the username from the given JWT token.
     *
     * @param token The JWT token.
     * @return The username extracted from the token.
     */
    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody().getSubject();
    }

    /**
     * Converts the Base64-encoded secret key string into a Key object.
     *
     * @return The signing key.
     */
    private Key getSigningKey() {
        // Use URL-safe decoder for Base64 without padding
        byte[] keyBytes = Base64.getUrlDecoder().decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Returns the access token expiration time in seconds.
     *
     * @return The access token expiration time in seconds.
     */
    public long getAccessExpirationSeconds() {
        return accessExpirationMs / 1000;
    }
}