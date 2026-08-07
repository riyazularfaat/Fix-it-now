import bcrypt from "bcryptjs";
import config from "../src/config/index";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = config.admin_email;
  const adminPassword = config.admin_password;

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existing) return;

  const passwordHash = await bcrypt.hash(
    adminPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: passwordHash,
      name: "Admin",
      role: "ADMIN",
      activeStatus: "ACTIVE",
    },
  });
}

main()
  .catch((e) => {
    console.error("Seeding failed: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
