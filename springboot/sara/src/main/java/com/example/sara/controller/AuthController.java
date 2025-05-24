package com.example.sara.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.example.sara.service.RegistrationService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.example.sara.dto.AuthResponse;
import com.example.sara.dto.LoginRequest;
import com.example.sara.dto.RefreshTokenRequest;
import com.example.sara.dto.SignUpRequest;
import com.example.sara.dto.UserDto;
import com.example.sara.model.User;
import com.example.sara.service.AuthService;
import com.example.sara.service.RefreshTokenService;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;

// AuthController.java
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final RegistrationService registrationService ;
    
    
    public AuthController(AuthService authService, RefreshTokenService refreshTokenService, RegistrationService registrationService ) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.registrationService=registrationService;
    }

    @Operation(summary = "Authenticate a user and return access and refresh tokens")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authenticateUser(request));
    }

    @Operation(summary = "Refresh the access token using a refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshAccessToken(request));
    }
    //this endopoint is vulnerable , anyone can logout any user by guessing the userId, for now i'm leaving it as it is, but later on should implement the code in comments
    // Consider implementing user authentication and authorization checks before allowing logout
    @Operation(summary = "Delete refresh tokens for a user")
    @DeleteMapping("/logout/{userId}")
    public ResponseEntity<Void> logout(@PathVariable Long userId) {
        refreshTokenService.deleteByUserId(userId);
        return ResponseEntity.noContent().build();
    }
    
    
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignUpRequest signUpRequest) {
        try {
            User newUser = registrationService.registerNewUser(signUpRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                new UserDto(
                    newUser.getId(),
                    newUser.getEmail(),
                    newUser.getRole(),
                    newUser.getUsername()
                )
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
        }
    }

/* @DeleteMapping("/logout/{userId}")
    @PreAuthorize("isAuthenticated()")

public ResponseEntity<Void> logout(
    @PathVariable Long userId, 
    @AuthenticationPrincipal User principal // Get logged-in user
) {
    if (!principal.getId().equals(userId)) {
        throw new AccessDeniedException("Unauthorized logout attempt");
    }
    refreshTokenService.deleteByUserId(userId);
    return ResponseEntity.noContent().build();
} */
} 
