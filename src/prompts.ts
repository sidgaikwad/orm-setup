// src/prompts.ts
import { select, confirm, text, isCancel } from "@clack/prompts";
import type { ProjectInfo } from "./detector";

type OrmType = "drizzle" | "prisma" | "kysely";
type DatabaseType = "postgresql" | "mysql" | "sqlite";
type TemplateType = "empty" | "starter" | "blog" | "ecommerce" | "saas";

export interface SetupConfig {
  orm: OrmType;
  database: DatabaseType;
  template: TemplateType;
  includeStudio: boolean;
  clientPath?: string;
}

export async function promptOrmSetup(
  project: ProjectInfo
): Promise<SetupConfig> {
  const ormResult = await select({
    message: "Select your ORM",
    options: [
      {
        value: "drizzle",
        label: "Drizzle",
        hint: "TypeScript-first, lightweight",
      },
      { value: "prisma", label: "Prisma", hint: "Most popular, great DX" },
      { value: "kysely", label: "Kysely", hint: "Type-safe SQL builder" },
    ],
    initialValue: "drizzle",
  });

  if (isCancel(ormResult)) process.exit(0);
  const orm = ormResult as OrmType;

  const dbResult = await select({
    message: "Select your database",
    options: [
      {
        value: "postgresql",
        label: "PostgreSQL",
        hint: "Recommended for production",
      },
      { value: "mysql", label: "MySQL/MariaDB", hint: "Popular choice" },
      { value: "sqlite", label: "SQLite", hint: "Great for development" },
    ],
    initialValue:
      project.database.type !== "unknown"
        ? project.database.type
        : "postgresql",
  });

  if (isCancel(dbResult)) process.exit(0);
  const database = dbResult as DatabaseType;

  const templateResult = await select({
    message: "Choose your schema template",
    options: [
      { value: "starter", label: "📦 Starter", hint: "User table only" },
      {
        value: "blog",
        label: "🚀 Blog",
        hint: "User, Post, Comment, Category",
      },
      {
        value: "ecommerce",
        label: "🛒 E-commerce",
        hint: "User, Product, Order, Cart",
      },
      {
        value: "saas",
        label: "💼 SaaS",
        hint: "User, Organization, Subscription",
      },
      {
        value: "empty",
        label: "❌ Empty",
        hint: "No tables, start from scratch",
      },
    ],
    initialValue: "starter",
  });

  if (isCancel(templateResult)) process.exit(0);
  const template = templateResult as TemplateType;

  let includeStudio = false;
  if (orm === "drizzle") {
    const studio = await confirm({
      message: "Include Drizzle Studio? (database GUI)",
      initialValue: true,
    });

    if (isCancel(studio)) process.exit(0);
    includeStudio = studio;
  }

  const useCustomPath = await confirm({
    message: "Use custom path for database client?",
    initialValue: false,
  });

  if (isCancel(useCustomPath)) process.exit(0);

  let clientPath: string | undefined;
  if (useCustomPath) {
    const path = await text({
      message: "Enter path (e.g., src/lib/database)",
      placeholder: project.srcDir ? `${project.srcDir}/lib/db` : "lib/db",
    });

    if (isCancel(path)) process.exit(0);
    clientPath = path;
  }

  return {
    orm,
    database,
    template,
    includeStudio,
    clientPath,
  };
}
