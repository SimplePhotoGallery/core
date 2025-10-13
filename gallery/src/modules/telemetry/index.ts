import type { ConsolaInstance } from 'consola';

import { getTelemetryConsentStatus, setTelemetryConsent, isTelemetryDisabledByEnv } from '../../utils/telemetry-config';

import type { TelemetryOptions } from './types';

/**
 * Telemetry command implementation
 * Allows users to enable or disable telemetry collection
 * @param options - Options specifying the action (enable, disable, status)
 * @param ui - ConsolaInstance for logging
 */
export async function telemetryCommand(options: TelemetryOptions, ui: ConsolaInstance): Promise<void> {
  const action = options.action?.toLowerCase();

  // Check if telemetry is disabled by environment
  const disabledByEnv = isTelemetryDisabledByEnv();

  if (disabledByEnv) {
    ui.warn('⚠️  Telemetry is disabled by environment variable (CI, DO_NOT_TRACK, or SPG_TELEMETRY=0)');
    ui.info('This setting takes precedence over the configuration.');
    return;
  }

  switch (action) {
    case 'enable': {
      setTelemetryConsent(true);
      ui.success('✅ Telemetry enabled');
      ui.info('Thank you for helping us improve Simple Photo Gallery!');
      break;
    }
    case 'disable': {
      setTelemetryConsent(false);
      ui.success('❌ Telemetry disabled');
      ui.info('You can re-enable it anytime with: gallery telemetry enable');
      break;
    }
    case 'status': {
      const status = getTelemetryConsentStatus();
      if (status === undefined) {
        ui.info('📊 Telemetry status: Not configured (will be asked on first command)');
      } else if (status) {
        ui.info('📊 Telemetry status: ✅ Enabled');
      } else {
        ui.info('📊 Telemetry status: ❌ Disabled');
      }
      break;
    }
    default: {
      ui.error('Invalid action. Use: enable, disable, or status');
      ui.info('Examples:');
      ui.info('  gallery telemetry enable   - Enable telemetry');
      ui.info('  gallery telemetry disable  - Disable telemetry');
      ui.info('  gallery telemetry status   - Show current status');
      break;
    }
  }
}
