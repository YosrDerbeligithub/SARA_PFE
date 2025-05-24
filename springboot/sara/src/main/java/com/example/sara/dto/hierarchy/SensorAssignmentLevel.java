package com.example.sara.dto.hierarchy;

import lombok.Data;

public class SensorAssignmentLevel {
    private String displayColor;

	public SensorAssignmentLevel(String displayColor) {
		super();
		this.displayColor = displayColor;
	}

	public String getDisplayColor() {
		return displayColor;
	}

	public void setDisplayColor(String displayColor) {
		this.displayColor = displayColor;
	}
    
    
    
    
}
