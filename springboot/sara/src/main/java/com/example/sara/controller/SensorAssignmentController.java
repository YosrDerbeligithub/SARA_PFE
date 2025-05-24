package com.example.sara.controller;

import com.example.sara.dto.SensorAssignmentDto;
import com.example.sara.dto.SensorAssignmentCreateDto;
import com.example.sara.service.SensorAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST Controller for SensorAssignment endpoints.
 */
@RestController
@RequestMapping("/api/sensorassignments")
public class SensorAssignmentController {

    private final SensorAssignmentService sensorAssignmentService;

    @Autowired
    public SensorAssignmentController(SensorAssignmentService sensorAssignmentService) {
        this.sensorAssignmentService = sensorAssignmentService;
    }

    /**
     * GET endpoint to retrieve all sensor assignments.
     */
    @GetMapping
    public ResponseEntity<List<SensorAssignmentDto>> getAllSensorAssignments() {
        return ResponseEntity.ok(sensorAssignmentService.getAllSensorAssignments());
    }

    /**
     * POST endpoint to create a new sensor assignment (Admin only).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SensorAssignmentDto> createSensorAssignment(@RequestBody SensorAssignmentCreateDto dto) {
        return ResponseEntity.ok(sensorAssignmentService.createSensorAssignment(dto));
    }

    /**
     * PUT endpoint to update an existing sensor assignment (Admin only).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SensorAssignmentDto> updateSensorAssignment(@PathVariable Long id, @RequestBody SensorAssignmentCreateDto dto) {
        return ResponseEntity.ok(sensorAssignmentService.updateSensorAssignment(id, dto));
    }

    /**
     * DELETE endpoint to remove a sensor assignment (Admin only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSensorAssignment(@PathVariable Long id) {
        sensorAssignmentService.deleteSensorAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
