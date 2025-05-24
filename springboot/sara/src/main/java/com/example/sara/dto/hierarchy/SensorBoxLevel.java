package com.example.sara.dto.hierarchy;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;


public class SensorBoxLevel {
    private Long sensorBoxId;     // Added
    private String agentSerial;
    private String displayColor;  // Added
    private List<SensorAssignmentLevel> assignments;
    
    
    
	public SensorBoxLevel(Long sensorBoxId, String agentSerial, String displayColor,
			List<SensorAssignmentLevel> assignments) {
		super();
		this.sensorBoxId = sensorBoxId;
		this.agentSerial = agentSerial;
		this.displayColor = displayColor;
		this.assignments = assignments;
	}
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
	public String getDisplayColor() {
		return displayColor;
	}
	public void setDisplayColor(String displayColor) {
		this.displayColor = displayColor;
	}
	public List<SensorAssignmentLevel> getAssignments() {
		return assignments;
	}
	public void setAssignments(List<SensorAssignmentLevel> assignments) {
		this.assignments = assignments;
	}
    
    
    
}
