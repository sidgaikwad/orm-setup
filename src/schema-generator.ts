export type SchemaType = "full" | "minimal" | "none";
export type OrmType = "prisma" | "drizzle";

/**
 * Generate Prisma schema
 */
export function generatePrismaSchema(
  database: "postgresql" | "mysql" | "sqlite",
  schemaType: SchemaType
): string {
  const provider =
    database === "postgresql"
      ? "postgresql"
      : database === "mysql"
      ? "mysql"
      : "sqlite";

  let schema = `// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

`;

  if (schemaType === "minimal") {
    schema += generatePrismaMinimalSchema();
  } else if (schemaType === "full") {
    schema += generatePrismaFullSchema();
  }

  return schema;
}

function generatePrismaMinimalSchema(): string {
  return `model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
`;
}

function generatePrismaFullSchema(): string {
  return `model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("users")
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String?   @db.Text
  published Boolean   @default(false)
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([authorId])
  @@map("posts")
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId])
  @@index([authorId])
  @@map("comments")
}
`;
}

/**
 * Generate Drizzle schema
 */
export function generateDrizzleSchema(
  database: "postgresql" | "mysql" | "sqlite",
  schemaType: SchemaType
): string {
  if (database === "postgresql") {
    return generateDrizzlePostgresSchema(schemaType);
  } else if (database === "mysql") {
    return generateDrizzleMysqlSchema(schemaType);
  } else {
    return generateDrizzleSqliteSchema(schemaType);
  }
}

function generateDrizzlePostgresSchema(schemaType: SchemaType): string {
  let schema = `import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

`;

  if (schemaType === "minimal") {
    schema += `export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
`;
  } else if (schemaType === "full") {
    schema += `export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}))
`;
  }

  return schema;
}

function generateDrizzleMysqlSchema(schemaType: SchemaType): string {
  let schema = `import { mysqlTable, varchar, timestamp, boolean } from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'

`;

  if (schemaType === "minimal") {
    schema += `export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
`;
  }

  return schema;
}

function generateDrizzleSqliteSchema(schemaType: SchemaType): string {
  let schema = `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

`;

  if (schemaType === "minimal") {
    schema += `export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
`;
  }

  return schema;
}
