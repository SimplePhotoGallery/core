#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';
import { createConsola, LogLevels, type ConsolaInstance } from 'consola';

import { build } from './modules/build';
import { clean } from './modules/clean';
import { init } from './modules/init';
import { thumbnails } from './modules/thumbnails';
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
 * @returns Wrapped handler function that creates UI and handles errors
 */
function withConsolaUI<O>(handler: (opts: O, ui: ConsolaInstance) => Promise<void> | void) {
  return async (opts: O) => {
    const ui = createConsolaUI(program.opts());

    // Start update check in background (non-blocking)
    const updateCheckPromise = checkForUpdates(packageJson.name, packageJson.version);

    try {
      await handler(opts, ui);
    } catch (error) {
      ui.debug(error);

      process.exitCode = 1;
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
  .action(withConsolaUI(init));

program
  .command('thumbnails')
  .description('Create thumbnails for all media files in the gallery')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .action(withConsolaUI(thumbnails));

program
  .command('build')
  .description('Build the HTML gallery in the specified directory')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Scan subdirectories recursively', false)
  .option('-b, --base-url <url>', 'Base URL where the photos are hosted')
  .action(withConsolaUI(build));

program
  .command('clean')
  .description('Remove all gallery files and folders (index.html, gallery/)')
  .option('-g, --gallery <path>', 'Path to the directory of the gallery. Default: current working directory', process.cwd())
  .option('-r, --recursive', 'Clean subdirectories recursively', false)
  .action(withConsolaUI(clean));

program.parse();
