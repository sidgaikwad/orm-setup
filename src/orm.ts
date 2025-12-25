import { select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import type { DetectedSetup } from "./detector";
import { getFrameworkPaths } from "./framework-detector";
import type { SchemaType } from "./schema-generator";

export interface OrmConfig {
  orm: "prisma" | "drizzle";
  schemaType: SchemaType;
  includeSeed: boolean;
}

/**
 * Select ORM with user prompts
 */
export async function selectOrm(setup: DetectedSetup): Promise<OrmConfig> {
  console.log(
    chalk.blueBright("\n================ ORM Setup ================\n")
  );

  // Warn if ORM already exists
  if (setup.existingOrm) {
    console.log(
      chalk.yellow(
        `⚠️  ${setup.existingOrm.toUpperCase()} is already installed in this project.`
      )
    );

    const shouldContinue = await confirm({
      message: chalk.yellow(
        "This will overwrite your existing ORM setup. Continue?"
      ),
      default: false,
    });

    if (!shouldContinue) {
      console.log(
        chalk.gray(
          "\nSetup cancelled. Your existing configuration was not modified."
        )
      );
      process.exit(0);
    }
    console.log(""); // Empty line
  }

  // Select ORM
  const orm = await select<"prisma" | "drizzle">({
    message: chalk.cyan("Select your ORM:"),
    choices: [
      {
        name: "Prisma - Most popular, excellent DX, auto-generated client",
        value: "prisma",
      },
      {
        name: "Drizzle - TypeScript-first, lightweight, edge-ready",
        value: "drizzle",
      },
    ],
  });

  // Select schema type
  const schemaType = await select<SchemaType>({
    message: chalk.cyan("Include starter schema?"),
    choices: [
      {
        name: "Full - User, Post, Comment models with relations",
        value: "full",
      },
      {
        name: "Minimal - Just a User model",
        value: "minimal",
      },
      {
        name: "None - Empty schema, I'll define my own",
        value: "none",
      },
    ],
  });

  // Ask about seed data (only if schema is included)
  let includeSeed = false;
  if (schemaType !== "none") {
    includeSeed = await confirm({
      message: chalk.cyan("Include seed data script?"),
      default: true,
    });
  }

  return {
    orm,
    schemaType,
    includeSeed,
  };
}

export { getFrameworkPaths };
