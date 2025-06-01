//*****************************
//* Pat-Monitor
//* webAPI- Master
//* 機能： I/F FrontendからのFirebaseAuth認証後のユーザ毎API
//* 起動パラメタ：ecosystem.config.js
//* データソース：↑より   
//* 特記： Secury Policyによりエラーはすべて404で応答する
//        logでは正確な記録を残す    

// node package
import express, { Request, Response,NextFunction  } from "express";
import axios from "axios";
import path from "path";
import * as fs from "fs";
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import * as admin from "firebase-admin";
import * as cluster from  "cluster";
const numCPUs = require("os").cpus().length;
import * as https from "https";
import * as http from "http";

// import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import * as bodyParser from "body-parser";
import { SecureVersion } from 'tls';  // 'SecureVersion'型をインポート
import SSE from "express-sse";
import * as zlib from 'zlib';

//* ユーザ定義ライブラリ
import expressMiddleware from './expressMiddleware'; // express ミドルウェア
import * as constants from "./constants"; //定義値
import * as appAuth from "./appAuthFirebase"; //Firebase認証
import * as getAppgeojson from "./appGetGeoJson"; //GeoJson取得
import * as getAppReq from "./appRequestAPI"; //appRequestAPI 基本機能
import * as getAppDataPick from "./appDataPickList"; //任意項目抽出
import * as getAppItemCounter from "./appItemCounter"; //有寿命品稼働時間集計

import { dbWorkerComponent } from './db/dbWorkerConfig';
import { SystemMonitor } from './systemMonitor';
import { loggerWork } from "./log4js";  //Logger(Log4js)
import * as common from "./common";

//環境変数 .env ****************************
import dotenv from "dotenv";
const envFile = process.env.DEBUG_FLG === 'true' ? '.env.'+ process.env.GROUP_CODE as string : '.env';
dotenv.config({path:envFile});
let dbgflg = process.env.DEBUG_FLG as string; //デバッグ用フラグ

// ****************************
// ソフト管理バージョン .envより
const PROG_PARAM: common.comonKeyValue = {
	PROG_NO: process.env.PROG_NO as string,
	PROG_NAME:  process.env.PROG_NAME as string,
	PROG_VERSION: process.env.PROG_VERSION as string,
	PROG_NAME_JP: process.env.PROG_NAME_JP as string,
	PROG_ROLE: process.env.PROG_ROLE  as string,
	USER_NAME: process.env.USER_NAME as string,
	GROUP_CODE: process.env.GROUP_CODE as string,
	PORT: process.env.USER_PORT as string,
	BASE_CONFIG_PATH: process.env.BASE_CONFIG_PATH as string,
	DATABASE_HOST: process.env.DATABASE_HOST as string,
	DATABASE_PORT: process.env.DATABASE_PORT as string,
	DEBUG: process.env.DEBUG_FLG as string
};
const titlelabel =`[${PROG_PARAM.GROUP_CODE}] ${PROG_PARAM.USER_NAME} [${PROG_PARAM.PROG_ROLE} (Ver.${PROG_PARAM.PROG_VERSION}) ]:${PROG_PARAM.PORT}`;
process.title = titlelabel;

//Express ****************************
const app = express();
app.use(expressMiddleware);

//******************************************
//FirebaseSDKの初期化
// 環境変数からFirebase SDKの初期設定
//const firebaseConfig = common.loadJsonConfig(process.env.GOOGLE_FIREBASE_SDK_PATH as string);
// サービスアカウントキー
const serviceAccount = common.loadJsonConfig(process.env.GOOGLE_APPLICATION_CREDENTIALS as string);
// Firebase Admin SDKの初期化
admin.initializeApp({
	credential: admin.credential.applicationDefault(), // サービスアカウント認証
	databaseURL: `https://${serviceAccount.project_id}.firebaseio.com` // Realtime Database のURL
});
// Firestoreのインスタンスを取得
const db = admin.firestore();

// リクエストログミドルウェア - debug
app.use((req: Request, res: Response, next: NextFunction) => {
	if(dbgflg === "true"){
		loggerWork.debug(`[${req.method} ${req.url}  ${req.params}  ${req.body}`);
	}
  	next();
});

