import { createTelemetryEvent, sanitizeError, type TelemetryEvent } from './telemetry-data';
import { getTelemetryProvider, type TelemetryProvider } from './telemetry-provider';
import { isTelemetryEnabled } from './telemetry-config';

/**
 * Telemetry manager class
 */
class TelemetryManager {
  private provider: TelemetryProvider;

  constructor(provider?: TelemetryProvider) {
    this.provider = provider || getTelemetryProvider();
  }

  /**
   * Sets the telemetry provider
   * @param provider - Telemetry provider to use
   */
  setProvider(provider: TelemetryProvider): void {
    this.provider = provider;
  }

  /**
   * Sends a telemetry event if telemetry is enabled
   * @param event - Telemetry event to send
   * @param overrideTelemetry - Optional override to force enable/disable
   */
  async send(event: TelemetryEvent, overrideTelemetry?: number): Promise<void> {
    if (!isTelemetryEnabled(overrideTelemetry)) {
      return;
    }

    try {
      await this.provider.send(event);
    } catch (error) {
      // Silently fail - don't break the user's command
      console.debug('Telemetry send error:', error);
    }
  }

  /**
   * Records a successful command execution
   * @param command - Command name
   * @param args - Command arguments
   * @param itemsProcessed - Number of items processed
   * @param itemType - Type of items processed
   * @param overrideTelemetry - Optional override to force enable/disable
   */
  async recordSuccess(
    command: string,
    args: Record<string, unknown>,
    itemsProcessed?: number,
    itemType?: string,
    overrideTelemetry?: number,
  ): Promise<void> {
    const event = createTelemetryEvent(command, args, 'success', undefined, itemsProcessed, itemType);
    await this.send(event, overrideTelemetry);
  }

  /**
   * Records a failed command execution
   * @param command - Command name
   * @param args - Command arguments
   * @param error - Error that occurred
   * @param overrideTelemetry - Optional override to force enable/disable
   */
  async recordError(
    command: string,
    args: Record<string, unknown>,
    error: Error,
    overrideTelemetry?: number,
  ): Promise<void> {
    // Sanitize error to remove sensitive information
    const sanitizedError = new Error(sanitizeError(error));
    const event = createTelemetryEvent(command, args, 'error', sanitizedError);
    await this.send(event, overrideTelemetry);
  }
}

// Export singleton instance
export const telemetry = new TelemetryManager();

// Export types and utilities
export type { TelemetryEvent } from './telemetry-data';
export type { TelemetryProvider } from './telemetry-provider';
export { getTelemetryProvider } from './telemetry-provider';
export { isTelemetryEnabled, setTelemetryConsent, ensureTelemetryConsent } from './telemetry-config';
