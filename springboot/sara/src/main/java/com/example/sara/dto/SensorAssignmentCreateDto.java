package com.example.sara.dto;

/**
 * DTO for creating or updating a SensorAssignment.
 */
public class SensorAssignmentCreateDto {
    private Long sensorBoxId;
    private Long sensorTypeId;
    private String displayColor; // Optional, default "#FFFFFF" if not provided

    // Getters and Setters

    public Long getSensorBoxId() {
        return sensorBoxId;
    }
    public void setSensorBoxId(Long sensorBoxId) {
        this.sensorBoxId = sensorBoxId;
    }
    public Long getSensorTypeId() {
        return sensorTypeId;
    }
    public void setSensorTypeId(Long sensorTypeId) {
        this.sensorTypeId = sensorTypeId;
    }
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
