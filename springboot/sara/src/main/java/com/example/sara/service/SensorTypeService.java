package com.example.sara.service;

import com.example.sara.dto.SensorTypeDto;
import com.example.sara.dto.SensorTypeCreateDto;
import java.util.List;

/**
 * Service interface for SensorType operations.
 */
public interface SensorTypeService {
    SensorTypeDto createSensorType(SensorTypeCreateDto dto);
    SensorTypeDto updateSensorType(Long sensorTypeId, SensorTypeCreateDto dto);
    void deleteSensorType(Long sensorTypeId);
    List<SensorTypeDto> getAllSensorTypes();
    Long countTotalSensorTypes();
}
