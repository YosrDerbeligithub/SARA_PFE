package com.example.sara.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents a SensorType entity.
 */
@Entity
@Table(name = "sensor_type") // Align table name with snake_case convention
public class SensorType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sensorTypeId; // Maps to "sensor_type_id" by default

    @Column(nullable = false, unique = true, length = 255)
    private String name; // Maps to "name" by default

    @Column(nullable = false, length = 50)
    private String unit; // Maps to "unit" by default

    @Column(updatable = false)
    private LocalDateTime createdAt; // Maps to "created_at" by default

    @OneToMany(mappedBy = "sensorType", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SensorAssignment> sensorAssignments;

    @Column(nullable = false, length = 7)
    private String displayColor = "#FFFFFF"; // Maps to "display_color" by default

    public SensorType() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getSensorTypeId() {
        return sensorTypeId;
    }

    public void setSensorTypeId(Long sensorTypeId) {
        this.sensorTypeId = sensorTypeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<SensorAssignment> getSensorAssignments() {
        return sensorAssignments;
    }

    public void setSensorAssignments(List<SensorAssignment> sensorAssignments) {
        this.sensorAssignments = sensorAssignments;
    }

    public String getDisplayColor() {
        return displayColor;
    }

    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
