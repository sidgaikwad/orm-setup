// src/templates/table-definitions.ts
// Universal table definitions that work across all ORMs

export interface Field {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "uuid" | "text" | "json";
  required?: boolean;
  unique?: boolean;
  default?: string | number | boolean;
  isPrimaryKey?: boolean;
  isAutoIncrement?: boolean;
  length?: number;
  references?: {
    table: string;
    field: string;
    onDelete?: "cascade" | "set null" | "restrict";
  };
}

export interface TableDefinition {
  name: string;
  displayName: string;
  fields: Field[];
  relations?: Array<{
    type: "one-to-many" | "many-to-one" | "many-to-many";
    toTable: string;
    fieldName: string;
  }>;
}

// ============================================
// CORE TABLES (Building Blocks)
// ============================================

export const userTable: TableDefinition = {
  name: "users",
  displayName: "User",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    {
      name: "email",
      type: "string",
      required: true,
      unique: true,
      length: 255,
    },
    { name: "name", type: "string", length: 255 },
    { name: "emailVerified", type: "date" },
    { name: "image", type: "string", length: 500 },
    { name: "createdAt", type: "date", default: "now" },
    { name: "updatedAt", type: "date", default: "now" },
  ],
};

export const postTable: TableDefinition = {
  name: "posts",
  displayName: "Post",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    { name: "title", type: "string", required: true, length: 255 },
    { name: "slug", type: "string", required: true, unique: true, length: 255 },
    { name: "content", type: "text" },
    { name: "excerpt", type: "string", length: 500 },
    { name: "published", type: "boolean", default: false },
    { name: "publishedAt", type: "date" },
    {
      name: "authorId",
      type: "uuid",
      required: true,
      references: { table: "users", field: "id", onDelete: "cascade" },
    },
    { name: "createdAt", type: "date", default: "now" },
    { name: "updatedAt", type: "date", default: "now" },
  ],
  relations: [
    { type: "many-to-one", toTable: "users", fieldName: "author" },
    { type: "one-to-many", toTable: "comments", fieldName: "comments" },
  ],
};

export const commentTable: TableDefinition = {
  name: "comments",
  displayName: "Comment",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    { name: "content", type: "text", required: true },
    {
      name: "postId",
      type: "uuid",
      required: true,
      references: { table: "posts", field: "id", onDelete: "cascade" },
    },
    {
      name: "authorId",
      type: "uuid",
      required: true,
      references: { table: "users", field: "id", onDelete: "cascade" },
    },
    {
      name: "parentId",
      type: "uuid",
      references: { table: "comments", field: "id", onDelete: "cascade" },
    },
    { name: "createdAt", type: "date", default: "now" },
    { name: "updatedAt", type: "date", default: "now" },
  ],
};

export const categoryTable: TableDefinition = {
  name: "categories",
  displayName: "Category",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    { name: "name", type: "string", required: true, unique: true, length: 100 },
    { name: "slug", type: "string", required: true, unique: true, length: 100 },
    { name: "description", type: "text" },
    { name: "createdAt", type: "date", default: "now" },
  ],
};

export const tagTable: TableDefinition = {
  name: "tags",
  displayName: "Tag",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    { name: "name", type: "string", required: true, unique: true, length: 50 },
    { name: "slug", type: "string", required: true, unique: true, length: 50 },
    { name: "createdAt", type: "date", default: "now" },
  ],
};

export const productTable: TableDefinition = {
  name: "products",
  displayName: "Product",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    { name: "name", type: "string", required: true, length: 255 },
    { name: "slug", type: "string", required: true, unique: true, length: 255 },
    { name: "description", type: "text" },
    { name: "price", type: "number", required: true },
    { name: "compareAtPrice", type: "number" },
    { name: "inventory", type: "number", default: 0 },
    { name: "images", type: "json" },
    { name: "published", type: "boolean", default: false },
    { name: "createdAt", type: "date", default: "now" },
    { name: "updatedAt", type: "date", default: "now" },
  ],
};

