package com.example.sara.exception;

//--- com/example/sara/exception/ResourceNotFoundException.java ---

/**
* Custom exception for resource not found scenarios.
*/
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException() { super(); }
    public ResourceNotFoundException(String message) { super(message); }
    public ResourceNotFoundException(String message, Throwable cause) { super(message, cause); }
}