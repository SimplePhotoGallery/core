#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';
import { createConsola, LogLevels, type ConsolaInstance } from 'consola';

import { build } from './modules/build';
import { clean } from './modules/clean';
import { init } from './modules/init';
import { telemetryCommand } from './modules/telemetry';
import { thumbnails } from './modules/thumbnails';
import { ensureTelemetryConsent, telemetry } from './utils';
import { getAndClearCommandMetrics } from './utils/command-metrics';
import { checkForUpdates, displayUpdateNotification, waitForUpdateCheck } from './utils/version';

import packageJson from '../package.json' with { type: 'json' };

/** Command line interface program instance */
const program = new Command();

program
  .name('gallery')
  .description('Simple Photo Gallery CLI')
  .version(packageJson.version)
  .option('-v, --verbose', 'Verbose output (debug level)', false)
  .option('-q, --quiet', 'Minimal output (only warnings/errors)', false)
  .showHelpAfterError(true);

/**
 * Creates a Consola UI instance with appropriate log level based on global options
 * @param globalOpts - Global command options containing verbose/quiet flags
 * @returns ConsolaInstance configured with appropriate log level and tag
 */
function createConsolaUI(globalOpts: ReturnType<typeof program.opts>): ConsolaInstance {
  let level = LogLevels.info;

  if (globalOpts.quiet) {
    level = LogLevels.warn;
  } else if (globalOpts.verbose) {
    level = LogLevels.debug;
  }

  return createConsola({
    level,
  }).withTag('simple-photo-gallery');
}

/**
 * Higher-order function that wraps command handlers to provide ConsolaUI instance
 * @param handler - Command handler function that receives options and UI instance
 * @param commandName - Name of the command for telemetry
 * @returns Wrapped handler function that creates UI and handles errors
 */
function withConsolaUI<O extends { telemetry?: number }>(
  handler: (opts: O, ui: ConsolaInstance) => Promise<void> | void,
  commandName: string,
) {
  return async (opts: O) => {
    const ui = createConsolaUI(program.opts());

    // Get telemetry override from options
    const telemetryOverride = opts.telemetry;

    // Ask for telemetry consent on first run (only for non-telemetry commands)
    if (commandName !== 'telemetry') {
      await ensureTelemetryConsent(ui);
    }

    // Start update check in background (non-blocking)
    const updateCheckPromise = checkForUpdates(packageJson.name, packageJson.version);

    let commandError: Error | undefined;
    let commandResult: unknown;

    try {
      commandResult = await handler(opts, ui);
    } catch (error) {
      commandError = error instanceof Error ? error : new Error(String(error));
      ui.debug(error);

      process.exitCode = 1;
    }

    // Record telemetry
    if (commandName !== 'telemetry') {
      // Get metrics from commands
      const metrics = getAndClearCommandMetrics();

      await (commandError
        ? telemetry.recordError(commandName, opts as Record<string, unknown>, commandError, telemetryOverride)
        : telemetry.recordSuccess(
            commandName,
            opts as Record<string, unknown>,
            metrics?.itemsProcessed,
            metrics?.itemType,
            telemetryOverride,
          ));
    }

    // After command completes, check if update is available
    // Wait up to 5 seconds for the check to complete
    const updateInfo = await waitForUpdateCheck(updateCheckPromise);

    if (updateInfo) {
      displayUpdateNotification(updateInfo, ui);
    }
  };
}

program
  .command('init')
  .description('Initialize a gallery by scaning a folder for images and videos')
  .option(
    '-p, --photos <path>',
    'Path to the folder where the photos are stored. Default: current working directory',
    process.cwd(),
  )
  .option(
    '-g, --gallery <path>',
    'Path to the directory where the gallery will be initialized. Default: same directory as the photos folder',
  )
  .option('-r, --recursive', 'Recursively create galleries from all photos subdirectories', false)
  .option('-d, --default', 'Use default gallery settings instead of asking the user', false)
  .option('--telemetry <value>', 'Override telemetry setting (0=disable, 1=enable)', (value) => Number.parseInt(value, 10))
  .action(withConsolaUI(init, 'init'));

program
  .command('thumbnails')
  .description('Create thumbnails for all media files in the gallery')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .option('--telemetry <value>', 'Override telemetry setting (0=disable, 1=enable)', (value) => Number.parseInt(value, 10))
  .action(withConsolaUI(thumbnails, 'thumbnails'));

program
  .command('build')
  .description('Build the HTML gallery in the specified directory')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .option('-b, --base-url <url>', 'Base URL where the photos are hosted')
  .option('--telemetry <value>', 'Override telemetry setting (0=disable, 1=enable)', (value) => Number.parseInt(value, 10))
  .action(withConsolaUI(build, 'build'));

program
  .command('clean')
  .description('Remove all gallery files and folders (index.html, gallery/)')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Clean subdirectories recursively', false)
  .option('--telemetry <value>', 'Override telemetry setting (0=disable, 1=enable)', (value) => Number.parseInt(value, 10))
  .action(withConsolaUI(clean, 'clean'));

program
  .command('telemetry <action>')
  .description('Manage telemetry settings (enable, disable, status)')
  .action(async (action: string) => {
    const ui = createConsolaUI(program.opts());
    try {
      await telemetryCommand({ action }, ui);
    } catch (error) {
      ui.debug(error);
      process.exitCode = 1;
    }
  });

program.parse();
