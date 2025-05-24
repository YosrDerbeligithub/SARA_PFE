package com.example.sara.dto;

/**
 * DTO for creating or updating a Site.
 */
public class SiteCreateDto {
    private String name;
    private String type; 
    private String displayColor;
// Expected: CAMPUS, MUSEUM, OTHER

    // Getters and Setters

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
    public String getDisplayColor() {
        return displayColor;
    }
    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
