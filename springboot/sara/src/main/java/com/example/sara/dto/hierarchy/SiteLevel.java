package com.example.sara.dto.hierarchy;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;


public class SiteLevel {
    private Long siteId;
    private String siteName;
    private String displayColor;  // Added
    private List<LocationLevel> locations;
    
    
    
    
    
	public SiteLevel(Long siteId, String siteName, String displayColor, List<LocationLevel> locations) {
		super();
		this.siteId = siteId;
		this.siteName = siteName;
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
	public String getDisplayColor() {
		return displayColor;
	}
	public void setDisplayColor(String displayColor) {
		this.displayColor = displayColor;
	}
	public List<LocationLevel> getLocations() {
		return locations;
	}
	public void setLocations(List<LocationLevel> locations) {
		this.locations = locations;
	}
    
    
    
    
}