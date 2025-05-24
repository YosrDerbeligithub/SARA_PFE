package com.example.sara.controller;

import com.example.sara.dto.hierarchy.SensorTypeLevel;
import com.example.sara.dto.hierarchy.SiteLevelLocationCentric;
import com.example.sara.service.HierarchyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/**
 * REST Controller for hierarchy endpoints.
 */
@RestController
@RequestMapping("/api/hierarchy")
public class HierarchyController {

    private final HierarchyService hierarchyService;

    @Autowired
    public HierarchyController(HierarchyService hierarchyService) {
        this.hierarchyService = hierarchyService;
    }

    @GetMapping("/sensor-centric")
    public ResponseEntity<List<SensorTypeLevel>> getSensorCentricHierarchy() {
        return ResponseEntity.ok(hierarchyService.getSensorCentricHierarchy());
    }

    @GetMapping("/location-centric")
    public ResponseEntity<List<SiteLevelLocationCentric>> getLocationCentricHierarchy() {
        return ResponseEntity.ok(hierarchyService.getLocationCentricHierarchy());
    }
}