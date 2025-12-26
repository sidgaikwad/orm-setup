import { writeMultipleFiles } from "../file-writer";
import { generateSchema } from "./templates/drizzle-schema";
import { generateClient } from "./templates/drizzle-client";
import { generateConfig } from "./templates/drizzle-config";
import { generateMigrate } from "./templates/drizzle-migrate";
import type { ResolvedPaths } from "../paths";

interface GenerateOptions {
  paths: ResolvedPaths;
  database: "postgresql" | "mysql" | "sqlite";
  typescript: boolean;
  includeExamples: boolean;
}

export async function generateDrizzleSetup(options: GenerateOptions): Promise<void> {
  const { paths, database, includeExamples } = options;

  const files = [
    {
      path: paths.schemaFile,
      content: generateSchema(database, includeExamples),
    },
    {
      path: paths.clientFile,
      content: generateClient(database, paths.schemaDir),
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
