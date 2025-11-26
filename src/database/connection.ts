import "reflect-metadata";
import { DataSource } from "typeorm";
import * as entities from "./entities";
import { env } from "../config/env";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.postgres.host,
  port: env.postgres.port,
  username: env.postgres.user,
  password: env.postgres.password,
  database: env.postgres.database,

  ssl: {
    rejectUnauthorized: false,
  },

  synchronize: false, // keep as you want
  logging: env.nodeEnv === "development",

  entities: Object.values(entities) as Function[],
  migrations: ["src/database/migrations/**/*.ts"],
});
