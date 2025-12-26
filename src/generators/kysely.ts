import { writeMultipleFiles } from "../file-writer";
import { getKyselySchema } from "./templates/schemas";
import type { ResolvedPaths } from "../paths";

interface GenerateOptions {
  paths: ResolvedPaths;
  database: "postgresql" | "mysql" | "sqlite";
  template: "empty" | "starter" | "blog" | "ecommerce" | "saas";
}

export async function generateKyselySetup(
  options: GenerateOptions
): Promise<void> {
  const { paths, database, template } = options;

  const files = [
    {
      path: paths.schemaFile,
      content: getKyselySchema(template),
    },
    {
      path: paths.clientFile,
      content: generateKyselyClient(database),
    },
    {
      path: paths.migrateFile,
      content: generateKyselyMigrator(database),
    },
  ];

  await writeMultipleFiles(files);
}

function generateKyselyClient(
  database: "postgresql" | "mysql" | "sqlite"
): string {
  if (database === "postgresql") {
    return `import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const dialect = new PostgresDialect({
  pool: new Pool({ connectionString: process.env.DATABASE_URL }),
})

export const db = new Kysely<Database>({ dialect })
`;
  }

  if (database === "mysql") {
    return `import { Kysely, MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'
import type { Database } from './db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const dialect = new MysqlDialect({
  pool: createPool(process.env.DATABASE_URL),
})

export const db = new Kysely<Database>({ dialect })
`;
  }

  return `import { Kysely, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'
import type { Database as DatabaseType } from './db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const dialect = new SqliteDialect({
  database: new Database(process.env.DATABASE_URL),
})

export const db = new Kysely<DatabaseType>({ dialect })
`;
}

function generateKyselyMigrator(database: string): string {
  return `import { promises as fs } from 'fs'
import { Migrator, FileMigrationProvider } from 'kysely'
import { db } from '../db'
import * as path from 'path'

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../../migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(\`✅ Migration "\${it.migrationName}" was executed successfully\`)
    } else if (it.status === 'Error') {
      console.error(\`❌ Failed to execute migration "\${it.migrationName}"\`)
    }
  })

  if (error) {
    console.error('❌ Failed to migrate')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest()
`;
}
