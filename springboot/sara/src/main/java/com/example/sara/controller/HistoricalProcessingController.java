package com.example.sara.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.example.sara.dto.ExportRequestDTO;
import com.example.sara.dto.RadioDevicesAtTimeRequestDTO;
import com.example.sara.dto.RadioDevicesAtTimeResponseDTO;
import com.example.sara.dto.ThermalmapAtTimeRequestDTO;
import com.example.sara.dto.ThermalmapAtTimeResponseDTO;
import com.example.sara.model.ProcessingRequestDTO;
import com.example.sara.model.ProcessingResponseDTO;
import com.example.sara.model.User;
import com.example.sara.service.HistoricalProcessingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import reactor.core.publisher.Flux;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/historical")
@Tag(name = "Historical Processing", description = "Endpoints for processing historical sensor data")


public class HistoricalProcessingController {
	private static final Logger logger = LoggerFactory.getLogger(HistoricalProcessingController.class);


    private final HistoricalProcessingService processingService;

    public HistoricalProcessingController(HistoricalProcessingService processingService) {
        this.processingService = processingService;
    }

    @Operation(summary = "Process Historical Sensor Data", description = "Aggregates sensor data based on specified time ranges, aggregation level, and metric.")
    @PostMapping("/process")
    public ResponseEntity<?> processHistoricalData(@Valid @RequestBody ProcessingRequestDTO request,@AuthenticationPrincipal User user
 ) {
    	System.out.println("DEBUG - Request received at: tawa ");
        logger.info("Received processing request: {}", request);
        try {
            ProcessingResponseDTO response = processingService.processHistoricalData(request, user.getEmail());
            
            if (response == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No data found for the specified parameters"));
            }
            
            return ResponseEntity.ok(response);
            
        } catch (WebClientResponseException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "error", "Processing service error",
                            "message", e.getMessage(),
                            "status", e.getStatusCode().value()
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal server error",
                            "message", e.getMessage(),
                            "status", HttpStatus.INTERNAL_SERVER_ERROR.value()
                    ));
        }
    }
    
    
    
    @PostMapping("/radio/devices_at_time")
    public ResponseEntity<?> getRadioDevicesAtTime(
        @Valid @RequestBody RadioDevicesAtTimeRequestDTO request,
        @AuthenticationPrincipal User user
    ) {
        logger.info("Fetching radio devices at {} for agent {}", request.getTimestamp(), request.getAgent_serial());
        try {
            RadioDevicesAtTimeResponseDTO response = processingService.fetchRadioDevicesAtTime(request, user.getEmail());
            return ResponseEntity.ok(response);
        } catch (WebClientResponseException e) {
            logger.error("Error from processing service: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                .body(Map.of(
                    "error", "Processing service error",
                    "message", e.getResponseBodyAsString(),
                    "status", e.getStatusCode().value()
                ));
        } catch (Exception e) {
            logger.error("Internal error fetching radio devices: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    
    @PostMapping("/thermalmap/reading_at_time")
    public ResponseEntity<?> getThermalmapReadingAtTime(
        @Valid @RequestBody ThermalmapAtTimeRequestDTO request,
        @AuthenticationPrincipal User user
    ) {
        logger.info("Fetching thermalmap reading at {} for agent {}", request.getTimestamp(), request.getAgentSerial());
        try {
            ThermalmapAtTimeResponseDTO response = processingService.fetchThermalmapReadingAtTime(request, user.getEmail());
            return ResponseEntity.ok(response);
        } catch (WebClientResponseException e) {
            logger.error("Error from processing service: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                .body(Map.of(
                    "error", "Processing service error",
                    "message", e.getResponseBodyAsString(),
                    "status", e.getStatusCode().value()
                ));
        } catch (Exception e) {
            logger.error("Internal error fetching thermalmap reading: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    


    
    @PostMapping("/export-data")
    public ResponseEntity<byte[]> exportData(
        @Valid @RequestBody ExportRequestDTO request,
        @AuthenticationPrincipal User user
    ) {
        // Delegate to the blocking service
        byte[] payload = processingService.exportData(request, user.getEmail());

        // Build filename
        String filename = String.format(
            "%s_%s_%s.%s",
            request.getFacility(),
            request.getAgentSerial().get(0),
            request.getStart().toString().replace(':', '-'),
            request.getFormat()
        );

        // Prepare response headers
        HttpHeaders headers = new HttpHeaders();
        if ("csv".equalsIgnoreCase(request.getFormat())) {
            headers.setContentType(MediaType.TEXT_PLAIN);
        } else {
            headers.setContentType(MediaType.APPLICATION_JSON);
        }
        headers.setContentDisposition(ContentDisposition
            .attachment()
            .filename(filename)
            .build()
        );

        return new ResponseEntity<>(payload, headers, HttpStatus.OK);
    }
    
    
    
}