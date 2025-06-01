//Lo4js CustomPath
import { configure, getLogger } from "log4js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

//指定パスにlogファイルを生成する
const baseConfigPath = process.env.BASE_CONFIG_PATH as  string; 
console.log( path.resolve(baseConfigPath, "log/node-api.log"))
const log4jsConfig = {
	appenders: {
		app: {
			type: "file",
			filename: path.resolve(baseConfigPath, "log/node-api.log"),
			//filename: path.resolve("c:/node-server_master/log/node-api.log"),
			maxLogSize: 10485760,
			backups: 5
		},
		master: {
			type: "file",
			filename: path.resolve(baseConfigPath, "log/node_worker.log"),			
			//filename: path.resolve("c:/node-server_master/log/node_master.log"),
			maxLogSize: 10485760,
			backups: 5
		},
		worker: {
			type: "file",
			filename: path.resolve(baseConfigPath, "log/node_worker.log"),			
			maxLogSize: 10485760,
			backups: 10
		},
		debug: {
			type: "file",
			filename: path.resolve(baseConfigPath,"log/node_worker_debug.log"),
			maxLogSize: 10485760,
			backups: 10
		},		
		console: {
			type: "console",
			layout: {
				type: "pattern",
				pattern: "[%d{ISO8601}][%p]- %m"
			}
		}
	},
	categories: {
		default: { appenders: ["app", "console"], level: "info" },
		node_master: { appenders: ["master", "console"], level: "info" },
		node_worker: { appenders: ["worker", "console"], level: "info" },
		debug: { appenders: ["debug", "console"], level: "debug" },
		console: { appenders: ["console"], level: "info" }
	},
	pm2: true,
 	pm2InstanceVar: process.env.GROUP_CODE as string
};

// log4jsの設定を適用
configure(log4jsConfig);

// ロガーをエクスポート
const logger = getLogger("node_master");
const loggerWork = getLogger("node_worker");
export { logger, loggerWork };
