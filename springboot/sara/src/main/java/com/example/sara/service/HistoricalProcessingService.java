package com.example.sara.service;

import com.example.sara.dto.ExportRequestDTO;
import com.example.sara.dto.RadioDevicesAtTimeRequestDTO;

import com.example.sara.dto.RadioDevicesAtTimeResponseDTO;
import com.example.sara.dto.ThermalmapAtTimeRequestDTO;
import com.example.sara.dto.ThermalmapAtTimeResponseDTO;
import com.example.sara.model.AggregatedResultDTO;
import com.example.sara.model.ProcessingRequestDTO;


import com.example.sara.model.ProcessingResponseDTO;

import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.TimeoutException;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;
import reactor.netty.http.client.HttpClient; // Correct HttpClient

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
public class HistoricalProcessingService {

    private static final Logger logger = LoggerFactory.getLogger(HistoricalProcessingService.class);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(300);
    
    private  WebClient webClient;
    private final TokenService tokenService;
    
    @Value("${historical.processing.url}")
    private String historicalProcessingUrl;

    public HistoricalProcessingService(
            WebClient.Builder webClientBuilder, 
            TokenService tokenService
        ) {
            this.tokenService = tokenService;
            
            // Defer WebClient initialization to @PostConstruct
            this.webClient = webClientBuilder
                    .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(16 * 1024 * 1024) // 16MB buffer
                    )
                    .build(); // Keep this here 
        }
    
    
    @PostConstruct // Ensures injection happens firs
    public void init() {
        // Rebuild WebClient with injected URL
        this.webClient = this.webClient.mutate()
            .baseUrl(this.historicalProcessingUrl)
            .build();
        
        logger.error("!!! CONFIGURED URL: {} !!!", this.historicalProcessingUrl);
    }
    
    
    public ProcessingResponseDTO processHistoricalData(ProcessingRequestDTO request, String userEmail) {
        logger.info("Processing historical data request for user: {}", userEmail);
        String authToken = getValidatedToken(userEmail);

        try {
            logger.debug("Sending request to processing service: {}", request);

            HttpClient httpClient = HttpClient.create()
                .responseTimeout(REQUEST_TIMEOUT)
                .doOnConnected(conn ->
                    conn.addHandlerLast(new ReadTimeoutHandler(REQUEST_TIMEOUT.getSeconds(), TimeUnit.SECONDS))
                );

            // 1) Fire the POST and get a Flux of daily (or minute‐batch) DTOs
            Flux<ProcessingResponseDTO> flux = webClient.mutate()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build()
                .post()
                .uri("/process/batched_stream")
                .header("Authorization", "Bearer " + authToken)
                .accept(MediaType.valueOf("application/x-ndjson"))
                .bodyValue(request)
                .retrieve()
                .onStatus(this::isErrorResponse, this::handleErrorResponse)
                .bodyToFlux(ProcessingResponseDTO.class)
                .timeout(REQUEST_TIMEOUT)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(100))
                    .filter(ex -> {
                        if (ex instanceof WebClientResponseException) {
                            return ((WebClientResponseException) ex)
                                     .getStatusCode()
                                     .is5xxServerError();
                        }
                        return ex instanceof IOException;
                    })
                    .doAfterRetry(r -> logger.warn("Retry attempt {} for {}", r.totalRetries(), userEmail))
                )
                .doOnNext(r -> logger.info("Received stream chunk for {}", userEmail))
                .doOnError(e -> {
                    if (e instanceof TimeoutException) {
                        logger.error("Stream timed out after {}s for {}", REQUEST_TIMEOUT.getSeconds(), userEmail);
                    } else {
                        logger.error("Error while streaming for {}", userEmail, e);
                    }
                });

            // 2) Block to collect all chunks into a List
            List<ProcessingResponseDTO> chunks = flux.collectList().block();
            if (chunks == null || chunks.isEmpty()) {
                throw new RuntimeException("No data received from streaming endpoint");
            }

            // 3) Merge into one big DTO
            ProcessingResponseDTO merged = new ProcessingResponseDTO();
            ProcessingResponseDTO first = chunks.get(0);

            // copy all the metadata fields
            merged.setFacility(first.getFacility());
            merged.setAgent_serial(first.getAgent_serial());
            merged.setSensor_type(first.getSensor_type());
            merged.setAggregation_level(first.getAggregation_level());
            merged.setMetric(first.getMetric());
            merged.setMeta(first.getMeta());

            // stitch together every day's (or chunk's) aggregated_results
            Map<String, List<AggregatedResultDTO>> fullResults = new LinkedHashMap<>();
            for (ProcessingResponseDTO c : chunks) {
                fullResults.putAll(c.getAggregated_results());
            }
            merged.setAggregated_results(fullResults);

            logger.info("Successfully processed historical data for {}", userEmail);
            return merged;

        } catch (WebClientResponseException e) {
            logger.error("HTTP error {} from processing service. Body: {}",
                         e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Processing service error", e);
        } catch (Exception e) {
            logger.error("Unexpected error processing request for {}: {}", userEmail, e.getMessage());
            throw new RuntimeException("Processing request failed", e);
        }
    }

    public ProcessingResponseDTO processHistoricalDataaaaaaaaa(ProcessingRequestDTO request, String userEmail) {
        logger.info("Processing historical data request for user: {}", userEmail);
        
        final String authToken = getValidatedToken(userEmail);
        
        try {
            logger.debug("Sending request to processing service: {}", request);
            
            // Create a custom HTTP client with extended timeouts
            HttpClient httpClient = HttpClient.create()
                .responseTimeout(REQUEST_TIMEOUT)
                .doOnConnected(conn -> 
                    conn.addHandlerLast(new ReadTimeoutHandler(REQUEST_TIMEOUT.getSeconds(), TimeUnit.SECONDS))
                );

            ProcessingResponseDTO response = webClient.mutate()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build()
                .post()
                .uri("/process")
                .header("Authorization", "Bearer " + authToken)
                .bodyValue(request)
                .retrieve()
                .onStatus(this::isErrorResponse, this::handleErrorResponse)
                .bodyToMono(ProcessingResponseDTO.class)
                .timeout(REQUEST_TIMEOUT)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(100))
                    .filter(ex -> {
                        // Only retry on network errors or 5xx status codes
                        if (ex instanceof WebClientResponseException) {
                            return ((WebClientResponseException) ex).getStatusCode().is5xxServerError();
                        }
                        return ex instanceof IOException; 
                    })
                    .doAfterRetry(retry -> logger.warn("Retry attempt {} for {}", retry.totalRetries(), userEmail))
                )
                .doOnSuccess(r -> logger.info("Successfully processed request for {}", userEmail))
                .doOnError(e -> {
                    if (e instanceof TimeoutException) {
                        logger.error("Request timed out after {} seconds for {}", 
                                   REQUEST_TIMEOUT.getSeconds(), userEmail);
                    } else {
                        logger.error("Request processing failed for {}", userEmail, e);
                    }
                })
                .block();
            
            logger.debug("Received response: {}", response);
            return response;
            
        } catch (WebClientResponseException e) {
            logger.error("HTTP error {} from processing service. Body: {}", 
                       e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Processing service error", e);
        } catch (Exception e) {
            logger.error("Unexpected error processing request for {}: {}", userEmail, e.getMessage());
            throw new RuntimeException("Processing request failed", e);
        }
    }
    private String getValidatedToken(String userEmail) {
        String authToken = tokenService.getCurrentToken(userEmail);
        if (authToken == null || authToken.isBlank()) {
            logger.error("No valid token available for user: {}", userEmail);
            throw new SecurityException("Authentication required");
        }
        logger.debug("Using valid token for user: {}", userEmail);
        return authToken;
    }

    private boolean isErrorResponse(HttpStatusCode status) {
        return status.is4xxClientError() || status.is5xxServerError();
    }

    private Mono<Throwable> handleErrorResponse(org.springframework.web.reactive.function.client.ClientResponse response) {
        return response.bodyToMono(String.class)
            .defaultIfEmpty("No error details available")
            .flatMap(errorBody -> {
                logger.error("Error response from processing service: {} - {}",
                           response.statusCode(), errorBody);
                return Mono.error(new RuntimeException(
                    "Processing service error: " + response.statusCode() + " - " + errorBody));
            });
    }
    
    
    
    
 
        public RadioDevicesAtTimeResponseDTO fetchRadioDevicesAtTime(
            RadioDevicesAtTimeRequestDTO request,
            String userEmail
        ) {
            String authToken = getValidatedToken(userEmail);

            // Construire un HTTP client avec timeout
            HttpClient httpClient = HttpClient.create()
                .responseTimeout(REQUEST_TIMEOUT)
                .doOnConnected(conn ->
                    conn.addHandlerLast(new ReadTimeoutHandler(REQUEST_TIMEOUT.getSeconds(), TimeUnit.SECONDS))
                );

            // Prépare et envoie la requête
            return webClient.mutate()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build()
                .post()
                .uri("/radio/devices_at_time")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(this::isErrorResponse, this::handleErrorResponse)
                .bodyToMono(RadioDevicesAtTimeResponseDTO.class)
                .timeout(REQUEST_TIMEOUT)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(100))
                    .filter(ex -> ex instanceof Exception)
                )
                .block();
        }
        
        public ThermalmapAtTimeResponseDTO fetchThermalmapReadingAtTime(
                ThermalmapAtTimeRequestDTO request,
                String userEmail
            ) {
                String authToken = getValidatedToken(userEmail);
                HttpClient client = HttpClient.create()
                    .responseTimeout(REQUEST_TIMEOUT)
                    .doOnConnected(c -> c.addHandlerLast(new ReadTimeoutHandler(REQUEST_TIMEOUT.getSeconds(), TimeUnit.SECONDS)));
                return webClient.mutate()
                    .clientConnector(new ReactorClientHttpConnector(client))
                    .build()
                    .post()
                    .uri("/thermalmap/reading_at_time")
                    .header("Authorization", "Bearer " + authToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(this::isErrorResponse, this::handleErrorResponse)
                    .bodyToMono(ThermalmapAtTimeResponseDTO.class)
                    .timeout(REQUEST_TIMEOUT)
                    .retryWhen(Retry.backoff(2, Duration.ofMillis(100)))
                    .block();
            }
        
        
        /**
         * Blocking export method using WebClient blocking call.
         */
        public byte[] exportData(ExportRequestDTO request, String userEmail) {
            String authToken = getValidatedToken(userEmail);

            // Prepare and execute a synchronous HTTP call to the microservice
            byte[] data = webClient.post()
                .uri("/export")
                .header("Authorization", "Bearer " + authToken)
                .accept(MediaType.APPLICATION_OCTET_STREAM)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(this::isErrorResponse, this::handleErrorResponse)
                .bodyToMono(byte[].class)
                .block();

            if (data == null || data.length == 0) {
                throw new RuntimeException("No data received from export endpoint");
            }

            return data;
        }

    
    
    
    
}