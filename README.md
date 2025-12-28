# 🔐 @sidgaikwad/auth-setup

> Production-ready Better Auth setup in 2 minutes

[![npm version](https://badge.fury.io/js/%40sidgaikwad%2Fauth-setup.svg)](https://www.npmjs.com/package/@sidgaikwad/auth-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Better Auth Integration** - Modern, type-safe authentication
- 🔐 **Multiple Auth Methods** - Email/Password, Google OAuth, GitHub OAuth
- 🗄️ **ORM Integration** - Works with Drizzle, Prisma, or standalone
- 🎨 **UI Components** - Pre-built Sign In, Sign Up, and User Button
- 🛡️ **Route Protection** - Middleware for protected routes
- ⚡ **Framework Agnostic** - Works with Next.js, Remix, and more
- 📦 **Zero Config** - Smart defaults, works out of the box

## 🚀 Quick Start

```bash
# Using bunx (recommended)
bunx @sidgaikwad/auth-setup

# Using npx
npx @sidgaikwad/auth-setup
```

Answer a few questions and you're done! 🎉

## 📦 What Gets Generated

```
your-project/
├── lib/
│   └── auth.ts                 # Better Auth configuration
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts    # Auth API endpoints
│   └── components/
│       ├── sign-in.tsx         # Sign in form
│       ├── sign-up.tsx         # Sign up form
│       └── user-button.tsx     # User menu
├── middleware.ts               # Route protection
├── .env.example                # Required environment variables
└── db/
    └── schema.ts               # Auth tables (if ORM detected)
```

## 🎯 Usage

### 1. Run the CLI

```bash
bunx @sidgaikwad/auth-setup
```

### 2. Choose your authentication methods

```
◇ Select authentication methods
│ ◉ Email + Password
│ ◉ Google OAuth
│ ◯ GitHub OAuth

◇ Generate UI components?
│ Yes

◇ Generate middleware for route protection?
│ Yes
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Generate a secret
openssl rand -base64 32

# Add to .env
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Get OAuth credentials (if needed)

**Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

**GitHub OAuth:**

1. Go to [GitHub Settings > Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Add callback URL: `http://localhost:3000/api/auth/callback/github`

### 5. Run migrations (if using ORM)

```bash
# For Drizzle
bun db:generate
bun db:migrate

# For Prisma
bun db:generate
bun db:migrate
```

### 6. Use in your app!

```tsx
// In a Server Component
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth.api.getSession({ headers: headers() });

  return <div>Welcome {session?.user?.name}</div>;
}

// In a Client Component
import { SignIn } from "@/components/sign-in";

export default function SignInPage() {
  return <SignIn />;
}

// Protected route (middleware handles this)
// Just create files in /dashboard, /profile, etc.
```

## 🎨 Generated Components

### Sign In Component

```tsx
import { SignIn } from "@/components/sign-in";

export default function SignInPage() {
  return <SignIn />;
}
```

### Sign Up Component

```tsx
import { SignUp } from "@/components/sign-up";

export default function SignUpPage() {
  return <SignUp />;
}
```

### User Button

```tsx
import { UserButton } from "@/components/user-button";

export default function Navbar() {
  return (
    <nav>
      <UserButton />
    </nav>
  );
}
```

## 🔧 Configuration

The generated `lib/auth.ts` can be customized:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Add this
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  // Add more configuration here
});
```

## 🛡️ Route Protection

The generated middleware protects specified routes:

```typescript
// middleware.ts
export const config = {
  matcher: [
    "/dashboard/:path*", // Protected
    "/profile/:path*", // Protected
    "/settings/:path*", // Protected
  ],
};
```

Add more routes as needed!

## 🤝 Integration with @sidgaikwad/orm-setup

If you've already run `@sidgaikwad/orm-setup`, this tool will:

- ✅ Detect your ORM (Drizzle or Prisma)
- ✅ Detect your database type
- ✅ Add auth tables to your existing schema
- ✅ Use your existing database client

No conflicts, everything just works! 🎉

## 📚 Examples

### Check if user is authenticated

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: headers(),
});

if (!session) {
  redirect("/sign-in");
}
```

