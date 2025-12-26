import { execa } from "execa";
import { readFile, writeFile } from "node:fs/promises";

type PackageManager = "bun" | "npm" | "pnpm" | "yarn";
type Database = "postgresql" | "mysql" | "sqlite";

function getDriverPackage(database: Database): string {
  switch (database) {
    case "postgresql":
      return "postgres";
    case "mysql":
      return "mysql2";
    case "sqlite":
      return "better-sqlite3";
  }
}

export async function installDependencies(
  pm: PackageManager,
  database: Database,
  includeStudio: boolean
): Promise {
  const driver = getDriverPackage(database);

  // Runtime dependencies
  const deps = ["drizzle-orm", driver];

  // Dev dependencies
  const devDeps = ["drizzle-kit"];
  if (includeStudio && !devDeps.includes("drizzle-kit")) {
    // drizzle-kit already includes studio
  }

  // Install commands vary by package manager
  const addCmd = pm === "npm" ? "install" : "add";
  const devFlag = pm === "npm" ? "--save-dev" : "-D";

  // Install runtime deps
  await execa(pm, [addCmd, ...deps], { stdio: "inherit" });

  // Install dev deps
  await execa(pm, [addCmd, devFlag, ...devDeps], { stdio: "inherit" });
}

export async function addPackageScripts(database: Database): Promise {
  const pkgPath = "package.json";
  const content = await readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(content);

  // Determine dialect for drizzle-kit commands
  const dialect = database === "postgresql" ? "pg" : database;

  // Add scripts
  pkg.scripts = {
    ...pkg.scripts,
    "db:generate": `drizzle-kit generate`,
    "db:migrate": `drizzle-kit migrate`,
    "db:push": `drizzle-kit push`,
    "db:studio": `drizzle-kit studio`,
  };

  // Write back
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
