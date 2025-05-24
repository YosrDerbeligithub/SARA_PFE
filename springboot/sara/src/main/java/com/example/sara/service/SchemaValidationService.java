package com.example.sara.service;

import com.example.sara.dto.ValidationError;

//src/main/java/edu/uoa/sara/datasets/service/SchemaValidationService.java

import com.fasterxml.jackson.databind.JsonNode;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
* Encapsulates JSON Schema validation logic.
*/
@Service
public class SchemaValidationService {

 private final JsonSchemaFactory schemaFactory;

 public SchemaValidationService() {
	 this.schemaFactory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012);
 }

 /**
  * Validate a JSON payload against an optional JSON Schema.
  * @param data   the JSON to validate (array or object)
  * @param schema the JSON Schema to apply, or null to skip validation
  * @return a list of errors; empty if valid or no schema provided
  */
 public List<ValidationError> validate(JsonNode data, JsonNode schema) {
     if (schema == null || schema.isNull()) {
         // No schema => automatically valid
         return List.of();
     }

     // Compile the schema
     JsonSchema jsonSchema = schemaFactory.getSchema(schema);
     // Run validation
     Set<ValidationMessage> errs = jsonSchema.validate(data);

     // Map to human-readable strings

     return errs.stream()
         .map(vm -> new ValidationError(
             vm.getPath(),        // e.g. "/0/value"
             vm.getSchemaPath(),  // e.g. "#/items/properties/value/type"
             vm.getMessage()      // human text
         ))
         .collect(Collectors.toList()); // Collect ValidationError objects
 }
}

