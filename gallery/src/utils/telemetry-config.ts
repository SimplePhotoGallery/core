import Conf from 'conf';
import type { ConsolaInstance } from 'consola';

/**
 * Configuration store for telemetry settings
 */
const config = new Conf({
  projectName: 'simple-photo-gallery',
  projectSuffix: '',
});

/**
 * Checks if telemetry should be disabled based on environment variables
 * @returns True if telemetry is disabled via environment
 */
export function isTelemetryDisabledByEnv(): boolean {
  // Check if CI environment
  if (process.env.CI) {
    return true;
  }

  // Check if DO_NOT_TRACK is set
  if (process.env.DO_NOT_TRACK === '1' || process.env.DO_NOT_TRACK === 'true') {
    return true;
  }

  // Check if SPG_TELEMETRY is set to 0
  if (process.env.SPG_TELEMETRY === '0' || process.env.SPG_TELEMETRY === 'false') {
    return true;
  }

  return false;
}

/**
 * Checks if telemetry is enabled
 * @param overrideTelemetry - Optional override value (0 or 1)
 * @returns True if telemetry is enabled
 */
export function isTelemetryEnabled(overrideTelemetry?: number): boolean {
  // Check override first
  if (overrideTelemetry !== undefined) {
    return overrideTelemetry === 1;
  }

  // Check environment variables
  if (isTelemetryDisabledByEnv()) {
    return false;
  }

  // Check stored configuration
  const hasConsented = config.get('telemetry.consented') as boolean | undefined;
  if (hasConsented === undefined) {
    // Not yet asked - will be asked on first run
    return false;
  }

  return hasConsented;
}

/**
 * Sets telemetry consent in the configuration
 * @param enabled - Whether telemetry should be enabled
 */
export function setTelemetryConsent(enabled: boolean): void {
  config.set('telemetry.consented', enabled);
}

/**
 * Checks if the user has been asked for consent
 * @returns True if consent has been requested before
 */
export function hasAskedForConsent(): boolean {
  return config.get('telemetry.consented') !== undefined;
}

/**
 * Asks the user for telemetry consent if they haven't been asked before
 * @param ui - ConsolaInstance for prompting
 * @returns Promise resolving to whether telemetry is enabled
 */
export async function ensureTelemetryConsent(ui: ConsolaInstance): Promise<boolean> {
  // Don't ask if disabled by environment
  if (isTelemetryDisabledByEnv()) {
    return false;
  }

  // Don't ask if already asked
  if (hasAskedForConsent()) {
    return isTelemetryEnabled();
  }

  // Ask for consent
  ui.info('');
  ui.info('🔍 Simple Photo Gallery collects anonymous telemetry to improve the tool.');
  ui.info('📊 We collect: command usage, Node.js version, OS, and error information.');
  ui.info('🔒 We never collect: personal data, photo data, file paths, or any sensitive information.');
  ui.info('');

  const consent = await ui.prompt('Would you like to help us improve by sharing anonymous telemetry?', {
    type: 'confirm',
    initial: true,
  });

  setTelemetryConsent(consent as boolean);

  if (consent) {
    ui.success('Thank you! You can disable telemetry anytime with: gallery telemetry disable');
  } else {
    ui.info('Telemetry disabled. You can enable it anytime with: gallery telemetry enable');
  }

  ui.info('');

  return consent as boolean;
}

/**
 * Gets the current telemetry consent status
 * @returns The consent status or undefined if not yet asked
 */
export function getTelemetryConsentStatus(): boolean | undefined {
  return config.get('telemetry.consented') as boolean | undefined;
}
