package com.example.sara.service;

import com.example.sara.dto.hierarchy.*;
import com.example.sara.repositories.HierarchyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class HierarchyServiceImpl implements HierarchyService {
    private static final Logger log = LoggerFactory.getLogger(HierarchyServiceImpl.class);

    private final HierarchyRepository hierarchyRepository;

    @Autowired
    public HierarchyServiceImpl(HierarchyRepository hierarchyRepository) {
        this.hierarchyRepository = hierarchyRepository;
    }

    @Override
    public List<SensorTypeLevel> getSensorCentricHierarchy() {
        List<Object[]> results = hierarchyRepository.getSensorCentricHierarchy();
        Map<Long, SensorTypeLevel> sensorTypeMap = new LinkedHashMap<>();
        Map<Long, SiteLevel> siteMap = new HashMap<>();
        Map<Long, LocationLevel> locationMap = new HashMap<>();
        Map<Long, SensorBoxLevel> sensorBoxMap = new HashMap<>();

        for (Object[] row : results) {
            Long sensorTypeId = (Long) row[0];
            String sensorTypeName = (String) row[1];
            String unit = (String) row[2];
            String sensorTypeColor = (String) row[3];
            Long siteId = (Long) row[4];
            String siteName = (String) row[5];
            String siteColor = (String) row[6];
            Long locationId = (Long) row[7];
            String locationName = (String) row[8];
            String locationColor = (String) row[9];
            Long sensorBoxId = (Long) row[10];
            String agentSerial = (String) row[11];
            String sensorBoxColor = (String) row[12];
            String assignmentColor = (String) row[13];

            if (sensorTypeId == null || siteId == null || locationId == null || sensorBoxId == null) {
                log.warn("Invalid row data: {}", Arrays.toString(row));
                continue;
            }

            SensorTypeLevel sensorType = sensorTypeMap.computeIfAbsent(sensorTypeId, id -> 
                new SensorTypeLevel(sensorTypeId, sensorTypeName, unit, sensorTypeColor, new ArrayList<>()));

            SiteLevel site = findOrCreateSite(siteMap, siteId, siteName, siteColor);
            if (site != null && !sensorType.getSites().contains(site)) {
                sensorType.getSites().add(site);
            }

            LocationLevel location = findOrCreateLocation(locationMap, locationId, locationName, locationColor);
            if (location != null && !site.getLocations().contains(location)) {
                site.getLocations().add(location);
            }

            SensorBoxLevel sensorBox = findOrCreateSensorBox(sensorBoxMap, sensorBoxId, agentSerial, sensorBoxColor);
            if (sensorBox != null && !location.getSensorBoxes().contains(sensorBox)) {
                location.getSensorBoxes().add(sensorBox);
            }

            if (assignmentColor != null) {
                sensorBox.getAssignments().add(new SensorAssignmentLevel(assignmentColor));
            }
        }

        return new ArrayList<>(sensorTypeMap.values());
    }

    @Override
    public List<SiteLevelLocationCentric> getLocationCentricHierarchy() {
        List<Object[]> results = hierarchyRepository.getLocationCentricHierarchy();
        Map<Long, SiteLevelLocationCentric> siteMap = new LinkedHashMap<>();
        Map<Long, LocationLevelLocationCentric> locationMap = new HashMap<>();
        Map<Long, SensorBoxLevelLocationCentric> sensorBoxMap = new HashMap<>();

        for (Object[] row : results) {
            Long siteId = (Long) row[0];
            String siteName = (String) row[1];
            String siteType = (String) row[2];
            String siteColor = (String) row[3];
            Long locationId = (Long) row[4];
            String locationName = (String) row[5];
            String locationColor = (String) row[6];
            Long sensorBoxId = (Long) row[7];
            String agentSerial = (String) row[8];
            String sensorBoxColor = (String) row[9];
            Long sensorTypeId = (Long) row[10];
            String sensorTypeName = (String) row[11];
            String sensorTypeColor = (String) row[12];
            String assignmentColor = (String) row[13];

            if (siteId == null || locationId == null || sensorBoxId == null) {
                log.warn("Invalid row data: {}", Arrays.toString(row));
                continue;
            }

            SiteLevelLocationCentric site = siteMap.computeIfAbsent(siteId, id -> 
                new SiteLevelLocationCentric(siteId, siteName, siteType, siteColor, new ArrayList<>()));

            LocationLevelLocationCentric location = findOrCreateLocationLocationCentric(locationMap, locationId, locationName, locationColor);
            
            // Add location to site if not already present
            if (location != null && !site.getLocations().contains(location)) {
                site.getLocations().add(location);
            }

            SensorBoxLevelLocationCentric sensorBox = findOrCreateSensorBoxLocationCentric(sensorBoxMap, sensorBoxId, agentSerial, sensorBoxColor);
            
            // Add sensor box to location if not already present
            if (sensorBox != null && !location.getSensorBoxes().contains(sensorBox)) {
                location.getSensorBoxes().add(sensorBox);
            }

            // Add assignment to sensor box
            if (sensorTypeId != null) {
                sensorBox.getAssignments().add(new SensorAssignmentLevelLocationCentric(
                    sensorTypeId, 
                    sensorTypeName, 
                    sensorTypeColor, 
                    assignmentColor
                ));
            }
        }

        return new ArrayList<>(siteMap.values());
    }

    // Helper methods for Sensor-Centric
    private SiteLevel findOrCreateSite(Map<Long, SiteLevel> siteMap, Long siteId, String name, String color) {
        return siteMap.computeIfAbsent(siteId, id -> new SiteLevel(siteId, name, color, new ArrayList<>()));
    }

    private LocationLevel findOrCreateLocation(Map<Long, LocationLevel> locationMap, Long locationId, String name, String color) {
        return locationMap.computeIfAbsent(locationId, id -> new LocationLevel(locationId, name, color, new ArrayList<>()));
    }

    private SensorBoxLevel findOrCreateSensorBox(Map<Long, SensorBoxLevel> sensorBoxMap, Long sensorBoxId, String agentSerial, String color) {
        return sensorBoxMap.computeIfAbsent(sensorBoxId, id -> new SensorBoxLevel(sensorBoxId, agentSerial, color, new ArrayList<>()));
    }

    // Helper methods for Location-Centric
    private LocationLevelLocationCentric findOrCreateLocationLocationCentric(Map<Long, LocationLevelLocationCentric> locationMap, Long locationId, String name, String color) {
        return locationMap.computeIfAbsent(locationId, id -> new LocationLevelLocationCentric(locationId, name, color, new ArrayList<>()));
    }

    private SensorBoxLevelLocationCentric findOrCreateSensorBoxLocationCentric(Map<Long, SensorBoxLevelLocationCentric> sensorBoxMap, Long sensorBoxId, String agentSerial, String color) {
        return sensorBoxMap.computeIfAbsent(sensorBoxId, id -> new SensorBoxLevelLocationCentric(sensorBoxId, agentSerial, color, new ArrayList<>()));
    }
}