import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import chalk from "chalk";
import type { DetectedSetup } from "../detector";
import type { OrmConfig } from "../orm";
import { generateDrizzleSchema } from "../schema-generator";

/**
 * Setup Drizzle ORM
 */
export async function setupDrizzle(
  detected: DetectedSetup,
  config: OrmConfig
): Promise<void> {
  console.log(chalk.blue("\n📦 Setting up Drizzle...\n"));

  // 1. Install dependencies
  await installDrizzleDependencies(detected.packageManager, detected.database);

  // 2. Create db directory
  const dbDir = "src/db";
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  // 3. Generate and write schema
  await writeDrizzleSchema(detected, config);

  // 4. Create Drizzle client file
  await writeDrizzleClient(detected);

  // 5. Create migration runner
  await writeDrizzleMigrate(detected);

  // 6. Create drizzle.config.ts
  await writeDrizzleConfig(detected);

  // 7. Update package.json scripts
  await updatePackageJsonScripts(detected.database);

  console.log(chalk.green("\n✅ Drizzle setup complete!\n"));
  printNextSteps();
}

/**
 * Install Drizzle dependencies
 */
async function installDrizzleDependencies(
  packageManager: DetectedSetup["packageManager"],
  database: DetectedSetup["database"]
): Promise<void> {
  console.log(chalk.blue("Installing Drizzle dependencies..."));

  // Base packages
  const packages = ["drizzle-orm", "drizzle-kit"];

  // Add database-specific driver
  const driverMap: Record<DetectedSetup["database"], string> = {
    postgresql: "postgres",
    mysql: "mysql2",
    sqlite: "better-sqlite3",
    unknown: "postgres",
  };

  packages.push(driverMap[database]);

  const installCmd: Record<typeof packageManager, string> = {
    bun: `bun add ${packages.join(" ")}`,
    npm: `npm install ${packages.join(" ")}`,
    pnpm: `pnpm add ${packages.join(" ")}`,
    yarn: `yarn add ${packages.join(" ")}`,
  };

  const result = spawnSync(installCmd[packageManager], {
    stdio: "inherit",
    shell: true,
  });

  if (result.error) {
    throw new Error(`Failed to install Drizzle: ${result.error.message}`);
  }

  console.log(chalk.green("✓ Installed Drizzle dependencies\n"));
}

/**
 * Write Drizzle schema file
 */
async function writeDrizzleSchema(
  detected: DetectedSetup,
  config: OrmConfig
): Promise<void> {
  console.log(chalk.blue("Generating Drizzle schema..."));

  // Normalize database type (handle 'unknown' case)
  const normalizedDb =
    detected.database === "unknown" ? "postgresql" : detected.database;

  // Generate schema content (already returns correct syntax for database type)
  const schemaContent = generateDrizzleSchema(normalizedDb, config.schemaType);

  // Write to file
  const schemaPath = "src/db/schema.ts";
  writeFileSync(schemaPath, schemaContent, "utf-8");

  console.log(chalk.green(`✓ Created ${schemaPath}\n`));
}

/**
 * Write Drizzle client
 */
async function writeDrizzleClient(detected: DetectedSetup): Promise<void> {
  console.log(chalk.blue("Creating Drizzle client..."));

  const templatePath = join(__dirname, "../../templates/drizzle/db.ts");
  let clientContent: string;

  if (existsSync(templatePath)) {
    clientContent = readFileSync(templatePath, "utf-8");
  } else {
    // Fallback: inline template based on database type
    const importMap: Record<DetectedSetup["database"], string> = {
      postgresql:
        "import { drizzle } from 'drizzle-orm/postgres-js'\nimport postgres from 'postgres'",
      mysql:
        "import { drizzle } from 'drizzle-orm/mysql2'\nimport mysql from 'mysql2/promise'",
      sqlite:
        "import { drizzle } from 'drizzle-orm/better-sqlite3'\nimport Database from 'better-sqlite3'",
      unknown:
        "import { drizzle } from 'drizzle-orm/postgres-js'\nimport postgres from 'postgres'",
    };

    const clientMap: Record<DetectedSetup["database"], string> = {
      postgresql: `const queryClient = postgres(connectionString)
export const db = drizzle(queryClient, { schema })`,
      mysql: `const queryClient = mysql.createPool(connectionString)
export const db = drizzle(queryClient, { schema })`,
      sqlite: `const queryClient = new Database(connectionString)
export const db = drizzle(queryClient, { schema })`,
      unknown: `const queryClient = postgres(connectionString)
export const db = drizzle(queryClient, { schema })`,
    };

    clientContent = `${importMap[detected.database]}
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

${clientMap[detected.database]}
`;
  }

  writeFileSync("src/db/index.ts", clientContent, "utf-8");

  console.log(chalk.green("✓ Created src/db/index.ts\n"));
}

