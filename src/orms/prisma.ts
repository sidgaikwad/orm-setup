import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { spawnSync } from "child_process";
import chalk from "chalk";
import type { DetectedSetup } from "../detector";
import type { OrmConfig } from "../orm";
import { generatePrismaSchema } from "../schema-generator";

/**
 * Setup Prisma ORM
 */
export async function setupPrisma(
  detected: DetectedSetup,
  config: OrmConfig
): Promise<void> {
  console.log(chalk.blue("\n📦 Setting up Prisma...\n"));

  // 1. Install dependencies
  await installPrismaDependencies(detected.packageManager);

  // 2. Create prisma directory
  const prismaDir = "prisma";
  if (!existsSync(prismaDir)) {
    mkdirSync(prismaDir, { recursive: true });
  }

  // 3. Generate and write schema
  await writePrismaSchema(detected, config);

  // 4. Create Prisma client file
  await writePrismaClient(detected);

  // 5. Create seed file (if requested)
  if (config.includeSeed) {
    await writePrismaSeed(config.schemaType);
  }

  // 6. Update package.json scripts
  await updatePackageJsonScripts();

  // 7. Generate Prisma Client
  await generatePrismaClient(detected.packageManager);

  console.log(chalk.green("\n✅ Prisma setup complete!\n"));
  printNextSteps();
}

/**
 * Install Prisma dependencies
 */
async function installPrismaDependencies(
  packageManager: DetectedSetup["packageManager"]
): Promise<void> {
  console.log(chalk.blue("Installing Prisma dependencies..."));

  const commands: Record<typeof packageManager, string[]> = {
    bun: ["bun", "add", "@prisma/client", "&&", "bun", "add", "-d", "prisma"],
    npm: [
      "npm",
      "install",
      "@prisma/client",
      "&&",
      "npm",
      "install",
      "-D",
      "prisma",
    ],
    pnpm: [
      "pnpm",
      "add",
      "@prisma/client",
      "&&",
      "pnpm",
      "add",
      "-D",
      "prisma",
    ],
    yarn: [
      "yarn",
      "add",
      "@prisma/client",
      "&&",
      "yarn",
      "add",
      "-D",
      "prisma",
    ],
  };

  const [cmd, ...args] = commands[packageManager];
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
  });

  if (result.error) {
    throw new Error(`Failed to install Prisma: ${result.error.message}`);
  }

  console.log(chalk.green("✓ Installed Prisma dependencies\n"));
}

/**
 * Write Prisma schema file with proper database provider
 */
async function writePrismaSchema(
  detected: DetectedSetup,
  config: OrmConfig
): Promise<void> {
  console.log(chalk.blue("Generating Prisma schema..."));

  // Map database types to Prisma providers
  const providerMap: Record<DetectedSetup["database"], string> = {
    postgresql: "postgresql",
    mysql: "mysql",
    sqlite: "sqlite",
    unknown: "postgresql", // default
  };

  const provider = providerMap[detected.database];

  // Normalize database type (handle 'unknown' case)
  const normalizedDb =
    detected.database === "unknown" ? "postgresql" : detected.database;

  // Generate schema content
  const schemaContent = generatePrismaSchema(normalizedDb, config.schemaType);

  // Replace the placeholder with actual provider
  const finalSchema = schemaContent.replace(/{{DATABASE_PROVIDER}}/g, provider);

  // Write to file
  const schemaPath = "prisma/schema.prisma";
  writeFileSync(schemaPath, finalSchema, "utf-8");

  console.log(chalk.green(`✓ Created ${schemaPath}\n`));
}

/**
 * Write Prisma client singleton
 */
