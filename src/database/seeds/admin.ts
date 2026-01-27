import "reflect-metadata";
import { AppDataSource } from "../connection";
import { User, UserRole } from "../entities/User";
import { hashPassword } from "../../utils/encryption";

export const seedUser = async () => {
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(User);
  const admin = await repo.findOneBy({ email: "manoj.patidar@inditronics.com" });

  if (admin) {
    console.log("User already exists – skipping seed");
    await AppDataSource.destroy();
    return;
  }

  const hash = await hashPassword("Manoj@123");
  await repo.insert({
    email: "manoj.patidar@inditronics.com",
    password: hash,
    name: "Manoj Patidar",
    role: UserRole.DEVELOPER
  });

  console.log("User seeded");
  await AppDataSource.destroy();
};

// Allow direct execution: node dist/database/seeds/admin.js
if (require.main === module) {
  seedUser().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}