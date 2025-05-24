package com.example.sara.dto;
import java.time.Instant;
import java.util.List;


public class RadioDevicesAtTimeResponseDTO {

    private Instant time;
    private List<RadioDeviceDTO> devices;

    // ----- Getters & Setters -----
    public Instant getTime() {
        return time;
    }

    public void setTime(Instant time) {
        this.time = time;
    }

    public List<RadioDeviceDTO> getDevices() {
        return devices;
    }

    public void setDevices(List<RadioDeviceDTO> devices) {
        this.devices = devices;
    }
}