package com.example.sara.dto;


/**
* Details of a single schema‐validation failure.
*/
public class ValidationError {
 /** JSON Pointer into the *data* that failed (e.g. "/0/value"). */
 private final String dataPath;
 /** JSON Pointer into your *schema* where the rule sits (e.g. "#/items/properties/value/type"). */
 private final String schemaPath;
 /** Human‐readable message (type mismatch, missing property, etc.). */
 private final String message;

 public ValidationError(String dataPath, String schemaPath, String message) {
     this.dataPath   = dataPath;
     this.schemaPath = schemaPath;
     this.message    = message;
 }
 public String getDataPath()   { return dataPath; }
 public String getSchemaPath() { return schemaPath; }
 public String getMessage()    { return message;  }
}
