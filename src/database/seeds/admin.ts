import "reflect-metadata";
import { AppDataSource } from "../connection";
import { User, UserRole } from "../entities/User";
import { hashPassword } from "../../utils/encryption";

const EMAILS = [
  "mahesh.bhorade@inditronics.com",
  "manoj.patidar@inditronics.com",
  "abhishek.gawade@inditronics.com",
  "swapnil.gaikwad@inditronics.com",
  "nikhil.kshirsagar@inditronics.com",
  "aftab.momin@inditronics.com",
  "akkay.datt@inditronics.com",
  "vahan.nersesyan@inditronics.com",
  "pranav.dalve@inditronics.com"
];

const DEFAULT_PASSWORD = "Pass@123";

const toName = (email: string) =>
  email
    .split("@")[0]
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const seedAdminsBatch = async () => {
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(User);
  const hash = await hashPassword(DEFAULT_PASSWORD);

  for (const email of EMAILS) {
    const existing = await repo.findOneBy({ email });

    if (existing) {
      console.log(`Skipping ${email} – already exists`);
      continue;
    }

    await repo.insert({
      email,
      password: hash,
      name: toName(email),
      role: UserRole.ADMIN,
    });

    console.log(`Seeded admin: ${email}`);
  }

  await AppDataSource.destroy();
};

// Allow direct execution: node dist/database/seeds/admins-batch.js
if (require.main === module) {
  seedAdminsBatch().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}