package com.example.sara.controller;

import com.example.sara.dto.SensorBoxDto;
import com.example.sara.dto.SensorBoxCreateDto;
import com.example.sara.service.SensorBoxService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST Controller for SensorBox endpoints.
 */
@RestController
@RequestMapping("/api/sensorboxes")
public class SensorBoxController {

    private final SensorBoxService sensorBoxService;

    @Autowired
    public SensorBoxController(SensorBoxService sensorBoxService) {
        this.sensorBoxService = sensorBoxService;
    }

    /**
     * GET endpoint to retrieve all sensor boxes.
     */
    @GetMapping
    public ResponseEntity<List<SensorBoxDto>> getAllSensorBoxes() {
        return ResponseEntity.ok(sensorBoxService.getAllSensorBoxes());
    }

    /**
     * GET endpoint to return the total count of sensor boxes.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countSensorBoxes() {
        return ResponseEntity.ok(sensorBoxService.countTotalSensorBoxes());
    }

    /**
     * POST endpoint to create a new sensor box (Admin only).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SensorBoxDto> createSensorBox(@RequestBody SensorBoxCreateDto dto) {
        return ResponseEntity.ok(sensorBoxService.createSensorBox(dto));
    }

    /**
     * PUT endpoint to update an existing sensor box (Admin only).
     */
    @PutMapping("/{sensorBoxId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SensorBoxDto> updateSensorBox(@PathVariable Long sensorBoxId, @RequestBody SensorBoxCreateDto dto) {
        return ResponseEntity.ok(sensorBoxService.updateSensorBox(sensorBoxId, dto));
    }

    /**
     * DELETE endpoint to remove a sensor box (Admin only).
     */
    @DeleteMapping("/{sensorBoxId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSensorBox(@PathVariable Long sensorBoxId) {
        sensorBoxService.deleteSensorBox(sensorBoxId);
        return ResponseEntity.noContent().build();
    }
}
