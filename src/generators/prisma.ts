import { writeMultipleFiles } from "../file-writer";
import { generateSchemaForORM } from "./table-generators";
import type { ResolvedPaths } from "../paths";
import type { TableDefinition } from "../templates/table-definitions";

interface GenerateOptions {
  paths: ResolvedPaths;
  database: "postgresql" | "mysql" | "sqlite";
  selectedTables: TableDefinition[];
}

export async function generatePrismaSetup(
  options: GenerateOptions
): Promise<void> {
  const { paths, database, selectedTables } = options;

  // Generate Prisma schema
  const schemaContent = generateSchemaForORM(
    "prisma",
    selectedTables,
    database
  );

  // Prisma uses a different file structure
  const files = [
    {
      path: "prisma/schema.prisma",
      content: schemaContent,
    },
    {
      path: paths.clientFile,
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
