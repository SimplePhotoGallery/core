#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';
import type { Command as CommanderCommand } from 'commander';
import { createConsola, LogLevels, type ConsolaInstance } from 'consola';

import { build } from './modules/build';
import { clean } from './modules/clean';
import { init } from './modules/init';
import { manageTelemetry } from './modules/telemetry-command';
import { thumbnails } from './modules/thumbnails';
import { TelemetryService } from './telemetry';
import type { CommandResultSummary, TelemetryOption } from './types/command';
import { checkForUpdates, displayUpdateNotification, waitForUpdateCheck } from './utils/version';

import packageJson from '../package.json' with { type: 'json' };

/** Command line interface program instance */
const program = new Command();

const telemetryService = new TelemetryService(packageJson.name, packageJson.version);

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

function collectCommandArguments(command: CommanderCommand): string[] {
  return command.options
    .map((option) => ({ name: option.attributeName(), source: command.getOptionValueSource(option.attributeName()) }))
    .filter((option) => option.source && option.source !== 'default')
    .map((option) => option.name);
}

function collectGlobalArguments(): string[] {
  return program.options
    .map((option) => ({ name: option.attributeName(), source: program.getOptionValueSource(option.attributeName()) }))
    .filter((option) => option.source && option.source !== 'default')
    .map((option) => option.name);
}

function parseTelemetryOption(value: string): '0' | '1' {
  if (value !== '0' && value !== '1') {
    throw new Error('Telemetry option must be either 0 or 1.');
  }

  return value;
}

/**
 * Higher-order function that wraps command handlers to provide Consola UI and telemetry instrumentation.
 * @param handler - Command handler function that receives options, UI instance and commander command
 * @returns Wrapped handler function that creates UI, handles errors and records telemetry
 */
function withCommandContext<O>(
  handler: (opts: O, ui: ConsolaInstance, command: CommanderCommand) => Promise<CommandResultSummary | void> | CommandResultSummary | void,
) {
  return async (rawOpts: O & TelemetryOption, command: CommanderCommand) => {
    const { telemetry: telemetryOverride, ...commandOptions } = rawOpts as O & TelemetryOption;
    const ui = createConsolaUI(program.opts());

    const startedAt = Date.now();

    const updateCheckPromise = checkForUpdates(packageJson.name, packageJson.version);

    const decision = await telemetryService.resolveDecision(telemetryOverride);

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

      if (error instanceof Error) {
        errorInfo = { name: error.name, message: error.message };
      } else {
        errorInfo = { name: 'UnknownError', message: String(error) };
      }

      process.exitCode = 1;
    }

    const updateInfo = await waitForUpdateCheck(updateCheckPromise);

    if (updateInfo) {
      displayUpdateNotification(updateInfo, ui);
    }

    await telemetryService.emit({
      command: command.name(),
      argumentsProvided: collectCommandArguments(command),
      globalOptionsProvided: collectGlobalArguments(),
      metrics,
      success,
      error: errorInfo,
      decision,
      startedAt,
    });
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
  .option('--telemetry <state>', 'Enable (1) or disable (0) telemetry for this command', parseTelemetryOption)
  .action(withCommandContext((options, ui) => init(options, ui)));

program
  .command('thumbnails')
  .description('Create thumbnails for all media files in the gallery')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .option('--telemetry <state>', 'Enable (1) or disable (0) telemetry for this command', parseTelemetryOption)
  .action(withCommandContext((options, ui) => thumbnails(options, ui)));

program
  .command('build')
  .description('Build the HTML gallery in the specified directory')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .option('-b, --base-url <url>', 'Base URL where the photos are hosted')
  .option('--telemetry <state>', 'Enable (1) or disable (0) telemetry for this command', parseTelemetryOption)
  .action(withCommandContext((options, ui) => build(options, ui)));

program
  .command('clean')
  .description('Remove all gallery files and folders (index.html, gallery/)')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Clean subdirectories recursively', false)
  .option('--telemetry <state>', 'Enable (1) or disable (0) telemetry for this command', parseTelemetryOption)
  .action(withCommandContext((options, ui) => clean(options, ui)));

program
  .command('telemetry')
  .description('Manage anonymous telemetry preferences')
  .option('--enable', 'Enable anonymous telemetry')
  .option('--disable', 'Disable anonymous telemetry')
  .option('--provider <provider>', 'Set telemetry provider (console|plausible)')
  .option('--telemetry <state>', 'Enable (1) or disable (0) telemetry for this command', parseTelemetryOption)
  .action(withCommandContext((options, ui) => manageTelemetry(options, ui, telemetryService)));

program.parse();
