import os from 'node:os';
import process from 'node:process';

import packageJson from '../../package.json' with { type: 'json' };

/**
 * Telemetry event data structure
 */
export interface TelemetryEvent {
  /** Name of the command that was run */
  command: string;
  /** Arguments that were set (not values, just names) */
  arguments: string[];
  /** Result of the command */
  result: 'success' | 'error';
  /** Error message if result is error */
  error?: string;
  /** Number of items processed (photos, galleries, etc.) */
  itemsProcessed?: number;
  /** Type of items processed (photos, galleries, etc.) */
  itemType?: string;
  /** SPG version */
  spgVersion: string;
  /** Node.js version */
  nodeVersion: string;
  /** Operating system platform */
  platform: string;
  /** Operating system release */
  osRelease: string;
  /** CPU architecture */
  arch: string;
  /** Timestamp of the event */
  timestamp: string;
}

/**
 * Gets system information for telemetry
 * @returns System information object
 */
export function getSystemInfo() {
  return {
    spgVersion: packageJson.version,
    nodeVersion: process.version,
    platform: os.platform(),
    osRelease: os.release(),
    arch: os.arch(),
  };
}

/**
 * Creates a telemetry event
 * @param command - Command name
 * @param args - Command arguments object
 * @param result - Command result
 * @param error - Error if any
 * @param itemsProcessed - Number of items processed
 * @param itemType - Type of items processed
 * @returns Telemetry event object
 */
export function createTelemetryEvent(
  command: string,
  args: Record<string, unknown>,
  result: 'success' | 'error',
  error?: Error,
  itemsProcessed?: number,
  itemType?: string,
): TelemetryEvent {
  // Extract argument names (not values) to avoid leaking data
  const argumentNames = Object.keys(args).filter((key) => {
    const value = args[key];
    // Only include if the value is not the default/empty
    return value !== undefined && value !== false && value !== '' && value !== null;
  });

  return {
    command,
    arguments: argumentNames,
    result,
    error: error?.message,
    itemsProcessed,
    itemType,
    ...getSystemInfo(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sanitizes an error message to remove any potential sensitive information
 * @param error - Error object
 * @returns Sanitized error message
 */
export function sanitizeError(error: Error): string {
  let message = error.message;

  // Remove file paths (anything that looks like a path)
  message = message.replace(/\/[^\s]+/g, '[path]');
  message = message.replace(/[A-Z]:\\[^\s]+/gi, '[path]');

  // Remove URLs
  message = message.replace(/https?:\/\/[^\s]+/gi, '[url]');

  // Remove email addresses
  message = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');

  return message;
}
