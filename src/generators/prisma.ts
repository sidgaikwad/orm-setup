// src/generators/prisma.ts
import { writeMultipleFiles } from "../file-writer";
import type { ResolvedPaths } from "../paths";

interface GenerateOptions {
  paths: ResolvedPaths;
  database: "postgresql" | "mysql" | "sqlite";
  includeExamples: boolean;
}

export async function generatePrismaSetup(
  options: GenerateOptions
): Promise<void> {
  const { paths, database, includeExamples } = options;

  const files = [
    {
      path: "prisma/schema.prisma",
      content: generatePrismaSchema(database, includeExamples),
    },
    {
      path: paths.clientFile.replace("/db.ts", "/prisma.ts"), // Use prisma.ts instead of db.ts
      content: generatePrismaClient(),
    },
  ];

  await writeMultipleFiles(files);
}

function generatePrismaSchema(
  database: "postgresql" | "mysql" | "sqlite",
  includeExamples: boolean
): string {
  const provider =
    database === "postgresql"
      ? "postgresql"
      : database === "mysql"
      ? "mysql"
      : "sqlite";

  const baseSchema = `datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;

  if (!includeExamples) {
    return `${baseSchema}
// Define your models here
// Example:
// model User {
//   id    String @id @default(uuid())
//   email String @unique
// }
`;
  }

  const userModel = `
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

  return `${baseSchema}${userModel}`;
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
