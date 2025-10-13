import process from 'node:process';

import { PLAUSIBLE_DOMAIN, PLAUSIBLE_ENDPOINT, PLAUSIBLE_URL } from '../config';

import type { TelemetryClient, TelemetryEvent } from '../types';

/**
 * Telemetry client that forwards anonymised events to Plausible Analytics.
 */
export class PlausibleTelemetryClient implements TelemetryClient {
  async record(event: TelemetryEvent): Promise<void> {
    const props: Record<string, string> = {
      command: event.command,
      result: event.result,
      packageVersion: event.packageVersion,
      packageName: event.packageName,
      nodeVersion: event.nodeVersion,
      osPlatform: event.osPlatform,
      osRelease: event.osRelease,
      osArch: event.osArch,
      durationMs: event.durationMs.toString(),
    };

    if (event.argumentsProvided.length > 0) {
      props.options = event.argumentsProvided.join(',');
    }

    if (event.globalOptionsProvided.length > 0) {
      props.globalOptions = event.globalOptionsProvided.join(',');
    }

    if (event.metrics) {
      for (const [key, value] of Object.entries(event.metrics)) {
        if (value === undefined) {
          continue;
        }

        props[`metric_${key}`] = String(value);
      }
    }

    if (event.errorName) {
      props.errorName = event.errorName;
    }

    if (event.errorMessage) {
      props.errorMessage = event.errorMessage;
    }

    try {
      await fetch(PLAUSIBLE_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': `simple-photo-gallery/${event.packageVersion} (${process.platform}; ${process.arch})`,
        },
        body: JSON.stringify({
          name: 'cli-command',
          domain: PLAUSIBLE_DOMAIN,
          url: PLAUSIBLE_URL,
          props,
        }),
      });
    } catch {
      // Swallow network errors - telemetry must never interrupt the CLI flow.
    }
  }
}
