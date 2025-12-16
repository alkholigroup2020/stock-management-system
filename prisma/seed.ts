import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ========================================
  // 1. CREATE DEFAULT ADMIN USER
  // ========================================
  console.log("👤 Creating admin user...");

  const adminPassword = await hash("Admin@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@foodstock.local" },
    update: {},
    create: {
      username: "admin",
      email: "admin@foodstock.local",
      full_name: "System Administrator",
      role: "ADMIN",
      password_hash: adminPassword,
      is_active: true,
    },
  });

  console.log(`✓ Admin user created: ${adminUser.email}`);
  console.log(`  Username: admin`);
  console.log(`  Password: Admin@123\n`);
}

// Execute the main function and handle errors
main()
  .catch((e) => {
    console.error("\n❌ Seed failed with error:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
