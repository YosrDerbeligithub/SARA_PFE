package com.example.sara.service;


import com.example.sara.dto.SiteDto;
import com.example.sara.dto.SiteCreateDto;
import java.util.List;

/**
 * Service interface for Site operations.
 */
public interface SiteService {
    SiteDto createSite(SiteCreateDto dto);
    SiteDto updateSite(Long siteId, SiteCreateDto dto);
    void deleteSite(Long siteId);
    List<SiteDto> getAllSites();
    Long countTotalSites();
}
