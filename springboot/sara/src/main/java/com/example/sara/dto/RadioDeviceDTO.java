package com.example.sara.dto;

public class RadioDeviceDTO {

    private String imei;
    private Double rssi;

    // ----- Getters & Setters -----
    public String getImei() {
        return imei;
    }

    public void setImei(String imei) {
        this.imei = imei;
    }

    public Double getRssi() {
        return rssi;
    }

    public void setRssi(Double rssi) {
        this.rssi = rssi;
    }
}


