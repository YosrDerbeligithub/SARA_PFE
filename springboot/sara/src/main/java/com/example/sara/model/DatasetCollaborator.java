package com.example.sara.model;
//--- com/example/sara/model/DatasetCollaborator.java ---

import jakarta.persistence.*;

/**
* Represents a collaborator relationship between a dataset and a user email.
* Ensures access control for RESTRICTED visibility datasets.
*/
@Entity
@Table(name = "dataset_collaborators")
public class DatasetCollaborator {

 @EmbeddedId
 private DatasetCollaboratorId id;

 @MapsId("datasetId")
 @ManyToOne(fetch = FetchType.LAZY)
 @JoinColumn(name = "dataset_id", nullable = false)
 private Dataset dataset;

 public DatasetCollaborator() {}

 /**
  * Creates a new collaborator relationship
  * @param dataset The associated dataset
  * @param collaboratorEmail Validated email address of collaborator
  */
 public DatasetCollaborator(Dataset dataset, String collaboratorEmail) {
     this.dataset = dataset;
     this.id = new DatasetCollaboratorId();
     this.id.setCollaboratorEmail(collaboratorEmail);
 }

 // Getters and Setters
 public DatasetCollaboratorId getId() { return id; }
 public void setId(DatasetCollaboratorId id) { this.id = id; }
 public Dataset getDataset() { return dataset; }
 public void setDataset(Dataset dataset) { this.dataset = dataset; }
}