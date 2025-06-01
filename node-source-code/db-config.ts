import type { Knex } from "knex";
import dotenv from "dotenv";
dotenv.config();

const config: { [key: string]: Knex.Config } = {
	// PostgresSQL設定
	postgresSet:
	{
		client: "postgresql",
		connection: {
			// DB名はGROUP_CODE と同じであること
			host:process.env.DB_HOST as string,
			database: process.env.GROUP_CODE as string,
			password: process.env.DATABASE_PSWD as string,
			user: process.env.DATABASE_USER as string,
			port: Number(process.env.DATABASE_PORT),
		},
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			directory: './migrations', // マイグレーションファイルの場所を指定
		}
	}
};

module.exports = config;
