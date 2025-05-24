package com.example.sara.service;

import com.example.sara.dto.SensorAssignmentDto;
import com.example.sara.dto.SensorAssignmentCreateDto;
import java.util.List;

/**
 * Service interface for SensorAssignment operations.
 */
public interface SensorAssignmentService {
    SensorAssignmentDto createSensorAssignment(SensorAssignmentCreateDto dto);
    SensorAssignmentDto updateSensorAssignment(Long id, SensorAssignmentCreateDto dto);
    void deleteSensorAssignment(Long id);
    List<SensorAssignmentDto> getAllSensorAssignments();
}
