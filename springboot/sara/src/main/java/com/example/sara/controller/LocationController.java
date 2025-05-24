package com.example.sara.controller;

import com.example.sara.dto.LocationDto;
import com.example.sara.dto.LocationCreateDto;
import com.example.sara.service.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST Controller for Location endpoints.
 */
@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;

    @Autowired
    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    /**
     * GET endpoint to retrieve all locations.
     */
    @GetMapping
    public ResponseEntity<List<LocationDto>> getAllLocations() {
        return ResponseEntity.ok(locationService.getAllLocations());
    }

    /**
     * GET endpoint to return the total count of locations.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countLocations() {
        return ResponseEntity.ok(locationService.countTotalLocations());
    }

    /**
     * POST endpoint to create a new location (Admin only).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<LocationDto> createLocation(@RequestBody LocationCreateDto dto) {
        return ResponseEntity.ok(locationService.createLocation(dto));
    }

    /**
     * PUT endpoint to update an existing location (Admin only).
     */
    @PutMapping("/{locationId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<LocationDto> updateLocation(@PathVariable Long locationId, @RequestBody LocationCreateDto dto) {
        return ResponseEntity.ok(locationService.updateLocation(locationId, dto));
    }

    /**
     * DELETE endpoint to remove a location (Admin only).
     */
    @DeleteMapping("/{locationId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long locationId) {
        locationService.deleteLocation(locationId);
        return ResponseEntity.noContent().build();
    }
}
