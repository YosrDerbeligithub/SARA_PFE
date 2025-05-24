package com.example.sara.dto;


import java.util.List;

/**
* A node in the JSON‑schema attribute hierarchy.
*/
public record AttributeNode(
 String name,
 String path,
 List<AttributeNode> children
) { }
