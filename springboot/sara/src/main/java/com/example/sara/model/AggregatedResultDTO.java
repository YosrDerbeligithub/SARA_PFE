package com.example.sara.model;
import java.time.ZonedDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Represents a single aggregated result.
 */
public class AggregatedResultDTO {
    @Schema(description = "Time bucket for the aggregated value", example = "2022-03-10T00:00:00Z")
    private ZonedDateTime time;
    
    @Schema(description = "Aggregated value for this time bucket", example = "24.8")
    private double value;

    // Getters and Setters
    public ZonedDateTime getTime() {
        return time;
    }
    public void setTime(ZonedDateTime time) {
        this.time = time;
    }
    public double getValue() {
        return value;
    }
    public void setValue(double value) {
        this.value = value;
    }
}