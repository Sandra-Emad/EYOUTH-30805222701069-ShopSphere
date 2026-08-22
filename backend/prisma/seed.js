import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

async function main() {
  console.log("🌱 Starting database seed...");

  const adminPassword = await bcrypt.hash(
    "Admin@12345",
    12
  );

  const customerPassword = await bcrypt.hash(
    "Customer@12345",
    12
  );

  await prisma.user.upsert({
    where: {
      email: "admin@store.com",
    },

    update: {
      name: "Store Admin",
      password: adminPassword,
      role: "ADMIN",
    },

    create: {
      name: "Store Admin",
      email: "admin@store.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "customer@store.com",
    },

    update: {
      name: "Demo Customer",
      password: customerPassword,
      role: "CUSTOMER",
    },

    create: {
      name: "Demo Customer",
      email: "customer@store.com",
      password: customerPassword,
      role: "CUSTOMER",
    },
  });

  const phones = await prisma.category.upsert({
    where: {
      name: "Phones",
    },

    update: {
      description: "Smartphones and mobile devices",
    },

    create: {
      name: "Phones",
      description: "Smartphones and mobile devices",
    },
  });

  const laptops = await prisma.category.upsert({
    where: {
      name: "Laptops",
    },

    update: {
      description: "Laptops and notebooks",
    },

    create: {
      name: "Laptops",
      description: "Laptops and notebooks",
    },
  });

  const accessories = await prisma.category.upsert({
    where: {
      name: "Accessories",
    },

    update: {
      description: "Tech accessories and peripherals",
    },

    create: {
      name: "Accessories",
      description: "Tech accessories and peripherals",
    },
  });

  const products = [
    {
      name: "iPhone 15",
      description:
        "Apple smartphone with advanced camera and performance.",
      price: "799.99",
      stock: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80",
      categoryId: phones.id,
    },

    {
      name: "Samsung Galaxy S24",
      description:
        "Premium Android smartphone with a powerful display and camera.",
      price: "749.99",
      stock: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80",
      categoryId: phones.id,
    },

    {
      name: "MacBook Air M3",
      description:
        "Lightweight laptop powered by Apple silicon.",
      price: "1099.99",
      stock: 15,
      imageUrl:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
      categoryId: laptops.id,
    },

    {
      name: "Dell Inspiron 15",
      description:
        "Reliable everyday laptop for study and work.",
      price: "649.99",
      stock: 20,
      imageUrl:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
      categoryId: laptops.id,
    },

    {
      name: "Wireless Mouse",
      description:
        "Comfortable wireless mouse for everyday use.",
      price: "24.99",
      stock: 50,
      imageUrl:
        "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80",
      categoryId: accessories.id,
    },

    {
      name: "USB-C Hub",
      description:
        "Multi-port USB-C hub for laptops and tablets.",
      price: "39.99",
      stock: 40,
      imageUrl:
        "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80",
      categoryId: accessories.id,
    },
  ];

  for (const product of products) {
    const existingProduct =
      await prisma.product.findFirst({
        where: {
          name: product.name,
        },
      });

    if (existingProduct) {
      await prisma.product.update({
        where: {
          id: existingProduct.id,
        },

        data: product,
      });
    } else {
      await prisma.product.create({
        data: product,
      });
    }
  }

  console.log("");
  console.log("✅ Seed completed successfully!");
  console.log("");

  console.log("Admin account:");
  console.log("Email: admin@store.com");
  console.log("Password: Admin@12345");
  console.log("");

  console.log("Customer account:");
  console.log("Email: customer@store.com");
  console.log("Password: Customer@12345");
  console.log("");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });