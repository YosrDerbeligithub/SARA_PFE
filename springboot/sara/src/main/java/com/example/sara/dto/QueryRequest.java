package com.example.sara.dto;


import jakarta.validation.constraints.NotBlank;

/** xPath and yPath as returned from your /attributes endpoint */
public record QueryRequest(
@NotBlank String xPath,
@NotBlank String yPath
) { }