//**************************************** 
//ワーカースレッド DB 定期取得
const postgresWorker = new dbWorkerComponent({
	workerScriptPath: './databese-worker.js',
	dbConfig: {
	  host: 'localhost',
	  port: Number(process.env.DATABASE_PORT),
	  database: process.env.GROUP_CODE as string,
	  user: process.env.DATABASE_USER as string,
	  password: process.env.DATABASE_PSWD as string
	}
  });

//編成一覧 req->res(既存)
async function getStateDB(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	const data = postgresWorker.getData(constants.NODE_CACHE_KEY_FORMLIST);
	res.json(data);
}

//Express SSE ************************
// 画面ごとのSSEオブジェクト
const ssePerScreen = {
	KEY_FORMLIST: new SSE(),	//Formlist
	KEY_TROUBLELIST: new SSE()  //TroubleList
};
// SSE配列
let clients: any = {
    KEY_FORMLIST: [],		//Formlist
    KEY_TROUBLELIST: [],	//TroubleList
};
// 接続アクティブ無効設定
const isConnectionActiveMap: Record<string, Map<string, boolean>> = {
    KEY_FORMLIST: new Map<string, boolean>(),		// Formlist
    KEY_TROUBLELIST: new Map<string, boolean>(),	// TroubleList
};
// オープン開始設定
const isOpenedMap: Record<string, Map<string, boolean>> = {
    KEY_FORMLIST: new Map<string, boolean>(),		// Formlist
    KEY_TROUBLELIST: new Map<string, boolean>(),	// TroubleList
};
// セクションIDのクリーンアップ処理
const cleanup_sectionId = (channelKey: string, sectionId: string) => {
	// オープン開始?
	if (isOpenedMap[channelKey].has(sectionId) === true) {
		// オープン開始削除
		isOpenedMap[channelKey].delete(sectionId);
	}
	// 接続アクティブ有効?
	if (isConnectionActiveMap[channelKey].has(sectionId) === true) {
		// 接続アクティブ削除
		isConnectionActiveMap[channelKey].delete(sectionId);
	}
};

// クリーンアップ関数
const cleanup_KEY_FORMLIST = (heartbeatInterval: NodeJS.Timeout, channelKey: string, sectionId: string) => {
	// オープン開始?
	const isOpened = isOpenedMap[channelKey].has(sectionId) && isOpenedMap[channelKey].get(sectionId) === true;
	if(isOpened === true) {
		// クローズ処理実施
		clients.KEY_FORMLIST.pop();
		console.log('Client disconnected from KEY_FORMLIST:', clients.KEY_FORMLIST.length, ', id:', sectionId);
	} else {
		// キャンセル処理実施
		console.log('Client cancel from KEY_FORMLIST:', clients.KEY_FORMLIST.length, ', id:', sectionId);
	}
	// 接続アクティブ有効?
	if (isConnectionActiveMap[channelKey].has(sectionId) === true) {
		// 接続アクティブ無効
		isConnectionActiveMap[channelKey].set(sectionId, false);
	}
	// オープン開始?
	if (isOpenedMap[channelKey].has(sectionId) === true) {
		// オープン開始削除
		isOpenedMap[channelKey].delete(sectionId);
		// console.log('Deleted isOpenedMap from KEY_FORMLIST:', sectionId);
	}
	// セクション管理クリア
	clearInterval(heartbeatInterval);
};

