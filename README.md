# @sidgaikwad/orm-setup

Framework-agnostic CLI for setting up Drizzle, Prisma, or Kysely ORM with best practices.

## Features

- 🎯 **Multi-ORM Support** - Choose between Drizzle, Prisma, or Kysely
- 🗄️ **Multi-Database** - PostgreSQL, MySQL, or SQLite
- 🚀 **Zero Config** - Smart defaults, works everywhere
- 📦 **Batteries Included** - Client, migrations, and scripts
- ⚡ **Fast** - Built with Bun

## Quick Start

```bash
# Using bunx (recommended)
bunx @sidgaikwad/orm-setup

# Using npx
npx @sidgaikwad/orm-setup
```

## What It Does

1. Detects your project structure (TypeScript, package manager, folders)
2. Asks what ORM and database you want
3. Installs dependencies
4. Generates schema, client, and config files
5. Adds helpful scripts to package.json

## Generated Files

**For Drizzle:**
src/lib/db.ts # Database client
src/lib/db/schema.ts # Schema definition
src/lib/db/migrate.ts # Migration runner
drizzle.config.ts # Drizzle config

**For Prisma:**
prisma/schema.prisma # Schema definition
src/lib/prisma.ts # Prisma client

**For Kysely:**
src/lib/db.ts # Kysely client
src/lib/db/schema.ts # TypeScript types
src/lib/db/migrate.ts # Migration runner

## Usage

After running the CLI:

```bash
# Add your database URL
echo "DATABASE_URL=your-connection-string" > .env

# For Drizzle/Kysely
bun db:generate  # Generate migrations
bun db:migrate   # Apply migrations
bun db:studio    # Open DB GUI (Drizzle only)

# For Prisma
bun db:generate  # Generate Prisma Client
bun db:migrate   # Create & apply migration
bun db:studio    # Open Prisma Studio
```

## Requirements

- Node.js 18+ or Bun
- A database (PostgreSQL, MySQL, or SQLite)

## License

MIT © Siddharth Gaikwad
