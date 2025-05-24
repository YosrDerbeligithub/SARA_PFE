package com.example.sara.service;

import com.example.sara.dto.SensorBoxDto;
import com.example.sara.dto.SensorBoxCreateDto;
import com.example.sara.model.Location;
import com.example.sara.model.SensorBox;
import com.example.sara.repositories.LocationRepository;
import com.example.sara.repositories.SensorBoxRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of the SensorBoxService interface.
 */
@Service
public class SensorBoxServiceImpl implements SensorBoxService {

    private final SensorBoxRepository sensorBoxRepository;
    private final LocationRepository locationRepository;

    @Autowired
    public SensorBoxServiceImpl(SensorBoxRepository sensorBoxRepository, LocationRepository locationRepository) {
        this.sensorBoxRepository = sensorBoxRepository;
        this.locationRepository = locationRepository;
    }

    @Override
    public SensorBoxDto createSensorBox(SensorBoxCreateDto dto) {
        Location location = locationRepository.findById(dto.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id " + dto.getLocationId()));
        SensorBox sensorBox = new SensorBox();
        sensorBox.setAgentSerial(dto.getAgentSerial());
        sensorBox.setLocation(location);
        sensorBox.setDisplayColor(dto.getDisplayColor());
        SensorBox saved = sensorBoxRepository.save(sensorBox);
        return mapToDto(saved);
    }

    @Override
    public SensorBoxDto updateSensorBox(Long sensorBoxId, SensorBoxCreateDto dto) {
        SensorBox sensorBox = sensorBoxRepository.findById(sensorBoxId)
                .orElseThrow(() -> new RuntimeException("SensorBox not found with id " + sensorBoxId));
        sensorBox.setAgentSerial(dto.getAgentSerial());
        sensorBox.setDisplayColor(dto.getDisplayColor());
        if (!sensorBox.getLocation().getLocationId().equals(dto.getLocationId())) {
            Location location = locationRepository.findById(dto.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Location not found with id " + dto.getLocationId()));
            sensorBox.setLocation(location);
        }
        SensorBox updated = sensorBoxRepository.save(sensorBox);
        return mapToDto(updated);
    }

    @Override
    public void deleteSensorBox(Long sensorBoxId) {
        SensorBox sensorBox = sensorBoxRepository.findById(sensorBoxId)
                .orElseThrow(() -> new RuntimeException("SensorBox not found with id " + sensorBoxId));
        sensorBoxRepository.delete(sensorBox);
    }

    @Override
    public List<SensorBoxDto> getAllSensorBoxes() {
        List<SensorBox> boxes = sensorBoxRepository.findAll();
        return boxes.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public Long countTotalSensorBoxes() {
        return sensorBoxRepository.count();
    }

    /**
     * Maps a SensorBox entity to a SensorBoxDto.
     */
    private SensorBoxDto mapToDto(SensorBox sensorBox) {
        SensorBoxDto dto = new SensorBoxDto();
        dto.setSensorBoxId(sensorBox.getSensorBoxId());
        dto.setAgentSerial(sensorBox.getAgentSerial());
        dto.setDisplayColor(sensorBox.getDisplayColor());
        dto.setLocationName(sensorBox.getLocation().getName());
        dto.setSiteName(sensorBox.getLocation().getSite().getName());
        dto.setSensorCount(sensorBox.getSensorAssignments() != null ? sensorBox.getSensorAssignments().size() : 0);
        dto.setStatus("active"); // In production, determine status based on actual criteria.
        return dto;
    }
}
