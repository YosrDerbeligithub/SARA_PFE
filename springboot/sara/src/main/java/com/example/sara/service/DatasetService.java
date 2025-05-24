package com.example.sara.service;

import com.example.sara.dto.*;

import com.example.sara.model.*;
import com.example.sara.repositories.DatasetRepository;
import com.example.sara.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import com.example.sara.exception.ResourceNotFoundException;
import com.example.sara.dto.AttributeNode;
import com.example.sara.dto.DatasetAttributesResponse;
import com.example.sara.exception.ValidationException;
import com.fasterxml.jackson.databind.JsonNode;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.PathNotFoundException;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import com.example.sara.dto.QueryRequest;
import com.example.sara.dto.QueryPoint;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DatasetService {

    private final DatasetRepository dsRepo;
    private final UserRepository userRepository;
    
    
    @PersistenceContext
    private EntityManager em;

    // Inject both repositories
    public DatasetService(DatasetRepository dsRepo, UserRepository userRepository) {
        this.dsRepo = dsRepo;
        this.userRepository = userRepository;
    }

    @Transactional
    public Dataset create(CreateDatasetRequest req, Long ownerId) {
        // Fetch the user entity first
        User owner = userRepository.findById(ownerId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));
        
        Dataset ds = new Dataset();
        ds.setOwner(owner);  // Set the relationship
        ds.setName(req.getName().trim());
        ds.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        ds.setPayload(req.getPayload());
        ds.setSchema(req.getSchema());
        ds.setVisibility(req.getVisibility());
        
        if (req.getVisibility() == Visibility.RESTRICTED) {
            ds.setCollaborators(
                req.getCollaborators().stream()
                    .map(email -> new DatasetCollaborator(ds, email.trim().toLowerCase()))
                    .collect(Collectors.toList())
            );
        }
        
        return dsRepo.save(ds);
    }

    @Transactional
    public Dataset update(Long id, UpdateDatasetRequest req, Long userId) {
        Dataset ds = dsRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dataset not found with id: " + id));
        
        // Check ownership via the relationship
        if (!ds.getOwner().getId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized dataset access");
        }

        ds.setName(req.getName().trim());
        ds.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        ds.setPayload(req.getPayload());
        ds.setSchema(req.getSchema());
        
        // Handle visibility changes
        if (req.getVisibility() != ds.getVisibility()) {
            ds.setVisibility(req.getVisibility());
            ds.getCollaborators().clear();
        }

        if (req.getVisibility() == Visibility.RESTRICTED) {
            req.getCollaborators().forEach(email -> {
                String normalizedEmail = email.trim().toLowerCase();
                boolean exists = ds.getCollaborators().stream()
                    .anyMatch(c -> c.getId().getCollaboratorEmail().equals(normalizedEmail));
                if (!exists) {
                    ds.getCollaborators().add(new DatasetCollaborator(ds, normalizedEmail));
                }
            });
        }
        
        return dsRepo.save(ds);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Dataset ds = dsRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dataset not found with id: " + id));
        
        // Check ownership via the relationship
        if (!ds.getOwner().getId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized dataset deletion");
        }
        
        dsRepo.delete(ds);
    }
    
    
    @Transactional
    public Dataset updateVisibility(Long id, UpdateVisibilityRequest request, Long userId) {
        Dataset dataset = dsRepo.findByIdWithCollaborators(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dataset not found with id: " + id));
        validateOwnership(dataset, userId);

        Visibility oldVis = dataset.getVisibility();
        Visibility newVis = request.visibility();
        dataset.setVisibility(newVis);

        if (oldVis == Visibility.RESTRICTED) {
            // remove old collaborators first
            dataset.getCollaborators().clear();
            em.flush();
        }

        if (newVis == Visibility.RESTRICTED) {
            // add new collaborators
            for (String email : request.collaborators()) {
                dataset.getCollaborators().add(
                    new DatasetCollaborator(dataset, email.trim().toLowerCase())
                );
            }
        }

        return dsRepo.save(dataset);
    }

    @Transactional
    public Dataset updateCollaborators(Long id, UpdateCollaboratorsRequest request, Long userId) {
        Dataset dataset = dsRepo.findByIdWithCollaborators(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dataset not found with id: " + id));
        validateOwnership(dataset, userId);

        if (dataset.getVisibility() != Visibility.RESTRICTED) {
            throw new IllegalArgumentException("Collaborators can only be updated for RESTRICTED datasets");
        }

        // clear existing and flush deletes
        dataset.getCollaborators().clear();
        em.flush();

        // add new collaborators
        for (String email : request.collaborators()) {
            dataset.getCollaborators().add(
                new DatasetCollaborator(dataset, email.trim().toLowerCase())
            );
        }

        return dsRepo.save(dataset);
    }
    
    @Transactional
    public Dataset updateSchema(Long id, UpdateSchemaRequest request, Long userId) {
        Dataset dataset = dsRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dataset not found with id: " + id));
        
        validateOwnership(dataset, userId);
        
        dataset.setSchema(request.schema());
        return dsRepo.save(dataset);
    }
    
    
    
    
 // DatasetService.java
    public List<DatasetListResponse> getAllDatasets(User currentUser) {
        return dsRepo.findAllWithCollaborators().stream()
            .filter(dataset -> isDatasetAccessible(dataset, currentUser))
            .map(DatasetListResponse::fromEntity)
            .collect(Collectors.toList());
    }

    public DatasetDetailsResponse getDatasetById(Long id, User user) {
        Dataset dataset = dsRepo.findByIdWithCollaborators(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dataset not found"));
        
        if (!isDatasetAccessible(dataset, user)) {
            throw new AccessDeniedException("Access denied");
        }
        
        return DatasetDetailsResponse.fromEntity(dataset);
    }

    private boolean isDatasetAccessible(Dataset dataset, User user) {
        return switch (dataset.getVisibility()) {
            case PUBLIC -> true;
            case PRIVATE -> dataset.getOwner().getId().equals(user.getId());
            case RESTRICTED -> dataset.getOwner().getId().equals(user.getId()) || 
                dataset.getCollaborators().stream()
                    .anyMatch(c -> c.getId().getCollaboratorEmail()
                        .equalsIgnoreCase(user.getEmail()));
        };
    }
    
    private void validateOwnership(Dataset dataset, Long userId) {
        Long ownerId = dataset.getOwner().getId();
        if (!ownerId.equals(userId)) {
            throw new AccessDeniedException("Unauthorized operation");
        }
    }
    
    
    @Transactional(readOnly = true)
    public List<DatasetAttributesResponse> getAllAttributeTrees(User current_user) {
        return dsRepo.findAllWithCollaborators().stream()
            .filter(ds -> isDatasetAccessible(ds,current_user))  // you can wrap userId or fetch a User stub
            .map(ds -> {
                JsonNode schema = ds.getSchema();
                if (schema == null) {
                    throw new ValidationException(
                        "Dataset " + ds.getId() + " is missing a JSON schema"
                    );
                }
                List<AttributeNode> attrs = buildTreeFromSchema(schema, "");
                return DatasetAttributesResponse.of(
                    ds.getId(),
                    ds.getName(),
                    attrs
                );
            })
            .collect(Collectors.toList());
    }

    /**
     * Recursively walk a JSON‑Schema to produce an AttributeNode tree.
     * Uses "/field", "/arrayField/*", etc. for paths.
     */
    private List<AttributeNode> buildTreeFromSchema(JsonNode schemaNode, String basePath) {
        // 1) If this node has properties, treat it like an object:
        JsonNode props = schemaNode.get("properties");
        if (props != null && props.isObject()) {
            List<AttributeNode> nodes = new ArrayList<>();
            props.fieldNames().forEachRemaining(field -> {
                JsonNode propSchema = props.get(field);
                String path = basePath + "/" + field;
                List<AttributeNode> children = List.of();

                // Recurse if nested object or array
                String fieldType = propSchema.path("type").asText();
                if ("object".equals(fieldType) || propSchema.has("properties")) {
                    children = buildTreeFromSchema(propSchema, path);
                } else if ("array".equals(fieldType)) {
                    JsonNode items = propSchema.get("items");
                    if (items != null) {
                        children = buildTreeFromSchema(items, path + "/*");
                    }
                }

                nodes.add(new AttributeNode(field, path, children));
            });
            return nodes;
        }

        // 2) Otherwise if it's an array with items, unwrap into items:
        if ("array".equals(schemaNode.path("type").asText())) {
            JsonNode items = schemaNode.get("items");
            if (items != null) {
                return buildTreeFromSchema(items, basePath + "/*");
            }
        }

        // 3) Nothing to do:
        return List.of();
    }
    /**
     * Convert a front‑end slash path like "/*
     * /ageGroup" into a JsonPath string:
     *  "/"       → root ($)
     *  "*"       → array wildcard [*]
     *  "field"   → .field
     **/
     
    private String slashToJsonPath(String slashPath) {
        StringBuilder jp = new StringBuilder("$");
        for (String segment : slashPath.split("/")) {
            if (segment.isBlank()) {
                continue;
            }
            if (segment.equals("*")) {
                jp.append("[*]");
            } else {
                jp.append(".").append(segment);
            }
        }
        return jp.toString();
    }
    
    
    
    @Transactional(readOnly = true)
    public List<QueryPoint> queryAttributes(
        Long datasetId,
        User currentUser,
        QueryRequest req
    ) {
        // 1) Load dataset (with collaborators for RESTRICTED ACL)
        Dataset ds = dsRepo.findByIdWithCollaborators(datasetId)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Dataset not found: " + datasetId)
            );

        // 2) ACL check
        if (!isDatasetAccessible(ds, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Access denied to dataset: " + datasetId);
        }

        // 3) Prepare JSON payload
        String json = ds.getPayload().toString();

        // 4) Translate slash‑paths into JsonPath
        String jsonPathX = slashToJsonPath(req.xPath());
        String jsonPathY = slashToJsonPath(req.yPath());

        List<Object> xs;
        List<Object> ys;
        try {
            xs = JsonPath.read(json, jsonPathX);
            ys = JsonPath.read(json, jsonPathY);
        } catch (PathNotFoundException pnfe) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid JsonPath: " + pnfe.getMessage(), pnfe);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Error extracting data: " + ex.getMessage(), ex);
        }

        // 5) Ensure equal lengths
        if (xs.size() != ys.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Mismatched sizes: x(" + xs.size() + ") vs y(" + ys.size() + ")");
        }

        // 6) Zip into QueryPoint list
        List<QueryPoint> points = new ArrayList<>(xs.size());
        for (int i = 0; i < xs.size(); i++) {
            points.add(new QueryPoint(xs.get(i), ys.get(i)));
        }

        return points;
    }
    
    
    
    
    
}