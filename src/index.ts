#!/usr/bin/env node

import chalk from "chalk";
import { detectSetup, validateSetup } from "./detector";
import { selectOrm } from "./orm";
import { setupPrisma } from "./orms/prisma";
import { setupDrizzle } from "./orms/drizzle";

async function main() {
  try {
    console.log(chalk.bold.cyan("\n🗄️  ORM Setup CLI\n"));
    console.log(chalk.gray("Setup Prisma or Drizzle with best practices\n"));

    // Step 1: Detect current setup
    const setup = await detectSetup();

    // Step 2: Validate requirements
    const validation = validateSetup(setup);
    if (!validation.valid) {
      console.log(chalk.red(`\n❌ ${validation.error}\n`));

      // Provide helpful guidance
      if (validation.error?.includes("DATABASE_URL")) {
        console.log(chalk.cyan("💡 Tip: Run this first:"));
        console.log(chalk.white("   bunx @sidgaikwad/db-setup\n"));
      }

      process.exit(1);
    }

    // Step 3: Select ORM and configuration
    const config = await selectOrm(setup);

    // Step 4: Run setup based on selected ORM
    if (config.orm === "prisma") {
      await setupPrisma(setup, config);
    } else if (config.orm === "drizzle") {
      await setupDrizzle(setup, config);
    }

    console.log(chalk.green("\n🎉 Setup completed successfully!\n"));
    console.log(chalk.gray("Happy coding! 🚀\n"));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red("\n❌ Setup failed:"), error.message);

      if (error.message.includes("ENOENT")) {
        console.log(
          chalk.yellow("\n💡 Make sure you're in your project directory\n")
        );
      }
    } else {
      console.error(chalk.red("\n❌ Setup failed:"), error);
    }

    console.log(
      chalk.gray(
        "Tip: Run the command again or check the error message above.\n"
      )
    );
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n⚠️  Setup cancelled by user\n"));
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(chalk.yellow("\n\n⚠️  Setup cancelled\n"));
  process.exit(0);
});

main();
