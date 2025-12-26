// src/generators/templates.ts
// This file contains all template generators for Drizzle setup

type Database = "postgresql" | "mysql" | "sqlite";

// ============================================
// SCHEMA TEMPLATE
// ============================================
export function generateSchema(
  database: Database,
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
      ? "integer('id').primaryKey({ autoIncrement: true })"
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

// ============================================
// CLIENT TEMPLATE
// ============================================
export function generateClient(database: Database): string {
  if (database === "postgresql") {
    return `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const client = postgres(process.env.DATABASE_URL)
export const db = drizzle(client, { schema })
`;
  }

  if (database === "mysql") {
    return `import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const connection = await mysql.createConnection(process.env.DATABASE_URL)
export const db = drizzle(connection, { schema })
`;
  }

  // SQLite
  return `import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sqlite = new Database(process.env.DATABASE_URL)
export const db = drizzle(sqlite, { schema })
`;
}

// ============================================
// CONFIG TEMPLATE
// ============================================
export function generateConfig(
  database: Database,
  schemaPath: string,
  migrationsDir: string
): string {
  const dialect =
    database === "postgresql"
      ? "postgresql"
      : database === "mysql"
      ? "mysql"
      : "sqlite";

  const dbCredentials =
    database === "sqlite"
      ? `url: process.env.DATABASE_URL!`
      : `url: process.env.DATABASE_URL!`;

  return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './${schemaPath}',
  out: './${migrationsDir}',
  dialect: '${dialect}',
  dbCredentials: {
    ${dbCredentials},
  },
})
`;
}

// ============================================
// MIGRATE TEMPLATE
// ============================================
export function generateMigrate(database: Database): string {
  if (database === "postgresql") {
    return `import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connection = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(connection)

await migrate(db, { migrationsFolder: './drizzle/migrations' })
await connection.end()

console.log('✅ Migrations complete!')
`;
  }

  if (database === "mysql") {
    return `import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import mysql from 'mysql2/promise'

const connection = await mysql.createConnection(process.env.DATABASE_URL!)
const db = drizzle(connection)

await migrate(db, { migrationsFolder: './drizzle/migrations' })
await connection.end()

console.log('✅ Migrations complete!')
`;
  }

  return `import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'

const sqlite = new Database(process.env.DATABASE_URL!)
const db = drizzle(sqlite)

migrate(db, { migrationsFolder: './drizzle/migrations' })
sqlite.close()

console.log('✅ Migrations complete!')
`;
}
