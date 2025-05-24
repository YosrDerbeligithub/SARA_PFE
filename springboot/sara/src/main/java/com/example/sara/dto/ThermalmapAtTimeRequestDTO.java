package com.example.sara.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ThermalmapAtTimeRequestDTO {

    @NotBlank
    @Pattern(regexp = "^(uoa|istic)$", message = "Facility must be 'uoa' or 'istic'")
    @JsonProperty("facility")
    private String facility;

    @NotBlank
    @JsonProperty("agent_serial")
    private String agentSerial;

    @NotNull
    @JsonProperty("timestamp")
    private Instant timestamp;

    // ----- Getters & Setters -----
    @JsonProperty("facility")
    public String getFacility() {
        return facility;
    }

    @JsonProperty("facility")
    public void setFacility(String facility) {
        this.facility = facility;
    }

    @JsonProperty("agent_serial")
    public String getAgentSerial() {
        return agentSerial;
    }

    @JsonProperty("agent_serial")
    public void setAgentSerial(String agentSerial) {
        this.agentSerial = agentSerial;
    }

    @JsonProperty("timestamp")
    public Instant getTimestamp() {
        return timestamp;
    }

    @JsonProperty("timestamp")
    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
