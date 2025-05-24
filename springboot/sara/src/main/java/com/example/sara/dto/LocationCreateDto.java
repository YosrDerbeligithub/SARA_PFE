package com.example.sara.dto;

/**
 * DTO for creating or updating a Location.
 */
public class LocationCreateDto {
    private String name;
    private Long siteId; 
    private String displayColor;
// To join with Site

    // Getters and Setters

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Long getSiteId() {
        return siteId;
    }
    public void setSiteId(Long siteId) {
        this.siteId = siteId;
    }
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
