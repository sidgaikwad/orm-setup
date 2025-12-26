import { select, confirm, text } from "@clack/prompts";
import type { ProjectInfo } from "./detector";

export interface SetupConfig {
  database: "postgresql" | "mysql" | "sqlite";
  includeSchema: boolean;
  includeStudio: boolean;
  clientPath?: string;
}

export async function promptOrmSetup(project: ProjectInfo): Promise {
  // Database selection
  const database = (await select({
    message: "Select your database",
    options: [
      {
        value: "postgresql",
        label: "PostgreSQL",
        hint: "Recommended for production",
      },
      {
        value: "mysql",
        label: "MySQL/MariaDB",
        hint: "Popular choice",
      },
      {
        value: "sqlite",
        label: "SQLite",
        hint: "Great for development",
      },
    ],
    initialValue:
      project.database.type !== "unknown"
        ? project.database.type
        : "postgresql",
  })) as Promise;

  // Schema inclusion
  const includeSchema = (await confirm({
    message: "Include starter schema (User model)?",
    initialValue: true,
  })) as boolean;

  // Drizzle Studio
  const includeStudio = (await confirm({
    message: "Include Drizzle Studio? (database GUI)",
    initialValue: true,
  })) as boolean;

  // Custom path (advanced)
  const useCustomPath = (await confirm({
    message: "Use custom path for database client?",
    initialValue: false,
  })) as boolean;

  let clientPath: string | undefined;
  if (useCustomPath) {
    clientPath = (await text({
      message: "Enter path (e.g., src/lib/database)",
      placeholder: project.srcDir ? `${project.srcDir}/lib/db` : "lib/db",
    })) as string;
  }

  return {
    database,
    includeSchema,
    includeStudio,
    clientPath,
  };
}
