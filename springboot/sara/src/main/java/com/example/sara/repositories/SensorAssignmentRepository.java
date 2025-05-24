package com.example.sara.repositories;

import com.example.sara.model.SensorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for SensorAssignment entities.
 */
@Repository
public interface SensorAssignmentRepository extends JpaRepository<SensorAssignment, Long> {
}

