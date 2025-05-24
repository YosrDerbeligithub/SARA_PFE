package com.example.sara.service;

import com.example.sara.dto.SensorTypeDto;
import com.example.sara.dto.SensorTypeCreateDto;
import com.example.sara.model.SensorType;
import com.example.sara.repositories.SensorTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of the SensorTypeService interface.
 */
@Service
public class SensorTypeServiceImpl implements SensorTypeService {

    private final SensorTypeRepository sensorTypeRepository;

    @Autowired
    public SensorTypeServiceImpl(SensorTypeRepository sensorTypeRepository) {
        this.sensorTypeRepository = sensorTypeRepository;
    }

    @Override
    public SensorTypeDto createSensorType(SensorTypeCreateDto dto) {
        SensorType sensorType = new SensorType();
        sensorType.setName(dto.getName());
        sensorType.setUnit(dto.getUnit());
        sensorType.setDisplayColor(dto.getDisplayColor());
        SensorType saved = sensorTypeRepository.save(sensorType);
        return mapToDto(saved);
    }

    @Override
    public SensorTypeDto updateSensorType(Long sensorTypeId, SensorTypeCreateDto dto) {
        SensorType sensorType = sensorTypeRepository.findById(sensorTypeId)
                .orElseThrow(() -> new RuntimeException("SensorType not found with id " + sensorTypeId));
        sensorType.setName(dto.getName());
        sensorType.setUnit(dto.getUnit());
        sensorType.setDisplayColor(dto.getDisplayColor());

        SensorType updated = sensorTypeRepository.save(sensorType);
        return mapToDto(updated);
    }

    @Override
    public void deleteSensorType(Long sensorTypeId) {
        SensorType sensorType = sensorTypeRepository.findById(sensorTypeId)
                .orElseThrow(() -> new RuntimeException("SensorType not found with id " + sensorTypeId));
        sensorTypeRepository.delete(sensorType);
    }

    @Override
    public List<SensorTypeDto> getAllSensorTypes() {
        List<SensorType> types = sensorTypeRepository.findAll();
        return types.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public Long countTotalSensorTypes() {
        return sensorTypeRepository.count();
    }

    /**
     * Maps a SensorType entity to a SensorTypeDto.
     */
    private SensorTypeDto mapToDto(SensorType sensorType) {
        SensorTypeDto dto = new SensorTypeDto();
        dto.setSensorTypeId(sensorType.getSensorTypeId());
        dto.setName(sensorType.getName());
        dto.setUnit(sensorType.getUnit());
        dto.setUsage(sensorType.getSensorAssignments() != null ? sensorType.getSensorAssignments().size() : 0);
        dto.setDisplayColor("#FFFFFF"); // Default color; adjust as needed.
        return dto;
    }
}
