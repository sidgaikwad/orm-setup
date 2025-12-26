// src/paths.ts (with validation and debug)
export interface ResolvedPaths {
  clientDir: string; // e.g., 'src/lib'
  clientFile: string; // e.g., 'src/lib/db.ts'
  schemaDir: string; // e.g., 'src/lib/db'
  schemaFile: string; // e.g., 'src/lib/db/schema.ts'
  migrateFile: string; // e.g., 'src/lib/db/migrate.ts'
  configFile: string; // e.g., 'drizzle.config.ts'
  migrationsDir: string; // e.g., 'drizzle/migrations'
}

export function resolvePaths(
  srcDir: string | null,
  customPath?: string
): ResolvedPaths {
  // Base path logic
  let base: string;

  if (customPath) {
    // User provided custom path
    base = customPath.replace(/\\/g, "/"); // Normalize Windows paths
  } else if (srcDir) {
    // Use src directory structure
    base = `${srcDir}/lib`;
  } else {
    // Root level lib directory
    base = "lib";
  }

  const paths: ResolvedPaths = {
    clientDir: base,
    clientFile: `${base}/db.ts`,
    schemaDir: `${base}/db`,
    schemaFile: `${base}/db/schema.ts`,
    migrateFile: `${base}/db/migrate.ts`,
    configFile: "drizzle.config.ts",
    migrationsDir: "drizzle/migrations",
  };

  // Debug logging
  console.log("\n🔍 Debug - Resolved paths:");
  console.log("  Base directory:", base);
  console.log("  Client file:", paths.clientFile);
  console.log("  Schema file:", paths.schemaFile);
  console.log("");

  return paths;
}
