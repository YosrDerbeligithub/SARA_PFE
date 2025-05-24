package com.example.sara.repositories;


import com.example.sara.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Location entities.
 */
@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
}
