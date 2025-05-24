package com.example.sara.repositories;

import com.example.sara.model.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Site entities.
 */
@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
}
