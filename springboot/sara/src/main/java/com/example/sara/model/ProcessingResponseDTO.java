package com.example.sara.model;

import java.util.List;
import java.util.Map;

import com.example.sara.dto.MetaDTO;

import io.swagger.v3.oas.annotations.media.Schema;

public class ProcessingResponseDTO {

    @Schema(description = "Facility identifier", example = "uoa")
    private String facility;

    @Schema(description = "Sensor module identifier", example = "AGENT001")
    private List<String> agent_serial;

    @Schema(description = "Type of sensor", example = "TemperatureSensor")
    private String sensor_type;

    @Schema(description = "Aggregation level", example = "yearly")
    private String aggregation_level;

    @Schema(description = "Statistical metric", example = "max")
    private String metric;

    @Schema(description = "Aggregated results grouped by time segments")
    private Map<String, List<AggregatedResultDTO>> aggregated_results;

    @Schema(description = "Processing metadata (buckets, cache hits, etc.)")
    private MetaDTO meta;

    // getters & setters for all fields
    public String getFacility() { return facility; }
    public void setFacility(String facility) { this.facility = facility; }

    public List<String> getAgent_serial() { return agent_serial; }
    public void setAgent_serial(List<String> agent_serial) { this.agent_serial = agent_serial; }

    public String getSensor_type() { return sensor_type; }
    public void setSensor_type(String sensor_type) { this.sensor_type = sensor_type; }

    public String getAggregation_level() { return aggregation_level; }
    public void setAggregation_level(String aggregation_level) { this.aggregation_level = aggregation_level; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public Map<String, List<AggregatedResultDTO>> getAggregated_results() {
        return aggregated_results;
    }
    public void setAggregated_results(Map<String, List<AggregatedResultDTO>> aggregated_results) {
        this.aggregated_results = aggregated_results;
    }

    public MetaDTO getMeta() { return meta; }
    public void setMeta(MetaDTO meta) { this.meta = meta; }
}
