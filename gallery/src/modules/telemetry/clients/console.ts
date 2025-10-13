import { stdout } from 'node:process';

import type { TelemetryClient, TelemetryEvent } from '../types';

/**
 * Telemetry client that prints events to the console.
 * Useful for local development and testing without sending network requests.
 */
export class ConsoleTelemetryClient implements TelemetryClient {
  async record(event: TelemetryEvent): Promise<void> {
    const serialized = JSON.stringify(event, null, 2);

    stdout.write(`TELEMETRY EVENT: ${serialized}\n`);
  }
}
