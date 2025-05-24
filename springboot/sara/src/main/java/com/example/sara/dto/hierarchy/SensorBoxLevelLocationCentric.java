package com.example.sara.dto.hierarchy;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import lombok.AllArgsConstructor;
import lombok.Data;

public class SensorBoxLevelLocationCentric {
    private Long sensorBoxId;
    private String agentSerial;
    private String displayColor;  // Added
    private List<SensorAssignmentLevelLocationCentric> assignments;
    
    
	public SensorBoxLevelLocationCentric(Long sensorBoxId, String agentSerial, String displayColor,
			List<SensorAssignmentLevelLocationCentric> assignments) {
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


	public List<SensorAssignmentLevelLocationCentric> getAssignments() {
		return assignments;
	}


	public void setAssignments(List<SensorAssignmentLevelLocationCentric> assignments) {
		this.assignments = assignments;
	}


	@Override
	public int hashCode() {
		return Objects.hash(agentSerial, assignments, displayColor, sensorBoxId);
	}


	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		SensorBoxLevelLocationCentric other = (SensorBoxLevelLocationCentric) obj;
		return Objects.equals(agentSerial, other.agentSerial) && Objects.equals(assignments, other.assignments)
				&& Objects.equals(displayColor, other.displayColor) && Objects.equals(sensorBoxId, other.sensorBoxId);
	}
	
	
    
	
	
    
    
}
