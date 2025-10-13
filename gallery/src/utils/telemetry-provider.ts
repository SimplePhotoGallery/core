import type { TelemetryEvent } from './telemetry-data';

/**
 * Abstract interface for telemetry providers
 */
export interface TelemetryProvider {
  /**
   * Send a telemetry event
   * @param event - Telemetry event to send
   */
  send(event: TelemetryEvent): Promise<void>;

  /**
   * Get the provider name
   */
  getName(): string;
}

/**
 * Console telemetry provider - prints telemetry to console for testing
 */
export class ConsoleTelemetryProvider implements TelemetryProvider {
  getName(): string {
    return 'console';
  }

  async send(event: TelemetryEvent): Promise<void> {
    console.log('📊 Telemetry Event:', JSON.stringify(event, null, 2));
  }
}

/**
 * Plausible Analytics telemetry provider
 */
export class PlausibleTelemetryProvider implements TelemetryProvider {
  private readonly domain: string;
  private readonly endpoint: string;

  constructor(domain: string = 'simple.photo', endpoint: string = 'https://plausible.io/api/event') {
    this.domain = domain;
    this.endpoint = endpoint;
  }

  getName(): string {
    return 'plausible';
  }

  async send(event: TelemetryEvent): Promise<void> {
    try {
      // Plausible event payload
      const payload = {
        name: `CLI: ${event.command}`,
        url: `https://${this.domain}/cli/${event.command}`,
        domain: this.domain,
        props: {
          command: event.command,
          result: event.result,
          spg_version: event.spgVersion,
          node_version: event.nodeVersion,
          platform: event.platform,
          os_release: event.osRelease,
          arch: event.arch,
          arguments: event.arguments.join(','),
          ...(event.error && { error: event.error }),
          ...(event.itemsProcessed !== undefined && { items_processed: event.itemsProcessed.toString() }),
          ...(event.itemType && { item_type: event.itemType }),
        },
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `simple-photo-gallery/${event.spgVersion}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Silently fail - don't break the user's command if telemetry fails
        console.debug(`Telemetry failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Silently fail - don't break the user's command if telemetry fails
      console.debug('Telemetry error:', error);
    }
  }
}

/**
 * Gets the telemetry provider based on environment or configuration
 * @param providerName - Optional provider name (console, plausible)
 * @returns Telemetry provider instance
 */
export function getTelemetryProvider(providerName?: string): TelemetryProvider {
  const provider = providerName || process.env.SPG_TELEMETRY_PROVIDER || 'plausible';

  switch (provider) {
    case 'console': {
      return new ConsoleTelemetryProvider();
    }
    case 'plausible': {
      return new PlausibleTelemetryProvider();
    }
    default: {
      return new PlausibleTelemetryProvider();
    }
  }
}
