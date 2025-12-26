// src/prompts.ts (FIXED - no import errors)
import { select, confirm, text, isCancel } from "@clack/prompts";
import type { ProjectInfo } from "./detector";

export interface SetupConfig {
  orm: OrmType;
  database: DatabaseType;
  includeSchema: boolean;
  includeStudio: boolean;
  clientPath?: string;
}

type OrmType = "drizzle" | "prisma" | "kysely";
type DatabaseType = "postgresql" | "mysql" | "sqlite";

export async function promptOrmSetup(
  project: ProjectInfo
): Promise<SetupConfig> {
  // ORM Selection
  const ormResult = await select({
    message: "Select your ORM",
    options: [
      { value: "drizzle", label: "Drizzle" },
      { value: "prisma", label: "Prisma" },
      { value: "kysely", label: "Kysely" },
    ],
    initialValue: "drizzle",
  });

  if (isCancel(ormResult)) process.exit(0);

  const orm = ormResult as OrmType;

  // Database selection
  const dbResult = await select({
    message: "Select your database",
    options: [
      { value: "postgresql", label: "PostgreSQL" },
      { value: "mysql", label: "MySQL/MariaDB" },
      { value: "sqlite", label: "SQLite" },
    ],
    initialValue:
      project.database.type !== "unknown"
        ? project.database.type
        : "postgresql",
  });

  if (isCancel(dbResult)) process.exit(0);

  const database = dbResult as DatabaseType;

  // Schema inclusion
  const includeSchema = (await confirm({
    message: "Include starter schema (User model)?",
    initialValue: true,
  })) as boolean;

  // Drizzle Studio (only for Drizzle)
  let includeStudio = false;
  if (orm === "drizzle") {
    includeStudio = (await confirm({
      message: "Include Drizzle Studio? (database GUI)",
      initialValue: true,
    })) as boolean;
  }

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
    orm,
    database,
    includeSchema,
    includeStudio,
    clientPath,
  };
}
