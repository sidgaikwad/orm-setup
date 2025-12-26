// src/generators/drizzle.ts (updated to use templates)
import { writeMultipleFiles } from "../file-writer";
import { generateClient, generateConfig, generateMigrate } from "./templates";
import { getDrizzleSchema } from "./templates/schemas";
import type { ResolvedPaths } from "../paths";

interface GenerateOptions {
  paths: ResolvedPaths;
  database: "postgresql" | "mysql" | "sqlite";
  typescript: boolean;
  template: "empty" | "starter" | "blog" | "ecommerce" | "saas";
}

export async function generateDrizzleSetup(
  options: GenerateOptions
): Promise<void> {
  const { paths, database, template } = options;

  const files = [
    {
      path: paths.schemaFile,
      content: getDrizzleSchema(template, database),
    },
    {
      path: paths.clientFile,
      content: generateClient(database),
    },
    {
      path: paths.configFile,
      content: generateConfig(database, paths.schemaFile, paths.migrationsDir),
    },
    {
      path: paths.migrateFile,
      content: generateMigrate(database),
    },
  ];

  await writeMultipleFiles(files);
}
