import { existsSync, readFileSync } from "fs";

export type Framework =
  | "nextjs"
  | "remix"
  | "sveltekit"
  | "astro"
  | "express"
  | "fastify"
  | "unknown";

export interface FrameworkInfo {
  name: Framework;
  version?: string;
  appRouter?: boolean; // For Next.js
}

/**
 * Detect framework from package.json
 */
export function detectFramework(): FrameworkInfo {
  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Next.js detection
    if (deps.next) {
      const version = deps.next.replace(/[\^~]/, "");
      const majorVersion = parseInt(version.split(".")[0]);

      // Check if using App Router (Next.js 13+)
      const hasAppDir = existsSync("app") || existsSync("src/app");

      return {
        name: "nextjs",
        version: deps.next,
        appRouter: majorVersion >= 13 && hasAppDir,
      };
    }

    // Remix detection
    if (deps["@remix-run/react"] || deps["@remix-run/node"]) {
      return {
        name: "remix",
        version: deps["@remix-run/react"] || deps["@remix-run/node"],
      };
    }

    // SvelteKit detection
    if (deps["@sveltejs/kit"]) {
      return {
        name: "sveltekit",
        version: deps["@sveltejs/kit"],
      };
    }

    // Astro detection
    if (deps.astro) {
      return {
        name: "astro",
        version: deps.astro,
      };
    }

    // Express detection
    if (deps.express) {
      return {
        name: "express",
        version: deps.express,
      };
    }

    // Fastify detection
    if (deps.fastify) {
      return {
        name: "fastify",
        version: deps.fastify,
      };
    }

    return { name: "unknown" };
  } catch (error) {
    return { name: "unknown" };
  }
}

/**
 * Get recommended file paths for the detected framework
 */
export function getFrameworkPaths(framework: FrameworkInfo): {
  clientPath: string;
  schemaDir: string;
  seedPath: string;
  migrateDir?: string;
} {
  switch (framework.name) {
    case "nextjs":
      return {
        clientPath: "lib/db.ts",
        schemaDir: "prisma", // or src/db for drizzle
        seedPath: "prisma/seed.ts",
        migrateDir: "src/db",
      };

    case "remix":
      return {
        clientPath: "app/db.server.ts",
        schemaDir: "prisma",
        seedPath: "prisma/seed.ts",
        migrateDir: "app/db",
      };

    case "sveltekit":
      return {
        clientPath: "src/lib/db.ts",
        schemaDir: "prisma",
        seedPath: "prisma/seed.ts",
        migrateDir: "src/lib/db",
      };

    case "astro":
      return {
        clientPath: "src/lib/db.ts",
        schemaDir: "prisma",
        seedPath: "prisma/seed.ts",
        migrateDir: "src/db",
      };

    case "express":
    case "fastify":
      return {
        clientPath: "src/db.ts",
        schemaDir: "prisma",
        seedPath: "prisma/seed.ts",
        migrateDir: "src/db",
      };

    default:
      return {
        clientPath: "src/db.ts",
        schemaDir: "prisma",
        seedPath: "prisma/seed.ts",
        migrateDir: "src/db",
      };
  }
}

/**
 * Get friendly framework name for display
 */
export function getFrameworkDisplayName(framework: FrameworkInfo): string {
  const names: Record<Framework, string> = {
    nextjs: "Next.js",
    remix: "Remix",
    sveltekit: "SvelteKit",
    astro: "Astro",
    express: "Express",
    fastify: "Fastify",
    unknown: "Unknown/Generic",
  };

  let displayName = names[framework.name];

  if (framework.version) {
    displayName += ` ${framework.version}`;
  }

  if (framework.name === "nextjs" && framework.appRouter) {
    displayName += " (App Router)";
  }

  return displayName;
}
