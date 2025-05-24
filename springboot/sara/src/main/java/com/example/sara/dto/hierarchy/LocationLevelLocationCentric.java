package com.example.sara.dto.hierarchy;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import lombok.AllArgsConstructor;
import lombok.Data;


public class LocationLevelLocationCentric {
    private Long locationId;
    private String locationName;
    private String displayColor;  // Added
    private List<SensorBoxLevelLocationCentric> sensorBoxes;
    
    
    
    
    
    
	public LocationLevelLocationCentric(Long locationId, String locationName, String displayColor,
			List<SensorBoxLevelLocationCentric> sensorBoxes) {
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
	public List<SensorBoxLevelLocationCentric> getSensorBoxes() {
		return sensorBoxes;
	}
	public void setSensorBoxes(List<SensorBoxLevelLocationCentric> sensorBoxes) {
		this.sensorBoxes = sensorBoxes;
	}
	@Override
	public int hashCode() {
		return Objects.hash(displayColor, locationId, locationName, sensorBoxes);
	}
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		LocationLevelLocationCentric other = (LocationLevelLocationCentric) obj;
		return Objects.equals(displayColor, other.displayColor) && Objects.equals(locationId, other.locationId)
				&& Objects.equals(locationName, other.locationName) && Objects.equals(sensorBoxes, other.sensorBoxes);
	}
	
	
	
    
    
    
    
}