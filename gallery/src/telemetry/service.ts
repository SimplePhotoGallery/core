import os from 'node:os';
import { stdin as input, stdout as output } from 'node:process';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

import Conf from 'conf';

import type { CommandResultSummary } from '../types/command';

import { ConsoleTelemetryClient } from './clients/console';
import { PlausibleTelemetryClient } from './clients/plausible';
import type { TelemetryClient, TelemetryConfigSchema, TelemetryDecision, TelemetryEvent, TelemetryProvider } from './types';

const CONFIG_KEY = 'telemetryEnabled';
const PROVIDER_KEY = 'telemetryProvider';

interface BuildEventParams {
  command: string;
  argumentsProvided: string[];
  globalOptionsProvided: string[];
  metrics?: CommandResultSummary;
  success: boolean;
  error?: { name: string; message: string };
  decision: TelemetryDecision;
  startedAt: number;
}

/**
 * Manages telemetry configuration, consent and dispatching events to a concrete client.
 */
export class TelemetryService {
  private readonly config: Conf<TelemetryConfigSchema>;
  private readonly packageName: string;
  private readonly packageVersion: string;
  private decisionCache?: TelemetryDecision;
  private client?: TelemetryClient;

  constructor(packageName: string, packageVersion: string) {
    this.packageName = packageName;
    this.packageVersion = packageVersion;
    this.config = new Conf<TelemetryConfigSchema>({ projectName: packageName });
  }

  /** Returns the stored telemetry preference, if any. */
  getStoredPreference(): boolean | undefined {
    return this.config.get(CONFIG_KEY);
  }

  /** Updates the persisted telemetry preference. */
  setStoredPreference(enabled: boolean): void {
    this.config.set(CONFIG_KEY, enabled);
    this.decisionCache = undefined;
  }

  /** Determines whether telemetry should be collected for this run. */
  async resolveDecision(override?: '0' | '1'): Promise<TelemetryDecision> {
    if (process.env.CI) {
      return { enabled: false, source: 'ci' };
    }

    if (process.env.DO_NOT_TRACK) {
      return { enabled: false, source: 'do-not-track' };
    }

    if (override) {
      return {
        enabled: override === '1',
        source: 'command-override',
        context: override,
      };
    }

    const envTelemetry = process.env.SPG_TELEMETRY;
    if (envTelemetry === '0') {
      return { enabled: false, source: 'environment', context: 'SPG_TELEMETRY=0' };
    }

    if (envTelemetry === '1') {
      return { enabled: true, source: 'environment', context: 'SPG_TELEMETRY=1' };
    }

    if (this.decisionCache) {
      return this.decisionCache;
    }

    const stored = this.getStoredPreference();
    if (stored !== undefined) {
      const decision: TelemetryDecision = {
        enabled: stored,
        source: 'user-config',
      };
      this.decisionCache = decision;

      return decision;
    }

    const consent = await this.promptForConsent();
    const decision: TelemetryDecision = {
      enabled: consent,
      source: 'consent-default',
      prompted: true,
    };

    this.setStoredPreference(consent);
    this.decisionCache = decision;

    return decision;
  }

  /** Builds and dispatches a telemetry event when telemetry is enabled. */
  async emit(params: BuildEventParams): Promise<void> {
    if (!params.decision.enabled) {
      return;
    }

    const event = this.buildEvent(params);

    try {
      await this.getClient().record(event);
    } catch (error) {
      // Telemetry errors must never break the CLI. Swallow gracefully.
    }
  }

  private buildEvent({
    command,
    argumentsProvided,
    globalOptionsProvided,
    metrics,
    success,
    error,
    decision,
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
      telemetrySource: decision.source,
      telemetryContext: decision.context,
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

  private async promptForConsent(): Promise<boolean> {
    const message = [
      'Simple Photo Gallery collects anonymous usage telemetry to improve the CLI.',
      'No personal data or information about your photos is collected.',
      'Would you like to enable telemetry? (Y/n) ',
    ].join(' ');

    if (!input.isTTY || !output.isTTY) {
      output.write(`${message}Telemetry will be enabled by default. Run "gallery telemetry disable" to opt out.\n`);
      return true;
    }

    const rl = createInterface({ input, output });

    try {
      const answer = (await rl.question(message)).trim().toLowerCase();

      if (answer === 'n' || answer === 'no') {
        output.write('Anonymous telemetry disabled. You can re-enable it with "gallery telemetry enable".\n');
        return false;
      }

      output.write('Thank you! Telemetry will help us improve Simple Photo Gallery.\n');

      return true;
    } finally {
      rl.close();
    }
  }

  private getClient(): TelemetryClient {
    if (this.client) {
      return this.client;
    }

    const provider = this.getProvider();

    if (provider === 'console') {
      this.client = new ConsoleTelemetryClient();
    } else {
      this.client = new PlausibleTelemetryClient({ domain: 'simple.photo' });
    }

    return this.client;
  }

  private getProvider(): TelemetryProvider {
    const envProvider = process.env.SPG_TELEMETRY_PROVIDER as TelemetryProvider | undefined;
    if (envProvider) {
      return envProvider;
    }

    if (process.env.NODE_ENV === 'test') {
      return 'console';
    }

    return this.config.get(PROVIDER_KEY) ?? 'plausible';
  }

  /** Allows overriding the telemetry provider via the CLI command. */
  setProvider(provider: TelemetryProvider): void {
    this.config.set(PROVIDER_KEY, provider);
    this.client = undefined;
  }
}
