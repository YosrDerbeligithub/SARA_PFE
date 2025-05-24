package com.example.sara.dto.hierarchy;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;


public class SensorTypeLevel {
    private Long sensorTypeId;
    private String sensorType;
    private String unit;
    private String displayColor;  // Added
    private List<SiteLevel> sites;
    
    
	public SensorTypeLevel(Long sensorTypeId, String sensorType, String unit, String displayColor,
			List<SiteLevel> sites) {
		super();
		this.sensorTypeId = sensorTypeId;
		this.sensorType = sensorType;
		this.unit = unit;
		this.displayColor = displayColor;
		this.sites = sites;
	}


	public Long getSensorTypeId() {
		return sensorTypeId;
	}


	public void setSensorTypeId(Long sensorTypeId) {
		this.sensorTypeId = sensorTypeId;
	}


	public String getSensorType() {
		return sensorType;
	}


	public void setSensorType(String sensorType) {
		this.sensorType = sensorType;
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


	public List<SiteLevel> getSites() {
		return sites;
	}


	public void setSites(List<SiteLevel> sites) {
		this.sites = sites;
	}
    
	
	
    
    
    
}