//**************************************** 
// 画面ごとの SSE clients オブジェクト配列
// SSEエンドポイント 
async function getSseStream(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	// タイムアウトIDを取得
	const heartbeatInterval = setInterval(function(){}, Number(process.env.UPDATE_INTERVAL));
	// セクションID(=タイムアウトID)を取得
	const sectionId = String(Number(heartbeatInterval));			
	// 現在のチャネル定義
	const channelKey = "KEY_FORMLIST";

	try {
		// headerパラメタ取得-すべて小文字-F/Eとマッチすること
		const { screenid, username, usergroup } = req.query;
		const authorization = req.headers.authorization;

		// 接続アクティブ無効設定
		if (!isConnectionActiveMap[channelKey]) {
			isConnectionActiveMap[channelKey] = new Map<string, boolean>();
		}
		isConnectionActiveMap[channelKey].set(sectionId, true);
		// オープン開始設定
		if (!isOpenedMap[channelKey]) {
			isOpenedMap[channelKey] = new Map<string, boolean>();
		}
		isOpenedMap[channelKey].set(sectionId, false);

		// タイムアウト設定
		req.socket.setTimeout(Number(process.env.CONNECTION_TIMEOUT) || 60000);

		// 複数のイベントで切断を検知
		res.on("close",  () => {cleanup_KEY_FORMLIST(heartbeatInterval, channelKey, sectionId)});
		res.on("finish", () => {cleanup_KEY_FORMLIST(heartbeatInterval, channelKey, sectionId)});
		req.on("end", () => {cleanup_KEY_FORMLIST(heartbeatInterval, channelKey, sectionId)});
		req.socket.on("timeout", () => {
			loggerWork.info(`Connection timeout for: ${screenid} ${username}`);
			// クリーンアップ処理
			cleanup_KEY_FORMLIST(heartbeatInterval, channelKey, sectionId);
			res.end();
		});

		const params = appAuth.getRequestParams(req);
		// 引数Validation
		if (!appAuth.validateParams(params, res)) {
			loggerWork.info(`getSseStream [401] illigal params: ${params}`);
			res.status(404);
			return;
		}
		//USER_GROUP判定
		if ((usergroup as string) !== (process.env.GROUP_CODE as string)) {
			loggerWork.info(`getSseTrbListStream [401] Unmatch GROUP_CODE ${process.env.GROUP_CODE} != ${usergroup}`);
			res.status(404);
			return;
		}
		// screenidの値チェック (例: 許可されたscreen IDのリスト)
		let defscreen = constants.DEFINED_SCREEN_IDS; // 定義済みの画面 ID 配列
		if (!defscreen.includes(params.screenid as string)) {
			loggerWork.info(`getSseStream [401] illigal screenid: ${screenid}`);
			res.status(404);
			return;
		}
		// Firebase Token 認証
		if (params.authorization) {
			const decodedToken = await appAuth.verifyToken(params.authorization, res);

			if (!decodedToken) {
				loggerWork.info(`getSseStream [400] Failed authorization: ${screenid} ${username}`);
				res.status(404);
				return;
			}

			if (decodedToken && decodedToken.uid) {
				console.log("User ID:", decodedToken.uid);
				// 認証成功
				loggerWork.info(`getSseStream Registered: ${screenid} ${username}/ uid:${decodedToken.uid}`);

				let initialData;
				try {
					initialData = await postgresWorker.getData(constants.NODE_CACHE_KEY_FORMLIST);
				} catch (error: any) {
					loggerWork.info("getSseStream [500] fetching initialData:", error);
					res.status(404);
					return;
				}

				// 接続アクティブ有効設定?
				const isActive = isConnectionActiveMap[channelKey].has(sectionId) && isConnectionActiveMap[channelKey].get(sectionId) === true;
				if(isActive === true) {
					// オープン開始完了
					isOpenedMap[channelKey].set(sectionId, true);
					// SSEにデータを登録
					ssePerScreen.KEY_FORMLIST.init(req, res, initialData);
					// clients配列にデータを追加
					clients.KEY_FORMLIST.push(initialData);
					console.log('Client connected to FORMLIST:', clients.KEY_FORMLIST.length, ', id:', sectionId);
				}
				// 接続アクティブ有効?
				if (isConnectionActiveMap[channelKey].has(sectionId) === true) {
					// 接続アクティブ削除
					isConnectionActiveMap[channelKey].delete(sectionId);
					// console.log('Deleted isConnectionActiveMap from KEY_FORMLIST:', sectionId);
				}
			} else {
				// 認証失敗
				loggerWork.info(`getSseStream [401] Failed to verify token or uid is missing: ${screenid} ${username}`);
				res.status(404);
				return;
			}
		}
	} catch (error:any) {
		if (error.code === 'auth/id-token-expired') {
			loggerWork.info(`getSseStream トークンの有効期限が切れています。`, error.code);
		} else {
		 	loggerWork.info(`getSseStream トークンの認証に失敗しました:`, error.message);
		}
		// クリーンアップ処理
		cleanup_KEY_FORMLIST(heartbeatInterval, channelKey, sectionId);
		// セクションIDのクリーンアップ処理
		cleanup_sectionId(channelKey, sectionId);
		res.status(404);
		next(error); 
	}
};
// 定期的にSSE送信処理
// ※ メインスレッドに影響を受けタイマー維持できない場合はワーカースレッド化
//編成一覧
setInterval(async () => {
	try {
		// 送信先があればPush ,Arrayのlengthで判定
		if (clients.KEY_FORMLIST.length > 0) {
			// loggerWork.info(`formlist ${sseScreenClients.KEY_FORMLIST } ---> ${constants.NODE_CACHE_KEY_FORMLIST}: `);
			const data = await postgresWorker.getData(constants.NODE_CACHE_KEY_FORMLIST);
			ssePerScreen.KEY_FORMLIST.send(data, constants.NODE_CACHE_KEY_FORMLIST);
		}
	} catch (error) {
		loggerWork.error("Error fetching or sending data:", error);
	}
}, Number(process.env.UPDATE_INTERVAL)); // 1000ms

