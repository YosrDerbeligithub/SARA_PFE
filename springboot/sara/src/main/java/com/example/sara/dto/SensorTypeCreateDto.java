package com.example.sara.dto;

/**
 * DTO for creating or updating a SensorType.
 */
public class SensorTypeCreateDto {
    private String name;
    private String unit;
    private String displayColor; // For GET all endpoint


    // Getters and Setters

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
    
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
