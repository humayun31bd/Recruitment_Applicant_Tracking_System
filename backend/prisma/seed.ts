import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim() || "admin@hris.local";
  let password = process.env.ADMIN_PASSWORD?.trim();

  if (process.env.NODE_ENV === "production" && (!password || password.length < 12)) {
    throw new Error("FATAL: In production, ADMIN_PASSWORD must be provided via environment variables (>= 12 chars).");
  }

  if (!password) {
    password = crypto.randomBytes(12).toString("base64url") + "!9Aa";
    console.log("--------------------------------------------------");
    console.log("[INITIAL SEED CREDENTIALS GENERATED]");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log("--------------------------------------------------");
  }

  return { email, password };
}

async function main() {
  const { email, password } = getAdminCredentials();
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      role: "SUPERADMIN"
    }
  });

  console.log(`[SEED] Admin account verified: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
