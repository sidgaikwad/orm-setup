import { writeMultipleFiles } from "../file-writer";
import { getPrismaSchema } from "./templates/schemas";
import type { ResolvedPaths } from "../paths";

interface GenerateOptions {
  paths: ResolvedPaths;
  database: "postgresql" | "mysql" | "sqlite";
  template: "empty" | "starter" | "blog" | "ecommerce" | "saas";
}

export async function generatePrismaSetup(
  options: GenerateOptions
): Promise<void> {
  const { paths, database, template } = options;

  const files = [
    {
      path: "prisma/schema.prisma",
      content: getPrismaSchema(template, database),
    },
    {
      path: paths.clientFile.replace("/db.ts", "/prisma.ts"),
      content: generatePrismaClient(),
    },
  ];

  await writeMultipleFiles(files);
}

function generatePrismaClient(): string {
  return `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
`;
}
