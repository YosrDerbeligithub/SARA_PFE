import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders } from "@angular/common/http"
import { type Observable, of } from "rxjs"
import { catchError, retry, timeout } from "rxjs/operators"
import { MetricMappingService } from "./metric-mapping.service"


export interface CustomQueryRequest {
  xPath: string;
  yPath: string;
}

export interface CustomQueryResponseItem {
  x: any; 
  y: any;
}
export interface SensorDataPoint {
  time: string
  value: number
}

export interface SensorDataResponse {
  agent_serial: string[]
  sensor_type: string
  aggregation_level: string
  metric: string
  aggregated_results: {
    [key: string]: SensorDataPoint[]
  }
}

export interface SensorDataParams {
  facility: string;          // Added facility
  sensor_type: string;       // Matches backend DTO
  aggregation_level: AggregationLevel; // Changed from granularity
  agent_serial: string[];
  metric: string;
  start: string;
  end: string;
}

export interface ThermalmapParams{
  facility:string;
  agent_serial:string;
  timestamp:string;
}
export interface ThermalmapResponse {
  /** Timestamp ISO‑8601 UTC */
  time: string;
  /** Matrice de valeurs (rows × cols) */
  reading: number[][];
}

// BLE Devices at Time API
export interface BleDevicesAtTimeParams {
  facility: string;
  agent_serial: string;
  timestamp: string;
}
export interface BleDevice {
  imei: string;
  rssi: number;
}
export interface BleDevicesAtTimeResponse {
  time: string;
  devices: BleDevice[];
}

export interface ExportDataParams {
  facility: string;
  sensor_type: string;
  agent_serial: string[];
  start: string;  
  end: string;    
  format: 'csv' | 'json';
}

// Type for aggregation levels
export type AggregationLevel = "minute" | "hourly" | "daily" | "monthly" | "yearly"

@Injectable({
  providedIn: "root",
})
export class HttpRequestsService {
  private apiUrl = 'http://localhost:8081/api/historical/process';
  private exportUrl  = 'http://localhost:8081/api/historical/export-data';



  constructor(
    private http: HttpClient,
    private metricMapper: MetricMappingService
  ) {}

  fetchSensorData(params: SensorDataParams): Observable<SensorDataResponse | null> {
    const backendParams = {
      ...params,
      metric: this.metricMapper.getBackendMetric(params.metric)
    };
    console.log("fetch started",backendParams)
    return this.http.post<SensorDataResponse>(this.apiUrl, backendParams).pipe(
      timeout(300000), // 300 second timeout
      retry(2), // Retry failed requests up to 2 times
      catchError((error) => {
        console.error("Error fetching sensor data:", error);
        return of(null);
      }),
    );
  }

  /**
   * Fetch a thermalmap matrix from the backend.
   * @param params ThermalmapParams (facility, agent_serial, timestamp)
   * @returns Observable<ThermalmapResponse | null>
   */
  fetchThermalmap(params: ThermalmapParams): Observable<ThermalmapResponse | null> {
    const url = "http://localhost:8081/api/historical/thermalmap/reading_at_time";
    return this.http.post<ThermalmapResponse>(url, params).pipe(
      timeout(300000), // 300 second timeout
      retry(2),
      catchError((error) => {
        console.error("Error fetching thermalmap:", error);
        return of(null);
      }),
    );
  }

  /**
   * Fetch BLE devices and their RSSI at a specific time.
   * @param params BleDevicesAtTimeParams
   * @returns Observable<BleDevicesAtTimeResponse | null>
   */
  fetchBleDevicesAtTime(params: BleDevicesAtTimeParams): Observable<BleDevicesAtTimeResponse | null> {
    const url = "http://localhost:8081/api/historical/radio/devices_at_time";
    console.log("[BLE] Fetching BLE devices at time:", params);
    return this.http.post<BleDevicesAtTimeResponse>(url, params).pipe(
      timeout(300000),
      retry(2),
      catchError((error) => {
        console.error("[BLE] Error fetching BLE devices:", error);
        return of(null);
      }),
    );
  }


    /**
   * Export historical sensor data as CSV or JSON file.
   * Returns an Observable<Blob> containing the file binary.
   */
  exportData(params: ExportDataParams): Observable<Blob> {
    // Map metric if present
    const body = { ...params };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(this.exportUrl, body, {
      headers,
      responseType: 'blob'
    }).pipe(
      timeout(300000),      // 5 minutes
      retry(2),             // retry twice on failure
      catchError(error => {
        console.error('Error exporting data:', error);
        return of(new Blob()); // emit empty Blob on error
      })
    );
  }


  fetchCustomData(params: CustomQueryRequest & { datasetId: number }) {
  const url = `http://localhost:8081/datasets/customquery/${params.datasetId}`;
  // Remove datasetId from body before sending
  const { datasetId, ...body } = params;
  return this.http.post<CustomQueryResponseItem[]>(url, body).pipe(
    timeout(300000),
    retry(2),
    catchError((error) => {
      console.error('[HTTP] Custom Data Error:', error);
      return of([]);
    }),
  );
}




}
