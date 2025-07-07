#!/usr/bin/env node

import { scan } from "./modules/scan";

import { Command } from "commander";

const program = new Command();

program.name("gallery").description("Simple Photo Gallery CLI").version("0.0.1");

program
  .command("init")
  .description("Initialize a new gallery project")
  .action(() => {
    console.log("Hello from gallery init!");
  });

program
  .command("build")
  .description("Build the gallery project")
  .action(() => {
    console.log("Hello from gallery build!");
  });

program
  .command("scan")
  .description("Scan directory for images and videos and create gallery.json")
  .option("-p, --path <path>", "Path to scan for media files", process.cwd())
  .option("-o, --output <path>", "Output directory for gallery.json", "")
  .option("-r, --recursive", "Scan subdirectories recursively", false)
  .action(scan);

program.parse();
