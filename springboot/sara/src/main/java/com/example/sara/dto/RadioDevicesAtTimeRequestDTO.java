package com.example.sara.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class RadioDevicesAtTimeRequestDTO {

    @NotBlank
    @Pattern(regexp = "^(uoa|istic)$", message = "Facility must be 'uoa' or 'istic'")
    private String facility;

    @NotBlank
    private String agent_serial;

    @NotNull
    private Instant timestamp;

    // ----- Getters & Setters -----
    public String getFacility() {
        return facility;
    }

    public void setFacility(String facility) {
        this.facility = facility;
    }

    public String getAgent_serial() {
        return agent_serial;
    }

    public void setAgent_serial(String agent_serial) {
        this.agent_serial = agent_serial;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}