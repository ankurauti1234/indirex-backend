import "reflect-metadata";
import { AppDataSource } from "../connection";
import { seedAdminsBatch } from "./admin";
import { seedEvents } from "./events"; // Add this

export const runAllSeeds = async () => {
  await AppDataSource.initialize();
  console.log("Running all DB seeds…");

  await seedAdminsBatch();
  await seedEvents(); // Add this
  // await other seeds...

  console.log("All seeds completed");
  await AppDataSource.destroy();
};

if (require.main === module) {
  runAllSeeds().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}