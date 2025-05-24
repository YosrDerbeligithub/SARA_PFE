import { Injectable, NgZone } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class SensorStreamService {
  private dataSubject = new ReplaySubject<any>(1);
  public dataStream$ = this.dataSubject.asObservable();

  private currentParams: { facility?: string; box?: string; sensor?: string } = {};
  private controls: {
    frequency?: number;
    buffer_time?: number;
    aggregation_metric?: string;
  } = {};

  /** Map of “key URL” (without timestamp) → EventSource */
  private connectionMap = new Map<string, EventSource>();
  /** Ordered list for pruning oldest connections */
  private activeConnections: EventSource[] = [];
  private readonly MAX_CONNECTIONS = 1;

  /** Last “key URL” we opened, so we can skip redundant reconnects */
  private lastKeyUrl: string | null = null;

  /** Debounce scheduling flags */
  private connectScheduled = false;
  private connectTimer: any = null;

  constructor(private zone: NgZone) {}

  /**
   * Called when facility/box/sensor path params change.
   * Debounced to collapse rapid successive calls.
   */
  updateParams(params: { facility: string; box: string; sensor: string }): void {
    console.log('[SERVICE] updateParams()', {
      old: this.currentParams,
      new: params
    });
    this.currentParams = { ...params };
    this.scheduleConnect();
  }

  /**
   * Called when frequency, buffer_time, or aggregation_metric change.
   * Debounced to collapse rapid successive calls.
   */
  updateControls(controls: {
    frequency?: number;
    buffer_time?: number;
    aggregation_metric?: string;
  }): void {
    console.log('[SERVICE] updateControls()', {
      old: this.controls,
      incoming: controls
    });
    this.controls = { ...this.controls, ...controls };
    this.scheduleConnect();
  }

  /** Pause the currently active stream by key */
  pause(): void {
    console.log('[SERVICE] pause() — closing last EventSource');
    if (this.lastKeyUrl && this.connectionMap.has(this.lastKeyUrl)) {
      const es = this.connectionMap.get(this.lastKeyUrl)!;
      es.close();
      this.removeFromActiveConnections(es);
      this.connectionMap.delete(this.lastKeyUrl);
    }
    this.lastKeyUrl = null;
  }

  /** Resume (reconnect) with the same params+controls */
  resume(): void {
    console.log('[SERVICE] resume()');
    this.scheduleConnect();
  }

  /** Completely tear down all connections */
  disconnect(): void {
    console.log('[ERVICE] disconnect() — closing all EventSources');
    for (const es of this.activeConnections) {
      es.close();
    }
    this.activeConnections = [];
    this.connectionMap.clear();
    this.lastKeyUrl = null;
    clearTimeout(this.connectTimer);
    this.connectScheduled = false;
  }

  /** Internal handler for incoming SSE "update" events */
  private updateHandler = (e: MessageEvent) => {
    console.log('[SERVICE][RAW update]', e.data);
    const msg = JSON.parse(e.data);
    if (msg.reading != null) {
      this.zone.run(() => this.dataSubject.next(msg));
    }
  };

  /** Schedule a debounced connect call (batches multiple calls within 50ms) */
  private scheduleConnect(): void {
    if (this.connectScheduled) {
      clearTimeout(this.connectTimer);
    } else {
      this.connectScheduled = true;
    }
    this.connectTimer = setTimeout(() => {
      this.connectScheduled = false;
      this.connect();
    }, 50);
  }

  /** Core connect/reconnect logic */
  private connect(): void {
    // 1) Build the key URL (exclude timestamp)
    const keyUrl = this.buildUrl({ includeTimestamp: false });
    if (!keyUrl) {
      console.warn('[SERVICE] cannot build URL, missing params', this.currentParams);
      return;
    }

    // 2) If key unchanged, skip reconnect
    if (keyUrl === this.lastKeyUrl) {
      console.log('[SERVICE] key URL unchanged, skipping reconnect:', keyUrl);
      return;
    }
    this.lastKeyUrl = keyUrl;

    // 3) Close any existing ES for that key
    if (this.connectionMap.has(keyUrl)) {
      console.log('[SERVICE] Closing existing connection for', keyUrl);
      const oldES = this.connectionMap.get(keyUrl)!;
      oldES.close();
      this.removeFromActiveConnections(oldES);
      this.connectionMap.delete(keyUrl);
    }

    // 4) Build the real URL (with timestamp) and open SSE
    const realUrl = this.buildUrl({ includeTimestamp: true })!;
    console.log('[SERVICE] opening SSE →', realUrl);
    let es: EventSource;
    try {
      es = new EventSource(realUrl);
    } catch (err) {
      console.error('[SERVICE] SSE connection failed', err);
      this.zone.run(() => this.dataSubject.error(err));
      return;
    }

    // 5) Track and wire handlers
    this.connectionMap.set(keyUrl, es);
    this.activeConnections.push(es);

    es.onopen = () => {
      console.log('[SERVICE] SSE onopen');
      // prime subscriber with a null to reset buffers
      this.zone.run(() => this.dataSubject.next(null));
      this.cleanupOldConnections();
    };

    es.onerror = (err) => {
      console.error('[SERVICE] SSE error', err);
      this.zone.run(() => this.dataSubject.error(err));
      this.removeConnection(es, keyUrl);
    };

    es.addEventListener('update', this.updateHandler);

    // 6) Prune if exceeding MAX_CONNECTIONS
    this.cleanupOldConnections();
  }

  /**
   * Constructs the SSE endpoint URL.
   * @param includeTimestamp if true, adds a cache-buster `_` param
   */
  private buildUrl(opts: { includeTimestamp: boolean }): string | null {
    var { facility, box, sensor } = this.currentParams;
    if (!facility || !box || !sensor) {
      return null;
    }
    if (sensor === 'ble') {
    sensor = 'radio';
  }


    const base = `http://localhost:8002/monitoring/${facility}/${box}/${sensor}`;
    const params = new URLSearchParams();
    if (this.controls.frequency != null) {
      params.set('frequency', this.controls.frequency.toString());
    }
    if (this.controls.aggregation_metric) {
      params.set('aggregation_metric', this.controls.aggregation_metric);
      const buf = this.controls.buffer_time ?? this.controls.frequency!;
      params.set('buffer_time', buf.toString());
    }
    if (opts.includeTimestamp) {
      params.set('_', Date.now().toString());
    }

    return `${base}?${params.toString()}`;
  }

  /** Closes oldest connections when over the MAX_CONNECTIONS limit */
  private cleanupOldConnections(): void {
    while (this.activeConnections.length > this.MAX_CONNECTIONS) {
      const old = this.activeConnections.shift()!;
      console.log('[SERVICE] Pruning old connection');
      old.close();
      // remove it from the map
      for (const [key, es] of this.connectionMap.entries()) {
        if (es === old) {
          this.connectionMap.delete(key);
          break;
        }
      }
    }
  }

  /** Helper to remove a specific ES instance */
  private removeConnection(es: EventSource, key: string): void {
    es.close();
    this.connectionMap.delete(key);
    this.removeFromActiveConnections(es);
  }

  /** Remove from our activeConnections array */
  private removeFromActiveConnections(es: EventSource): void {
    const idx = this.activeConnections.indexOf(es);
    if (idx !== -1) {
      this.activeConnections.splice(idx, 1);
    }
  }
}
