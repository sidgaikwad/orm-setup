// src/generators/drizzle.ts (with debug logging)
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

  // Debug: Log what paths we're using
  console.log("\n🔍 Debug - Paths to create:");
  console.log("  Schema:", paths.schemaFile);
  console.log("  Client:", paths.clientFile);
  console.log("  Config:", paths.configFile);
  console.log("  Migrate:", paths.migrateFile);
  console.log("");

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

  try {
    await writeMultipleFiles(files);
  } catch (error) {
    if (error instanceof Error) {
      console.error("\n❌ File generation failed:", error.message);
    }
    throw error;
  }
}