export const orderTable: TableDefinition = {
  name: "orders",
  displayName: "Order",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    {
      name: "orderNumber",
      type: "string",
      required: true,
      unique: true,
      length: 20,
    },
    {
      name: "userId",
      type: "uuid",
      required: true,
      references: { table: "users", field: "id" },
    },
    {
      name: "status",
      type: "string",
      required: true,
      default: "pending",
      length: 50,
    },
    { name: "total", type: "number", required: true },
    { name: "subtotal", type: "number", required: true },
    { name: "tax", type: "number", default: 0 },
    { name: "shipping", type: "number", default: 0 },
    { name: "shippingAddress", type: "json" },
    { name: "createdAt", type: "date", default: "now" },
    { name: "updatedAt", type: "date", default: "now" },
  ],
};

export const organizationTable: TableDefinition = {
  name: "organizations",
  displayName: "Organization",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    { name: "name", type: "string", required: true, length: 255 },
    { name: "slug", type: "string", required: true, unique: true, length: 255 },
    { name: "logo", type: "string", length: 500 },
    { name: "plan", type: "string", default: "free", length: 50 },
    { name: "createdAt", type: "date", default: "now" },
    { name: "updatedAt", type: "date", default: "now" },
  ],
};

export const subscriptionTable: TableDefinition = {
  name: "subscriptions",
  displayName: "Subscription",
  fields: [
    { name: "id", type: "uuid", isPrimaryKey: true },
    {
      name: "organizationId",
      type: "uuid",
      required: true,
      references: { table: "organizations", field: "id", onDelete: "cascade" },
    },
    { name: "plan", type: "string", required: true, length: 50 },
    {
      name: "status",
      type: "string",
      required: true,
      default: "active",
      length: 50,
    },
    { name: "currentPeriodStart", type: "date", required: true },
    { name: "currentPeriodEnd", type: "date", required: true },
    { name: "cancelAtPeriodEnd", type: "boolean", default: false },
    { name: "stripeSubscriptionId", type: "string", unique: true, length: 255 },
    { name: "createdAt", type: "date", default: "now" },
    { name: "updatedAt", type: "date", default: "now" },
  ],
};

// ============================================
// TEMPLATE BUNDLES
// ============================================

export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tables: TableDefinition[];
}

export const schemaTemplates: SchemaTemplate[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Just the basics - User table only",
    icon: "📦",
    tables: [userTable],
  },
  {
    id: "blog",
    name: "Blog",
    description: "User, Post, Comment, Category, Tag",
    icon: "🚀",
    tables: [userTable, postTable, commentTable, categoryTable, tagTable],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Products, Orders, Cart, Inventory",
    icon: "🛒",
    tables: [userTable, productTable, orderTable],
  },
  {
    id: "saas",
    name: "SaaS",
    description: "Multi-tenant with Organizations & Subscriptions",
    icon: "💼",
    tables: [userTable, organizationTable, subscriptionTable],
  },
  {
    id: "custom",
    name: "Custom",
    description: "Pick specific tables you need",
    icon: "🎯",
    tables: [], // User will select
  },
  {
    id: "empty",
    name: "Empty",
    description: "No tables, start from scratch",
    icon: "❌",
    tables: [],
  },
];

// ============================================
// ALL AVAILABLE TABLES (for custom selection)
// ============================================

export const allTables: TableDefinition[] = [
  userTable,
  postTable,
  commentTable,
  categoryTable,
  tagTable,
  productTable,
  orderTable,
  organizationTable,
  subscriptionTable,
];

// Helper to get table by name
export function getTableByName(name: string): TableDefinition | undefined {
  return allTables.find((t) => t.name === name);
}

// Helper to get tables with their dependencies
export function getTablesWithDependencies(
  tableNames: string[]
): TableDefinition[] {
  const result: TableDefinition[] = [];
  const added = new Set<string>();

  function addTable(name: string) {
    if (added.has(name)) return;

    const table = getTableByName(name);
    if (!table) return;

    // Add dependencies first
    table.fields.forEach((field) => {
      if (field.references && !added.has(field.references.table)) {
        addTable(field.references.table);
      }
    });

    result.push(table);
    added.add(name);
  }

  tableNames.forEach(addTable);
  return result;
}
