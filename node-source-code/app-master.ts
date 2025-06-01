//*****************************
//* Pat-Monitor
//* webAPI- Master
//* 機能： I/F Frontendからの初回アクセスエントリ
//*        FirebaseAuth認証を正で、FirebaseStoreよりアカウントの所属Groupを取得
//*        所属Groupの値をキーに conf/workerAddr.json に記載されたWokerAddrを返す
//* 挙動：Singleton model
//* Version 
let appVer: string = "A0.2.0";

// node package
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import * as https from "https";
import * as http from "http";
import * as fs from "fs";
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import * as admin from "firebase-admin";
// import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { SecureVersion } from 'tls';  // 'SecureVersion'型をインポート

//* ユーザ定義ライブラリ
import * as common from "./common";
import { logger } from "./log4js";  //Logger
import expressMiddleware from './expressMiddleware'; // ミドルウェアのインポート


//環境変数 .env 
import dotenv from "dotenv";
dotenv.config();
let dbgflg = process.env.DEBUG_FLG as string; //デバッグ用フラグ

// ****************************
// ソフト管理バージョン
const PROG_PARAM: common.comonKeyValue = {
	PROG_NO: "22PS-RS-0188",
	PROG_NAME: "node-server",
	PROG_VERSION: "A2.0.0",
	PROG_NAME_JP: "WebAPI",
	PROG_ROLE: "Master",
	USER_NAME: process.env.USER_NAME as string,
	GROUP_CODE: "-",
	PORT: process.env.PORT as string,
	BASE_CONFIG_PATH: "-",
	DATABASE_HOST: process.env.DATABASE_HOST as string,
	DATABASE_PORT: process.env.DATABASE_PORT as string,
	DEBUG: process.env.DEBUG_FLG as string
};

//Express 
const app = express();
app.use(expressMiddleware);

// Workerアドレス
const tbl_worker_addr = common.loadJsonConfig(process.env.CONFIG_WORKER_ADDR as string);
//******************************************
//FirebaseSDKの初期化
// 環境変数からFirebase SDKの初期設定
const firebaseConfig = common.loadJsonConfig(process.env.GOOGLE_FIREBASE_SDK_PATH as string);
// サービスアカウントキー
const serviceAccount = common.loadJsonConfig(process.env.GOOGLE_APPLICATION_CREDENTIALS as string);
// Firebase Admin SDKの初期化
admin.initializeApp({
	credential: admin.credential.applicationDefault(), // サービスアカウント認証
	databaseURL: `https://${serviceAccount.project_id}.firebaseio.com` // Realtime Database のURL
});
// Firestoreのインスタンスを取得
const db = admin.firestore();


//*****************************************
// フロントエンド  初回エントリ
// endpoints:  domain/verify
// request type:POST
// body:idToken (フロントエンド認証済 FirbaseAuthenticated  ), email(ユーザ名)
//
// Secury Policyによりエラーはすべて404で応答する
// logでは正確な記録を残す
app.post("/verify", async (req: Request, res: Response) => {
	const { idToken, email, usergroup } = req.body;
	console.log(req.body);

	if ("true" === dbgflg) //試験用コール .env
	{
		// const grp = process.env.GROUP_CODE as string;
		const grp = usergroup as string;
		const prmWorker = {
			group: grp,
			address: tbl_worker_addr[grp],
			// group: process.env.GROUP_CODE as string,
			// address: tbl_worker_addr[process.env.GROUP_CODE as string],
			permission: "1"
		};

		//	console.log("Debug / Res verifyIdToken:",prmWorker.group, prmWorker.address);
		logger.info(`*Debug Success [${prmWorker}]`)

		//結果データ応答
		res.status(200).send({
			message: "Debug / Res verifyIdToken",
			token: idToken,
			user: prmWorker
		});
	}
	else {
		//実リクエスト(Proxy経由では失敗する)y
		try {
			// Firebase IDトークンの検証
			const decodedToken = await admin.auth().verifyIdToken(idToken);
			if (decodedToken.email === email) {
				// トークンが有効で、メールアドレスが一致する場合
				// Firestoreからユーザー名をキーに値取得(同名メールを許容する場合はuidで識別)
				const userDoc = await db
					.collection(process.env.APP_FIRESTORE_MONITORNAME as string)
					.doc(email)
					.get();

				// Firestoreデータ有無
				if (!userDoc.exists) {
					logger.info(`#[403]:ユーザーが見つかりません ${email}`);
					return res.status(404);
				}

				const userData = userDoc.data();
				if (userData) {
					const grp = JSON.parse(JSON.stringify(userData));
					console.log("userData:", JSON.stringify(userData));

					//WokerAddrのキー有無
					if (grp.group in tbl_worker_addr) {
						const prmWorker = {
							group: grp.group,
							address: tbl_worker_addr[grp.group],
							permission:
								grp.permission !== undefined && grp.permission !== null ? grp.permission.toString() : "1"
						};
						//結果データ応答
						logger.info(`- Success [${prmWorker}]`)
						res.status(200).send({
							message: "Token is valid",
							token: decodedToken,
							user: prmWorker
						});
					} else {
						//WokerAddrのキー無
						logger.info(`#[403]: Group does not exist ${grp}`)
						res.status(404);
					}
				} else {
					logger.info(`#[403]: FireStore documents does not exist ${decodedToken.email}`)
					res.status(404);
				}
			} else {
				logger.info(`#[403]: Email does not match ${decodedToken.email}`);
				res.status(404);
			}
		} catch (error: any) {
			logger.info(`#[403]: Invalid token ${error.message}`);
			res.status(404);
		}
	}
});


//******************************************
// 生存確認エンドポイント
export async function reqCanary(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	res.status(200).send({
		message: `[${common.getFormattedTimestamp()}][Alive][port:${PORT}] ${process.env.name} [${process.env.NAME_JP}][SoftVer:${appVer}] [ConfVer:${process.env.CONFVERSION}] `
	});
}

//******************************************
// サーバを起動
const PORT = process.env.PORT || 8080;
// BootMessage
common.bootlog(logger, PROG_PARAM);
// logger.info(`[Boot] NodeAPI - Master [port:${PORT}]`);
// logger.info(`[SoftVer:${appVer}] [ConfVer:${process.env.CONFVERSION}]`);

Object.entries(tbl_worker_addr).forEach(([key, value], index) => {
	console.log(`${index + 1}: ${key} = ${value}`);
});

// HTTPSサーバーの作成と起動
if (process.env.DEBUG_FLG == "true") {
	//試験中はreferer無視
	const server = app.listen(PORT, function () {
		logger.info(`debug - HTTP サーバーが起動しました:`, PORT);
	});
} else {
	try {

		//HTTPS用 認証key, 認証ファイル設定
		const options: https.ServerOptions = {
			key: fs.readFileSync(path.resolve(__dirname, "./cert/pat.key")),
			cert: fs.readFileSync(path.resolve(__dirname, "./cert/www.pat-train.com.crt")),
			minVersion: 'TLSv1.2' as SecureVersion,  // SecureVersion型にキャスト
			maxVersion: 'TLSv1.3' as SecureVersion   // SecureVersion型にキャスト
		};
		const serverhttps = https.createServer(options, app);

		serverhttps.listen(PORT, () => {
			logger.info(`Production - HTTPS サーバーが起動しました:`, PORT);
		});
	} catch (e) {
		//認証ファイルがなければHTTP起動（分散側待ち受け）
		const server = app.listen(PORT, function () {
			logger.info(`Production -  HTTP サーバーが起動しました(Non Cert):`, PORT);
		});
	}
}

//EOF
