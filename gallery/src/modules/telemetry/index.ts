import type { TelemetryService } from './service';
import type { CommandResultSummary, TelemetryOptions } from './types';
import type { ConsolaInstance } from 'consola';

/**
 * Handles the `gallery telemetry` command allowing users to configure telemetry preferences.
 */
export async function telemetry(
  options: TelemetryOptions,
  ui: ConsolaInstance,
  telemetryService: TelemetryService,
): Promise<CommandResultSummary> {
  const updates: CommandResultSummary = {};

  // Return the status if no state is provided
  if (options.state === undefined) {
    const current = telemetryService.getStoredPreference();
    if (current === undefined) {
      ui.info('Telemetry preference not set yet. It will be requested on next command run.');
      updates.telemetryStatus = 'unset';
    } else {
      ui.info(`Telemetry is currently ${current ? 'enabled' : 'disabled'}.`);
      updates.telemetryEnabled = current;
    }
  } else {
    // Set the telemetry preference
    telemetryService.setStoredPreference(options.state === '1');
    ui.success(`Anonymous telemetry ${options.state === '1' ? 'enabled' : 'disabled'}.`);
    updates.telemetryEnabled = options.state === '1';
  }

  return updates;
}
