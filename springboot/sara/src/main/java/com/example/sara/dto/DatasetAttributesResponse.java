package com.example.sara.dto;

import java.util.List;

/**
* Wraps the attribute tree for one dataset.
*/
public record DatasetAttributesResponse(
 Long datasetId,
 String name,
 List<AttributeNode> attributes
) {
 public static DatasetAttributesResponse of(Long id, String name, List<AttributeNode> attrs) {
     return new DatasetAttributesResponse(id, name, attrs);
 }
}
