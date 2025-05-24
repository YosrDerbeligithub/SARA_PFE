package com.example.sara.repositories;

import com.example.sara.model.SensorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HierarchyRepository extends JpaRepository<SensorType, Long> {

    @Query(value = """
        SELECT 
            st.sensor_type_id AS sensorTypeId,
            st.name AS sensorType,
            st.unit,
            st.display_color AS sensorTypeColor,
            s.site_id AS siteId,
            s.name AS siteName,
            s.display_color AS siteColor,
            l.location_id AS locationId,
            l.name AS locationName,
            l.display_color AS locationColor,
            sb.sensor_box_id AS sensorBoxId,
            sb.agent_serial AS agentSerial,
            sb.display_color AS sensorBoxColor,
            sa.display_color AS assignmentColor
        FROM sensor_type st
        LEFT JOIN sensor_assignment sa ON st.sensor_type_id = sa.sensor_type_id
        LEFT JOIN sensor_box sb ON sa.sensor_box_id = sb.sensor_box_id
        LEFT JOIN location l ON sb.location_id = l.location_id
        LEFT JOIN site s ON l.site_id = s.site_id
        ORDER BY st.sensor_type_id, s.site_id, l.location_id, sb.sensor_box_id
        """, nativeQuery = true)
    List<Object[]> getSensorCentricHierarchy();

    @Query(value = """
        SELECT 
            s.site_id AS siteId,
            s.name AS siteName,
            s.type AS siteType,
            s.display_color AS siteColor,
            l.location_id AS locationId,
            l.name AS locationName,
            l.display_color AS locationColor,
            sb.sensor_box_id AS sensorBoxId,
            sb.agent_serial AS agentSerial,
            sb.display_color AS sensorBoxColor,
            st.sensor_type_id AS sensorTypeId,
            st.name AS sensorType,
            st.display_color AS sensorTypeColor,
            sa.display_color AS assignmentColor
        FROM site s
        JOIN location l ON s.site_id = l.site_id
        LEFT JOIN sensor_box sb ON l.location_id = sb.location_id
        LEFT JOIN sensor_assignment sa ON sb.sensor_box_id = sa.sensor_box_id
        LEFT JOIN sensor_type st ON sa.sensor_type_id = st.sensor_type_id
        ORDER BY s.site_id, l.location_id, sb.sensor_box_id, st.sensor_type_id
        """, nativeQuery = true)
    List<Object[]> getLocationCentricHierarchy();
}