package com.example.sara.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents a Site entity.
 */
@Entity
@Table(name = "site") // Optional if table name matches the default
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long siteId; // Maps to "site_id" by default

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 50)
    private String type; // Allowed values: CAMPUS, MUSEUM, OTHER

    @Column(updatable = false)
    private LocalDateTime createdAt; // Maps to "created_at" by default

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Location> locations;
    
    @Column(nullable = false, length = 7)
    private String displayColor = "#FFFFFF"; // Maps to "display_color" by default

    public Site() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

	public Long getSiteId() {
		return siteId;
	}

	public void setSiteId(Long siteId) {
		this.siteId = siteId;
	}

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

	public List<Location> getLocations() {
		return locations;
	}

	public void setLocations(List<Location> locations) {
		this.locations = locations;
	}

	public String getDisplayColor() {
		return displayColor;
	}

	public void setDisplayColor(String displayColor) {
		this.displayColor = displayColor;
	}
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // Getters and Setters

    
}