### Get current user

```typescript
const session = await auth.api.getSession({
  headers: headers(),
});

const user = session?.user;
console.log(user?.email, user?.name);
```

### Sign out

```typescript
"use client";

import { auth } from "@/lib/auth";

async function handleSignOut() {
  await auth.signOut();
  router.push("/");
}
```

## 🐛 Troubleshooting

### "Database connection failed"

Make sure `DATABASE_URL` is set in your `.env` file.

### "OAuth redirect URI mismatch"

Check that your OAuth redirect URIs match:

- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

### "Session not found"

Make sure you've run migrations to create the auth tables.

## 🗺️ Roadmap

### v1.0 (Current)

- ✅ Better Auth integration
- ✅ Email + Password
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ UI components

### v1.1 (Coming soon)

- [ ] Magic links
- [ ] Email verification UI
- [ ] Password reset flow
- [ ] More OAuth providers

### v2.0 (Future)

- [ ] Clerk integration
- [ ] Lucia integration
- [ ] NextAuth.js integration
- [ ] Provider comparison guide

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

## 📄 License

MIT © Siddharth Gaikwad

---

## 🔗 Links

- [Better Auth Documentation](https://better-auth.com/docs)
- [GitHub Repository](https://github.com/sidgaikwad/auth-setup)
- [npm Package](https://www.npmjs.com/package/@sidgaikwad/auth-setup)
- [Report Issues](https://github.com/sidgaikwad/auth-setup/issues)

---

## 💬 Feedback

Have feedback or suggestions? [Open an issue](https://github.com/sidgaikwad/auth-setup/issues) or reach out on Twitter [@sidgaikwad](https://twitter.com/sidgaikwad)

---

Made with ❤️ by [Siddharth Gaikwad](https://github.com/sidgaikwad)

---

# 🚀 LAUNCH CHECKLIST

## Before Publishing

- [ ] All source files created
- [ ] Build succeeds (`bun run build`)
- [ ] Tested in Next.js project with Drizzle
- [ ] Tested in Next.js project with Prisma
- [ ] Tested in fresh Next.js project (no ORM)
- [ ] Tested email + password auth
- [ ] Tested Google OAuth
- [ ] Tested GitHub OAuth
- [ ] README complete with screenshots
- [ ] .env.example is clear
- [ ] Error handling works
- [ ] Package.json is correct

## Launch Day

1. **Publish to npm**

```bash
npm login
npm publish --access public
```

2. **Create GitHub Release**

```bash
git tag v1.0.0
git push origin v1.0.0
```

3. **Tweet Thread** (use the one I created earlier)

4. **Reddit Posts**

- r/webdev - "I built a CLI for Better Auth setup"
- r/nextjs - "Better Auth setup for Next.js in 2 minutes"
- r/typescript - "Type-safe authentication setup CLI"

5. **Dev.to Article**
   Title: "Setting up Better Auth in 2 minutes with a CLI"

6. **LinkedIn Post** (use the one I created earlier)

## Post-Launch

- [ ] Monitor npm downloads
- [ ] Respond to issues within 24 hours
- [ ] Collect feedback
- [ ] Plan v1.1 features
- [ ] Update docs based on questions

---

# 📊 Success Metrics

## Week 1 Goals

- [ ] 100 downloads
- [ ] 10 GitHub stars
- [ ] 0 critical bugs
- [ ] 3+ positive feedback

## Month 1 Goals

- [ ] 1,000 downloads
- [ ] 50 GitHub stars
- [ ] 10 GitHub issues/PRs
- [ ] Featured in 1 newsletter

---

You now have EVERYTHING you need to build and launch! 🚀

Next steps:

1. Create the repo
2. Copy all the code
3. Build and test
4. Publish!

Want me to help with any specific part?
