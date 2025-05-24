package com.example.sara.dto;

/**
 * DTO for returning Site information.
 */
public class SiteDto {
    private Long siteId;
    private String name;
    private String type;
    private Integer locationCount;
    private Integer sensorBoxCount;
    private String createdAt;
    private String displayColor;

    // Getters and Setters

    public Long getSiteId() {
        return siteId;
    }
    public void setSiteId(Long siteId) {
        this.siteId = siteId;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getType() {
        return type;
    }
    public void setType(String type) {
        this.type = type;
    }
    public Integer getLocationCount() {
        return locationCount;
    }
    public void setLocationCount(Integer locationCount) {
        this.locationCount = locationCount;
    }
    public Integer getSensorBoxCount() {
        return sensorBoxCount;
    }
    public void setSensorBoxCount(Integer sensorBoxCount) {
        this.sensorBoxCount = sensorBoxCount;
    }
    public String getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
