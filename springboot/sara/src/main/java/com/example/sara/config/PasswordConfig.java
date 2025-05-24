package com.example.sara.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * PasswordConfig defines the BCryptPasswordEncoder bean.
 */
@Configuration
public class PasswordConfig {

    /**
     * Provides the BCryptPasswordEncoder bean.
     * 
     * @return BCryptPasswordEncoder object
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
