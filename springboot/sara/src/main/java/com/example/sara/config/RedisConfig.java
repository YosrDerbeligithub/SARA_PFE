package com.example.sara.config;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;

import com.example.sara.model.ApiTokenEntry;
import com.example.sara.model.EncryptedPasswordEntry;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.data.redis.serializer.StringRedisSerializer;


@Configuration
public class RedisConfig {
    
    @Value("${spring.redis.password}")
    private String redisPassword;

    @Bean
    public RedisConnectionFactory redisConnectionFactory(
        @Value("${spring.redis.host}") String host,
        @Value("${spring.redis.port}") int port
    ) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(host, port);
        config.setPassword(redisPassword); // Set password
        return new LettuceConnectionFactory(config);
    }

    @Bean
    public RedisTemplate<String, EncryptedPasswordEntry> redisTemplate(
        RedisConnectionFactory connectionFactory
    ) {
        RedisTemplate<String, EncryptedPasswordEntry> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());

        // Create and configure ObjectMapper
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Initialize the serializer with the custom ObjectMapper
        Jackson2JsonRedisSerializer<EncryptedPasswordEntry> serializer = 
            new Jackson2JsonRedisSerializer<>(objectMapper, EncryptedPasswordEntry.class);

        // Set the serializer
        template.setValueSerializer(serializer);
        return template;
    }
    
    
    @Bean
    public RedisTemplate<String, ApiTokenEntry> apiTokenRedisTemplate(
        RedisConnectionFactory connectionFactory
    ) {
        RedisTemplate<String, ApiTokenEntry> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        template.setValueSerializer(new Jackson2JsonRedisSerializer<>(mapper, ApiTokenEntry.class));
        return template;
    }
}

