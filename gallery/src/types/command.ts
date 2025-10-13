export type CommandResultSummaryValue = string | number | boolean | undefined;

export type CommandResultSummary = Record<string, CommandResultSummaryValue>;

export interface TelemetryOption {
  /** Command-level override for telemetry collection */
  telemetry?: '0' | '1';
}
