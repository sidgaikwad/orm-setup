export function generateSchema(
  database: "postgresql" | "mysql" | "sqlite",
  includeExamples: boolean
): string {
  const dbImport =
    database === "postgresql"
      ? "pg-core"
      : database === "mysql"
      ? "mysql-core"
      : "sqlite-core";

  const tableFunc =
    database === "postgresql"
      ? "pgTable"
      : database === "mysql"
      ? "mysqlTable"
      : "sqliteTable";

  const imports = `import { ${tableFunc}, text, timestamp, integer } from 'drizzle-orm/${dbImport}'`;

  if (!includeExamples) {
    return `${imports}

// Define your schema here
// Example:
// export const users = ${tableFunc}('users', {
//   id: integer('id').primaryKey(),
//   email: text('email').notNull().unique(),
// })
`;
  }

  // Generate example User table
  const idType =
    database === "sqlite"
      ? "integer('id').primaryKey()"
      : "text('id').primaryKey().$defaultFn(() => crypto.randomUUID())";

  return `${imports}

export const users = ${tableFunc}('users', {
  id: ${idType},
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
`;
}
