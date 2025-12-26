import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create sample user
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
    },
  });

  console.log("✅ Created user:", user.email);

  // If you have the full schema with Post and Comment:
  // const post = await prisma.post.create({
  //   data: {
  //     title: 'Hello World',
  //     content: 'This is my first post!',
  //     published: true,
  //     authorId: user.id,
  //   },
  // })
  // console.log('✅ Created post:', post.title)

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