// クリーンアップ関数
const cleanup_KEY_TROUBLELIST = (heartbeatInterval: NodeJS.Timeout, channelKey: string, sectionId: string) => {
	// オープン開始?
	const isOpened = isOpenedMap[channelKey].has(sectionId) && isOpenedMap[channelKey].get(sectionId) === true;
	if(isOpened === true) {
		// クローズ処理実施
		clients.KEY_TROUBLELIST.pop();
		console.log('Client disconnected from KEY_TROUBLELIST:', clients.KEY_TROUBLELIST.length, ', id:', sectionId);
	} else {
		// キャンセル処理実施
		console.log('Client cancel from KEY_TROUBLELIST:', clients.KEY_TROUBLELIST.length, ', id:', sectionId);
	}
	// 接続アクティブ有効?
	if (isConnectionActiveMap[channelKey].has(sectionId) === true) {
		// 接続アクティブ無効
		isConnectionActiveMap[channelKey].set(sectionId, false);
	}
	// オープン開始?
	if (isOpenedMap[channelKey].has(sectionId) === true) {
		// オープン開始削除
		isOpenedMap[channelKey].delete(sectionId);
		// console.log('Deleted isOpenedMap from KEY_TROUBLELIST:', sectionId);
	}
	// セクション管理クリア
	clearInterval(heartbeatInterval);
};