async function writePrismaClient(detected: DetectedSetup): Promise<void> {
  console.log(chalk.blue("Creating Prisma client..."));

  // Determine client path based on framework
  const clientPaths: Record<string, string> = {
    nextjs: "lib/db.ts",
    remix: "app/db.server.ts",
    sveltekit: "src/lib/db.ts",
    astro: "src/lib/db.ts",
    express: "src/db.ts",
    fastify: "src/db.ts",
    unknown: "src/db.ts",
  };

  // Get framework name safely
  const frameworkName =
    typeof detected.framework === "object"
      ? detected.framework.name
      : detected.framework;

  const clientPath = clientPaths[frameworkName] || clientPaths.unknown;

  // Read template from templates directory
  const templatePath = join(__dirname, "../../templates/prisma/client.ts");
  let clientContent: string;

  if (existsSync(templatePath)) {
    clientContent = readFileSync(templatePath, "utf-8");
  } else {
    // Fallback: inline template
    clientContent = `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
`;
  }

  // Create directory if needed
  const dir = dirname(clientPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(clientPath, clientContent, "utf-8");

  console.log(chalk.green(`✓ Created ${clientPath}\n`));
}

/**
 * Write Prisma seed file
 */
async function writePrismaSeed(
  schemaType: OrmConfig["schemaType"]
): Promise<void> {
  console.log(chalk.blue("Creating seed file..."));

  const templatePath = join(__dirname, "../../templates/prisma/seed.ts");
  let seedContent: string;

  if (existsSync(templatePath)) {
    seedContent = readFileSync(templatePath, "utf-8");
  } else {
    // Fallback: inline template
    seedContent = `import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  })

  console.log('✅ Created user:', user.email)
  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
`;
  }

  writeFileSync("prisma/seed.ts", seedContent, "utf-8");

  console.log(chalk.green("✓ Created prisma/seed.ts\n"));
}

/**
 * Update package.json with Prisma scripts
 */
async function updatePackageJsonScripts(): Promise<void> {
  console.log(chalk.blue("Adding scripts to package.json..."));

  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));

    packageJson.scripts = {
      ...packageJson.scripts,
      "db:migrate": "prisma migrate dev",
      "db:push": "prisma db push",
      "db:seed": "prisma db seed",
      "db:studio": "prisma studio",
      "db:generate": "prisma generate",
    };

    packageJson.prisma = {
      seed: "bun prisma/seed.ts",
    };

    writeFileSync(
      "package.json",
      JSON.stringify(packageJson, null, 2),
      "utf-8"
    );

    console.log(chalk.green("✓ Added Prisma scripts to package.json\n"));
  } catch (error) {
    console.log(chalk.yellow("⚠ Could not update package.json scripts"));
  }
}

/**
 * Generate Prisma Client
 */
async function generatePrismaClient(
  packageManager: DetectedSetup["packageManager"]
): Promise<void> {
  console.log(chalk.blue("Generating Prisma Client..."));

  const commands: Record<typeof packageManager, string[]> = {
    bun: ["bunx", "prisma", "generate"],
    npm: ["npx", "prisma", "generate"],
    pnpm: ["pnpm", "exec", "prisma", "generate"],
    yarn: ["yarn", "prisma", "generate"],
  };

  const result = spawnSync(
    commands[packageManager][0],
    commands[packageManager].slice(1),
    {
      stdio: "inherit",
    }
  );

  if (result.error) {
    console.log(chalk.yellow("⚠ Could not generate Prisma Client"));
    console.log(chalk.yellow("  Run 'prisma generate' manually after setup"));
  } else {
    console.log(chalk.green("✓ Generated Prisma Client\n"));
  }
}

/**
 * Print next steps
 */
function printNextSteps(): void {
  console.log(chalk.bold("\n📚 Next Steps:\n"));
  console.log(chalk.gray("  1. Review your schema:"), "prisma/schema.prisma");
  console.log(chalk.gray("  2. Create migration:"), "bun run db:migrate");
  console.log(chalk.gray("  3. Seed database:"), "bun run db:seed");
  console.log(chalk.gray("  4. Open Prisma Studio:"), "bun run db:studio");
  console.log(
    chalk.gray("\n  5. Import in your code:"),
    "import { prisma } from '@/lib/db'"
  );
  console.log(chalk.gray("\n  📖 Docs:"), "https://www.prisma.io/docs\n");
}
