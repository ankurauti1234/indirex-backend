import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import { DataSource } from "typeorm";
import * as entities from "./entities";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  // REQUIRED FOR RDS
  ssl: {
    rejectUnauthorized: false, // Allows self-signed certs (common on RDS)
  },
  // DEV ONLY – remove in prod and use migrations
  synchronize: false,
//   synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
  entities: Object.values(entities) as Function[],
  migrations: ["src/database/migrations/**/*.ts"],
});