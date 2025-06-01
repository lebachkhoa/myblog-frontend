//編成一覧生成 マルチテナント
const dotenv = require('./node_modules/dotenv');
dotenv.config();

module.exports = {
	apps: [
		{
			//メインエントリ
			name: "MasterWorker",
			namespace: "MAIN",
			env: {
				NODE_ENV: "_production",
				CONFVERSION: "A1.0.0",
				USER_NAME: "MasterWorker",
				GROUP_CODE: "USER",
				PORT: 1234,
				DEBUG_FLG: "true",
				NODE_OPTIONS: "--inspect=0.0.0.0:9229" // デバッグオプションを追加
			},
			//以下固定設定
			script: "./dist/app.js",
			//interpreter: "ts-node",
			// script: process.platform === "win32" ? "./dist/your-app-name.exe" : "./dist/your-app-name",
			instances: 1,
			exec_mode: "cluster",
			watch: true,
			log_type: "json",
			log_date_format: "YYYY-MM-DD HH:mm:ss",

			combine_logs: false,
			merge_logs: false,

			time: true
		},
		{
			//事業者ごとエントリ管理
			name: "Worker_SDK",
			namespace: "WORKER",
			env: {
				NODE_ENV: "_production",
				CONFVERSION: "A0.1.1",
				USER_NAME: "ABC",
				//GROUP_CODEがユーザとシステムを横断するキーである
				//Group名/アカウント毎グループ名/MasterWorker-WorkerAddr/WorkerProcess名/Database名/Cardataフォルダ
				GROUP_CODE: "CVF",
				USER_PORT: 12345,
				BASE_CONFIG_PATH: "C:/CVF",
				DEBUG_FLG: "false",
				NODE_OPTIONS: "--inspect=0.0.0.0:9229" // デバッグオプションを追加
			},
			//以下固定設定
			script: "./dist/worker.js",
			//interpreter: "ts-node",
			// script: process.platform === "win32" ? "./dist/your-app-name.exe" : "./dist/your-app-name",
			instances: 1,
			exec_mode: "cluster",
			watch: true,
			log_type: "json",
			log_date_format: "YYYY-MM-DD HH:mm:ss",

			combine_logs: false,
			merge_logs: false,

			time: true
		},
		{
			//事業者ごとエントリ管理
			name: "ABC123",
			namespace: "WORKER",
			env: {
				NODE_ENV: "_production",
				CONFVERSION: "A0.1.1",
				USER_NAME: "A111",
				//GROUP_CODEがユーザとシステムを横断するキーである
				//Group名/アカウント毎グループ名/MasterWorker-WorkerAddr/WorkerProcess名/Database名/Cardataフォルダ
				GROUP_CODE: "123AAA",
				USER_PORT: 2345,
				BASE_CONFIG_PATH: "C:/123AAA",
				DEBUG_FLG: "false",
				NODE_OPTIONS: "--inspect=0.0.0.0:9229" // デバッグオプションを追加
			},
			//以下固定設定
			script: "./dist/worker.js",
			//interpreter: "ts-node",
			// script: process.platform === "win32" ? "./dist/your-app-name.exe" : "./dist/your-app-name",
			instances: 1,
			exec_mode: "cluster",
			watch: true,
			log_type: "json",
			log_date_format: "YYYY-MM-DD HH:mm:ss",

			combine_logs: false,
			merge_logs: false,

			time: true
		}
	]
};