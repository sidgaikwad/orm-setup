import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

async function main() {
  console.log("🚀 Running migrations...");

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "./drizzle/migrations" });

  console.log("✅ Migrations completed!");

  await sql.end();
}

main().catch((e) => {
  console.error("❌ Migration failed");
  console.error(e);
  process.exit(1);
});
