package com.example.sara.service;

import com.example.sara.dto.hierarchy.SensorTypeLevel;
import com.example.sara.dto.hierarchy.SiteLevelLocationCentric;
import java.util.List;

/**
 * Service interface for hierarchy endpoints.
 */
public interface HierarchyService {
    List<SensorTypeLevel> getSensorCentricHierarchy();
    List<SiteLevelLocationCentric> getLocationCentricHierarchy();
}