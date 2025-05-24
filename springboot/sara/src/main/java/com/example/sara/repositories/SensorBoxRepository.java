package com.example.sara.repositories;


import com.example.sara.model.SensorBox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for SensorBox entities.
 */
@Repository
public interface SensorBoxRepository extends JpaRepository<SensorBox, Long> {
}

