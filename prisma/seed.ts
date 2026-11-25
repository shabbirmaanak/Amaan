import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const phone = process.env.ADMIN_PHONE;
  const name = process.env.ADMIN_NAME ?? "Admin";
  if (!phone) {
    console.error("Set ADMIN_PHONE (and optionally ADMIN_NAME) before seeding, e.g.:");
    console.error("  ADMIN_PHONE=+919876543210 ADMIN_NAME=\"Event Admin\" npm run db:seed");
    process.exit(1);
  }

  const admin = await prisma.admin.upsert({
    where: { phone },
    update: { name },
    create: { phone, name },
  });

  console.log(`Admin ready: ${admin.name} (${admin.phone})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
