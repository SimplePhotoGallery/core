#!/usr/bin/env node

import process from 'node:process';

import { Command } from 'commander';
import { createConsola, LogLevels, type ConsolaInstance } from 'consola';

import { build } from './modules/build';
import { clean } from './modules/clean';
import { init } from './modules/init';
import { thumbnails } from './modules/thumbnails';

/**
 * CLI program instance used to register all commands.
 */
const program = new Command();

program
  .name('gallery')
  .description('Simple Photo Gallery CLI')
  .version('0.0.1')
  .option('-v, --verbose', 'Verbose output (debug level)', false)
  .option('-q, --quiet', 'Minimal output (only warnings/errors)', false)
  .showHelpAfterError(true);

/**
 * Create a Consola UI instance configured according to the global options.
 *
 * @param globalOpts - Global options parsed by commander.
 * @returns A configured Consola instance.
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
 * Wrap a command handler so that it receives the Consola UI instance.
 *
 * @param handler - Command handler to wrap.
 * @returns A new handler that injects the Consola UI instance.
 */
function withConsolaUI<O>(handler: (opts: O, ui: ConsolaInstance) => Promise<void> | void) {
  return async function wrappedHandler(opts: O) {
    const ui = createConsolaUI(program.opts());
    try {
      await handler(opts, ui);
    } catch (error) {
      ui.debug(error);

      process.exitCode = 1;
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
