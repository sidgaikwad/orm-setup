import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { dirname } from "path";
import { spawnSync } from "child_process";
import chalk from "chalk";
import type { DetectedSetup } from "../detector";
import type { OrmConfig } from "../orm";
import { getFrameworkPaths } from "../framework-detector";
import { generatePrismaSchema } from "../schema-generator";

/**
 * Install Prisma dependencies
 */
async function installDependencies(packageManager: string): Promise<boolean> {
  console.log(chalk.blueBright("Installing Prisma..."));

  const commands: Record<string, string[]> = {
    bun: ["add", "@prisma/client"],
    npm: ["install", "@prisma/client"],
    pnpm: ["add", "@prisma/client"],
    yarn: ["add", "@prisma/client"],
  };

  const devCommands: Record<string, string[]> = {
    bun: ["add", "-d", "prisma"],
    npm: ["install", "-D", "prisma"],
    pnpm: ["add", "-D", "prisma"],
    yarn: ["add", "-D", "prisma"],
  };

  const cmd = commands[packageManager] || commands.bun;
  const devCmd = devCommands[packageManager] || devCommands.bun;

  // Install production dependency
  const result = spawnSync(packageManager, cmd, {
    shell: true,
    stdio: "inherit",
  });

  if (result.status !== 0) return false;

  // Install dev dependency
  const devResult = spawnSync(packageManager, devCmd, {
    shell: true,
    stdio: "inherit",
  });

  if (devResult.status === 0) {
    console.log(chalk.green("✓ Installed @prisma/client"));
    console.log(chalk.green("✓ Installed prisma (dev)"));
    return true;
  }

  return false;
}

/**
 * Generate Prisma client file
 */
function generateClient(): string {
  return `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
`;
}

/**
 * Generate seed file
 */
function generateSeedFile(schemaType: OrmConfig["schemaType"]): string {
  if (schemaType === "none") return "";

  let seedContent = `import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

`;

  if (schemaType === "minimal") {
    seedContent += `  // Create sample users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
    },
  })

  console.log('✓ Created users:', { alice, bob })
`;
  } else if (schemaType === "full") {
    seedContent += `  // Delete existing data
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
      posts: {
        create: [
          {
            title: 'Getting Started with Prisma',
            content: 'Prisma makes database access easy and type-safe!',
            published: true,
          },
          {
            title: 'My Second Post',
            content: 'This is a draft post',
            published: false,
          },
        ],
      },
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob',
    },
  })

  // Add comment from Bob to Alice's first post
  const alicePost = await prisma.post.findFirst({
    where: { 
      authorId: alice.id,
      published: true,
    },
  })

  if (alicePost) {
    await prisma.comment.create({
      data: {
        content: 'Great post, Alice! Really helpful.',
        postId: alicePost.id,
        authorId: bob.id,
      },
    })
  }

  console.log('✓ Seeded database with users, posts, and comments')
`;
  }

  seedContent += `}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
`;

  return seedContent;
}

/**
 * Update package.json with Prisma scripts
 */
function updatePackageJson(packageManager: string, includeSeed: boolean): void {
  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));

    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["db:generate"] = "prisma generate";
    packageJson.scripts["db:migrate"] = "prisma migrate dev";
    packageJson.scripts["db:push"] = "prisma db push";
    packageJson.scripts["db:studio"] = "prisma studio";
    packageJson.scripts["db:reset"] = "prisma migrate reset";

    if (includeSeed) {
      packageJson.scripts["db:seed"] = "prisma db seed";
      packageJson.prisma = {
        seed:
          packageManager === "bun"
            ? "bun prisma/seed.ts"
            : "tsx prisma/seed.ts",
      };
    }

    writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
    console.log(chalk.green("✓ Added scripts to package.json"));
  } catch (error) {
    console.log(chalk.yellow("⚠️  Could not update package.json"));
  }
}

/**
 * Run Prisma generate
 */
function generatePrismaClient(): boolean {
  console.log(chalk.blueBright("\nGenerating Prisma Client..."));

  const result = spawnSync("npx", ["prisma", "generate"], {
    shell: true,
    stdio: "inherit",
  });

  if (result.status === 0) {
    console.log(chalk.green("✓ Prisma Client generated"));
    return true;
  }

  return false;
}

/**
 * Main Prisma setup function
 */
export async function setupPrisma(
  setup: DetectedSetup,
  config: OrmConfig
): Promise<void> {
  console.log(
    chalk.blueBright("\n================ Installing Prisma ================\n")
  );

  // 1. Install dependencies
  const installed = await installDependencies(setup.packageManager);
  if (!installed) {
    console.log(chalk.red("\n❌ Failed to install Prisma dependencies"));
    process.exit(1);
  }

  // 2. Create directory structure
  console.log(chalk.blueBright("\nGenerating files..."));

  if (!existsSync("prisma")) {
    mkdirSync("prisma", { recursive: true });
  }

  const paths = getFrameworkPaths(setup.framework);

  // Ensure lib directory exists
  const clientDir = dirname(paths.clientPath);
  if (!existsSync(clientDir)) {
    mkdirSync(clientDir, { recursive: true });
  }

  // 3. Generate and write schema
  const schemaContent = generatePrismaSchema(
    setup.database as any,
    config.schemaType
  );
  writeFileSync("prisma/schema.prisma", schemaContent);
  console.log(chalk.green("✓ Created prisma/schema.prisma"));

  // 4. Generate and write client
  const clientContent = generateClient();
  writeFileSync(paths.clientPath, clientContent);
  console.log(chalk.green(`✓ Created ${paths.clientPath}`));

  // 5. Generate and write seed file (if requested)
  if (config.includeSeed && config.schemaType !== "none") {
    const seedContent = generateSeedFile(config.schemaType);
    writeFileSync("prisma/seed.ts", seedContent);
    console.log(chalk.green("✓ Created prisma/seed.ts"));
  }

  // 6. Update package.json with scripts
  updatePackageJson(setup.packageManager, config.includeSeed);

  // 7. Generate Prisma Client
  generatePrismaClient();

  // 8. Show success message
  console.log(chalk.greenBright("\n✅ Prisma setup complete!\n"));
  console.log(chalk.cyan("Next steps:"));
  console.log(
    chalk.gray("  1. Review schema: ") + chalk.white("prisma/schema.prisma")
  );
  console.log(
    chalk.gray("  2. Create migration: ") +
      chalk.white(`${setup.packageManager} run db:migrate`)
  );

  if (config.includeSeed) {
    console.log(
      chalk.gray("  3. Seed database (optional): ") +
        chalk.white(`${setup.packageManager} run db:seed`)
    );
  }

  console.log(
    chalk.gray(`  ${config.includeSeed ? "4" : "3"}. Start coding with: `) +
      chalk.white(
        `import { prisma } from '@/${paths.clientPath.replace(".ts", "")}'`
      )
  );
  console.log(
    chalk.gray(`  ${config.includeSeed ? "5" : "4"}. Open Prisma Studio: `) +
      chalk.white(`${setup.packageManager} run db:studio`)
  );

  console.log(
    chalk.blueBright("\n📚 Documentation: ") +
      chalk.white("https://www.prisma.io/docs")
  );
  console.log(chalk.yellow("─".repeat(60)));
}
