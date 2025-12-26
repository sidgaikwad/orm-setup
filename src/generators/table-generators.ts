// src/generators/table-generators.ts
// Generates table definitions for any ORM from universal TableDefinition

import type { TableDefinition, Field } from "../templates/table-definitions";

type Database = "postgresql" | "mysql" | "sqlite";
type ORM = "drizzle" | "prisma" | "kysely";

// ============================================
// DRIZZLE GENERATOR
// ============================================

export function generateDrizzleTables(
  tables: TableDefinition[],
  database: Database
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

  // Collect all field types we need to import
  const fieldTypes = new Set<string>(["text", "timestamp"]);
  tables.forEach((table) => {
    table.fields.forEach((field) => {
      const drizzleType = getDrizzleFieldType(field);
      fieldTypes.add(drizzleType.split("(")[0]); // Get base type
    });
  });

  const imports = `import { ${tableFunc}, ${Array.from(fieldTypes).join(
    ", "
  )} } from 'drizzle-orm/${dbImport}'`;

  const tableDefinitions = tables
    .map((table) => {
      const fields = table.fields
        .map((field) => {
          return `  ${field.name}: ${generateDrizzleField(field, database)},`;
        })
        .join("\n");

      return `export const ${table.name} = ${tableFunc}('${table.name}', {
${fields}
})`;
    })
    .join("\n\n");

  // Add relations if any table has them
  const hasRelations = tables.some(
    (t) => t.relations && t.relations.length > 0
  );
  let relationsCode = "";

  if (hasRelations) {
    relationsCode = "\n\nimport { relations } from 'drizzle-orm'\n\n";
    relationsCode += tables
      .filter((t) => t.relations && t.relations.length > 0)
      .map((table) => {
        const relationDefs = table
          .relations!.map((rel) => {
            if (rel.type === "one-to-many") {
              return `    ${rel.fieldName}: many(${rel.toTable}),`;
            } else if (rel.type === "many-to-one") {
              return `    ${rel.fieldName}: one(${rel.toTable}, {
      fields: [${table.name}.${rel.fieldName}Id],
      references: [${rel.toTable}.id],
    }),`;
            }
            return "";
          })
          .join("\n");

        return `export const ${table.name}Relations = relations(${table.name}, ({ one, many }) => ({
${relationDefs}
}))`;
      })
      .join("\n\n");
  }

  return `${imports}\n\n${tableDefinitions}${relationsCode}`;
}

function getDrizzleFieldType(field: Field): string {
  switch (field.type) {
    case "uuid":
      return "text";
    case "string":
      return "text";
    case "text":
      return "text";
    case "number":
      return "integer";
    case "boolean":
      return "boolean";
    case "date":
      return "timestamp";
    case "json":
      return "json";
    default:
      return "text";
  }
}

function generateDrizzleField(field: Field, database: Database): string {
  let code = getDrizzleFieldType(field);
  code += `('${field.name}'`;

  if (field.length) {
    code += `, { length: ${field.length} }`;
  }

  code += ")";

  if (field.isPrimaryKey) {
    code += ".primaryKey()";
  }

  if (field.required && !field.isPrimaryKey) {
    code += ".notNull()";
  }

  if (field.unique) {
    code += ".unique()";
  }

  if (field.default !== undefined) {
    if (field.default === "now") {
      code += ".defaultNow()";
    } else if (typeof field.default === "string") {
      code += `.default('${field.default}')`;
    } else {
      code += `.default(${field.default})`;
    }
  }

  if (field.isPrimaryKey && field.type === "uuid") {
    code += ".$defaultFn(() => crypto.randomUUID())";
  }

  if (field.references) {
    code += `.references(() => ${field.references.table}.${field.references.field}`;
    if (field.references.onDelete) {
      code += `, { onDelete: '${field.references.onDelete}' }`;
    }
    code += ")";
  }

  return code;
}

// ============================================
// PRISMA GENERATOR
// ============================================

