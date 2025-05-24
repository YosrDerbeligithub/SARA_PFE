package com.example.sara.dto;
import java.util.List;

/**
* Response from validating data against a schema.
*/

public class ValidateResponse {
 private final boolean valid;
 private final List<ValidationError> errors;

 public ValidateResponse(boolean valid, List<ValidationError> errors) {
     this.valid  = valid;
     this.errors = errors;
 }
 public boolean isValid()               { return valid;  }
 public List<ValidationError> getErrors() { return errors; }
}


