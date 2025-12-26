#!/usr/bin/env bun
// src/index.ts (FIXED)
import { intro, outro, spinner, log, cancel, confirm } from "@clack/prompts";
import chalk from "chalk";
import { detectProject } from "./detector";
import { promptOrmSetup } from "./prompts";
import { resolvePaths } from "./paths";
import { generateDrizzleSetup } from "./generators/drizzle";
import { generatePrismaSetup } from "./generators/prisma";
import { generateKyselySetup } from "./generators/kysely";
import { installDependencies, addPackageScripts } from "./package-manager";

async function main() {
  console.clear();

  intro(chalk.bold.blue("🗄️  ORM Setup CLI v1.0.0"));

  try {
    // Step 1: Detect project structure
    const s = spinner();
    s.start("Analyzing your project...");

    const project = await detectProject();

    s.stop("Project analyzed");

    // Display what we found
    log.info(
      `${chalk.green("✓")} ${
        project.hasTypescript ? "TypeScript" : "JavaScript"
      } project`
    );
    log.info(`${chalk.green("✓")} Package manager: ${project.packageManager}`);
    if (project.srcDir) {
      log.info(`${chalk.green("✓")} Source directory: ${project.srcDir}/`);
    }
    if (project.database.url) {
      log.info(
        `${chalk.green("✓")} Database: ${project.database.type} (from .env)`
      );
    } else {
      log.warn(`${chalk.yellow("!")} No DATABASE_URL found in .env`);
    }

    // Check for existing ORM
    if (project.hasDrizzle) {
      log.warn(
        `${chalk.yellow("⚠")} Drizzle is already set up in this project`
      );
      const shouldContinue = await confirm({
        message: "Continue anyway? (this may overwrite files)",
        initialValue: false,
      });
      if (!shouldContinue) {
        cancel("Operation cancelled");
        process.exit(0);
      }
    }

    // Step 2: Get user preferences
    const config = await promptOrmSetup(project);

    // Step 3: Resolve file paths
    const paths = resolvePaths(project.srcDir, config.clientPath);

    // Step 4: Install dependencies
    s.start("Installing dependencies...");
    await installDependencies(
      project.packageManager,
      config.orm,
      config.database,
      config.includeStudio
    );
    s.stop("Dependencies installed");

    // Step 5: Generate files based on ORM choice
    s.start("Generating files...");

    switch (config.orm) {
      case "drizzle":
        await generateDrizzleSetup({
          paths,
          database: config.database,
          template: config.template, // ✅ NEW
          typescript: project.hasTypescript,
        });
        break;

      case "prisma":
        await generatePrismaSetup({
          paths,
          database: config.database,
          template: config.template, // ✅ NEW
        });
        break;

      case "kysely":
        await generateKyselySetup({
          paths,
          database: config.database,
          template: config.template, // ✅ NEW
        });
        break;
    }

    s.stop("Files generated");

    // Step 6: Add scripts to package.json
    s.start("Updating package.json...");
    await addPackageScripts(config.orm, config.database);
    s.stop("package.json updated");

    // Success!
    outro(
      chalk.green.bold(
        `✅ ${
          config.orm === "drizzle"
            ? "Drizzle"
            : config.orm === "prisma"
            ? "Prisma"
            : "Kysely"
        } ORM setup complete!`
      )
    );

    // Show next steps
    console.log();
    log.step(`Import your database client:`);

    if (config.orm === "drizzle") {
      console.log(chalk.cyan(`  import { db } from '@/lib/db'`));
    } else if (config.orm === "prisma") {
      console.log(chalk.cyan(`  import { prisma } from '@/lib/prisma'`));
    } else {
      console.log(chalk.cyan(`  import { db } from '@/lib/db'`));
    }

    console.log();
    log.step("Next steps:");

    if (config.orm === "drizzle") {
      console.log(`  ${chalk.gray("1.")} Add DATABASE_URL to .env`);
      console.log(
        `  ${chalk.gray("2.")} Run: ${chalk.cyan(
          "bun db:generate"
        )} (create migration)`
      );
      console.log(
        `  ${chalk.gray("3.")} Run: ${chalk.cyan(
          "bun db:migrate"
        )} (apply migration)`
      );
      if (config.includeStudio) {
        console.log(
          `  ${chalk.gray("4.")} Run: ${chalk.cyan(
            "bun db:studio"
          )} (open database GUI)`
        );
      }
    } else if (config.orm === "prisma") {
      console.log(`  ${chalk.gray("1.")} Add DATABASE_URL to .env`);
      console.log(
        `  ${chalk.gray("2.")} Run: ${chalk.cyan(
          "bun db:generate"
        )} (generate client)`
      );
      console.log(
        `  ${chalk.gray("3.")} Run: ${chalk.cyan(
          "bun db:migrate"
        )} (create & apply migration)`
      );
      console.log(
        `  ${chalk.gray("4.")} Run: ${chalk.cyan(
          "bun db:studio"
        )} (open Prisma Studio)`
      );
    } else {
      console.log(`  ${chalk.gray("1.")} Add DATABASE_URL to .env`);
      console.log(
        `  ${chalk.gray("2.")} Create migrations in migrations/ folder`
      );
      console.log(
        `  ${chalk.gray("3.")} Run: ${chalk.cyan(
          "bun db:migrate"
        )} (apply migrations)`
      );
    }

    console.log();

    const docUrl =
      config.orm === "drizzle"
        ? "https://orm.drizzle.team/docs"
        : config.orm === "prisma"
        ? "https://www.prisma.io/docs"
        : "https://kysely.dev/docs";

    log.info(`Documentation: ${chalk.cyan(docUrl)}`);
  } catch (error) {
    if (error instanceof Error) {
      log.error(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }
}

main();