export function generatePrismaTables(
  tables: TableDefinition[],
  database: Database
): string {
  const datasource = `datasource db {
  provider = "${
    database === "postgresql"
      ? "postgresql"
      : database === "mysql"
      ? "mysql"
      : "sqlite"
  }"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;

  const models = tables
    .map((table) => {
      const fields = table.fields
        .map((field) => {
          return `  ${generatePrismaField(field)}`;
        })
        .join("\n");

      // Add indexes for foreign keys
      const indexes = table.fields
        .filter((f) => f.references)
        .map((f) => `  @@index([${f.name}])`)
        .join("\n");

      return `model ${capitalize(table.displayName)} {
${fields}
${indexes ? "\n" + indexes : ""}
}`;
    })
    .join("\n\n");

  return `${datasource}\n${models}`;
}

function generatePrismaField(field: Field): string {
  let code = field.name;

  // Type
  code += "  ";
  const prismaType = getPrismaType(field);
  code += prismaType;

  // Optional/required
  if (!field.required && !field.isPrimaryKey) {
    code += "?";
  }

  // Attributes
  const attrs: string[] = [];

  if (field.isPrimaryKey) {
    if (field.type === "uuid") {
      attrs.push("@id @default(uuid())");
    } else if (field.isAutoIncrement) {
      attrs.push("@id @default(autoincrement())");
    } else {
      attrs.push("@id");
    }
  }

  if (field.unique && !field.isPrimaryKey) {
    attrs.push("@unique");
  }

  if (field.default !== undefined && !field.isPrimaryKey) {
    if (field.default === "now") {
      attrs.push("@default(now())");
    } else if (typeof field.default === "string") {
      attrs.push(`@default("${field.default}")`);
    } else if (typeof field.default === "boolean") {
      attrs.push(`@default(${field.default})`);
    } else {
      attrs.push(`@default(${field.default})`);
    }
  }

  if (field.references) {
    attrs.push(
      `@relation(fields: [${field.name}], references: [${field.references.field}]`
    );
    if (field.references.onDelete) {
      attrs.push(`, onDelete: ${capitalize(field.references.onDelete)}`);
    }
    attrs.push(")");
  }

  if (attrs.length > 0) {
    code += " " + attrs.join(" ");
  }

  return code;
}

function getPrismaType(field: Field): string {
  switch (field.type) {
    case "uuid":
      return "String";
    case "string":
      return "String";
    case "text":
      return "String";
    case "number":
      return "Int";
    case "boolean":
      return "Boolean";
    case "date":
      return "DateTime";
    case "json":
      return "Json";
    default:
      return "String";
  }
}

// ============================================
// KYSELY GENERATOR
// ============================================

export function generateKyselyTables(
  tables: TableDefinition[],
  database: Database
): string {
  const imports = `import { Generated, Insertable, Selectable, Updateable } from 'kysely'`;

  const interfaces = tables
    .map((table) => {
      const fields = table.fields
        .map((field) => {
          let type = getKyselyType(field);

          if (field.isPrimaryKey && field.isAutoIncrement) {
            type = `Generated<${type}>`;
          }

          if (!field.required && !field.isPrimaryKey) {
            type += " | null";
          }

          return `  ${field.name}: ${type}`;
        })
        .join("\n");

      const tableName = capitalize(table.displayName);

      return `export interface ${tableName}Table {
${fields}
}

export type ${tableName} = Selectable<${tableName}Table>
export type New${tableName} = Insertable<${tableName}Table>
export type ${tableName}Update = Updateable<${tableName}Table>`;
    })
    .join("\n\n");

  // Database interface
  const dbInterface = `export interface Database {
${tables
  .map((t) => `  ${t.name}: ${capitalize(t.displayName)}Table`)
  .join("\n")}
}`;

  return `${imports}\n\n${interfaces}\n\n${dbInterface}`;
}

function getKyselyType(field: Field): string {
  switch (field.type) {
    case "uuid":
      return "string";
    case "string":
      return "string";
    case "text":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "Date";
    case "json":
      return "unknown";
    default:
      return "string";
  }
}

// ============================================
// HELPERS
// ============================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Main export - generates schema for any ORM
export function generateSchemaForORM(
  orm: ORM,
  tables: TableDefinition[],
  database: Database
): string {
  switch (orm) {
    case "drizzle":
      return generateDrizzleTables(tables, database);
    case "prisma":
      return generatePrismaTables(tables, database);
    case "kysely":
      return generateKyselyTables(tables, database);
    default:
      throw new Error(`Unsupported ORM: ${orm}`);
  }
}
