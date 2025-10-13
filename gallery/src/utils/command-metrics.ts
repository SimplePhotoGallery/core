/**
 * Command metrics tracking for telemetry
 */

// Global metrics storage for the current command execution
let currentCommandMetrics: CommandMetrics | undefined;

/**
 * Command metrics interface
 */
export interface CommandMetrics {
  /** Number of items processed */
  itemsProcessed?: number;
  /** Type of items processed */
  itemType?: string;
}

/**
 * Sets the current command metrics
 * @param metrics - Metrics to set
 */
export function setCommandMetrics(metrics: CommandMetrics): void {
  currentCommandMetrics = metrics;
}

/**
 * Gets the current command metrics and clears them
 * @returns Current command metrics
 */
export function getAndClearCommandMetrics(): CommandMetrics | undefined {
  const metrics = currentCommandMetrics;
  currentCommandMetrics = undefined;
  return metrics;
}

/**
 * Clears the current command metrics
 */
export function clearCommandMetrics(): void {
  currentCommandMetrics = undefined;
}
