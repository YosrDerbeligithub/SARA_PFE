package com.example.sara.service;

import com.example.sara.dto.SensorBoxDto;
import com.example.sara.dto.SensorBoxCreateDto;
import java.util.List;

/**
 * Service interface for SensorBox operations.
 */
public interface SensorBoxService {
    SensorBoxDto createSensorBox(SensorBoxCreateDto dto);
    SensorBoxDto updateSensorBox(Long sensorBoxId, SensorBoxCreateDto dto);
    void deleteSensorBox(Long sensorBoxId);
    List<SensorBoxDto> getAllSensorBoxes();
    Long countTotalSensorBoxes();
}
