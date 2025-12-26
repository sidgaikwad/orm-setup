// src/generators/drizzle.ts
import { writeMultipleFiles } from "../file-writer";
import {
  generateSchema,
  generateClient,
  generateConfig,
  generateMigrate,
} from "./templates";
import type { ResolvedPaths } from "../paths";

interface GenerateOptions {
  paths: ResolvedPaths;
  database: "postgresql" | "mysql" | "sqlite";
  typescript: boolean;
  includeExamples: boolean;
}

export async function generateDrizzleSetup(
  options: GenerateOptions
): Promise<void> {
  const { paths, database, includeExamples } = options;

  const files = [
    {
      path: paths.schemaFile,
      content: generateSchema(database, includeExamples),
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
