package com.example.sara.repositories;

import com.example.sara.model.SensorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for SensorType entities.
 */
@Repository
public interface SensorTypeRepository extends JpaRepository<SensorType, Long> {
}

