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
    base = customPath;
  } else if (srcDir) {
    base = `${srcDir}/lib`;
  } else {
    base = "lib";
  }

  return {
    clientDir: base,
    clientFile: `${base}/db.ts`,
    schemaDir: `${base}/db`,
    schemaFile: `${base}/db/schema.ts`,
    migrateFile: `${base}/db/migrate.ts`,
    configFile: "drizzle.config.ts",
    migrationsDir: "drizzle/migrations",
  };
}
