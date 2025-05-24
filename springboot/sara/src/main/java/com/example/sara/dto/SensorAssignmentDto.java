package com.example.sara.dto;

/**
 * DTO for returning SensorAssignment information.
 */
public class SensorAssignmentDto {
    private Long id;
    private String sensorBoxAgentSerial;
    private String sensorTypeName;
    private String displayColor;

    // Getters and Setters

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getSensorBoxAgentSerial() {
        return sensorBoxAgentSerial;
    }
    public void setSensorBoxAgentSerial(String sensorBoxAgentSerial) {
        this.sensorBoxAgentSerial = sensorBoxAgentSerial;
    }
    public String getSensorTypeName() {
        return sensorTypeName;
    }
    public void setSensorTypeName(String sensorTypeName) {
        this.sensorTypeName = sensorTypeName;
    }
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
