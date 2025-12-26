export function generateMigrate(
  database: "postgresql" | "mysql" | "sqlite"
): string {
  if (database === "postgresql") {
    return `import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connection = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(connection)

await migrate(db, { migrationsFolder: './drizzle/migrations' })
await connection.end()
console.log('Migrations complete!')
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
console.log('Migrations complete!')
`;
  }

  return `import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'

const sqlite = new Database(process.env.DATABASE_URL!)
const db = drizzle(sqlite)

migrate(db, { migrationsFolder: './drizzle/migrations' })
sqlite.close()
console.log('Migrations complete!')
`;
}
