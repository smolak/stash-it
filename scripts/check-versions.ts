#!/usr/bin/env npx tsx

/**
 * Script to check that versions in package.json and jsr.json match for each package.
 * Also checks that jsr.json imports for @stash-it/core use the correct version.
 * Also checks that vitest version in dev-tools/jsr.json matches the catalog.
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

interface JsrImportInfo {
  packageName: string;
  importedCoreVersion: string | null;
  expectedCoreVersion: string;
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

async function getJsrJson(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function parseCoreVersionFromImport(importSpecifier: string): string | null {
  // Parse version from "jsr:@stash-it/core@^0.6.0" or "npm:@stash-it/core@^0.6.0"
  const match = importSpecifier.match(/@stash-it\/core@\^?(.+)$/);
  return match?.[1] ?? null;
}

function parseNpmVersionFromImport(importSpecifier: string, packageName: string): string | null {
  // Parse version from "npm:package@^version"
  const regex = new RegExp(`${packageName.replace("/", "\\/")}@(\\^?[\\d.]+)$`);
  const match = importSpecifier.match(regex);
  return match?.[1] ?? null;
}

async function getCatalogVersion(packageName: string): Promise<string | null> {
  try {
    const content = await readFile(join(process.cwd(), "pnpm-workspace.yaml"), "utf-8");
    // Parse "package: ^version" from the yaml file
    const regex = new RegExp(`^\\s*${packageName}:\\s*(\\^?[\\d.]+)`, "m");
    const match = content.match(regex);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

interface CatalogImportInfo {
  packageName: string;
  importedVersion: string | null;
  expectedVersion: string;
  match: boolean;
}

// Packages that use zod from the catalog
const PACKAGES_USING_ZOD = [
  "mysql-adapter",
  "postgresql-adapter",
  "redis-adapter",
  "sqlite-adapter",
  "ttl-plugin",
  "prefix-suffix-plugin",
  "read-only-plugin",
];

async function checkZodImports(catalogZodVersion: string): Promise<CatalogImportInfo[]> {
  const packagesDir = join(process.cwd(), "packages");
  const results: CatalogImportInfo[] = [];

  for (const pkg of PACKAGES_USING_ZOD) {
    const jsrJsonPath = join(packagesDir, pkg, "jsr.json");
    const jsrJson = await getJsrJson(jsrJsonPath);

    if (!jsrJson) {
      continue;
    }

    const imports = jsrJson.imports as Record<string, string> | undefined;
    if (!imports || !imports.zod) {
      results.push({
        packageName: pkg,
        importedVersion: null,
        expectedVersion: catalogZodVersion,
        match: false,
      });
      continue;
    }

    const importedVersion = parseNpmVersionFromImport(imports.zod, "zod");

    results.push({
      packageName: pkg,
      importedVersion,
      expectedVersion: catalogZodVersion,
      match: importedVersion === catalogZodVersion,
    });
  }

  return results;
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

async function checkJsrCoreImports(coreVersion: string): Promise<JsrImportInfo[]> {
  const packagesDir = join(process.cwd(), "packages");
  const results: JsrImportInfo[] = [];

  const packages = await readdir(packagesDir);

  for (const pkg of packages) {
    // Skip core package itself
    if (pkg === "core") {
      continue;
    }

    const jsrJsonPath = join(packagesDir, pkg, "jsr.json");
    const jsrJson = await getJsrJson(jsrJsonPath);

    if (!jsrJson) {
      continue;
    }

    const imports = jsrJson.imports as Record<string, string> | undefined;
    if (!imports || !imports["@stash-it/core"]) {
      continue;
    }

    const importedCoreVersion = parseCoreVersionFromImport(imports["@stash-it/core"]);

    results.push({
      packageName: pkg,
      importedCoreVersion,
      expectedCoreVersion: coreVersion,
      match: importedCoreVersion === coreVersion,
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

  // Check JSR imports for @stash-it/core version
  const coreVersion = await getVersionFromJson(join(process.cwd(), "packages", "core", "package.json"));

  if (!coreVersion) {
    console.error("\n❌ Could not read core package version");
    process.exit(1);
  }

  console.log(`\nChecking jsr.json imports for @stash-it/core (expected: ${coreVersion}):`);
  console.log("─".repeat(70));
  console.log(`${"Package".padEnd(25)} ${"imported".padEnd(15)} ${"expected".padEnd(15)} Status`);
  console.log("─".repeat(70));

  const importResults = await checkJsrCoreImports(coreVersion);
  const importMismatches = importResults.filter((r) => !r.match);

  for (const result of importResults) {
    const status = result.match ? "✅" : "❌ MISMATCH";
    const importedVersion = result.importedCoreVersion ?? "N/A";
    console.log(
      `${result.packageName.padEnd(25)} ${importedVersion.padEnd(15)} ${result.expectedCoreVersion.padEnd(15)} ${status}`,
    );
  }

  console.log("─".repeat(70));

  // Check vitest version in dev-tools
  const catalogVitestVersion = await getCatalogVersion("vitest");
  const devToolsJsr = await getJsrJson(join(process.cwd(), "packages", "dev-tools", "jsr.json"));
  const devToolsImports = devToolsJsr?.imports as Record<string, string> | undefined;
  const devToolsVitestImport = devToolsImports?.vitest;
  const devToolsVitestVersion = devToolsVitestImport ? parseNpmVersionFromImport(devToolsVitestImport, "vitest") : null;

  let vitestMismatch = false;

  console.log("\nChecking vitest version in dev-tools/jsr.json:");
  console.log("─".repeat(70));

  if (!catalogVitestVersion) {
    console.log("⚠️  Could not read vitest version from pnpm-workspace.yaml catalog");
  } else if (!devToolsVitestVersion) {
    console.log("⚠️  Could not read vitest version from dev-tools/jsr.json imports");
  } else if (devToolsVitestVersion !== catalogVitestVersion) {
    console.log(`❌ MISMATCH: dev-tools/jsr.json has ${devToolsVitestVersion}, catalog has ${catalogVitestVersion}`);
    vitestMismatch = true;
  } else {
    console.log(`✅ vitest version matches: ${devToolsVitestVersion}`);
  }

  console.log("─".repeat(70));

  // Check zod version across packages
  const catalogZodVersion = await getCatalogVersion("zod");
  let zodMismatches: CatalogImportInfo[] = [];

  console.log(`\nChecking zod version in jsr.json imports (expected: ${catalogZodVersion ?? "unknown"}):`);
  console.log("─".repeat(70));
  console.log(`${"Package".padEnd(25)} ${"imported".padEnd(15)} ${"expected".padEnd(15)} Status`);
  console.log("─".repeat(70));

  if (!catalogZodVersion) {
    console.log("⚠️  Could not read zod version from pnpm-workspace.yaml catalog");
  } else {
    const zodResults = await checkZodImports(catalogZodVersion);
    zodMismatches = zodResults.filter((r) => !r.match);

    for (const result of zodResults) {
      const status = result.match ? "✅" : "❌ MISMATCH";
      const importedVersion = result.importedVersion ?? "N/A";
      console.log(
        `${result.packageName.padEnd(25)} ${importedVersion.padEnd(15)} ${result.expectedVersion.padEnd(15)} ${status}`,
      );
    }
  }

  console.log("─".repeat(70));

  // Report all errors
  const hasErrors = mismatches.length > 0 || importMismatches.length > 0 || vitestMismatch || zodMismatches.length > 0;

  if (mismatches.length > 0) {
    console.log(`\n❌ Found ${mismatches.length} package version mismatch(es):`);
    for (const mismatch of mismatches) {
      console.log(
        `   - ${mismatch.packageName}: package.json=${mismatch.packageJsonVersion}, jsr.json=${mismatch.jsrJsonVersion}`,
      );
    }
  }

  if (importMismatches.length > 0) {
    console.log(`\n❌ Found ${importMismatches.length} jsr.json import version mismatch(es):`);
    for (const mismatch of importMismatches) {
      console.log(
        `   - ${mismatch.packageName}: imports @stash-it/core@${mismatch.importedCoreVersion ?? "unknown"}, expected ${mismatch.expectedCoreVersion}`,
      );
    }
  }

  if (vitestMismatch) {
    console.log(`\n❌ vitest version mismatch in dev-tools/jsr.json`);
    console.log(`   Update the vitest import to match the catalog version: ${catalogVitestVersion}`);
  }

  if (zodMismatches.length > 0) {
    console.log(`\n❌ Found ${zodMismatches.length} zod version mismatch(es):`);
    for (const mismatch of zodMismatches) {
      console.log(
        `   - ${mismatch.packageName}: imports zod@${mismatch.importedVersion ?? "missing"}, expected ${mismatch.expectedVersion}`,
      );
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log("\n✅ All versions match!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
