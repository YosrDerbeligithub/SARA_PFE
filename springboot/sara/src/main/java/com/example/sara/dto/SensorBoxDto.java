package com.example.sara.dto;

/**
 * DTO for returning SensorBox information.
 */
public class SensorBoxDto {
    private Long sensorBoxId;
    private String agentSerial;
    private String locationName;
    private String siteName;
    private Integer sensorCount;
    private String status;
    private String displayColor;
// active, inactive, maintenance

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
    public String getLocationName() {
        return locationName;
    }
    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }
    public String getSiteName() {
        return siteName;
    }
    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }
    public Integer getSensorCount() {
        return sensorCount;
    }
    public void setSensorCount(Integer sensorCount) {
        this.sensorCount = sensorCount;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
