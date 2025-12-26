// src/prompts.ts (updated with template selection)
import { select, confirm, text, multiselect } from "@clack/prompts";
import type { ProjectInfo } from "./detector";
import {
  schemaTemplates,
  allTables,
  getTablesWithDependencies,
} from "./templates/table-definitions";
import type { TableDefinition } from "./templates/table-definitions";

export interface SetupConfig {
  orm: "drizzle" | "prisma" | "kysely";
  database: "postgresql" | "mysql" | "sqlite";
  template: string;
  selectedTables: TableDefinition[];
  includeAuth: boolean;
  includeTimestamps: boolean;
  includeSoftDeletes: boolean;
  includeStudio: boolean;
  clientPath?: string;
}

export async function promptOrmSetup(
  project: ProjectInfo
): Promise<SetupConfig> {
  // ORM Selection
  const orm = (await select({
    message: "Select your ORM",
    options: [
      {
        value: "drizzle",
        label: "Drizzle",
        hint: "TypeScript-first, lightweight",
      },
      {
        value: "prisma",
        label: "Prisma",
        hint: "Most popular, great DX",
      },
      {
        value: "kysely",
        label: "Kysely",
        hint: "Type-safe SQL builder",
      },
    ],
    initialValue: "drizzle",
  })) as "drizzle" | "prisma" | "kysely";

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
  })) as "postgresql" | "mysql" | "sqlite";

  // Template Selection
  const template = (await select({
    message: "Choose your schema template",
    options: schemaTemplates.map((t) => ({
      value: t.id,
      label: `${t.icon} ${t.name}`,
      hint: t.description,
    })),
    initialValue: "starter",
  })) as string;

  let selectedTables: TableDefinition[] = [];
  let includeAuth = false;
  let includeTimestamps = true;
  let includeSoftDeletes = false;

  // If custom template, let user pick tables
  if (template === "custom") {
    const tableChoices = (await multiselect({
      message: "Select tables to include (space to select, enter to confirm)",
      options: allTables.map((t) => ({
        value: t.name,
        label: t.displayName,
        hint: `${t.fields.length} fields`,
      })),
      required: false,
    })) as string[];

    // Get tables with dependencies
    selectedTables = getTablesWithDependencies(tableChoices);

    // Ask about common features
    includeAuth = (await confirm({
      message: "Include auth fields? (email, password, tokens)",
      initialValue: true,
    })) as boolean;

    includeTimestamps = (await confirm({
      message: "Include timestamps? (createdAt, updatedAt)",
      initialValue: true,
    })) as boolean;

    includeSoftDeletes = (await confirm({
      message: "Include soft deletes? (deletedAt)",
      initialValue: false,
    })) as boolean;
  } else if (template !== "empty") {
    // Use predefined template
    const templateObj = schemaTemplates.find((t) => t.id === template);
    selectedTables = templateObj?.tables || [];
  }

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
    template,
    selectedTables,
    includeAuth,
    includeTimestamps,
    includeSoftDeletes,
    includeStudio,
    clientPath,
  };
}
