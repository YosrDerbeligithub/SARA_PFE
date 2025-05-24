package com.example.sara.dto.hierarchy;

import java.util.Objects;

import lombok.Data;


public class SensorAssignmentLevelLocationCentric {
    private Long sensorTypeId;
    private String sensorType;
    private String displayColor;
    private  String displayColor_sensortype;
    
    
    
    
	public SensorAssignmentLevelLocationCentric(Long sensorTypeId, String sensorType,  String displayColor_sensortype,String displayColor) {
		super();
		this.sensorTypeId = sensorTypeId;
		this.sensorType = sensorType;
		this.displayColor = displayColor;
		this.displayColor_sensortype=displayColor_sensortype;
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
	public String getDisplayColor() {
		return displayColor;
	}
	public void setDisplayColor(String displayColor) {
		this.displayColor = displayColor;
	}
	@Override
	public int hashCode() {
		return Objects.hash(displayColor, displayColor_sensortype, sensorType, sensorTypeId);
	}
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		SensorAssignmentLevelLocationCentric other = (SensorAssignmentLevelLocationCentric) obj;
		return Objects.equals(displayColor, other.displayColor)
				&& Objects.equals(displayColor_sensortype, other.displayColor_sensortype)
				&& Objects.equals(sensorType, other.sensorType) && Objects.equals(sensorTypeId, other.sensorTypeId);
	}
	
	
	


    
}