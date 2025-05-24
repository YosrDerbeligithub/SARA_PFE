package com.example.sara.service;

import com.example.sara.dto.SiteDto;
import com.example.sara.dto.SiteCreateDto;
import com.example.sara.model.Site;
import com.example.sara.repositories.SiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;

/**
 * Implementation of the SiteService interface.
 */
@Service
public class SiteServiceImpl implements SiteService {

    private final SiteRepository siteRepository;

    @Autowired
    public SiteServiceImpl(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    @Override
    public SiteDto createSite(SiteCreateDto dto) {
        Site site = new Site();
        site.setName(dto.getName());
        site.setType(dto.getType());
        site.setDisplayColor(dto.getDisplayColor());
        Site saved = siteRepository.save(site);
        return mapToDto(saved);
    }

    @Override
    public SiteDto updateSite(Long siteId, SiteCreateDto dto) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found with id " + siteId));
        site.setName(dto.getName());
        site.setType(dto.getType());
        site.setDisplayColor(dto.getDisplayColor());
        Site updated = siteRepository.save(site);
        return mapToDto(updated);
    }

    @Override
    public void deleteSite(Long siteId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found with id " + siteId));
        siteRepository.delete(site);
    }

    @Override
    public List<SiteDto> getAllSites() {
        List<Site> sites = siteRepository.findAll();
        return sites.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public Long countTotalSites() {
        return siteRepository.count();
    }

    /**
     * Maps a Site entity to a SiteDto.
     */
    private SiteDto mapToDto(Site site) {
        SiteDto dto = new SiteDto();
        dto.setSiteId(site.getSiteId());
        dto.setName(site.getName());
        dto.setType(site.getType());
        dto.setDisplayColor(site.getDisplayColor());
        dto.setLocationCount(site.getLocations() != null ? site.getLocations().size() : 0);
        int sensorCount = site.getLocations() != null ? site.getLocations().stream()
                .mapToInt(loc -> loc.getSensorBoxes() != null ? loc.getSensorBoxes().size() : 0).sum() : 0;
        dto.setSensorBoxCount(sensorCount);
        dto.setCreatedAt(site.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return dto;
    }
}
