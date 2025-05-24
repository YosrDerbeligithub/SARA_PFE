package com.example.sara.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.core.userdetails.UserDetailsService;

import com.example.sara.config.filters.JwtAuthFilter;

/**
 * SecurityConfig is the main configuration class for Spring Security.
 * It defines the security filter chain, authentication providers, and other security-related beans.
 */
@Configuration
@EnableWebSecurity // Enables Spring Security's web security support
@EnableMethodSecurity // Enables method-level security annotations like @PreAuthorize and @PostAuthorize
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter; // Custom filter for processing JWT authentication
    private final UserDetailsService userDetailsService; // Service to load user-specific data

    /**
     * Constructor for SecurityConfig.
     * 
     * @param jwtAuthFilter      Custom JWT authentication filter
     * @param userDetailsService Service to load user details
     */
    public SecurityConfig(JwtAuthFilter jwtAuthFilter, UserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Configures the security filter chain.
     * 
     * @param http HttpSecurity object for configuring security settings
     * @return SecurityFilterChain object
     * @throws Exception if an error occurs during configuration
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList("http://localhost:4200")); // Angular's URL
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}

    /**
     * Provides the AuthenticationManager bean.
     * 
     * @param config AuthenticationConfiguration object
     * @return AuthenticationManager object
     * @throws Exception if an error occurs during configuration
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) 
        throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Configures the DaoAuthenticationProvider bean.
     * 
     * @param passwordEncoder Password encoder bean
     * @return DaoAuthenticationProvider object
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider(BCryptPasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }
}