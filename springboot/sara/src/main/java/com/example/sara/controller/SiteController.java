package com.example.sara.controller;

import com.example.sara.dto.SiteDto;
import com.example.sara.dto.SiteCreateDto;
import com.example.sara.service.SiteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST Controller for Site endpoints.
 */
@RestController
@RequestMapping("/api/sites")
public class SiteController {

    private final SiteService siteService;

    @Autowired
    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    /**
     * GET endpoint to retrieve all sites.
     */
    @GetMapping("all")
    public ResponseEntity<List<SiteDto>> getAllSites() {
        return ResponseEntity.ok(siteService.getAllSites());
    }

    /**
     * GET endpoint to return the total count of sites.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countSites() {
        return ResponseEntity.ok(siteService.countTotalSites());
    }

    /**
     * POST endpoint to create a new site (Admin only).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SiteDto> createSite(@RequestBody SiteCreateDto siteCreateDto) {
        return ResponseEntity.ok(siteService.createSite(siteCreateDto));
    }

    /**
     * PUT endpoint to update an existing site (Admin only).
     */
    @PutMapping("/{siteId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SiteDto> updateSite(@PathVariable Long siteId, @RequestBody SiteCreateDto siteCreateDto) {
        return ResponseEntity.ok(siteService.updateSite(siteId, siteCreateDto));
    }

    /**
     * DELETE endpoint to remove a site (Admin only).
     */
    @DeleteMapping("/{siteId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSite(@PathVariable Long siteId) {
        siteService.deleteSite(siteId);
        return ResponseEntity.noContent().build();
    }
}
