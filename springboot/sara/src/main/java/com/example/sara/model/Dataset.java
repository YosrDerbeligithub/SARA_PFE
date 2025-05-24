package com.example.sara.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.example.sara.exception.ValidationException;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Represents a user-provided dataset with JSON payload and schema.
 * Includes audit timestamps and access control through visibility rules.
 */
@Entity
@Table(name = "datasets")
public class Dataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    
    

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, updatable = false)
    private User owner;
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private JsonNode payload;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode schema;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Visibility visibility;

    @OneToMany(mappedBy = "dataset", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DatasetCollaborator> collaborators = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    
    @Transient  // Not stored in DB, calculated on demand
    private transient Integer rowCount;
    
    @Transient
    private transient Integer columnCount;

    // Getters and Setters
    
    
    public Long getId() { return id; }
    public Long getOwnerId() {
        return owner != null ? owner.getId() : null;
	}
	public void setOwnerId(Long ownerId) {
	    if (this.owner == null) {
	        this.owner = new User();
	    }
	    this.owner.setId(ownerId);	}
	public void setId(Long id) { this.id = id; }

    public User getOwner() {
		return owner;
	}
	public void setOwner(User owner) {
		this.owner = owner;
	}
	public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public JsonNode getPayload() { return payload; }
    public void setPayload(JsonNode payload) { this.payload = payload; }
    public JsonNode getSchema() { return schema; }
    public void setSchema(JsonNode schema) { this.schema = schema; }
    public Visibility getVisibility() { return visibility; }
    public void setVisibility(Visibility visibility) { this.visibility = visibility; }
    public List<DatasetCollaborator> getCollaborators() { return collaborators; }
    public void setCollaborators(List<DatasetCollaborator> collaborators) { this.collaborators = collaborators; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    
    public Integer getRowCount() {
        if (rowCount == null) calculateDimensions();
        return rowCount;
    }

    public Integer getColumnCount() {
        if (columnCount == null) calculateDimensions();
        return columnCount;
    }
    
    
    
    public void calculateDimensions() {
        if (payload != null && payload.isArray()) {
            this.rowCount = payload.size();
            if (rowCount > 0) {
                JsonNode firstRow = payload.get(0);
                this.columnCount = firstRow.size();
            } else {
                this.columnCount = 0;
            }
        } else {
            this.rowCount = 0;
            this.columnCount = 0;
        }
    }
    
    //@PreUpdate
    //@PrePersist
  /*  private void validateCollaborators() {
        if (this.visibility == Visibility.RESTRICTED && 
           (this.collaborators == null || this.collaborators.isEmpty())) {
            throw new ValidationException("RESTRICTED datasets require at least one collaborator");
        }
    }*/
    
    
}