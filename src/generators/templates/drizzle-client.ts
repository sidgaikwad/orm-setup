export function generateClient(
  database: "postgresql" | "mysql" | "sqlite",
  schemaPath: string
): string {
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
