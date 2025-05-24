package com.example.sara.service;

import com.example.sara.dto.SensorAssignmentDto;
import com.example.sara.dto.SensorAssignmentCreateDto;
import com.example.sara.model.SensorAssignment;
import com.example.sara.model.SensorBox;
import com.example.sara.model.SensorType;
import com.example.sara.repositories.SensorAssignmentRepository;
import com.example.sara.repositories.SensorBoxRepository;
import com.example.sara.repositories.SensorTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of the SensorAssignmentService interface.
 */
@Service
public class SensorAssignmentServiceImpl implements SensorAssignmentService {

    private final SensorAssignmentRepository sensorAssignmentRepository;
    private final SensorBoxRepository sensorBoxRepository;
    private final SensorTypeRepository sensorTypeRepository;

    @Autowired
    public SensorAssignmentServiceImpl(SensorAssignmentRepository sensorAssignmentRepository,
                                       SensorBoxRepository sensorBoxRepository,
                                       SensorTypeRepository sensorTypeRepository) {
        this.sensorAssignmentRepository = sensorAssignmentRepository;
        this.sensorBoxRepository = sensorBoxRepository;
        this.sensorTypeRepository = sensorTypeRepository;
    }

    @Override
    public SensorAssignmentDto createSensorAssignment(SensorAssignmentCreateDto dto) {
        SensorBox sensorBox = sensorBoxRepository.findById(dto.getSensorBoxId())
                .orElseThrow(() -> new RuntimeException("SensorBox not found with id " + dto.getSensorBoxId()));
        SensorType sensorType = sensorTypeRepository.findById(dto.getSensorTypeId())
                .orElseThrow(() -> new RuntimeException("SensorType not found with id " + dto.getSensorTypeId()));
        SensorAssignment assignment = new SensorAssignment();
        assignment.setSensorBox(sensorBox);
        assignment.setSensorType(sensorType);
        if (dto.getDisplayColor() != null) {
            assignment.setDisplayColor(dto.getDisplayColor());
        }
        SensorAssignment saved = sensorAssignmentRepository.save(assignment);
        return mapToDto(saved);
    }

    @Override
    public SensorAssignmentDto updateSensorAssignment(Long id, SensorAssignmentCreateDto dto) {
        SensorAssignment assignment = sensorAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SensorAssignment not found with id " + id));
        if (!assignment.getSensorBox().getSensorBoxId().equals(dto.getSensorBoxId())) {
            SensorBox sensorBox = sensorBoxRepository.findById(dto.getSensorBoxId())
                    .orElseThrow(() -> new RuntimeException("SensorBox not found with id " + dto.getSensorBoxId()));
            assignment.setSensorBox(sensorBox);
        }
        if (!assignment.getSensorType().getSensorTypeId().equals(dto.getSensorTypeId())) {
            SensorType sensorType = sensorTypeRepository.findById(dto.getSensorTypeId())
                    .orElseThrow(() -> new RuntimeException("SensorType not found with id " + dto.getSensorTypeId()));
            assignment.setSensorType(sensorType);
        }
        if (dto.getDisplayColor() != null) {
            assignment.setDisplayColor(dto.getDisplayColor());
        }
        SensorAssignment updated = sensorAssignmentRepository.save(assignment);
        return mapToDto(updated);
    }

    @Override
    public void deleteSensorAssignment(Long id) {
        SensorAssignment assignment = sensorAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SensorAssignment not found with id " + id));
        sensorAssignmentRepository.delete(assignment);
    }

    @Override
    public List<SensorAssignmentDto> getAllSensorAssignments() {
        List<SensorAssignment> assignments = sensorAssignmentRepository.findAll();
        return assignments.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Maps a SensorAssignment entity to a SensorAssignmentDto.
     */
    private SensorAssignmentDto mapToDto(SensorAssignment assignment) {
        SensorAssignmentDto dto = new SensorAssignmentDto();
        dto.setId(assignment.getId());
        dto.setSensorBoxAgentSerial(assignment.getSensorBox().getAgentSerial());
        dto.setSensorTypeName(assignment.getSensorType().getName());
        dto.setDisplayColor(assignment.getDisplayColor());
        return dto;
    }
}
