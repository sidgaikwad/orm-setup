import { existsSync, readFileSync } from "fs";
import chalk from "chalk";
import {
  detectFramework,
  getFrameworkDisplayName,
  type FrameworkInfo,
} from "./framework-detector";
import { findDatabaseUrl, detectDatabaseType } from "./env";

export interface DetectedSetup {
  framework: FrameworkInfo;
  database: "postgresql" | "mysql" | "sqlite" | "unknown";
  databaseUrl: string | null;
  existingOrm: "prisma" | "drizzle" | "kysely" | "typeorm" | null;
  packageManager: "bun" | "npm" | "pnpm" | "yarn";
  typescript: boolean;
  projectRoot: string;
}

/**
 * Detect existing ORM installation
 */
function detectExistingOrm(): DetectedSetup["existingOrm"] {
  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for Prisma
    if (deps["@prisma/client"] || deps.prisma) {
      if (existsSync("prisma") || existsSync("prisma/schema.prisma")) {
        return "prisma";
      }
    }

    // Check for Drizzle
    if (deps["drizzle-orm"]) {
      if (existsSync("drizzle.config.ts") || existsSync("src/db/schema.ts")) {
        return "drizzle";
      }
    }

    // Check for Kysely
    if (deps.kysely) {
      return "kysely";
    }

    // Check for TypeORM
    if (deps.typeorm) {
      return "typeorm";
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Detect package manager
 */
function detectPackageManager(): DetectedSetup["packageManager"] {
  if (existsSync("bun.lockb")) return "bun";
  if (existsSync("pnpm-lock.yaml")) return "pnpm";
  if (existsSync("yarn.lock")) return "yarn";
  if (existsSync("package-lock.json")) return "npm";

  return "bun"; // Default
}

/**
 * Check if project uses TypeScript
 */
function detectTypeScript(): boolean {
  return existsSync("tsconfig.json");
}

/**
 * Main detection function
 */
export async function detectSetup(): Promise<DetectedSetup> {
  console.log(chalk.blueBright("Detecting your setup..."));

  const framework = detectFramework();
  const databaseUrl = findDatabaseUrl();
  const database = detectDatabaseType(databaseUrl || "");
  const existingOrm = detectExistingOrm();
  const packageManager = detectPackageManager();
  const typescript = detectTypeScript();
  const projectRoot = process.cwd();

  const setup: DetectedSetup = {
    framework,
    database,
    databaseUrl,
    existingOrm,
    packageManager,
    typescript,
    projectRoot,
  };

  // Display detection results
  console.log(
    chalk.green(`✓ Framework: ${getFrameworkDisplayName(setup.framework)}`)
  );
  console.log(
    chalk.green(
      `✓ Database: ${getDatabaseDisplayName(setup.database)}${
        databaseUrl ? "" : " (no DATABASE_URL found)"
      }`
    )
  );
  console.log(chalk.green(`✓ Package Manager: ${setup.packageManager}`));
  console.log(chalk.green(`✓ TypeScript: ${setup.typescript ? "Yes" : "No"}`));

  if (setup.existingOrm) {
    console.log(
      chalk.yellow(
        `⚠️  Existing ORM detected: ${setup.existingOrm.toUpperCase()}`
      )
    );
  } else {
    console.log(chalk.green(`✓ No existing ORM detected`));
  }

  console.log(""); // Empty line

  return setup;
}

/**
 * Get friendly database name
 */
function getDatabaseDisplayName(database: DetectedSetup["database"]): string {
  const names = {
    postgresql: "PostgreSQL",
    mysql: "MySQL",
    sqlite: "SQLite",
    unknown: "Unknown",
  };
  return names[database];
}

/**
 * Validate that we have minimum requirements
 */
export function validateSetup(setup: DetectedSetup): {
  valid: boolean;
  error?: string;
} {
  if (!setup.databaseUrl) {
    return {
      valid: false,
      error:
        "No DATABASE_URL found in .env files. Please run @sidgaikwad/db-setup first.",
    };
  }

  if (setup.database === "unknown") {
    return {
      valid: false,
      error: "Could not detect database type from DATABASE_URL.",
    };
  }

  if (!setup.typescript) {
    return {
      valid: false,
      error:
        "This tool requires TypeScript. Please initialize TypeScript first (tsc --init).",
    };
  }

  return { valid: true };
}
