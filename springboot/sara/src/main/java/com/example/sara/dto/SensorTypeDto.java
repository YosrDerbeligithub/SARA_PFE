package com.example.sara.dto;

/**
 * DTO for returning SensorType information.
 */
public class SensorTypeDto {
    private Long sensorTypeId;
    private String name;
    private String unit;
    private Integer usage; // Number of sensors using this type
    private String displayColor; // For GET all endpoint

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
    public Integer getUsage() {
        return usage;
    }
    public void setUsage(Integer usage) {
        this.usage = usage;
    }
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
