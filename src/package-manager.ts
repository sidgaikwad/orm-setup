// src/package-manager.ts (FIXED)
import { execa } from "execa";
import { readFile, writeFile } from "node:fs/promises";

type PackageManager = "bun" | "npm" | "pnpm" | "yarn";
type Database = "postgresql" | "mysql" | "sqlite";
type ORM = "drizzle" | "prisma" | "kysely";

function getDriverPackage(database: Database, orm: ORM): string {
  // Kysely and Drizzle need database drivers, Prisma has them built-in
  if (orm === "prisma") {
    return ""; // Prisma includes drivers
  }

  switch (database) {
    case "postgresql":
      return orm === "kysely" ? "pg" : "postgres";
    case "mysql":
      return "mysql2";
    case "sqlite":
      return "better-sqlite3";
  }
}

export async function installDependencies(
  pm: PackageManager,
  orm: ORM,
  database: Database,
  includeStudio: boolean
): Promise<void> {
  let deps: string[] = [];
  let devDeps: string[] = [];

  // Install based on ORM
  switch (orm) {
    case "drizzle":
      const drizzleDriver = getDriverPackage(database, orm);
      deps = ["drizzle-orm", drizzleDriver];
      devDeps = ["drizzle-kit"];
      break;

    case "prisma":
      deps = ["@prisma/client"];
      devDeps = ["prisma"];
      break;

    case "kysely":
      const kyselyDriver = getDriverPackage(database, orm);
      deps = ["kysely", kyselyDriver];
      devDeps = [];
      break;
  }

  // Install commands vary by package manager
  const addCmd = pm === "npm" ? "install" : "add";
  const devFlag = pm === "npm" ? "--save-dev" : "-D";

  // Install runtime deps
  if (deps.length > 0) {
    await execa(pm, [addCmd, ...deps], { stdio: "inherit" });
  }

  // Install dev deps
  if (devDeps.length > 0) {
    await execa(pm, [addCmd, devFlag, ...devDeps], { stdio: "inherit" });
  }
}

export async function addPackageScripts(
  orm: ORM,
  database: Database
): Promise<void> {
  const pkgPath = "package.json";
  const content = await readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(content);

  let scripts: Record<string, string> = {};

  switch (orm) {
    case "drizzle":
      scripts = {
        "db:generate": "drizzle-kit generate",
        "db:migrate": "drizzle-kit migrate",
        "db:push": "drizzle-kit push",
        "db:studio": "drizzle-kit studio",
      };
      break;

    case "prisma":
      scripts = {
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
        "db:push": "prisma db push",
        "db:studio": "prisma studio",
        "db:seed": "prisma db seed",
      };
      break;

    case "kysely":
      scripts = {
        "db:migrate": "bun src/lib/db/migrate.ts",
      };
      break;
  }

  // Add scripts
  pkg.scripts = {
    ...pkg.scripts,
    ...scripts,
  };

  // Write back
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