/**
 * Write Drizzle migration runner
 */
async function writeDrizzleMigrate(detected: DetectedSetup): Promise<void> {
  console.log(chalk.blue("Creating migration runner..."));

  const templatePath = join(__dirname, "../../templates/drizzle/migrate.ts");
  let migrateContent: string;

  if (existsSync(templatePath)) {
    migrateContent = readFileSync(templatePath, "utf-8");
  } else {
    // Fallback: inline template
    const importMap: Record<DetectedSetup["database"], string> = {
      postgresql:
        "import { drizzle } from 'drizzle-orm/postgres-js'\nimport { migrate } from 'drizzle-orm/postgres-js/migrator'\nimport postgres from 'postgres'",
      mysql:
        "import { drizzle } from 'drizzle-orm/mysql2'\nimport { migrate } from 'drizzle-orm/mysql2/migrator'\nimport mysql from 'mysql2/promise'",
      sqlite:
        "import { drizzle } from 'drizzle-orm/better-sqlite3'\nimport { migrate } from 'drizzle-orm/better-sqlite3/migrator'\nimport Database from 'better-sqlite3'",
      unknown:
        "import { drizzle } from 'drizzle-orm/postgres-js'\nimport { migrate } from 'drizzle-orm/postgres-js/migrator'\nimport postgres from 'postgres'",
    };

    const clientMap: Record<DetectedSetup["database"], string> = {
      postgresql:
        "const sql = postgres(connectionString, { max: 1 })\n  const db = drizzle(sql)",
      mysql:
        "const connection = await mysql.createConnection(connectionString)\n  const db = drizzle(connection)",
      sqlite:
        "const sqlite = new Database(connectionString)\n  const db = drizzle(sqlite)",
      unknown:
        "const sql = postgres(connectionString, { max: 1 })\n  const db = drizzle(sql)",
    };

    migrateContent = `${importMap[detected.database]}

const connectionString = process.env.DATABASE_URL!

async function main() {
  console.log('🚀 Running migrations...')

  ${clientMap[detected.database]}

  await migrate(db, { migrationsFolder: './drizzle/migrations' })

  console.log('✅ Migrations completed!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed')
    console.error(e)
    process.exit(1)
  })
`;
  }

  writeFileSync("src/db/migrate.ts", migrateContent, "utf-8");

  console.log(chalk.green("✓ Created src/db/migrate.ts\n"));
}

/**
 * Write drizzle.config.ts
 */
async function writeDrizzleConfig(detected: DetectedSetup): Promise<void> {
  console.log(chalk.blue("Creating Drizzle config..."));

  const driverMap: Record<DetectedSetup["database"], string> = {
    postgresql: "pg",
    mysql: "mysql2",
    sqlite: "better-sqlite3",
    unknown: "pg",
  };

  const configContent = `import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  driver: '${driverMap[detected.database]}',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
`;

  writeFileSync("drizzle.config.ts", configContent, "utf-8");

  console.log(chalk.green("✓ Created drizzle.config.ts\n"));
}

/**
 * Update package.json with Drizzle scripts
 */
async function updatePackageJsonScripts(
  database: DetectedSetup["database"]
): Promise<void> {
  console.log(chalk.blue("Adding scripts to package.json..."));

  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));

    const driverSuffix: Record<typeof database, string> = {
      postgresql: "pg",
      mysql: "mysql2",
      sqlite: "sqlite",
      unknown: "pg",
    };

    packageJson.scripts = {
      ...packageJson.scripts,
      "db:generate": `drizzle-kit generate:${driverSuffix[database]}`,
      "db:migrate": "bun src/db/migrate.ts",
      "db:push": `drizzle-kit push:${driverSuffix[database]}`,
      "db:studio": "drizzle-kit studio",
    };

    writeFileSync(
      "package.json",
      JSON.stringify(packageJson, null, 2),
      "utf-8"
    );

    console.log(chalk.green("✓ Added Drizzle scripts to package.json\n"));
  } catch (error) {
    console.log(chalk.yellow("⚠ Could not update package.json scripts"));
  }
}

/**
 * Print next steps
 */
function printNextSteps(): void {
  console.log(chalk.bold("\n📚 Next Steps:\n"));
  console.log(chalk.gray("  1. Review your schema:"), "src/db/schema.ts");
  console.log(chalk.gray("  2. Generate migration:"), "bun run db:generate");
  console.log(chalk.gray("  3. Apply migration:"), "bun run db:migrate");
  console.log(chalk.gray("  4. Open Drizzle Studio:"), "bun run db:studio");
  console.log(
    chalk.gray("\n  5. Import in your code:"),
    "import { db } from '@/db'"
  );
  console.log(chalk.gray("\n  📖 Docs:"), "https://orm.drizzle.team\n");
}
