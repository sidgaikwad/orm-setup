// src/generators/templates/schemas.ts
// Pre-built schema templates

type Database = "postgresql" | "mysql" | "sqlite";
type Template = "empty" | "starter" | "blog" | "ecommerce" | "saas";

// ============================================
// DRIZZLE SCHEMAS
// ============================================

export function getDrizzleSchema(
  template: Template,
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

  const imports = `import { ${tableFunc}, text, timestamp, integer, boolean } from 'drizzle-orm/${dbImport}'`;

  if (template === "empty") {
    return `${imports}

// Define your schema here
// Example:
// export const users = ${tableFunc}('users', {
//   id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
//   email: text('email').notNull().unique(),
// })
`;
  }

  const idType =
    database === "sqlite"
      ? "integer('id').primaryKey({ autoIncrement: true })"
      : "text('id').primaryKey().$defaultFn(() => crypto.randomUUID())";

  // STARTER: Just User
  if (template === "starter") {
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

  // BLOG: User, Post, Comment, Category
  if (template === "blog") {
    return `${imports}

export const users = ${tableFunc}('users', {
  id: ${idType},
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const posts = ${tableFunc}('posts', {
  id: ${idType},
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content'),
  published: boolean('published').default(false),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const comments = ${tableFunc}('comments', {
  id: ${idType},
  content: text('content').notNull(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const categories = ${tableFunc}('categories', {
  id: ${idType},
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
`;
  }

  // ECOMMERCE: User, Product, Order
  if (template === "ecommerce") {
    return `${imports}
import { json } from 'drizzle-orm/${dbImport}'

export const users = ${tableFunc}('users', {
  id: ${idType},
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const products = ${tableFunc}('products', {
  id: ${idType},
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  price: integer('price').notNull(), // in cents
  inventory: integer('inventory').default(0),
  images: json('images'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orders = ${tableFunc}('orders', {
  id: ${idType},
  orderNumber: text('order_number').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'),
  total: integer('total').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
`;
  }

  // SAAS: User, Organization, Subscription
  if (template === "saas") {
    return `${imports}

export const users = ${tableFunc}('users', {
  id: ${idType},
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const organizations = ${tableFunc}('organizations', {
  id: ${idType},
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').default('free'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const memberships = ${tableFunc}('memberships', {
  id: ${idType},
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const subscriptions = ${tableFunc}('subscriptions', {
  id: ${idType},
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull(),
  status: text('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
`;
  }

  return imports;
}

// ============================================
// PRISMA SCHEMAS
// ============================================

export function getPrismaSchema(
  template: Template,
  database: Database
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

  if (template === "empty") {
    return `${baseSchema}
// Define your models here
// Example:
// model User {
//   id    String @id @default(uuid())
//   email String @unique
// }
`;
  }

  // STARTER
  if (template === "starter") {
    return `${baseSchema}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
  }

  // BLOG
  if (template === "blog") {
    return `${baseSchema}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Post {
  id        String    @id @default(uuid())
  title     String
  slug      String    @unique
  content   String?
  published Boolean   @default(false)
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([authorId])
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  createdAt DateTime @default(now())

  @@index([postId])
  @@index([authorId])
}

model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
}
`;
  }

  // ECOMMERCE
  if (template === "ecommerce") {
    return `${baseSchema}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  orders    Order[]
  createdAt DateTime @default(now())
}

model Product {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  price       Int
  inventory   Int      @default(0)
  images      Json?
  createdAt   DateTime @default(now())
}

model Order {
  id          String   @id @default(uuid())
  orderNumber String   @unique
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  status      String   @default("pending")
  total       Int
  createdAt   DateTime @default(now())

  @@index([userId])
}
`;
  }

  // SAAS
  if (template === "saas") {
    return `${baseSchema}

model User {
  id          String       @id @default(uuid())
  email       String       @unique
  name        String?
  memberships Membership[]
  createdAt   DateTime     @default(now())
}

model Organization {
  id            String         @id @default(uuid())
  name          String
  slug          String         @unique
  plan          String         @default("free")
  memberships   Membership[]
  subscriptions Subscription[]
  createdAt     DateTime       @default(now())
}

model Membership {
  id             String       @id @default(uuid())
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId         String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId String
  role           String       @default("member")
  createdAt      DateTime     @default(now())

  @@index([userId])
  @@index([organizationId])
}

model Subscription {
  id               String       @id @default(uuid())
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId   String
  plan             String
  status           String       @default("active")
  currentPeriodEnd DateTime
  createdAt        DateTime     @default(now())

  @@index([organizationId])
}
`;
  }

  return baseSchema;
}

// ============================================
// KYSELY SCHEMAS (TypeScript Interfaces)
// ============================================

export function getKyselySchema(template: Template): string {
  const imports = `import { Generated } from 'kysely'`;

  if (template === "empty") {
    return `${imports}

// Define your table interfaces here
// Example:
// export interface UsersTable {
//   id: Generated<string>
//   email: string
//   name: string | null
// }

export interface Database {
  // Add your tables here
}
`;
  }

  // STARTER
  if (template === "starter") {
    return `${imports}

export interface UsersTable {
  id: Generated<string>
  email: string
  name: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface Database {
  users: UsersTable
}
`;
  }

  // BLOG
  if (template === "blog") {
    return `${imports}

export interface UsersTable {
  id: Generated<string>
  email: string
  name: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface PostsTable {
  id: Generated<string>
  title: string
  slug: string
  content: string | null
  published: Generated<boolean>
  author_id: string
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface CommentsTable {
  id: Generated<string>
  content: string
  post_id: string
  author_id: string
  created_at: Generated<Date>
}

export interface CategoriesTable {
  id: Generated<string>
  name: string
  slug: string
  created_at: Generated<Date>
}

export interface Database {
  users: UsersTable
  posts: PostsTable
  comments: CommentsTable
  categories: CategoriesTable
}
`;
  }

  // Similar for ecommerce and saas...
  return `${imports}\n\nexport interface Database {}`;
}
