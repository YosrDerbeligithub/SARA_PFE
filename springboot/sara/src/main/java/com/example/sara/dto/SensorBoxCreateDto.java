package com.example.sara.dto;

/**
 * DTO for creating or updating a SensorBox.
 */
public class SensorBoxCreateDto {
    private String agentSerial;
    private Long locationId;
    private String displayColor;
// To join with Location

    // Getters and Setters

    public String getAgentSerial() {
        return agentSerial;
    }
    public void setAgentSerial(String agentSerial) {
        this.agentSerial = agentSerial;
    }
    public Long getLocationId() {
        return locationId;
    }
    public void setLocationId(Long locationId) {
        this.locationId = locationId;
    }
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
