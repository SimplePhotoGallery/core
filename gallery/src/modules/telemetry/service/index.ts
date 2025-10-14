import os from 'node:os';
import process from 'node:process';

import Conf from 'conf';

import { ConsoleTelemetryClient } from '../clients/console';
import { PlausibleTelemetryClient } from '../clients/plausible';

import type { CommandResultSummary, TelemetryClient, TelemetryConfigSchema, TelemetryEvent } from '../types';
import type { ConsolaInstance } from 'consola';

const CONFIG_KEY = 'telemetryEnabled';

interface BuildEventParams {
  command: string;
  argumentsProvided: string[];
  globalOptionsProvided: string[];
  metrics?: CommandResultSummary;
  success: boolean;
  error?: { name: string; message: string };
  startedAt: number;
}

/**
 * Manages telemetry configuration, consent and dispatching events to a concrete client.
 */
export class TelemetryService {
  private readonly config: Conf<TelemetryConfigSchema>;
  private readonly packageName: string;
  private readonly packageVersion: string;
  private readonly ui: ConsolaInstance;

  private client?: TelemetryClient;

  constructor(packageName: string, packageVersion: string, ui: ConsolaInstance) {
    this.packageName = packageName;
    this.packageVersion = packageVersion;
    this.ui = ui;
    this.config = new Conf<TelemetryConfigSchema>({ projectName: packageName });
  }

  /** Returns the stored telemetry preference, if any. */
  getStoredPreference(): boolean | undefined {
    return this.config.get(CONFIG_KEY);
  }

  /** Updates the persisted telemetry preference. */
  setStoredPreference(enabled: boolean): void {
    this.config.set(CONFIG_KEY, enabled);
  }

  /** Determines whether telemetry should be collected for this run. */
  async shouldCollectTelemetry(override?: '0' | '1'): Promise<boolean> {
    /** Command-level override */
    if (override) {
      return override === '1';
    }

    /** CI or DO_NOT_TRACK environment variables */
    if (process.env.CI || process.env.DO_NOT_TRACK) {
      return false;
    }

    /** SPG_TELEMETRY environment variable */
    if (process.env.SPG_TELEMETRY) {
      return process.env.SPG_TELEMETRY === '1';
    }

    /** Stored preference */
    const stored = this.getStoredPreference();

    if (stored === undefined) {
      // Ask the user if no consent was given yet
      const consent = await this.promptForConsent();
      this.setStoredPreference(consent);
      return consent;
    } else {
      // Return the stored preference
      return stored;
    }
  }

  /** Builds and dispatches a telemetry event when telemetry is enabled. */
  async emit(params: BuildEventParams): Promise<void> {
    const event = this.buildEvent(params);

    try {
      const client = await this.getClient();

      if (client) {
        await client.record(event);
      }
    } catch (error) {
      this.ui.debug('Error recording telemetry event', error);
    }
  }

  /** Builds a telemetry event. */
  private buildEvent({
    command,
    argumentsProvided,
    globalOptionsProvided,
    metrics,
    success,
    error,
    startedAt,
  }: BuildEventParams): TelemetryEvent {
    const now = Date.now();

    const event: TelemetryEvent = {
      command,
      argumentsProvided,
      globalOptionsProvided,
      timestamp: new Date(now).toISOString(),
      durationMs: now - startedAt,
      packageName: this.packageName,
      packageVersion: this.packageVersion,
      nodeVersion: process.version,
      osPlatform: os.platform(),
      osRelease: os.release(),
      osArch: os.arch(),
      result: success ? 'success' : 'error',
    };

    if (metrics && Object.keys(metrics).length > 0) {
      event.metrics = metrics;
    }

    if (!success && error) {
      event.errorName = error.name;
      event.errorMessage = error.message;
    }

    return event;
  }

  /** Prompts the user for consent to collect telemetry. */
  private async promptForConsent(): Promise<boolean> {
    this.ui.info(
      'Simple Photo Gallery collects anonymous usage telemetry to improve the CLI. No personal data or information about your photos is collected.',
    );

    const answer = await this.ui.prompt('Would you like to enable telemetry?', {
      type: 'confirm',
      initial: true,
    });

    if (!answer) {
      this.ui.info('Anonymous telemetry disabled. You can re-enable it with "spg telemetry 1".');
      return false;
    }

    this.ui.success('Thank you! Telemetry will help us improve Simple Photo Gallery.');
    return true;
  }

  /** Returns the telemetry client. */
  private getClient(): TelemetryClient | undefined {
    if (!this.client) {
      // Create the client based on the environment variable
      switch (process.env.SPG_TELEMETRY_PROVIDER) {
        case 'none': {
          this.client = undefined;
          break;
        }
        case 'console': {
          this.client = new ConsoleTelemetryClient();
          break;
        }
        case 'plausible': {
          this.client = new PlausibleTelemetryClient();
          break;
        }
        default: {
          this.client = new PlausibleTelemetryClient();
          break;
        }
      }
    }

    return this.client;
  }
}