//**************************************** 
// SSEエンドポイント ⁻TroubleList
async function getSseTrbListStream(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	// タイムアウトIDを取得
	const heartbeatInterval = setInterval(function(){}, Number(process.env.UPDATE_INTERVAL)*5);
	// セクションID(=タイムアウトID)を取得
	const sectionId = String(Number(heartbeatInterval));			
	// 現在のチャネル定義
	const channelKey = "KEY_TROUBLELIST";

	try {
		// headerパラメタ取得-すべて小文字-F/Eとマッチすること
		const { screenid, username, usergroup } = req.query;
		const authorization = req.headers.authorization;

		// 接続アクティブ無効設定
		if (!isConnectionActiveMap[channelKey]) {
			isConnectionActiveMap[channelKey] = new Map<string, boolean>();
		}
		isConnectionActiveMap[channelKey].set(sectionId, true);
		// オープン開始設定
		if (!isOpenedMap[channelKey]) {
			isOpenedMap[channelKey] = new Map<string, boolean>();
		}
		isOpenedMap[channelKey].set(sectionId, false);

		// タイムアウト設定
		req.socket.setTimeout(Number(process.env.CONNECTION_TIMEOUT) || 60000);

		// 複数のイベントで切断を検知
		res.on("close",  () => {cleanup_KEY_TROUBLELIST(heartbeatInterval, channelKey, sectionId)});
		res.on("finish", () => {cleanup_KEY_TROUBLELIST(heartbeatInterval, channelKey, sectionId)});
		req.on("end", () => {cleanup_KEY_TROUBLELIST(heartbeatInterval, channelKey, sectionId)});
		req.socket.on("timeout", () => {
			loggerWork.info(`Connection timeout for: ${screenid} ${username}`);
			// クリーンアップ処理
			cleanup_KEY_TROUBLELIST(heartbeatInterval, channelKey, sectionId);
			res.end();
		});

		const params = appAuth.getRequestParams(req);
		// 引数Validation
		if (!appAuth.validateParams(params, res)) {
			loggerWork.info(`getSseTrbListStream [401] illigal params: ${params}`);
			res.status(404);
			return;
		}
		//USER_GROUP判定
		if ((usergroup as string) !== (process.env.GROUP_CODE as string)) {
			loggerWork.info(`getSseTrbListStream [401] Unmatch GROUP_CODE ${process.env.GROUP_CODE} != ${usergroup}`);
			res.status(404);
			return;
		}
		// screenidの値チェック (例: 許可されたscreen IDのリスト)
		let defscreen = constants.DEFINED_SCREEN_IDS; // 定義済みの画面 ID 配列
		if (!defscreen.includes(params.screenid as string)) {
			loggerWork.info(`getSseStream [401] illigal screenid: ${screenid}`);
			res.status(404);
			return;
		}

		//idToken 認証
		if (params.authorization) {
			// Firebase Token 認証
			const decodedToken = await appAuth.verifyToken(params.authorization, res);
			if (!decodedToken) {
				loggerWork.info(`getSseTrbListStream [400] Failed authorization: ${screenid} ${username}`);
				res.status(404);
				return;
			}

			if (decodedToken && decodedToken.uid) {
				console.log("User ID:", decodedToken.uid);
				// 初期データを取得し、クライアントに送信
				loggerWork.info(`getSseTrbListStream Registered: ${screenid} ${username}`);

				let initialData;
				try {
					initialData = await postgresWorker.getData(constants.NODE_CACHE_KEY_TROUBLELIST);
				} catch (error: any) {
					loggerWork.info("getSseTrbListStream [500] fetching initialData:", error);
					res.status(404);
					return;
				}
				//圧縮有効 - 故障一覧のみ
				zlib.deflate(JSON.stringify(initialData), (err, compressedData) => {
					if (err) {
						console.error("Compression error:", err);
						return;
					}

					// 接続アクティブ有効設定?
					const isActive = isConnectionActiveMap[channelKey].has(sectionId) && isConnectionActiveMap[channelKey].get(sectionId) === true;
					if(isActive === true) {
						// オープン開始完了
						isOpenedMap[channelKey].set(sectionId, true);
						// SSEに圧縮データを登録
						const base64Data = compressedData.toString("base64");
						ssePerScreen.KEY_TROUBLELIST.init(req, res, base64Data as unknown as NextFunction);
						// clients配列に圧縮データを追加
						clients.KEY_TROUBLELIST.push(initialData);
						console.log('Client connected to TROUBLELIST:', clients.KEY_TROUBLELIST.length, ', id:', sectionId);
					}
					// 接続アクティブ有効?
					if (isConnectionActiveMap[channelKey].has(sectionId) === true) {
						// 接続アクティブ削除
						isConnectionActiveMap[channelKey].delete(sectionId);
						// console.log('Deleted isConnectionActiveMap from KEY_TROUBLELIST:', sectionId);
					}
				});
				//仮
				// sseScreenClients.KEY_TROUBLELIST += 1;
				// ssePerScreen.KEY_TROUBLELIST.init(req, res, initialData);
			} else {
				// 認証失敗
				loggerWork.info(
					`getSseTrbListStream [401] Failed to verify token or uid is missing: ${screenid} ${username}`
				);
				res.status(404);
				return;
			}
		}
	} catch (error:any) {
		if (error.code === 'auth/id-token-expired') {
			loggerWork.info(`getSseTrbListStream トークンの有効期限が切れています。`, error.code);
		} else {
			loggerWork.info(`getSseTrbListStream トークンの認証に失敗しました:`, error.message);
		}
		// クリーンアップ処理
		cleanup_KEY_TROUBLELIST(heartbeatInterval, channelKey, sectionId);
		// セクションIDのクリーンアップ処理
		cleanup_sectionId(channelKey, sectionId);
		res.status(404);
		next(error); 
	}
};
// 定期的にSSE送信処理
//故障一覧－5秒更新
setInterval(async () => {
	try {
		// 送信先があればPush ,Arrayのlengthで判定
		if (clients.KEY_TROUBLELIST.length > 0) {
			// loggerWork.info(`getSseTrbListStream ${sseScreenClients.KEY_TROUBLELIST}---> ${constants.NODE_CACHE_KEY_TROUBLELIST}: `);
			const data = await postgresWorker.getData(constants.NODE_CACHE_KEY_TROUBLELIST);

			zlib.deflate(JSON.stringify(data), (err, compressedData) => {
				if (err) {
					console.error("setInterval ⁻getSseTrbListStream ⁻ Compression error:", err);
					return;
				}
				const compressedDataString = compressedData.toString('base64');
				ssePerScreen.KEY_TROUBLELIST.send(compressedDataString, constants.NODE_CACHE_KEY_TROUBLELIST);
			});
			// ssePerScreen.KEY_TROUBLELIST.send(compressedDataString, constants.NODE_CACHE_KEY_TROUBLELIST);

		}
	} catch (error) {
		loggerWork.error("getSseTrbListStream Error fetching or sending data:", error);
	}
}, Number(process.env.UPDATE_INTERVAL)*5); // 5000ms


