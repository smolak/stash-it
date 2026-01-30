#!/usr/bin/env npx tsx

/**
 * Script to check that versions in package.json and jsr.json match for each package.
 * Run from the root of the monorepo: npx tsx scripts/check-versions.ts
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

interface VersionInfo {
  packageName: string;
  packageJsonVersion: string;
  jsrJsonVersion: string;
  match: boolean;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function getVersionFromJson(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const json = JSON.parse(content);
    return json.version ?? null;
  } catch {
    return null;
  }
}

async function checkPackageVersions(): Promise<VersionInfo[]> {
  const packagesDir = join(process.cwd(), "packages");
  const results: VersionInfo[] = [];

  const packages = await readdir(packagesDir);

  for (const pkg of packages) {
    const packagePath = join(packagesDir, pkg);
    const packageJsonPath = join(packagePath, "package.json");
    const jsrJsonPath = join(packagePath, "jsr.json");

    const hasPackageJson = await fileExists(packageJsonPath);
    const hasJsrJson = await fileExists(jsrJsonPath);

    if (!hasPackageJson || !hasJsrJson) {
      continue;
    }

    const packageJsonVersion = await getVersionFromJson(packageJsonPath);
    const jsrJsonVersion = await getVersionFromJson(jsrJsonPath);

    if (packageJsonVersion === null || jsrJsonVersion === null) {
      console.warn(`Warning: Could not read version from ${pkg}`);
      continue;
    }

    results.push({
      packageName: pkg,
      packageJsonVersion,
      jsrJsonVersion,
      match: packageJsonVersion === jsrJsonVersion,
    });
  }

  return results;
}

async function main(): Promise<void> {
  console.log("Checking version consistency between package.json and jsr.json...\n");

  const results = await checkPackageVersions();
  const mismatches = results.filter((r) => !r.match);

  // Print all packages and their versions
  console.log("Package Versions:");
  console.log("─".repeat(70));
  console.log(`${"Package".padEnd(25)} ${"package.json".padEnd(15)} ${"jsr.json".padEnd(15)} Status`);
  console.log("─".repeat(70));

  for (const result of results) {
    const status = result.match ? "✅" : "❌ MISMATCH";
    console.log(
      `${result.packageName.padEnd(25)} ${result.packageJsonVersion.padEnd(15)} ${result.jsrJsonVersion.padEnd(15)} ${status}`,
    );
  }

  console.log("─".repeat(70));

  if (mismatches.length > 0) {
    console.log(`\n❌ Found ${mismatches.length} version mismatch(es):`);
    for (const mismatch of mismatches) {
      console.log(
        `   - ${mismatch.packageName}: package.json=${mismatch.packageJsonVersion}, jsr.json=${mismatch.jsrJsonVersion}`,
      );
    }
    process.exit(1);
  }

  console.log("\n✅ All versions match!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
