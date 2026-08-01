import "reflect-metadata";
import { AppDataSource } from "../connection";
import { User, UserRole } from "../entities/User";
import { hashPassword } from "../../utils/encryption";

export const seedAdmin = async () => {
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(User);
  const admin = await repo.findOneBy({ email: "vahan.nersesyan@inditronics.com" });

  if (admin) {
    console.log("Admin already exists – skipping seed");
    await AppDataSource.destroy();
    return;
  }

  const hash = await hashPassword("Pass@123");
  await repo.insert({
    email: "vahan.nersesyan@inditronics.com",
    password: hash,
    name: "Vahan Nersesyan",
    role: UserRole.SUPPORT
  });

  console.log("Admin seeded");
  await AppDataSource.destroy();
};

// Allow direct execution: node dist/database/seeds/admin.js
if (require.main === module) {
  seedAdmin().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}