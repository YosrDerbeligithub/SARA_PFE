package com.example.sara.repositories;

//--- com/example/sara/repository/DatasetRepository.java ---

import com.example.sara.model.Dataset;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
* Data access layer for Dataset entities.
* Provides basic CRUD operations and custom query methods.
*/
@Repository
public interface DatasetRepository extends JpaRepository<Dataset, Long> {

 /**
  * Finds all datasets owned by a specific user
  * @param ownerId The ID of the dataset owner
  * @return List of datasets ordered by creation date (newest first)
  */
    List<Dataset> findByOwner_IdOrderByCreatedAtDesc(Long ownerId);

 /**
  * Finds a dataset by ID along with its collaborators
  * @param id Dataset ID
  * @return Optional containing the dataset if found
  */
 @Query("SELECT ds FROM Dataset ds LEFT JOIN FETCH ds.collaborators WHERE ds.id = :id")
 Optional<Dataset> findByIdWithCollaborators(@Param("id") Long id);

 /**
  * Checks if a dataset exists with the given ID and owner
  * @param id Dataset ID
  * @param ownerId Owner ID
  * @return true if dataset exists and is owned by specified user
  */
 boolean existsByIdAndOwner_Id(Long id, Long ownerId);
 
 @Query("SELECT ds FROM Dataset ds LEFT JOIN FETCH ds.collaborators")
 List<Dataset> findAllWithCollaborators();
 
 @Modifying
 @Query("UPDATE Dataset ds SET ds.updatedAt = CURRENT_TIMESTAMP WHERE ds.id = :id")
 void refresh(@Param("id") Dataset dataset);


 
 
 
 
}
