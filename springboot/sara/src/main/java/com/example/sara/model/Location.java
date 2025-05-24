package com.example.sara.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents a Location entity.
 */
@Entity
@Table(name = "location") // Align table name with snake_case convention
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long locationId; // Maps to "location_id" by default

    @Column(nullable = false, length = 255)
    private String name; // Maps to "name" by default

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false) // Maps to "site_id" by default
    private Site site;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SensorBox> sensorBoxes;

    @Column(updatable = false)
    private LocalDateTime createdAt; // Maps to "created_at" by default

    @Column(nullable = false, length = 7)
    private String displayColor = "#FFFFFF"; // Maps to "display_color" by default

    public Location() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getLocationId() {
        return locationId;
    }

    public void setLocationId(Long locationId) {
        this.locationId = locationId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Site getSite() {
        return site;
    }

    public void setSite(Site site) {
        this.site = site;
    }

    public List<SensorBox> getSensorBoxes() {
        return sensorBoxes;
    }

    public void setSensorBoxes(List<SensorBox> sensorBoxes) {
        this.sensorBoxes = sensorBoxes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getDisplayColor() {
        return displayColor;
    }

    public void setDisplayColor(String displayColor) {
        this.displayColor = displayColor;
    }
}
