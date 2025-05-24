package com.example.sara.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Defines the visibility states for a dataset.
 * PUBLIC: Visible to all users
 * PRIVATE: Only visible to the owner
 * RESTRICTED: Visible to owner and explicitly listed collaborators
 */
public enum Visibility {
    PUBLIC,
    PRIVATE,
    RESTRICTED,

}