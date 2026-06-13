import process from 'node:process';

import type { TelemetryClient, TelemetryEvent } from '../types';

/**
 * Telemetry client that sends events to the Simple Photo Gallery telemetry API.
 */
export class ApiTelemetryClient implements TelemetryClient {
  private readonly endpoint = 'https://tools.simple.photo/api/telemetry';

  async record(event: TelemetryEvent): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': `simple-photo-gallery/${event.packageVersion} (${process.platform}; ${process.arch})`,
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // Swallow network errors - telemetry must never interrupt the CLI flow.
    }
  }
}
