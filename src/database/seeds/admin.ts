import "reflect-metadata";
import { AppDataSource } from "../connection";
import { User, UserRole } from "../entities/User";
import { hashPassword } from "../../utils/encryption";

export const seedAdmin = async () => {
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(User);
  const admin = await repo.findOneBy({ email: "ravindra.gaikwad@inditronics.com" });

  if (admin) {
    console.log("Admin already exists – skipping seed");
    await AppDataSource.destroy();
    return;
  }

  const hash = await hashPassword("Ravindra@123");
  await repo.insert({
    email: "ravindra.gaikwad@inditronics.com",
    password: hash,
    name: "Ravindra Gaikwad",
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