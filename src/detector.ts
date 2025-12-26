import { readFile, access } from "node:fs/promises";
import { join } from "node:path";

export interface ProjectInfo {
  hasTypescript: boolean;
  packageManager: "bun" | "npm" | "pnpm" | "yarn";
  srcDir: string | null;
  hasDrizzle: boolean;
  database: {
    type: "postgresql" | "mysql" | "sqlite" | "unknown";
    url: string | null;
  };
}

async function fileExists(path: string): Promise {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function detectPackageManager(): Promise {
  if (await fileExists("bun.lockb")) return "bun";
  if (await fileExists("pnpm-lock.yaml")) return "pnpm";
  if (await fileExists("yarn.lock")) return "yarn";
  return "npm";
}

async function detectSourceDir(): Promise {
  if (await fileExists("src")) return "src";
  if (await fileExists("app")) return "app";
  return null;
}

async function detectDatabase(): Promise {
  const envFiles = [".env", ".env.local", ".env.development"];

  for (const file of envFiles) {
    try {
      const content = await readFile(file, "utf-8");
      const match = content.match(/DATABASE_URL=["']?([^"'\n]+)/);

      if (match) {
        const url = match[1];
        const type = url.includes("postgres")
          ? "postgresql"
          : url.includes("mysql")
          ? "mysql"
          : url.includes("sqlite") || url.includes(".db")
          ? "sqlite"
          : "unknown";

        return { type, url };
      }
    } catch {
      continue;
    }
  }

  return { type: "unknown", url: null };
}

async function detectExistingDrizzle(): Promise {
  const indicators = [
    "drizzle.config.ts",
    "drizzle.config.js",
    "drizzle/migrations",
  ];

  for (const indicator of indicators) {
    if (await fileExists(indicator)) return true;
  }

  return false;
}

export async function detectProject(): Promise {
  const [hasTypescript, packageManager, srcDir, hasDrizzle, database] =
    await Promise.all([
      fileExists("tsconfig.json"),
      detectPackageManager(),
      detectSourceDir(),
      detectExistingDrizzle(),
      detectDatabase(),
    ]);

  return {
    hasTypescript,
    packageManager,
    srcDir,
    hasDrizzle,
    database,
  };
}
