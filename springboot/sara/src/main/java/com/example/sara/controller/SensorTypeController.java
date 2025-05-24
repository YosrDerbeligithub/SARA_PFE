package com.example.sara.controller;

import com.example.sara.dto.SensorTypeDto;
import com.example.sara.dto.SensorTypeCreateDto;
import com.example.sara.service.SensorTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST Controller for SensorType endpoints.
 */
@RestController
@RequestMapping("/api/sensortypes")
public class SensorTypeController {

    private final SensorTypeService sensorTypeService;

    @Autowired
    public SensorTypeController(SensorTypeService sensorTypeService) {
        this.sensorTypeService = sensorTypeService;
    }

    /**
     * GET endpoint to retrieve all sensor types.
     */
    @GetMapping
    public ResponseEntity<List<SensorTypeDto>> getAllSensorTypes() {
        return ResponseEntity.ok(sensorTypeService.getAllSensorTypes());
    }

    /**
     * GET endpoint to return the total count of sensor types.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countSensorTypes() {
        return ResponseEntity.ok(sensorTypeService.countTotalSensorTypes());
    }

    /**
     * POST endpoint to create a new sensor type (Admin only).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SensorTypeDto> createSensorType(@RequestBody SensorTypeCreateDto dto) {
        return ResponseEntity.ok(sensorTypeService.createSensorType(dto));
    }

    /**
     * PUT endpoint to update an existing sensor type (Admin only).
     */
    @PutMapping("/{sensorTypeId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SensorTypeDto> updateSensorType(@PathVariable Long sensorTypeId, @RequestBody SensorTypeCreateDto dto) {
        return ResponseEntity.ok(sensorTypeService.updateSensorType(sensorTypeId, dto));
    }

    /**
     * DELETE endpoint to remove a sensor type (Admin only).
     */
    @DeleteMapping("/{sensorTypeId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSensorType(@PathVariable Long sensorTypeId) {
        sensorTypeService.deleteSensorType(sensorTypeId);
        return ResponseEntity.noContent().build();
    }
}
