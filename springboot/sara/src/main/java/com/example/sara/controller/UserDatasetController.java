package com.example.sara.controller;

// --- com/example/sara/controller/UserDatasetController.java ---

import com.example.sara.dto.*;

import com.example.sara.model.Dataset;

import com.example.sara.model.User;
import com.example.sara.service.DatasetService;
import com.example.sara.service.SchemaValidationService;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import com.example.sara.dto.QueryRequest;
import com.example.sara.dto.QueryPoint;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/datasets")
public class UserDatasetController {
    
    private final DatasetService datasetService;
    private final SchemaValidationService validationService;

    public UserDatasetController(DatasetService datasetService, 
                                SchemaValidationService validationService) {
        this.datasetService = datasetService;
        this.validationService = validationService;
    }
    
    
    
    @PostMapping("/customquery/{id}")
    public ResponseEntity<List<QueryPoint>> queryAttributes(
        @PathVariable Long id,
        @Valid @RequestBody QueryRequest req,
        @AuthenticationPrincipal User user
    ) {
        List<QueryPoint> result = datasetService.queryAttributes(id, user, req);
        return ResponseEntity.ok(result);
    }



    @PostMapping("/{userId}")
    public ResponseEntity<DatasetResponse> create(
            @Valid @RequestBody CreateDatasetRequest req,
            @PathVariable Long userId) {

        Dataset created = datasetService.create(req, userId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(DatasetResponse.fromEntity(created));
    }

    @PutMapping("/{id}") /*useless might delete later */
    public ResponseEntity<DatasetResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDatasetRequest req,
            @AuthenticationPrincipal User user) {
        
        Dataset updated = datasetService.update(id, req, user.getId());
        return ResponseEntity.ok(DatasetResponse.fromEntity(updated));
    }
    
    
    @PutMapping("/{id}/visibility")
    public ResponseEntity<DatasetResponse> updateVisibility(
        @PathVariable Long id,
        @Valid @RequestBody UpdateVisibilityRequest request,
        @AuthenticationPrincipal User user
    ) {
        Dataset updated = datasetService.updateVisibility(id, request, user.getId());
        return ResponseEntity.ok(DatasetResponse.fromEntity(updated));
    }

    @PutMapping("/{id}/collaborators")
    public ResponseEntity<DatasetResponse> updateCollaborators(
        @PathVariable Long id,
        @Valid @RequestBody UpdateCollaboratorsRequest request,
        @AuthenticationPrincipal User user
    ) {
        Dataset updated = datasetService.updateCollaborators(id, request, user.getId());
        return ResponseEntity.ok(DatasetResponse.fromEntity(updated));
    }

    @PutMapping("/{id}/schema")
    public ResponseEntity<DatasetResponse> updateSchema(
        @PathVariable Long id,
        @Valid @RequestBody UpdateSchemaRequest request,
        @AuthenticationPrincipal User user
    ) {
        Dataset updated = datasetService.updateSchema(id, request, user.getId());
        return ResponseEntity.ok(DatasetResponse.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        
        datasetService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidateResponse> validate(
            @Valid @RequestBody ValidateRequest req) {
        
        List<ValidationError> errors = validationService.validate(
            req.getData(), 
            req.getSchema()
        );
        return ResponseEntity.ok(new ValidateResponse(errors.isEmpty(), errors));
    }
    
    
    
    @GetMapping("getAll")
    public ResponseEntity<List<DatasetListResponse>> getAllDatasets(
        @AuthenticationPrincipal User user
    ) {
        List<DatasetListResponse> datasets = datasetService.getAllDatasets(user);
        return ResponseEntity.ok(datasets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DatasetDetailsResponse> getDatasetById(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        DatasetDetailsResponse response = datasetService.getDatasetById(id, user);
        return ResponseEntity.ok(response);
    }
    
    
    @GetMapping("/attributes")
    public ResponseEntity<List<DatasetAttributesResponse>> getAllAttributeTrees(
        @AuthenticationPrincipal User user
    ) {
        List<DatasetAttributesResponse> trees =
            datasetService.getAllAttributeTrees(user);
        return ResponseEntity.ok(trees);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        Map<String, String> response = new HashMap<>();
        String message = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred";
        response.put("message", message);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    

}
