import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { AppDataSource } from "../connection";
import { User, UserRole } from "../entities/User";
import { hashPassword } from "../../utils/encryption";

export const seedAdmin = async () => {
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(User);
  const admin = await repo.findOneBy({ email: "admin@example.com" });

  if (admin) {
    console.log("Admin already exists – skipping seed");
    await AppDataSource.destroy();
    return;
  }

  const hash = await hashPassword("Admin123!");
  await repo.insert({
    email: "admin@inditronics.com",
    password: hash,
    name: "Indirex Admin",
    role: UserRole.ADMIN
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