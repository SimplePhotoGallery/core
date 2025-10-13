import type { ConsolaInstance } from 'consola';

import type { TelemetryService } from '../../telemetry';
import type { CommandResultSummary } from '../../types/command';

export interface ManageTelemetryOptions {
  enable?: boolean;
  disable?: boolean;
  provider?: string;
}

/**
 * Handles the `gallery telemetry` command allowing users to configure telemetry preferences.
 */
export async function manageTelemetry(
  options: ManageTelemetryOptions,
  ui: ConsolaInstance,
  telemetryService: TelemetryService,
): Promise<CommandResultSummary> {
  const updates: CommandResultSummary = {};

  if (options.enable && options.disable) {
    ui.error('Cannot enable and disable telemetry simultaneously.');
    throw new Error('Invalid telemetry options');
  }

  if (options.enable) {
    telemetryService.setStoredPreference(true);
    ui.success('Anonymous telemetry enabled.');
    updates.telemetryEnabled = true;
  } else if (options.disable) {
    telemetryService.setStoredPreference(false);
    ui.success('Anonymous telemetry disabled.');
    updates.telemetryEnabled = false;
  } else {
    const current = telemetryService.getStoredPreference();

    if (current === undefined) {
      ui.info('Telemetry preference not set yet. It will be requested on next command run.');
      updates.telemetryStatus = 'unset';
    } else {
      ui.info(`Telemetry is currently ${current ? 'enabled' : 'disabled'}.`);
      updates.telemetryEnabled = current;
    }
  }

  if (options.provider) {
    const provider = options.provider === 'console' ? 'console' : options.provider === 'plausible' ? 'plausible' : undefined;

    if (!provider) {
      ui.warn('Unknown provider. Supported providers are "console" and "plausible".');
      updates.telemetryProvider = 'invalid';
    } else {
      telemetryService.setProvider(provider);
      ui.success(`Telemetry provider set to ${provider}.`);
      updates.telemetryProvider = provider;
    }
  }

  return updates;
}
