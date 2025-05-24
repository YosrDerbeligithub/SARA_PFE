package com.example.sara.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.ZonedDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * The processing request structure received from the front end.
 */
public class ProcessingRequestDTO {
	
	@Schema(description = "Facility identifier (uoa/istic)", example = "uoa")
	@NotBlank(message = "Facility cannot be empty")
	@Pattern(regexp = "uoa|istic|museum", message = "Facility must be 'uoa' or 'istic'")
	private String facility;

   @Schema(description = "Start time of the time range (ISO 8601 format)", example = "2022-03-10T13:53:00Z")
   @NotNull(message = "Start time cannot be null")
   private ZonedDateTime start;

   @Schema(description = "End time of the time range (ISO 8601 format)", example = "2023-03-10T13:53:00Z")
   @NotNull(message = "End time cannot be null")
   private ZonedDateTime end;

   @Schema(description = "Type of sensor (e.g., 'TemperatureSensor')", example = "TemperatureSensor")
   @NotBlank(message = "Sensor type cannot be empty")
   @Pattern(regexp = "humidity|luminance|microphone|motion|presence|radio|temperature|thermalmap|thermography", message="Sensor Type must be one of the followin: humidity|luminance|microphone|motion|presence|radio|temperature|thermalmap|thermography")

   @JsonProperty("sensor_type")

   private String sensor_type;

   @Schema(description = "Sensor module identifiers", example = "[\"AGENT001\", \"AGENT002\"]")
   @NotNull(message = "Agent serial list cannot be null")
   @Size(min = 1, message = "At least one agent serial must be provided")
   
   private List<String> agent_serial;  

   @Schema(description = "Aggregation level: minute, hourly, daily, monthly, or yearly", example = "yearly")
   @NotBlank(message = "Aggregation level cannot be empty")
   @Pattern(regexp = "minute|hourly|daily|monthly|yearly", message = "Aggregation level must be one of 'minute', 'hourly', 'daily', 'monthly', or 'yearly'")
   private String aggregation_level;

   @Schema(description = "Statistical metric (e.g., average, sum, median, skewness)", example = "max")
   @NotBlank(message = "Metric cannot be empty")
   @Pattern(regexp = "average|sum|median|min|max|skewness|event_count|activity_percent|event_duration_avg|event_duration_max", message = "Metric must be one of average|sum|median|min|max|skewness|event_count|activity_percent|event_duration_avg|event_duration_max")
   private String metric;

   // Getters and Setters
   
   public String getFacility() {
       return facility;
   }

   public void setFacility(String facility) {
       this.facility = facility;
   }
   public ZonedDateTime getStart() {
       return start;
   }

   public void setStart(ZonedDateTime start) {
       this.start = start;
   }

   public ZonedDateTime getEnd() {
       return end;
   }

   public void setEnd(ZonedDateTime end) {
       this.end = end;
   }

   public String getSensor_type() {
       return sensor_type;
   }

   public void setSensor_type(String sensor_type) {
       this.sensor_type = sensor_type;
   }

   public List<String> getAgent_serial() {
       return agent_serial;
   }

   public void setAgent_serial(List<String> agent_serial) {
       this.agent_serial = agent_serial;
   }

   public String getAggregation_level() {
       return aggregation_level;
   }

   public void setAggregation_level(String aggregation_level) {
       this.aggregation_level = aggregation_level;
   }

   public String getMetric() {
       return metric;
   }

   public void setMetric(String metric) {
       this.metric = metric;
   }
}
