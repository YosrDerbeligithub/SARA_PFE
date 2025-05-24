package com.example.sara.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class MetaDTO {
    @Schema(description = "Total number of buckets returned", example = "3308")
    private int total_buckets;

    @Schema(description = "Number of cache hits", example = "0")
    private int cache_hits;

    @Schema(description = "Number of raw hits", example = "3308")
    private int raw_hits;

    @Schema(description = "Number of empty buckets", example = "0")
    private int empty_buckets;

    // getters & setters
    public int getTotal_buckets() { return total_buckets; }
    public void setTotal_buckets(int total_buckets) { this.total_buckets = total_buckets; }

    public int getCache_hits() { return cache_hits; }
    public void setCache_hits(int cache_hits) { this.cache_hits = cache_hits; }

    public int getRaw_hits() { return raw_hits; }
    public void setRaw_hits(int raw_hits) { this.raw_hits = raw_hits; }

    public int getEmpty_buckets() { return empty_buckets; }
    public void setEmpty_buckets(int empty_buckets) { this.empty_buckets = empty_buckets; }
}
