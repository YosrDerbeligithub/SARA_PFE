package com.example.sara.model;


import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/**
* Composite primary key for DatasetCollaborator entity.
* Combines dataset ID and collaborator email for unique relationships.
*/
@Embeddable
public class DatasetCollaboratorId implements Serializable {

 private Long datasetId;
 private String collaboratorEmail;

 public Long getDatasetId() { return datasetId; }
 public void setDatasetId(Long datasetId) { this.datasetId = datasetId; }
 public String getCollaboratorEmail() { return collaboratorEmail; }
 public void setCollaboratorEmail(String collaboratorEmail) { 
     this.collaboratorEmail = collaboratorEmail; 
 }

 @Override
 public boolean equals(Object o) {
     if (this == o) return true;
     if (!(o instanceof DatasetCollaboratorId)) return false;
     DatasetCollaboratorId that = (DatasetCollaboratorId) o;
     return Objects.equals(datasetId, that.datasetId) &&
            Objects.equals(collaboratorEmail, that.collaboratorEmail);
 }

 @Override
 public int hashCode() {
     return Objects.hash(datasetId, collaboratorEmail);
 }
}