import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { spawnSync } from "child_process";
import chalk from "chalk";
import type { DetectedSetup } from "../detector";
import type { OrmConfig } from "../orm";
import { generateDrizzleSchema } from "../schema-generator";

/**
 * Install Drizzle dependencies
 */
async function installDependencies(
  packageManager: string,
  database: string
): Promise<boolean> {
  console.log(chalk.blueBright("Installing Drizzle..."));

  // Determine database driver
  const driver =
    database === "postgresql"
      ? "postgres"
      : database === "mysql"
      ? "mysql2"
      : "better-sqlite3";

  const packages = ["drizzle-orm", driver];
  const devPackages = ["drizzle-kit"];

  const commands: Record<string, { prod: string[]; dev: string[] }> = {
    bun: {
      prod: ["add", ...packages],
      dev: ["add", "-d", ...devPackages],
    },
    npm: {
      prod: ["install", ...packages],
      dev: ["install", "-D", ...devPackages],
    },
    pnpm: {
      prod: ["add", ...packages],
      dev: ["add", "-D", ...devPackages],
    },
    yarn: {
      prod: ["add", ...packages],
      dev: ["add", "-D", ...devPackages],
    },
  };

  const cmd = commands[packageManager] || commands.bun;

  // Install production dependencies
  const prodResult = spawnSync(packageManager, cmd.prod, {
    shell: true,
    stdio: "inherit",
  });

  if (prodResult.status !== 0) return false;

  // Install dev dependencies
  const devResult = spawnSync(packageManager, cmd.dev, {
    shell: true,
    stdio: "inherit",
  });

  if (devResult.status === 0) {
    console.log(chalk.green(`✓ Installed drizzle-orm and ${driver}`));
    console.log(chalk.green("✓ Installed drizzle-kit (dev)"));
    return true;
  }

  return false;
}

/**
 * Generate Drizzle client file
 */
function generateClient(database: string): string {
  if (database === "postgresql") {
    return `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const client = postgres(process.env.DATABASE_URL)
export const db = drizzle(client, { schema })
`;
  } else if (database === "mysql") {
    return `import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const client = await mysql.createConnection(process.env.DATABASE_URL)
export const db = drizzle(client, { schema, mode: 'default' })
`;
  } else {
    return `import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sqlite = new Database(process.env.DATABASE_URL)
export const db = drizzle(sqlite, { schema })
`;
  }
}

/**
 * Generate Drizzle config file
 */
function generateConfig(database: string): string {
  const dialect =
    database === "postgresql"
      ? "postgresql"
      : database === "mysql"
      ? "mysql"
      : "sqlite";

  return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: '${dialect}',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
`;
}

/**
 * Generate migrate script
 */
function generateMigrateScript(database: string): string {
  if (database === "postgresql") {
    return `import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const runMigrate = async () => {
  console.log('⏳ Running migrations...')

  const connection = postgres(process.env.DATABASE_URL!, { max: 1 })
  const db = drizzle(connection)

  await migrate(db, { migrationsFolder: './drizzle' })

  await connection.end()

  console.log('✅ Migrations complete!')
  process.exit(0)
}

runMigrate().catch((err) => {
  console.error('❌ Migration failed')
  console.error(err)
  process.exit(1)
})
`;
  }

  return "";
}

/**
 * Update package.json with Drizzle scripts
 */
function updatePackageJson(packageManager: string, database: string): void {
  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));

    const dialect =
      database === "postgresql"
        ? "pg"
        : database === "mysql"
        ? "mysql"
        : "sqlite";

    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["db:generate"] = `drizzle-kit generate`;
    packageJson.scripts["db:migrate"] =
      packageManager === "bun"
        ? "bun src/db/migrate.ts"
        : "tsx src/db/migrate.ts";
    packageJson.scripts["db:push"] = `drizzle-kit push`;
    packageJson.scripts["db:studio"] = "drizzle-kit studio";

    writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
    console.log(chalk.green("✓ Added scripts to package.json"));
  } catch (error) {
    console.log(chalk.yellow("⚠️  Could not update package.json"));
  }
}

/**
 * Main Drizzle setup function
 */
export async function setupDrizzle(
  setup: DetectedSetup,
  config: OrmConfig
): Promise<void> {
  console.log(
    chalk.blueBright("\n================ Installing Drizzle ================\n")
  );

  // 1. Install dependencies
  const installed = await installDependencies(
    setup.packageManager,
    setup.database
  );
  if (!installed) {
    console.log(chalk.red("\n❌ Failed to install Drizzle dependencies"));
    process.exit(1);
  }

  // 2. Create directory structure
  console.log(chalk.blueBright("\nGenerating files..."));

  const dbDir = "src/db";
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  if (!existsSync("drizzle")) {
    mkdirSync("drizzle", { recursive: true });
  }

  // 3. Generate and write schema
  const schemaContent = generateDrizzleSchema(
    setup.database as any,
    config.schemaType
  );
  writeFileSync(`${dbDir}/schema.ts`, schemaContent);
  console.log(chalk.green(`✓ Created ${dbDir}/schema.ts`));

  // 4. Generate and write client
  const clientContent = generateClient(setup.database);
  writeFileSync(`${dbDir}/index.ts`, clientContent);
  console.log(chalk.green(`✓ Created ${dbDir}/index.ts`));

  // 5. Generate and write config
  const configContent = generateConfig(setup.database);
  writeFileSync("drizzle.config.ts", configContent);
  console.log(chalk.green("✓ Created drizzle.config.ts"));

  // 6. Generate migrate script
  if (setup.database === "postgresql") {
    const migrateContent = generateMigrateScript(setup.database);
    writeFileSync(`${dbDir}/migrate.ts`, migrateContent);
    console.log(chalk.green(`✓ Created ${dbDir}/migrate.ts`));
  }

  // 7. Update package.json with scripts
  updatePackageJson(setup.packageManager, setup.database);

  // 8. Generate initial migration
  if (config.schemaType !== "none") {
    console.log(chalk.blueBright("\nGenerating initial migration..."));
    const generateResult = spawnSync("npx", ["drizzle-kit", "generate"], {
      shell: true,
      stdio: "inherit",
    });

    if (generateResult.status === 0) {
      console.log(chalk.green("✓ Initial migration generated"));
    }
  }

  // 9. Show success message
  console.log(chalk.greenBright("\n✅ Drizzle setup complete!\n"));
  console.log(chalk.cyan("Next steps:"));
  console.log(
    chalk.gray("  1. Review schema: ") + chalk.white(`${dbDir}/schema.ts`)
  );
  console.log(
    chalk.gray("  2. Run migration: ") +
      chalk.white(`${setup.packageManager} run db:migrate`)
  );
  console.log(
    chalk.gray("  3. Start coding with: ") +
      chalk.white(`import { db } from '@/db'`)
  );
  console.log(
    chalk.gray("  4. Open Drizzle Studio: ") +
      chalk.white(`${setup.packageManager} run db:studio`)
  );

  console.log(
    chalk.blueBright("\n📚 Documentation: ") +
      chalk.white("https://orm.drizzle.team/docs")
  );
  console.log(chalk.yellow("─".repeat(60)));
}
