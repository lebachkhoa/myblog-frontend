// postgresKnex.ts
import knex, { Knex } from "knex";
import * as dotenv from "dotenv";
dotenv.config();

const postgresKnex: Knex = knex({
  client: "pg",
  connection: {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
});

export default postgresKnex;
