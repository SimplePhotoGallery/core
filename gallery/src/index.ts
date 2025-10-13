#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';
import { createConsola, LogLevels, type ConsolaInstance } from 'consola';

import { build } from './modules/build';
import { clean } from './modules/clean';
import { init } from './modules/init';
import { telemetry } from './modules/telemetry';
import { TelemetryService } from './modules/telemetry/service';
import { thumbnails } from './modules/thumbnails';
import { parseTelemetryOption } from './utils';
import { checkForUpdates, displayUpdateNotification, waitForUpdateCheck } from './utils/version';

import packageJson from '../package.json' with { type: 'json' };

import type { CommandResultSummary } from './modules/telemetry/types';
import type { TelemetryOption } from './types';
import type { Command as CommanderCommand } from 'commander';

/** Command line interface program instance */
const program = new Command();

const telemetryService = new TelemetryService(packageJson.name, packageJson.version, createConsolaUI(program.opts()));

program
  .name('gallery')
  .description('Simple Photo Gallery CLI')
  .version(packageJson.version)
  .option('-v, --verbose', 'Verbose output (debug level)', false)
  .option('-q, --quiet', 'Minimal output (only warnings/errors)', false)
  .option('--telemetry <state>', 'Enable (1) or disable (0) telemetry for this command', parseTelemetryOption)
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
 * Collects the command arguments
 * @param command - The commander command
 * @returns The command arguments
 */
function collectCommandArguments(command: CommanderCommand): string[] {
  return command.options
    .map((option) => ({ name: option.attributeName(), source: command.getOptionValueSource(option.attributeName()) }))
    .filter((option) => option.source && option.source !== 'default')
    .map((option) => option.name);
}

/**
 * Collects the global arguments
 * @returns The global arguments
 */
function collectGlobalArguments(): string[] {
  return program.options
    .map((option) => ({ name: option.attributeName(), source: program.getOptionValueSource(option.attributeName()) }))
    .filter((option) => option.source && option.source !== 'default')
    .map((option) => option.name);
}

/**
 * Higher-order function that wraps command handlers to provide Consola UI and telemetry instrumentation.
 * @param handler - Command handler function that receives options, UI instance and commander command
 * @returns Wrapped handler function that creates UI, handles errors and records telemetry
 */
function withCommandContext<O>(
  handler: (
    opts: O,
    ui: ConsolaInstance,
    command: CommanderCommand,
  ) => Promise<CommandResultSummary | void> | CommandResultSummary | void,
) {
  return async (rawOpts: O & TelemetryOption, command: CommanderCommand) => {
    const { telemetry: telemetryOverride, ...commandOptions } = rawOpts as O & TelemetryOption;

    // Create the Consola UI instance
    const ui = createConsolaUI(program.opts());

    // Determine if telemetry should be collected
    const shouldCollectTelemetry = await telemetryService.shouldCollectTelemetry(telemetryOverride);

    // Get the started at timestamp
    const startedAt = Date.now();

    // Start updates check
    const updateCheckPromise = checkForUpdates(packageJson.name, packageJson.version);

    // Run the command handler
    let success = false;
    let metrics: CommandResultSummary | undefined;
    let errorInfo: { name: string; message: string } | undefined;
    try {
      const result = await handler(commandOptions as O, ui, command);
      if (result && Object.keys(result).length > 0) {
        metrics = result;
      }

      success = true;
    } catch (error) {
      ui.debug(error);

      errorInfo =
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { name: 'UnknownError', message: String(error) };

      process.exitCode = 1;
    }

    // Wait for the updates check
    const updateInfo = await waitForUpdateCheck(updateCheckPromise);
    if (updateInfo) {
      displayUpdateNotification(updateInfo, ui);
    }

    if (shouldCollectTelemetry) {
      await telemetryService.emit({
        command: command.name(),
        argumentsProvided: collectCommandArguments(command),
        globalOptionsProvided: collectGlobalArguments(),
        metrics,
        success,
        error: errorInfo,
        startedAt,
      });
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
  .action(withCommandContext((options, ui) => init(options, ui)));

program
  .command('thumbnails')
  .description('Create thumbnails for all media files in the gallery')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .action(withCommandContext((options, ui) => thumbnails(options, ui)));

program
  .command('build')
  .description('Build the HTML gallery in the specified directory')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .option('-b, --base-url <url>', 'Base URL where the photos are hosted')
  .action(withCommandContext((options, ui) => build(options, ui)));

program
  .command('clean')
  .description('Remove all gallery files and folders (index.html, gallery/)')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Clean subdirectories recursively', false)
  .action(withCommandContext((options, ui) => clean(options, ui)));

program
  .command('telemetry [state]')
  .description('Manage anonymous telemetry preferences. Use 1 to enable, 0 to disable, or no argument to check status')
  .action(withCommandContext((options, ui) => telemetry(options, ui, telemetryService)));

program.parse();
