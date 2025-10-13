import type os from 'node:os';

export type CommandResultSummaryValue = string | number | boolean | undefined;

export type CommandResultSummary = Record<string, CommandResultSummaryValue>;

export interface TelemetryOptions {
  state?: '0' | '1';
}

export interface TelemetryConfigSchema {
  telemetryEnabled?: boolean;
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
  osPlatform: ReturnType<typeof os.platform>;
  osRelease: string;
  osArch: string;
  result: 'success' | 'error';
  metrics?: CommandResultSummary;
  errorName?: string;
  errorMessage?: string;
}

export interface TelemetryClient {
  record(event: TelemetryEvent): Promise<void>;
}