//* エンドポイント **********************************
//WorkerAliveCheck☑
app.get(constants.REQ_CANARY, getAppReq.reqCanary);
//編成一覧☑
app.get(constants.REQ_STATEDB, getStateDB );
app.get(constants.REQ_STATE_SSE_STREAM,  getSseStream );
//故障一覧☑
app.get(constants.REQ_STATE_SSE_STREAM_TRB, getSseTrbListStream);
// app.get(constants.REQ_TROUBLE, getAppReq.reqTroubleList);

//現在車両位置取得
app.get(constants.REQ_GETGPSPOS_DB, getAppReq.reqGetGpsPosDB );
app.get(constants.REQ_TROUBLE_NOW,getAppReq.reqTroubleNowFormOrder);
app.get(constants.REQ_TROUBLE_NOW_FORMORDER, getAppReq.reqTroubleNowFormOrder);

//指定gzファイル取得(trbrbdata …etc)
app.get(constants.REQ_GETGZFILE, getAppReq.reqGetGzFile);
//ユーザ ConfigZip取得
app.get(constants.REQ_GET_USERCONF, getAppReq.getUserConf);

//故障時ファイルデータ取得
app.post(constants.REQ_GETGZFILE, getAppReq.reqGetGzFile);
//Dataset取得
app.get(constants.REQ_GET_DATASET, getAppReq.reqGetDataset); 
//車系設定データ detail_layout取得
app.get(constants.REQ_GETCONF_FORMORDER,getAppReq.getFile);

//req/res/next以外に引数が必要ならwrapper

//１編成NOWdata
app.get(
	constants.REQ_GETCARDATA_FORMORDER,
	getAppReq.reqGetCardataFormOrder
);

// 各種geoJsonダウンロード
app.get(constants.REQ_GET_GEOJSON_STATION, getAppgeojson.getJsonStation);
app.get(constants.REQ_GET_GEOJSON_RAIL, getAppgeojson.getJsonRail);
app.get(constants.REQ_GET_GEOJSON_BASE, getAppgeojson.getJsonBase);
// app.get(constants.REQ_GET_GEOJSON_ROSEN, getAppgeojson.getJsonRosen);
// app.get(constants.REQ_GET_GEOJSON_STATIONPOINT, getAppgeojson.getJsonStationPoint);

