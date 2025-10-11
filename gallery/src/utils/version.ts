import axios from 'axios';
import { compareSemVer, parseSemVer } from 'semver-parser';

import type { ConsolaInstance } from 'consola';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
const CHECK_TIMEOUT_MS = 3000; // 3 seconds timeout for the check

interface PackageInfo {
  versions: Record<string, unknown>;
}

/**
 * Fetches the latest stable version of a package from npm registry
 * Uses abbreviated metadata for faster response times
 * @param packageName - Name of the package to check
 * @returns Promise resolving to the latest stable version or undefined if error
 */
async function fetchLatestStableVersion(packageName: string): Promise<string | undefined> {
  try {
    // Use abbreviated metadata endpoint for faster response
    const response = await axios.get<PackageInfo>(`${NPM_REGISTRY_URL}/${packageName}`, {
      timeout: CHECK_TIMEOUT_MS,
      headers: {
        Accept: 'application/vnd.npm.install-v1+json',
      },
    });

    // Get all version numbers
    const versions = Object.keys(response.data.versions);

    // Filter to only stable versions (no pre-release identifiers)
    const stableVersions = versions.filter((version) => {
      try {
        const parsed = parseSemVer(version);
        return !parsed.pre || parsed.pre.length === 0;
      } catch {
        return false;
      }
    });

    if (stableVersions.length === 0) {
      return undefined;
    }

    // Sort versions and get the latest stable one
    stableVersions.sort(compareSemVer);

    // eslint-disable-next-line unicorn/prefer-at
    return stableVersions[stableVersions.length - 1];
  } catch {
    // Silently fail on any error (network, timeout, etc.)
    return undefined;
  }
}

/**
 * Starts a background check for package updates
 * Returns a promise that resolves to update info or null
 * Only returns info if the latest stable version is newer than current
 * @param packageName - Name of the package
 * @param currentVersion - Current version of the package
 * @returns Promise resolving to update info or null
 */
export function checkForUpdates(
  packageName: string,
  currentVersion: string,
): Promise<{ currentVersion: string; latestVersion: string } | null> {
  return fetchLatestStableVersion(packageName).then((latestStableVersion) => {
    if (!latestStableVersion) {
      return null;
    }

    try {
      // Check if the latest stable version is newer than current
      if (compareSemVer(latestStableVersion, currentVersion) > 0) {
        return { currentVersion, latestVersion: latestStableVersion };
      }
    } catch {
      // If semver parsing fails, silently ignore
    }

    return null;
  });
}

/**
 * Displays an update notification box if an update is available
 * @param updateInfo - Information about the available update
 * @param ui - Consola UI instance for displaying the message
 */
export function displayUpdateNotification(
  updateInfo: { currentVersion: string; latestVersion: string },
  ui: ConsolaInstance,
): void {
  const { currentVersion, latestVersion } = updateInfo;

  const message = [
    `Update available: ${currentVersion} → ${latestVersion}`,
    '',
    'Run one of the following commands to update:',
    '',
    '  npm install -g simple-photo-gallery@latest',
    '  yarn global add simple-photo-gallery@latest',
    '  pnpm add -g simple-photo-gallery@latest',
  ].join('\n');

  ui.box(message);
}

/**
 * Waits for the update check promise with a timeout
 * If the check is not complete within the timeout, returns null
 * @param checkPromise - Promise from checkForUpdates
 * @returns Promise resolving to update info or null
 */
export async function waitForUpdateCheck(
  checkPromise: Promise<{ currentVersion: string; latestVersion: string } | null>,
): Promise<{ currentVersion: string; latestVersion: string } | null> {
  try {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), 5000);
    });

    const result = await Promise.race([checkPromise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch {
    // Silently fail on any error
    return null;
  }
}
