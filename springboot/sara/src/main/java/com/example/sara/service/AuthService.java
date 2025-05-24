package com.example.sara.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import com.example.sara.config.JwtUtils;
import com.example.sara.dto.AuthResponse;
import com.example.sara.dto.LoginRequest;
import com.example.sara.dto.RefreshTokenRequest;
import com.example.sara.dto.UserDto;
import com.example.sara.exception.TokenRefreshException;
import com.example.sara.model.RefreshToken;
import com.example.sara.model.User;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;
    private final PasswordVaultService passwordVaultService;
    private final TokenService tokenService;



    public AuthService(AuthenticationManager authenticationManager, JwtUtils jwtUtils, RefreshTokenService refreshTokenService,PasswordVaultService passwordVaultService,TokenService tokenService ) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.refreshTokenService = refreshTokenService;
        this.passwordVaultService=passwordVaultService;
        this.tokenService=tokenService;
    }
    /**
     * Authenticates a user using the provided login request.
     * 
     * @param request The login request containing email and password.
     * @return An AuthResponse containing the access token, refresh token, and user details.
     */

    public AuthResponse authenticateUser(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        User user = (User) authentication.getPrincipal();
        
        String accessToken = jwtUtils.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        passwordVaultService.storePassword(request.email(), request.password());
        
        tokenService.fetchAndStoreToken(request.email(), request.password());


        
        return new AuthResponse(
            accessToken,
            jwtUtils.getAccessExpirationSeconds(),
            refreshToken.getToken(),
            new UserDto(user.getId(), user.getEmail(), user.getRole(),user.getUsername())
        );
    }


    /**
     * Refreshes the access token using the provided refresh token request.
     * 
     * @param request The refresh token request containing the refresh token.
     * @return An AuthResponse containing the new access token and user details.
     */
    public AuthResponse refreshAccessToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.findByToken(request.refreshToken())
                .orElseThrow(() -> new TokenRefreshException("Invalid refresh token"));
        
        refreshTokenService.verifyExpiration(refreshToken);
        User user = refreshToken.getUser();
        
        String newAccessToken = jwtUtils.generateAccessToken(user);
        return new AuthResponse(
            newAccessToken,
            jwtUtils.getAccessExpirationSeconds(),
            refreshToken.getToken(),
            new UserDto(user.getId(), user.getEmail(), user.getRole(), user.getUsername())
        );
    }
}
