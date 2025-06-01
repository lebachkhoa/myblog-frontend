import knex, { Knex } from "knex";

const db: Knex = knex({
  client: "pg",
  connection: {
    host: "locallhost",
    port: 5432,
    user: "admin",
    password: "321987",
    database: "node-app"
  }
});

export default db;

