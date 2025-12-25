# 🗄️ ORM Setup CLI

> Interactive CLI for setting up ORMs (Prisma, Drizzle) with best practices and starter schemas

[![npm version](https://badge.fury.io/js/%40sidgaikwad%2Form-setup.svg)](https://www.npmjs.com/package/@sidgaikwad/orm-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Two Popular ORMs**: Prisma and Drizzle support
- 🎨 **Starter Schemas**: Full (User, Post, Comment) or Minimal (User only)
- 🧠 **Smart Detection**: Auto-detects framework, database, and package manager
- 📁 **Framework-Specific**: Proper file paths for Next.js, Remix, SvelteKit, etc.
- 🔧 **Best Practices**: Client singletons, type safety, migration scripts
- 💾 **Seed Data**: Optional seed scripts with sample data
- ⚙️ **Auto-Configure**: Adds all necessary scripts to package.json
- 🚀 **Ready to Code**: From setup to first query in 2 minutes

## 🚀 Quick Start

### Prerequisites

You should have already set up your database. If not, run:

```bash
bunx @sidgaikwad/db-setup
```

### Run ORM Setup

```bash
# With Bun (recommended)
bunx @sidgaikwad/orm-setup

# With npm
npx @sidgaikwad/orm-setup
```

## 🎯 What It Does

### 1. Detects Your Setup

```
✓ Framework: Next.js 15
✓ Database: PostgreSQL
✓ Package Manager: Bun
✓ TypeScript: Yes
✓ No existing ORM detected
```

### 2. Lets You Choose

- **ORM**: Prisma or Drizzle
- **Schema**: Full, Minimal, or None
- **Seed Data**: Yes or No

### 3. Generates Everything

- Schema files with models
- Database client with best practices
- Migration scripts
- Seed data (optional)
- package.json scripts

### 4. Ready to Code

```typescript
import { prisma } from "@/lib/db";
// or
import { db } from "@/db";

// Start querying!
const users = await prisma.user.findMany();
```

## 📚 Supported Configurations

### ORMs

- ✅ **Prisma** - Most popular, excellent DX, auto-generated client
- ✅ **Drizzle** - TypeScript-first, lightweight, edge-ready

### Databases

- ✅ PostgreSQL
- ✅ MySQL
- ✅ SQLite

### Frameworks

- ✅ Next.js (App Router & Pages Router)
- ✅ Remix
- ✅ SvelteKit
- ✅ Astro
- ✅ Express
- ✅ Any Node.js/Bun project

### Package Managers

- ✅ Bun
- ✅ npm
- ✅ pnpm
- ✅ yarn

## 🎨 Schema Options

### Minimal Schema (User Model Only)

Perfect for getting started:

```typescript
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Full Schema (User, Post, Comment)

Complete with relations:

```typescript
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String?
  published Boolean   @default(false)
  author    User      @relation(...)
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  post      Post     @relation(...)
  author    User     @relation(...)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔧 Generated Files

### For Prisma

```
project/
├── prisma/
│   ├── schema.prisma     # Your data model
│   └── seed.ts          # Seed data (optional)
├── lib/
│   └── db.ts            # Prisma client singleton
└── package.json         # Updated with scripts
```

### For Drizzle

```
project/
├── src/db/
│   ├── schema.ts        # Your data model
│   ├── index.ts         # Drizzle client
│   └── migrate.ts       # Migration runner
├── drizzle/
│   └── migrations/      # Generated migrations
├── drizzle.config.ts    # Drizzle config
└── package.json         # Updated with scripts
```

## 📝 Scripts Added to package.json

### Prisma Scripts

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed"
  }
}
```

### Drizzle Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "bun src/db/migrate.ts",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

## 💡 Usage Examples

### Complete Workflow

```bash
# 1. Setup database
bunx @sidgaikwad/db-setup
# Choose: Neon, US East

# 2. Setup ORM
bunx @sidgaikwad/orm-setup
# Choose: Prisma, Full schema, With seed

# 3. Run migration
bun db:migrate

# 4. Seed data (optional)
bun db:seed

# 5. Start coding!
```

### In Your Code (Prisma)

```typescript
// app/page.tsx
import { prisma } from "@/lib/db";

export default async function Home() {
  const users = await prisma.user.findMany({
    include: {
      posts: true,
    },
  });

  return <div>{/* Render users */}</div>;
}
```

### In Your Code (Drizzle)

```typescript
// app/page.tsx
import { db } from "@/db";
import { users } from "@/db/schema";

export default async function Home() {
  const allUsers = await db.select().from(users);

  return <div>{/* Render users */}</div>;
}
```

## 🛠️ Requirements

- Node.js >= 18.0.0 OR Bun >= 1.0.0
- TypeScript project (tsconfig.json required)
- DATABASE_URL in .env file

## 🤔 FAQ

### Q: Do I need to install the ORM manually?

**A:** No! The CLI installs all necessary dependencies.

### Q: Can I customize the generated schema?

**A:** Yes! After generation, edit the schema files and run migrations.

### Q: What if I already have an ORM installed?

**A:** The CLI will detect it and ask before overwriting.

### Q: Can I switch between ORMs later?

**A:** Yes, though you'll need to manually migrate your data.

### Q: Does this work with existing projects?

**A:** Yes! Just make sure you have a DATABASE_URL in your .env

## 🔗 Works Great With

- [@sidgaikwad/db-setup](https://www.npmjs.com/package/@sidgaikwad/db-setup) - Database provider setup
- [@sidgaikwad/auth-setup](https://www.npmjs.com/package/@sidgaikwad/auth-setup) - Authentication setup (coming soon)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT © [Siddharth Gaikwad](https://github.com/sidgaikwad)

## 🙏 Acknowledgments

- [Prisma](https://www.prisma.io) - Amazing ORM and developer experience
- [Drizzle](https://orm.drizzle.team) - TypeScript-first ORM
- [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI prompts

## 🐛 Issues & Support

- 🐛 [Report an issue](https://github.com/sidgaikwad/orm-setup/issues)
- 💬 [Discussions](https://github.com/sidgaikwad/orm-setup/discussions)

---

Made with ❤️ by [Siddharth Gaikwad](https://github.com/sidgaikwad)
