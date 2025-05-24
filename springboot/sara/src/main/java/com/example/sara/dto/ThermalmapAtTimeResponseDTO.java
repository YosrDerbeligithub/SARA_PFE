package com.example.sara.dto;
import java.time.Instant;
import java.util.List;

public class ThermalmapAtTimeResponseDTO {

    private Instant time;
    private List<List<Double>> reading;

    // ----- Getters & Setters -----
    public Instant getTime() {
        return time;
    }

    public void setTime(Instant time) {
        this.time = time;
    }

    public List<List<Double>> getReading() {
        return reading;
    }

    public void setReading(List<List<Double>> reading) {
        this.reading = reading;
    }
}
