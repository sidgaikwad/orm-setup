import { existsSync, readFileSync } from "fs";
import chalk from "chalk";

/**
 * Find DATABASE_URL in .env files
 */
export function findDatabaseUrl(): string | null {
  const envFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    "apps/backend/.env",
    "apps/api/.env",
  ];

  for (const file of envFiles) {
    if (existsSync(file)) {
      try {
        const content = readFileSync(file, "utf-8");

        // Try multiple common variable names
        const variableNames = [
          "DATABASE_URL",
          "POSTGRES_URL",
          "DB_URL",
          "DATABASE_CONNECTION",
        ];

        for (const varName of variableNames) {
          const regex = new RegExp(`^${varName}\\s*=\\s*(.+)$`, "m");
          const match = content.match(regex);

          if (match && match[1]) {
            const url = match[1].trim().replace(/["']/g, "");
            console.log(chalk.gray(`Found ${varName} in ${file}`));
            return url;
          }
        }
      } catch (error) {
        // Continue to next file
        continue;
      }
    }
  }

  return null;
}

/**
 * Detect database type from connection string
 */
export function detectDatabaseType(
  databaseUrl: string
): "postgresql" | "mysql" | "sqlite" | "unknown" {
  if (!databaseUrl) return "unknown";

  const lower = databaseUrl.toLowerCase();

  if (lower.startsWith("postgresql://") || lower.startsWith("postgres://")) {
    return "postgresql";
  }

  if (lower.startsWith("mysql://")) {
    return "mysql";
  }

  if (
    lower.startsWith("file:") ||
    lower.includes(".db") ||
    lower.includes(".sqlite")
  ) {
    return "sqlite";
  }

  return "unknown";
}

/**
 * Validate DATABASE_URL format
 */
export function validateDatabaseUrl(url: string | null): {
  valid: boolean;
  error?: string;
} {
  if (!url) {
    return {
      valid: false,
      error:
        "No DATABASE_URL found. Please run @sidgaikwad/db-setup first or add DATABASE_URL to your .env file.",
    };
  }

  const dbType = detectDatabaseType(url);

  if (dbType === "unknown") {
    return {
      valid: false,
      error:
        "Could not detect database type from DATABASE_URL. Supported: PostgreSQL, MySQL, SQLite",
    };
  }

  return { valid: true };
}
