export function generateConfig(
  database: "postgresql" | "mysql" | "sqlite",
  schemaPath: string,
  migrationsDir: string
): string {
  const dialect =
    database === "postgresql"
      ? "postgresql"
      : database === "mysql"
      ? "mysql"
      : "sqlite";

  return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './${schemaPath}',
  out: './${migrationsDir}',
  dialect: '${dialect}',
  dbCredentials: {
    ${database === "sqlite" ? "url" : "url"}: process.env.DATABASE_URL!,
  },
})
`;
}
