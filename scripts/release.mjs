#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dependencyFields = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const options = parseOptions(process.argv.slice(2));
const rootPackageJson = readJson(join(rootDir, "package.json"));
const changesetConfig = readJson(join(rootDir, ".changeset", "config.json"));
const packages = sortPackages(loadWorkspacePackages(rootPackageJson));
const archiveDir = mkdtempSync(join(tmpdir(), "simple-photo-gallery-release-"));

let releasedPackages = 0;

for (const pkg of packages) {
  const tagName = `${pkg.packageJson.name}@${pkg.packageJson.version}`;

  if (!options.dryRun && packageVersionExists(pkg.packageJson)) {
    console.log(
      `${pkg.packageJson.name}@${pkg.packageJson.version} is already published on npm`,
    );
    createTagIfNeeded(tagName, { dryRun: false, emitNewTag: true });
    continue;
  }

  const archivePath = join(
    archiveDir,
    `${pkg.packageJson.name.replace(/^@/, "").replace("/", "-")}-${pkg.packageJson.version}.tgz`,
  );

  run("yarn", [
    "workspace",
    pkg.packageJson.name,
    "pack",
    "--out",
    archivePath,
  ]);

  validatePackedManifest(archivePath, pkg);

  if (options.dryRun) {
    console.log(
      `[dry-run] Would publish ${pkg.packageJson.name}@${pkg.packageJson.version}`,
    );
    continue;
  }

  run("npm", [
    "publish",
    archivePath,
    "--access",
    options.access ?? changesetConfig.access ?? "public",
    "--tag",
    options.tag,
  ]);

  createTagIfNeeded(tagName, { dryRun: false, emitNewTag: true });
  releasedPackages += 1;
}

if (options.dryRun) {
  console.log(`Dry run complete. Packed ${packages.length} publishable packages.`);
} else if (releasedPackages === 0) {
  console.log("No unpublished packages were published.");
}

function parseOptions(args) {
  const parsed = {
    access: undefined,
    dryRun: false,
    tag: "latest",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (arg === "--access") {
      parsed.access = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--tag") {
      parsed.tag = readOptionValue(args, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown release option: ${arg}`);
  }

  return parsed;
}

function readOptionValue(args, index, name) {
  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }

  return value;
}

function loadWorkspacePackages(packageJson) {
  const workspacePatterns = Array.isArray(packageJson.workspaces)
    ? packageJson.workspaces
    : packageJson.workspaces?.packages;

  if (!Array.isArray(workspacePatterns)) {
    throw new Error("Root package.json does not define workspaces");
  }

  return workspacePatterns
    .flatMap(expandWorkspacePattern)
    .map((workspaceDir) => {
      const packageJsonPath = join(workspaceDir, "package.json");

      if (!existsSync(packageJsonPath)) {
        throw new Error(`Workspace package.json not found: ${packageJsonPath}`);
      }

      return {
        dir: workspaceDir,
        packageJson: readJson(packageJsonPath),
      };
    })
    .filter((pkg) => !pkg.packageJson.private);
}

function expandWorkspacePattern(pattern) {
  if (!pattern.includes("*")) {
    return [resolve(rootDir, pattern)];
  }

  if (!pattern.endsWith("/*") || pattern.slice(0, -2).includes("*")) {
    throw new Error(`Unsupported workspace pattern: ${pattern}`);
  }

  const baseDir = resolve(rootDir, pattern.slice(0, -2));

  return readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(baseDir, entry.name))
    .filter((workspaceDir) => existsSync(join(workspaceDir, "package.json")));
}

function sortPackages(workspacePackages) {
  const packagesByName = new Map(
    workspacePackages.map((pkg) => [pkg.packageJson.name, pkg]),
  );
  const sorted = [];
  const visiting = new Set();
  const visited = new Set();

  for (const pkg of workspacePackages) {
    visit(pkg);
  }

  return sorted;

  function visit(pkg) {
    const name = pkg.packageJson.name;

    if (visited.has(name)) {
      return;
    }

    if (visiting.has(name)) {
      throw new Error(`Workspace dependency cycle detected at ${name}`);
    }

    visiting.add(name);

    for (const field of dependencyFields) {
      for (const dependencyName of Object.keys(pkg.packageJson[field] ?? {})) {
        const dependency = packagesByName.get(dependencyName);

        if (dependency) {
          visit(dependency);
        }
      }
    }

    visiting.delete(name);
    visited.add(name);
    sorted.push(pkg);
  }
}

function packageVersionExists(packageJson) {
  const result = spawnSync(
    "npm",
    ["view", `${packageJson.name}@${packageJson.version}`, "version", "--json"],
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );
  const output = `${result.stdout}\n${result.stderr}`;

  if (result.status === 0) {
    return true;
  }

  if (output.includes("E404") || output.includes("No match found")) {
    return false;
  }

  throw new Error(
    `Could not check npm for ${packageJson.name}@${packageJson.version}:\n${output}`,
  );
}

function validatePackedManifest(archivePath, pkg) {
  const packedPackageJson = JSON.parse(
    execFileSync("tar", ["-xOf", archivePath, "package/package.json"], {
      cwd: rootDir,
      encoding: "utf8",
    }),
  );

  for (const field of dependencyFields) {
    for (const [dependencyName, range] of Object.entries(
      packedPackageJson[field] ?? {},
    )) {
      if (typeof range === "string" && range.startsWith("workspace:")) {
        throw new Error(
          `${pkg.packageJson.name} pack output still contains ${field}.${dependencyName}: ${range}`,
        );
      }
    }
  }
}

function createTagIfNeeded(tagName, { dryRun, emitNewTag }) {
  if (remoteTagExists(tagName)) {
    console.log(`Tag already exists on origin: ${tagName}`);
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] Would create tag ${tagName}`);
    return;
  }

  if (localTagExists(tagName)) {
    ensureLocalTagPointsAtHead(tagName);
  } else {
    run("git", ["tag", tagName]);
  }

  if (emitNewTag) {
    console.log(`New tag: ${tagName}`);
  }
}

function remoteTagExists(tagName) {
  const result = spawnSync(
    "git",
    ["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tagName}`],
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );

  return result.status === 0;
}

function localTagExists(tagName) {
  const result = spawnSync("git", ["rev-parse", "--verify", tagName], {
    cwd: rootDir,
    encoding: "utf8",
  });

  return result.status === 0;
}

function ensureLocalTagPointsAtHead(tagName) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();
  const taggedCommit = execFileSync("git", ["rev-list", "-n", "1", tagName], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();

  if (head !== taggedCommit) {
    throw new Error(
      `Local tag ${tagName} exists but points at ${taggedCommit}, not HEAD ${head}`,
    );
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function run(command, args) {
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
  });
}
