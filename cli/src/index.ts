#!/usr/bin/env node

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

program.parse();
