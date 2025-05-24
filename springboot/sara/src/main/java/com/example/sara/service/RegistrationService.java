package com.example.sara.service;

import com.example.sara.dto.SignUpRequest;
import com.example.sara.model.User;
import com.example.sara.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(UserRepository userRepository, 
                              PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerNewUser(SignUpRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.email())) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        if (userRepository.existsByUsername(signUpRequest.username())) {
            throw new IllegalArgumentException("Username already taken");
        }

        User user = new User();
        user.setEmail(signUpRequest.email());
        user.setUsername(signUpRequest.username());
        user.setPassword(passwordEncoder.encode(signUpRequest.password()));
        user.setRole(signUpRequest.role().toUpperCase());

        return userRepository.save(user);
    }
}