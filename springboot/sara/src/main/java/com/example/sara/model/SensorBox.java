package com.example.sara.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents a SensorBox entity.
 */
@Entity
@Table(name = "sensor_box") // Align table name with snake_case convention
public class SensorBox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sensorBoxId; // Maps to "sensor_box_id" by default

    @Column(nullable = false, length = 255)
    private String agentSerial; // Maps to "agent_serial" by default

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = true) // Maps to "location_id" by default
    private Location location;

    @OneToMany(mappedBy = "sensorBox", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SensorAssignment> sensorAssignments;

    @Column(updatable = false)
    private LocalDateTime createdAt; // Maps to "created_at" by default

    @Column(nullable = false, length = 7)
    private String displayColor = "#FFFFFF"; // Maps to "display_color" by default

    public SensorBox() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getSensorBoxId() {
        return sensorBoxId;
    }

    public void setSensorBoxId(Long sensorBoxId) {
        this.sensorBoxId = sensorBoxId;
    }

    public String getAgentSerial() {
        return agentSerial;
    }

    public void setAgentSerial(String agentSerial) {
        this.agentSerial = agentSerial;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public List<SensorAssignment> getSensorAssignments() {
        return sensorAssignments;
    }

    public void setSensorAssignments(List<SensorAssignment> sensorAssignments) {
        this.sensorAssignments = sensorAssignments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getDisplayColor() {
        return displayColor;
    }

    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
