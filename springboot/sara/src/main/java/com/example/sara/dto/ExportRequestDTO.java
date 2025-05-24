package com.example.sara.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ExportRequestDTO {

    @NotBlank
    @Pattern(regexp = "^(uoa|istic)$", message = "Facility must be 'uoa' or 'istic'")
    @JsonProperty("facility")
    private String facility;

    @NotBlank
    @Pattern(regexp = "^(humidity|luminance|microphone|motion|presence|radio|temperature|thermalmap|thermography)$")
    @JsonProperty("sensor_type")
    private String sensorType;

    @NotNull
    @JsonProperty("agent_serial")
    private List<String> agentSerial;

    @NotNull
    @JsonProperty("start")
    private Instant start;

    @NotNull
    @JsonProperty("end")
    private Instant end;

    @NotBlank
    @Pattern(regexp = "^(csv|json)$")
    @JsonProperty("format")
    private String format;

    // Getters & Setters
    public String getFacility() { return facility; }
    public void setFacility(String facility) { this.facility = facility; }

    @JsonProperty("sensor_type")
    public String getSensorType() { return sensorType; }
    @JsonProperty("sensor_type")
    public void setSensorType(String sensorType) { this.sensorType = sensorType; }

    @JsonProperty("agent_serial")
    public List<String> getAgentSerial() { return agentSerial; }
    @JsonProperty("agent_serial")
    public void setAgentSerial(List<String> agentSerial) { this.agentSerial = agentSerial; }

    public Instant getStart() { return start; }
    public void setStart(Instant start) { this.start = start; }

    public Instant getEnd() { return end; }
    public void setEnd(Instant end) { this.end = end; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
}