//[A2] 任意項目抽出
app.get(constants.REQ_DATAPICK_LIST,getAppDataPick.reqDataPickList); //一覧取得 Select
app.post(constants.REQ_DATAPICK_LIST,getAppDataPick.reqInsertDataPickList); //Insert
app.get(constants.REQ_DATAPICK_LIST_ID,getAppDataPick.reqDataPickListOne);  //１項目取得
app.put(constants.REQ_DATAPICK_LIST_ID,getAppDataPick.reqUpdateDataPickList);  //Upate
app.delete(constants.REQ_DATAPICK_LIST_ID,getAppDataPick.reqDeleteDataPickList); //Delete
app.post(constants.REQ_GETPICKGZFILE ,getAppDataPick.reqGetDataPickFile); //GetFile（仮
app.get(constants.REQ_GETPICKGZSTREAM ,getAppDataPick.reqGetDataStream); //GetFile（仮

app.get(constants.REQ_FORMNO_LIST ,getAppReq.reqGetFormNoList); //編成一覧取得
//[A2] 有寿命集計
app.get( getAppItemCounter.REQ_ITEMCOUNTER_LIST,getAppItemCounter.reqDataItemCounterList); //一覧取得 Select
app.get( getAppItemCounter.REQ_GETITEMCOUNTER_SERIES,getAppItemCounter.reqGetItemCounterSeries); //一覧取得 Select
app.get( getAppItemCounter.REQ_ITEMCOUNTER_LIMITTBL,getAppItemCounter.reqGetItemCounterLimit); //一覧取得 Select
// app.get( getAppItemCounter.REQ_ITEMCOUNTER_LIMITTBL_ID,getAppItemCounter.reqGetItemCounterSeries); //一覧取得 Select
app.post(getAppItemCounter.REQ_GETCOUNTFILE ,getAppItemCounter.reqGetDataCountFile); //GetFile（仮

// app.post(getAppItemCounter.REQ_ITEMCOUNTER_LIST_ID,getAppItemCounter.reqInsertDataPickList); //Insert
// app.get(getAppItemCounter.REQ_ITEMCOUNTER_EXPARAM,getAppItemCounter.reqDataPickListOne);  //１項目取得
// app.put(getAppItemCounter.REQ_GETCOUNTFILE,getAppItemCounter.reqUpdateDataPickList);  //Upate
// app.delete(constants.REQ_DATAPICK_LIST_ID,getAppDataPick.reqDeleteDataPickList); //Delete
// app.post(constants.REQ_GETPICKGZFILE ,getAppDataPick.reqGetDataPickFile); //GetFile（仮
 
//******************************************
//終了時 WorkerThread停止 - メモリリーク防止
process.on('SIGINT', () => {
	postgresWorker.terminateWorker();
	process.exit();
});
process.on('SIGTERM', () => {
	postgresWorker.terminateWorker();
	process.exit();
});

//******************************************
// 自リソース監視 5sec -> TitleBar
const monitor = new SystemMonitor();
const intervalId = monitor.startMonitoring(5000, (metrics) => {
  process.title = titlelabel +` # ${metrics.timestamp} cpu:${metrics.cpu.userCPUUsage}% mem:${metrics.memory.heapUsed}MB #`;
});

//******************************************
// WebAPI Worker起動
const PORT = process.env.DEBUG_FLG === 'true' ?  process.env.DEBUG_PORT as string : process.env.USER_PORT || 8085;

// BootMessage
common.bootlog(loggerWork,PROG_PARAM);
// (async () => {
	// HTTPSサーバーの作成と起動
	if (process.env.DEBUG_FLG == "true") {
		//試験中はreferer無視
		var server = app.listen(PORT, function () {
			loggerWork.info(`debug - HTTP サーバーが起動しました:`,PORT);
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
				loggerWork.info(`Production - HTTPS サーバーが起動しました:`,PORT);
			});
		} catch (e) {
			//認証ファイルがなければHTTP起動（分散側待ち受け）
			var server = app.listen(PORT, function () {
				loggerWork.info(`Production -  HTTP サーバーが起動しました(Non Cert):`,PORT);
			});
		}
	}
// });
//EOF
