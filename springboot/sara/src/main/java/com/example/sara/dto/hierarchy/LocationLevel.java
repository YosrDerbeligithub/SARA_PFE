package com.example.sara.dto.hierarchy;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;



public class LocationLevel {
    private Long locationId;
    private String locationName;
    private String displayColor; 
    private List<SensorBoxLevel> sensorBoxes;
    
    
    
    
    
    
	public LocationLevel(Long locationId, String locationName, String displayColor, List<SensorBoxLevel> sensorBoxes) {
		super();
		this.locationId = locationId;
		this.locationName = locationName;
		this.displayColor = displayColor;
		this.sensorBoxes = sensorBoxes;
	}
	public Long getLocationId() {
		return locationId;
	}
	public void setLocationId(Long locationId) {
		this.locationId = locationId;
	}
	public String getLocationName() {
		return locationName;
	}
	public void setLocationName(String locationName) {
		this.locationName = locationName;
	}
	public String getDisplayColor() {
		return displayColor;
	}
	public void setDisplayColor(String displayColor) {
		this.displayColor = displayColor;
	}
	public List<SensorBoxLevel> getSensorBoxes() {
		return sensorBoxes;
	}
	public void setSensorBoxes(List<SensorBoxLevel> sensorBoxes) {
		this.sensorBoxes = sensorBoxes;
	}
    
    
    
}
