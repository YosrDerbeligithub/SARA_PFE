package com.example.sara.dto.hierarchy;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import lombok.AllArgsConstructor;
import lombok.Data;


public class SiteLevelLocationCentric {
    private Long siteId;
    private String siteName;
    private String siteType;
    private String displayColor;  // Added
    private List<LocationLevelLocationCentric> locations;
	public SiteLevelLocationCentric(Long siteId, String siteName, String siteType, String displayColor,
			List<LocationLevelLocationCentric> locations) {
		super();
		this.siteId = siteId;
		this.siteName = siteName;
		this.siteType = siteType;
		this.displayColor = displayColor;
		this.locations = locations;
	}
	public Long getSiteId() {
		return siteId;
	}
	public void setSiteId(Long siteId) {
		this.siteId = siteId;
	}
	public String getSiteName() {
		return siteName;
	}
	public void setSiteName(String siteName) {
		this.siteName = siteName;
	}
	public String getSiteType() {
		return siteType;
	}
	public void setSiteType(String siteType) {
		this.siteType = siteType;
	}
	public String getDisplayColor() {
		return displayColor;
	}
	public void setDisplayColor(String displayColor) {
		this.displayColor = displayColor;
	}
	public List<LocationLevelLocationCentric> getLocations() {
		return locations;
	}
	public void setLocations(List<LocationLevelLocationCentric> locations) {
		this.locations = locations;
	}
	@Override
	public int hashCode() {
		return Objects.hash(displayColor, locations, siteId, siteName, siteType);
	}
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		SiteLevelLocationCentric other = (SiteLevelLocationCentric) obj;
		return Objects.equals(displayColor, other.displayColor) && Objects.equals(locations, other.locations)
				&& Objects.equals(siteId, other.siteId) && Objects.equals(siteName, other.siteName)
				&& Objects.equals(siteType, other.siteType);
	}
	
	
    
    
    
    
}
