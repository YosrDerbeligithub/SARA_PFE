package com.example.sara.dto;

/**
 * DTO for returning Location information.
 */
public class LocationDto {
    private Long locationId;
    private String name;
    private String siteName;
    private Integer sensorBoxCount;
    private String createdAt;
    private String displayColor;


    // Getters and Setters

    public Long getLocationId() {
        return locationId;
    }
    public void setLocationId(Long locationId) {
        this.locationId = locationId;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getSiteName() {
        return siteName;
    }
    public void setSiteName(String siteName) {
        this.siteName = siteName;
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
