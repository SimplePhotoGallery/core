import process from 'node:process';

import type { TelemetryClient, TelemetryEvent } from '../types';

interface PlausibleTelemetryOptions {
  domain: string;
  endpoint?: string;
  url?: string;
}

const DEFAULT_ENDPOINT = 'https://plausible.io/api/event';
const DEFAULT_URL = 'https://simple.photo/gallery-cli';

/**
 * Telemetry client that forwards anonymised events to Plausible Analytics.
 */
export class PlausibleTelemetryClient implements TelemetryClient {
  private readonly endpoint: string;
  private readonly domain: string;
  private readonly url: string;

  constructor(options: PlausibleTelemetryOptions) {
    this.domain = options.domain;
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.url = options.url ?? DEFAULT_URL;
  }

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
      telemetrySource: event.telemetrySource,
      durationMs: event.durationMs.toString(),
    };

    if (event.argumentsProvided.length > 0) {
      props.options = event.argumentsProvided.join(',');
    }

    if (event.globalOptionsProvided.length > 0) {
      props.globalOptions = event.globalOptionsProvided.join(',');
    }

    if (event.telemetryContext) {
      props.telemetryContext = event.telemetryContext;
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
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': `simple-photo-gallery/${event.packageVersion} (${process.platform}; ${process.arch})`,
        },
        body: JSON.stringify({
          name: 'cli-command',
          domain: this.domain,
          url: this.url,
          props,
        }),
      });
    } catch (error) {
      // Swallow network errors - telemetry must never interrupt the CLI flow.
    }
  }
}
