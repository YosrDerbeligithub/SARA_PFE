package com.example.sara.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a SensorAssignment entity.
 */
@Entity
@Table(
    name = "sensor_assignment", // Align table name with snake_case convention
    uniqueConstraints = @UniqueConstraint(columnNames = {"sensor_box_id", "sensor_type_id"}) // Align column names
)
public class SensorAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Maps to "id" by default

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_box_id", nullable = false) // Maps to "sensor_box_id" by default
    private SensorBox sensorBox;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_type_id", nullable = false) // Maps to "sensor_type_id" by default
    private SensorType sensorType;

    @Column(nullable = false, length = 7)
    private String displayColor = "#FFFFFF"; // Maps to "display_color" by default

    @Column(updatable = false)
    private LocalDateTime createdAt; // Maps to "created_at" by default

    public SensorAssignment() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public SensorBox getSensorBox() {
        return sensorBox;
    }

    public void setSensorBox(SensorBox sensorBox) {
        this.sensorBox = sensorBox;
    }

    public SensorType getSensorType() {
        return sensorType;
    }

    public void setSensorType(SensorType sensorType) {
        this.sensorType = sensorType;
    }

    public String getDisplayColor() {
        return displayColor;
    }

    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

