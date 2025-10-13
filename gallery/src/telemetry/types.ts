import type { CommandResultSummary } from '../types/command';

export type TelemetryProvider = 'console' | 'plausible';

export interface TelemetryConfigSchema {
  telemetryEnabled?: boolean;
  telemetryProvider?: TelemetryProvider;
}

export interface TelemetryDecision {
  enabled: boolean;
  /** Source that determined whether telemetry is enabled */
  source:
    | 'command-override'
    | 'ci'
    | 'do-not-track'
    | 'environment'
    | 'user-config'
    | 'consent-default';
  /** Additional context about the environment or override */
  context?: string;
  /** Whether we showed a consent prompt during this session */
  prompted?: boolean;
}

export interface TelemetryEvent {
  command: string;
  argumentsProvided: string[];
  globalOptionsProvided: string[];
  timestamp: string;
  durationMs: number;
  packageName: string;
  packageVersion: string;
  nodeVersion: string;
  osPlatform: NodeJS.Platform;
  osRelease: string;
  osArch: string;
  result: 'success' | 'error';
  metrics?: CommandResultSummary;
  errorName?: string;
  errorMessage?: string;
  telemetrySource: TelemetryDecision['source'];
  telemetryContext?: string;
}

export interface TelemetryClient {
  record(event: TelemetryEvent): Promise<void>;
}
