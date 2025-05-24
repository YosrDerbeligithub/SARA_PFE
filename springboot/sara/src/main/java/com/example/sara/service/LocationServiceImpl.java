package com.example.sara.service;

import com.example.sara.dto.LocationDto;
import com.example.sara.dto.LocationCreateDto;
import com.example.sara.model.Location;
import com.example.sara.model.Site;
import com.example.sara.repositories.LocationRepository;
import com.example.sara.repositories.SiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;

/**
 * Implementation of the LocationService interface.
 */
@Service
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;
    private final SiteRepository siteRepository;

    @Autowired
    public LocationServiceImpl(LocationRepository locationRepository, SiteRepository siteRepository) {
        this.locationRepository = locationRepository;
        this.siteRepository = siteRepository;
    }

    @Override
    public LocationDto createLocation(LocationCreateDto dto) {
        Site site = siteRepository.findById(dto.getSiteId())
                .orElseThrow(() -> new RuntimeException("Site not found with id " + dto.getSiteId()));
        Location location = new Location();
        location.setName(dto.getName());
        location.setSite(site);
        location.setDisplayColor(dto.getDisplayColor());
        Location saved = locationRepository.save(location);
        return mapToDto(saved);
    }

    @Override
    public LocationDto updateLocation(Long locationId, LocationCreateDto dto) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found with id " + locationId));
        location.setName(dto.getName());
        if (!location.getSite().getSiteId().equals(dto.getSiteId())) {
            Site site = siteRepository.findById(dto.getSiteId())
                    .orElseThrow(() -> new RuntimeException("Site not found with id " + dto.getSiteId()));
            location.setSite(site);
        }
        Location updated = locationRepository.save(location);
        return mapToDto(updated);
    }

    @Override
    public void deleteLocation(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found with id " + locationId));
        locationRepository.delete(location);
    }

    @Override
    public List<LocationDto> getAllLocations() {
        List<Location> locations = locationRepository.findAll();
        return locations.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public Long countTotalLocations() {
        return locationRepository.count();
    }

    /**
     * Maps a Location entity to a LocationDto.
     */
    private LocationDto mapToDto(Location location) {
        LocationDto dto = new LocationDto();
        dto.setLocationId(location.getLocationId());
        dto.setName(location.getName());
        dto.setSiteName(location.getSite().getName());
        dto.setDisplayColor(location.getDisplayColor());
        dto.setSensorBoxCount(location.getSensorBoxes() != null ? location.getSensorBoxes().size() : 0);
        dto.setCreatedAt(location.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return dto;
    }
}
