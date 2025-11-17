import { PrismaClient, Unit } from "@prisma/client";
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

  // ========================================
  // 2. CREATE TEST LOCATIONS
  // ========================================
  console.log("📍 Creating test locations...");

  const mainKitchen = await prisma.location.upsert({
    where: { code: "MAIN-KIT" },
    update: {},
    create: {
      code: "MAIN-KIT",
      name: "Main Kitchen",
      type: "KITCHEN",
      address: "Building A, Floor 2, Riyadh",
      manager_id: adminUser.id,
      timezone: "Asia/Riyadh",
      is_active: true,
    },
  });

  const centralStore = await prisma.location.upsert({
    where: { code: "CENTRAL-01" },
    update: {},
    create: {
      code: "CENTRAL-01",
      name: "Central Store",
      type: "CENTRAL",
      address: "Building B, Ground Floor, Riyadh",
      manager_id: adminUser.id,
      timezone: "Asia/Riyadh",
      is_active: true,
    },
  });

  const warehouse = await prisma.location.upsert({
    where: { code: "WH-01" },
    update: {},
    create: {
      code: "WH-01",
      name: "Main Warehouse",
      type: "WAREHOUSE",
      address: "Industrial Area, Riyadh",
      manager_id: adminUser.id,
      timezone: "Asia/Riyadh",
      is_active: true,
    },
  });

  console.log(`✓ Created ${3} locations`);
  console.log(`  - ${mainKitchen.code}: ${mainKitchen.name}`);
  console.log(`  - ${centralStore.code}: ${centralStore.name}`);
  console.log(`  - ${warehouse.code}: ${warehouse.name}\n`);

  // Update admin user with default location
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { default_location_id: mainKitchen.id },
  });

  // Grant admin access to all locations
  await prisma.userLocation.createMany({
    data: [
      {
        user_id: adminUser.id,
        location_id: mainKitchen.id,
        access_level: "MANAGE",
      },
      {
        user_id: adminUser.id,
        location_id: centralStore.id,
        access_level: "MANAGE",
      },
      {
        user_id: adminUser.id,
        location_id: warehouse.id,
        access_level: "MANAGE",
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✓ Granted admin access to all locations\n`);

  // ========================================
  // 3. CREATE TEST SUPPLIER
  // ========================================
  console.log("🏢 Creating test supplier...");

  const supplier = await prisma.supplier.upsert({
    where: { code: "SUP-001" },
    update: {},
    create: {
      code: "SUP-001",
      name: "Al-Safi Danone Company",
      contact:
        "Phone: +966 11 234 5678\nEmail: orders@alsafi.com.sa\nContact Person: Ahmed Al-Mutairi",
      is_active: true,
    },
  });

  console.log(`✓ Supplier created: ${supplier.code} - ${supplier.name}\n`);

  // ========================================
  // 4. CREATE SAMPLE ITEMS
  // ========================================
  console.log("📦 Creating sample items...");

  const items: Array<{
    code: string;
    name: string;
    unit: Unit;
    category: string;
    sub_category: string;
  }> = [
    // Dairy & Eggs
    {
      code: "DAIRY-001",
      name: "Fresh Milk - Full Fat",
      unit: "LTR",
      category: "Dairy",
      sub_category: "Milk",
    },
    {
      code: "DAIRY-002",
      name: "Eggs - Large Grade A",
      unit: "EA",
      category: "Dairy",
      sub_category: "Eggs",
    },
    {
      code: "DAIRY-003",
      name: "Butter - Unsalted",
      unit: "KG",
      category: "Dairy",
      sub_category: "Butter",
    },
    {
      code: "DAIRY-004",
      name: "Cheese - Cheddar",
      unit: "KG",
      category: "Dairy",
      sub_category: "Cheese",
    },

    // Vegetables
    {
      code: "VEG-001",
      name: "Tomatoes - Fresh",
      unit: "KG",
      category: "Vegetables",
      sub_category: "Fresh Vegetables",
    },
    {
      code: "VEG-002",
      name: "Onions - Yellow",
      unit: "KG",
      category: "Vegetables",
      sub_category: "Fresh Vegetables",
    },
    {
      code: "VEG-003",
      name: "Potatoes - White",
      unit: "KG",
      category: "Vegetables",
      sub_category: "Fresh Vegetables",
    },
    {
      code: "VEG-004",
      name: "Carrots - Fresh",
      unit: "KG",
      category: "Vegetables",
      sub_category: "Fresh Vegetables",
    },

    // Meat & Poultry
    {
      code: "MEAT-001",
      name: "Chicken Breast - Fresh",
      unit: "KG",
      category: "Meat & Poultry",
      sub_category: "Chicken",
    },
    {
      code: "MEAT-002",
      name: "Beef - Ground",
      unit: "KG",
      category: "Meat & Poultry",
      sub_category: "Beef",
    },
    {
      code: "MEAT-003",
      name: "Lamb - Shoulder",
      unit: "KG",
      category: "Meat & Poultry",
      sub_category: "Lamb",
    },

    // Dry Goods
    {
      code: "DRY-001",
      name: "Rice - Basmati",
      unit: "KG",
      category: "Dry Goods",
      sub_category: "Rice & Grains",
    },
    {
      code: "DRY-002",
      name: "Flour - All Purpose",
      unit: "KG",
      category: "Dry Goods",
      sub_category: "Baking",
    },
    {
      code: "DRY-003",
      name: "Sugar - White Granulated",
      unit: "KG",
      category: "Dry Goods",
      sub_category: "Baking",
    },
    {
      code: "DRY-004",
      name: "Olive Oil - Extra Virgin",
      unit: "LTR",
      category: "Dry Goods",
      sub_category: "Oils",
    },
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        name: item.name,
        unit: item.unit,
        category: item.category,
        sub_category: item.sub_category,
        is_active: true,
      },
    });
  }

  console.log(`✓ Created ${items.length} items`);
  items.forEach((item) => {
    console.log(`  - ${item.code}: ${item.name} (${item.unit})`);
  });

  // ========================================
  // 5. CREATE TEST PERIOD
  // ========================================
  console.log("\n📅 Creating test period...");

  // Get current date for period
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  // Create period for current month
  const startDate = new Date(currentYear, currentMonth, 1); // First day of month
  const endDate = new Date(currentYear, currentMonth + 1, 0); // Last day of month

  const periodName = `${startDate.toLocaleString("en-US", {
    month: "long",
  })} ${currentYear}`;

  // Check if period already exists
  let testPeriod = await prisma.period.findFirst({
    where: {
      name: periodName,
    },
  });

  // Create if doesn't exist
  if (!testPeriod) {
    testPeriod = await prisma.period.create({
      data: {
        name: periodName,
        start_date: startDate,
        end_date: endDate,
        status: "OPEN",
      },
    });
    console.log(`✓ Period created: ${testPeriod.name} (${testPeriod.status})`);
  } else {
    console.log(
      `✓ Period already exists: ${testPeriod.name} (${testPeriod.status})`
    );
  }

  console.log(`  Start: ${testPeriod.start_date.toLocaleDateString()}`);
  console.log(`  End: ${testPeriod.end_date.toLocaleDateString()}`);

  // Create period locations for all locations
  await prisma.periodLocation.createMany({
    data: [
      {
        period_id: testPeriod.id,
        location_id: mainKitchen.id,
        status: "OPEN",
        opening_value: 0,
      },
      {
        period_id: testPeriod.id,
        location_id: centralStore.id,
        status: "OPEN",
        opening_value: 0,
      },
      {
        period_id: testPeriod.id,
        location_id: warehouse.id,
        status: "OPEN",
        opening_value: 0,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✓ Created period locations for all locations\n`);

  // ========================================
  // 6. CREATE SAMPLE LOCATION STOCK
  // ========================================
  console.log("📊 Creating sample location stock...");

  // Get all created items
  const allItems = await prisma.item.findMany({
    where: { is_active: true },
  });

  // Create stock for main kitchen with sample WAC values
  const stockData = allItems.map((item) => ({
    location_id: mainKitchen.id,
    item_id: item.id,
    on_hand: 100.0, // Sample quantity
    wac: 10.0, // Sample WAC
    min_stock: 20.0,
    max_stock: 200.0,
  }));

  for (const stock of stockData) {
    await prisma.locationStock.upsert({
      where: {
        location_id_item_id: {
          location_id: stock.location_id,
          item_id: stock.item_id,
        },
      },
      update: {},
      create: stock,
    });
  }

  console.log(
    `✓ Created stock for ${stockData.length} items in ${mainKitchen.name}\n`
  );

  // ========================================
  // 7. CREATE PERIOD PRICES
  // ========================================
  console.log("💰 Creating period prices...");

  // Create period prices for all items
  const priceData = allItems.map((item) => ({
    period_id: testPeriod.id,
    item_id: item.id,
    price: 10.0, // Standard price for testing (will create variance when delivery uses different price)
    set_by: adminUser.id,
  }));

  for (const price of priceData) {
    await prisma.itemPrice.upsert({
      where: {
        item_id_period_id: {
          item_id: price.item_id,
          period_id: price.period_id,
        },
      },
      update: {},
      create: price,
    });
  }

  console.log(
    `✓ Created period prices for ${priceData.length} items in ${testPeriod.name}\n`
  );

  console.log("\n✅ Database seed completed successfully!\n");
  console.log("📝 Summary:");
  console.log("─".repeat(50));
  console.log(`  • 1 Admin user (admin@foodstock.local)`);
  console.log(`  • 3 Locations (Kitchen, Central Store, Warehouse)`);
  console.log(`  • 1 Supplier (Al-Safi Danone)`);
  console.log(`  • ${items.length} Items (across 4 categories)`);
  console.log(`  • 1 Period (${testPeriod.name} - OPEN)`);
  console.log(`  • ${stockData.length} Stock records (Main Kitchen)`);
  console.log(`  • ${priceData.length} Period prices (SAR 10.00 each)`);
  console.log("─".repeat(50));
  console.log("\n🔐 Login Credentials:");
  console.log("  Email: admin@foodstock.local");
  console.log("  Username: admin");
  console.log("  Password: Admin@123\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed with error:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
