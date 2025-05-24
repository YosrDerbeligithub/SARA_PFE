package com.example.sara.service;

import com.example.sara.dto.LocationDto;
import com.example.sara.dto.LocationCreateDto;
import java.util.List;

/**
 * Service interface for Location operations.
 */
public interface LocationService {
    LocationDto createLocation(LocationCreateDto dto);
    LocationDto updateLocation(Long locationId, LocationCreateDto dto);
    void deleteLocation(Long locationId);
    List<LocationDto> getAllLocations();
    Long countTotalLocations();
}
