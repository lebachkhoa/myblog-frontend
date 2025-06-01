//*****************************
//* Pat-Monitor
//* webAPI- appRequestAPI.ts 
//* リクエスト内部処理
//* 機能： WebAPI endoointからコールをうけ
//*        サーバ内処理を行い結果応答
//*        endpoint/Processの分離
//* Version 

import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import * as common from "./common";
import postgresKnex from "./postgresKnex";
import * as constants from "./constants";
import { __importStar } from "tslib";
import { loggerWork } from "./log4js";  //Logger(Log4js)

// 故障一覧取得 TrbAllList
export async function reqTroubleList(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	let mergeJson: any[] = [];
	// 自分のクラウドのデータを収集する
	await postgresKnex("troublelist")
		.select("c_id")
		.select("c_trb_shakei")
		.select("c_trb_1num")
		.select("c_trb_time", postgresKnex.raw("TO_CHAR(c_trb_time, 'YY/MM/DD HH24:MI:SS') as trb_time"))
		.select("c_trb_code")
		.select("c_trb_car")
		.select("c_trb_clearcar")
		.select("c_td_state")
		.select("c_td_from", postgresKnex.raw("TO_CHAR(c_td_from, 'YY/MM/DD HH24:MI:SS') as td_from"))
		.select("c_td_to", postgresKnex.raw("TO_CHAR(c_td_to, 'YY/MM/DD HH24:MI:SS') as td_to"))
		.select("c_td_filename")
		.orderByRaw("c_trb_time desc")
		.then(function (results: any[]) {
			mergeJson = results;
		})
		.catch(function (err: Error) {
			console.log(err);
		});

	res.send(JSON.stringify(mergeJson));
}

// 編成ごと現在発生中故障一覧（各編成 最高優先度1件）
export async function reqNowTroubleList(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	let mergeJson: any[] = [];
	let Query = `
    WITH tmp AS (
      SELECT *, ROW_NUMBER() OVER(PARTITION BY c_trb_shakei, c_trb_1num, c_trb_code ORDER BY c_trb_time DESC) as row_num
      FROM troublelist
    )
    SELECT c_id, c_trb_shakei, c_trb_1num, TO_CHAR(c_trb_time, 'YY/MM/DD HH24:MI:SS') as trb_time, 
           c_trb_code, c_trb_car, c_trb_clearcar, c_td_state, TO_CHAR(c_td_from, 'YY/MM/DD HH24:MI:SS') as td_from, 
           TO_CHAR(c_td_to, 'YY/MM/DD HH24:MI:SS') as td_to, c_td_filename
    FROM tmp
    WHERE tmp.row_num = 1 AND c_trb_car != 0
    ORDER BY c_trb_code, c_trb_time desc;
  `;

	// 自分のクラウドのデータを収集する
	await postgresKnex
		.raw(Query)
		.then(function (results: any) {
			mergeJson = results.rows;
		})
		.catch(function (err: Error) {
			console.log(err);
		});
	res.send(JSON.stringify(mergeJson));
}

// 編成一覧データ取得
export async function reqStateDB(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {

	console.log("statedb:",process.env.DATABASE_NAME, process.env.DATABASE_PSWD, process.env.DATABASE_USER, Number(process.env.DATABASE_PORT))

	let mergeJson: any[] = [];
	// 自分の編成一覧データを取得
	await postgresKnex("db_formlist")
		.select("*")
		.orderByRaw("tmsp desc")
		.then(function (results: any[]) {
			mergeJson = results;
		})
		.catch(function (err: Error) {
			console.log(err);
		});

	// ステータス順にソート
	mergeJson.sort(common.sort_formpriority);
	res.send(JSON.stringify(mergeJson));
}

// 編成ごと現在発生中故障一覧（各編成 最高優先度10件） - Ver1.1
export async function reqTroubleNowFormOrderx(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	// loggerWork.info("reqTroubleNowFormOrder ", req.query, req.headers.usergroup);
	const { username, shakei } = req.query;
	const usergroup = req.headers.usergroup; //ユーザグループ
	let mergeJson: any[] = [];
	let Query = `
    WITH tmp AS (
      SELECT *, ROW_NUMBER() OVER(PARTITION BY c_trb_shakei, c_trb_1num, c_trb_code ORDER BY c_trb_time DESC) as row_num
      FROM troublelist
    )
    SELECT c_id, c_trb_shakei, c_trb_1num, TO_CHAR(c_trb_time, 'YY/MM/DD HH24:MI:SS') as trb_time, 
           c_trb_code, c_trb_car, c_trb_clearcar, c_td_state, TO_CHAR(c_td_from, 'YY/MM/DD HH24:MI:SS') as td_from, 
           TO_CHAR(c_td_to, 'YY/MM/DD HH24:MI:SS') as td_to, c_td_filename
    FROM tmp
    WHERE tmp.c_trb_shakei = '${shakei}' AND tmp.c_trb_1num = '${req.query.shaban}' AND c_trb_car != 0
    ORDER BY c_trb_time desc LIMIT 10;
  `;
	// 自分のクラウドのデータを収集する
	await postgresKnex
		.raw(Query)
		.then(function (results: any) {
			mergeJson = results.rows;
		})
		.catch(function (err: Error) {
			console.log(err);
		});

	res.send(JSON.stringify(mergeJson));
}


//現在発生中故障最新 10件取得 - Ver.A3
//PostgreSQL 故障一覧Troubletable
export async function reqTroubleNowFormOrder(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
//	async function reqTroubleNowFormOrderArray(req, res, next) {
 //PostgreSQL 故障一覧Troubletable
	let mergeJson: any[] = [];
	
	const shakei = req.query.shakei;
	const shaban = req.query.shaban;
	const trbCodes = req.query?.trbcode?.toString().split(',').map(Number); // 配列データ

	const query = `SELECT * FROM get_latest_troubles(?, ?, ?)`;

	// 自分のクラウドのデータを収集する
	await postgresKnex
	.raw(query, [shakei, shaban, trbCodes])
	.then(function (results) {
		mergeJson = results.rows;
	})
	.catch(function (err) {
		console.log(err);
	});

	res.send(JSON.stringify(mergeJson));
};
// 各編成のGPS値を取得する Ver.A2
export async function reqGetGpsPosDB(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	let mergeJson: any[] = [];
	// headerパラメタ取得-すべて小文字-F/Eとマッチすること
	const { screenid, username, usergroup } = req.query;
	const authorization = req.headers.authorization;
	// 自分の編成一覧データを取得
	try {
		await postgresKnex("db_formlist")
			.select("shakei")
			.select("shaban")
			.select("gps")
			.select("carspeed")
			.select("station")
			.select("distance")
			.select("retsuban")
			.select("destination")
			.select("traintype")
			.select("notch")
			.orderByRaw("tmsp desc")
			.then(function (results: any[]) {
				mergeJson = results;
			})
			.catch(function (err: Error) {
				console.log(err);
			});

		// ステータス順にソート
		mergeJson.sort(common.sort_formpriority);

		let retDataArray: any[] = [];
		mergeJson.forEach((stGps) => {
			// 返送用JSONデータ生成
			let retData: any = {};
			retData["strSyakei"] = stGps["shakei"]; // 車系
			retData["strSyaban"] = stGps["shaban"]; // 車番
			retData["astrGpsloc"] = stGps["gps"]; // GPS緯度経度
			retDataArray.push(retData);
		});
		res.send(JSON.stringify(retDataArray));
	} catch {
		res.status(404).send(constants.STR_STATUS_404);
	}
}

// gzファイルのダウンロード
export async function reqGetGzFile(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	let filename = req.body.filename;
	console.log(filename);
	const authorization = req.headers.authorization;
	const usergroup = req.headers.usergroup; //ユーザグループ
	const carclass = req.headers.carclass; //車系
	//group match
	if (usergroup !== (process.env.GROUP_CODE as string)) {
		loggerWork.info(`getFile GroupCode Unmatch Request: ${usergroup} ${filename} `);
		res.status(404).send(constants.STR_STATUS_404);
		return;
	}

	const targetpath = process.env.BASE_CONFIG_PATH as string;
	const filepath = path.resolve(targetpath, constants.STR_CONFIG_DIR_TRBDATA,  filename as string);
	console.log(filename, targetpath);
	try {
		if (req.query.filename !== "undefined") {
			if (fs.existsSync(filepath)) {
				// ファイルがある場合ファイルを返す
				res.sendFile(filepath, function (err: Error) {
					if (err) {
						next(err);
					}
					loggerWork.info(`reqGetGzFile -->: ${usergroup} ${filename} `);
					
				});
			} else { 
				res.status(404).send("Not Found " + filename);
			}
		}
	} catch {
		res.status(404).send("Not Found " + filename);
	}
}

// gzファイルのダウンロード Ver.A2
export async function reqGetCardataFormOrder(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	const { screenid } = req.query;
	const authorization = req.headers.authorization;
	const username = req.headers.authorization;
	const usergroup = req.headers.authorization;
	const carclass = req.headers.carclass; //車系
	//[xx
	let filename = "NowData_" + req.query.shakeishaban + ".BIN"; // GET
	//[xx

	let filepath = path.resolve(
		process.env.BASE_CONFIG_PATH as string,
		constants.STR_CONFIG_DIR_NOWDATA,
		filename as string
	);
	// fsは絶対パスが必要
	try {
		if (req.query.filename !== "undefined") {
			if (fs.existsSync(filepath)) {
				// ファイルがある場合
				res.sendFile(filepath, function (err: Error) {
					if (err) {
						next(err);
					}
				});
			} else {
				res.send("Not Found " + filename);
			}
		}
	} catch {
		res.send("Not Found " + filename);
	}
}

export async function reqGetDataset(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	const { filename } = req.query;

	const authorization = req.headers.authorization;
	const username = req.headers.authorization;
	const usergroup = req.headers.usergroup; //ユーザグループ
	const carclass = req.headers.carclass;  //車系	
	//[xx
	const gzdir = process.env.BASE_CONFIG_PATH as string;

//	let filepath = path.resolve(__dirname, nowdir + "/" + filename);
	let filepath = path.resolve( process.env.BASE_CONFIG_PATH as string, constants.STR_CONFIG_DIR_CONF, carclass as string, constants.STR_CONFIG_DIR_DATAASET ,filename as string);
	console.log("reqGetDataset:",filepath);
	// 現行はNOWFILEを応答 ‐ 次版はPostgres NowData Tableより
	// fsは絶対パスが必要
	try {
		if (req.query.filename !== "undefined") {
			if (fs.existsSync(filepath)) {
				// ファイルがある場合
				res.sendFile(filepath, function (err: Error) {
					if (err) {
						next(err);
					}
				});
			} else {
				res.status(404).json({ error: "Not Found", filename: filename });
			}
		} else {
			res.status(404).json({ error: "Not Found", filename: filename });
		}
	} catch {
  		res.status(404).json({ error: "Not Found", filename: filename });
	}
}

//*********************************
// ユーザConfigダウンロード
export async function getUserConf(req: Request, res: Response, next: NextFunction): Promise<void> {

	const authorization = req.headers.authorization;
	const usergroup = req.headers.usergroup; //ユーザグループ
	const carclass = req.headers.carclass; //車系

	// .env.BASE_CONFIG_PATH / config / config.zip
	const targetpath = process.env.BASE_CONFIG_PATH as string;
	const filepath = path.resolve(targetpath, constants.STR_CONFIG_DIR_CONF, constants.STR_CONFIG_FILE);
	loggerWork.info("getUserConf ", req.headers.usergroup);
	try {
		if (req.query.filename !== "undefined") {
			if (fs.existsSync(filepath)) {
				// ファイルがある場合ファイルを返す
				res.sendFile(filepath, function (err: Error) {
					if (err) {
						next(err);
					}
				});
			} else {
				res.status(404).send("Not Found ");
			}
		}
	} catch {
		res.status(404).send("Not Found ");
	}
}

// ファイル取得関数の定義
export async function getFile(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	const { username,  filename } = req.query;
	const authorization = req.headers.authorization;
	const usergroup = req.headers.usergroup; //ユーザグループ
	const carclass = req.headers.carclass;  //車系
	// const filename = req.body.filename;
	//group match
	if(usergroup !== process.env.GROUP_CODE as string)
	{
		loggerWork.info(`getFile GroupCode Unmatch Request: ${usergroup} ${filename} `);
		res.status(404).send(constants.STR_STATUS_404);
		return;
	}

	const targetpath = process.env.BASE_CONFIG_PATH as string;
	const filepath = path.resolve(targetpath, constants.STR_CONFIG_DIR_CONF, carclass as string,  filename as string);
	console.log(filename, targetpath);
	try {
		if (filepath !== undefined) {
			// ファイルが存在するか確認
			if (fs.existsSync(filepath)) {
				// ファイルをクライアントに送信
				res.sendFile(filepath, (err: Error) => {
					if (err) {
						res.status(404).send(constants.STR_STATUS_404);
					}
				});
			} else {
				res.status(404).send(constants.STR_STATUS_404);
			}
		} else {
			// パラメータがない場合
			res.status(404).send(constants.STR_STATUS_404);
		}
	} catch (error) {
		console.error(error);
		res.status(500).send(constants.STR_STATUS_500);
	}
};

//******************************************
// 拡張パラメタWrapperGF
// In src/appRequestAPI.ts
export function withExtraParams(params: common.ExtraParams) {
	return function (req: Request, res: Response, next: NextFunction) {
		req.extraParams = params;
		next();
	};
}
//有効編成一覧取得
export async function reqGetFormNoList(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {	
	let mergeJson: any[] = [];
	const table_tbl_dsp_online = "tbl_dsp_online"
	try {
		// 自分のクラウドのデータを収集する
		await postgresKnex(table_tbl_dsp_online)
		.select("*")
		.then(function (results) {
			mergeJson = results;
		})
		.catch(function (err) {
			console.log(err);
		});
	
		res.send(JSON.stringify(mergeJson));

	} catch (error) {
		const msg = "reqGetFormNoList:" + error;
		loggerWork.info(msg);
		res.status(500).json({ error: "Internal Server Error" });
	}		
}
//*****************************************
// ユーザ フロントエンド  初回エントリ
// endpoints:  domain/api/getZipiniFile
// request type:POST
// body:idToken (フロントエンド認証済 FirbaseAuthenticated  ), email(ユーザ名)

//test
// app.post(constants.REQ_GET_ZIPINIFILE, async (req: Request, res: Response) => {
// 	const { idToken, email, group } = req.body;
// 	console.log(email,group)
// 	loggerWork.info(constants.REQ_GET_ZIPINIFILE,email);
// 	try 
// 	{		
// 		const confpath = path.join(process.env.BASE_CONFIG_PATH as string , constants.STR_CONFIG_FILE)
// 		console.log(confpath)
// 		//試験用コール .env
// 		if("true" !== dbgflg) 
// 		{
// 			// Firebase IDトークンの検証
// 			const decodedToken = await admin.auth().verifyIdToken(idToken);
// 			if (decodedToken.email === email)
// 			{
// 				getAppReq.getFile(req,res,confpath)
// 			}
// 			else
// 			{
// 				res.status(403).send({ message: "Invalid token" });
// 				console.log(`[${common.getFormattedTimestamp()}] ${req.body}`);
// 			}
// 		}
// 		else{
// 			//判定なしに応答
// 			getAppReq.getFile(req,res,confpath)
// 		}
// 	} catch (error: any) {
// 		res.status(403).send({ message: "Invalid token", error: error.message });
// 		console.log(`[${common.getFormattedTimestamp()}] ${req.body}`);
// 		loggerWork.info(constants.REQ_GET_ZIPINIFILE,email,"Invalid token");
// 	}
// });

//******************************************
// 生存確認エンドポイント
export async function reqCanary(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	res.status(200).send({
		message: "alive",
	});
}

// 外部I/F
export default {
	reqCanary,
	// ReqJsonSecondaryData,
	// ReqFileSecondaryData,
	reqTroubleList,
	reqNowTroubleList,
	reqStateDB,
	reqTroubleNowFormOrder,
	getUserConf,
	reqGetGpsPosDB,
	reqGetGzFile,
	getFile,
	reqGetDataset,
	reqGetCardataFormOrder,
	withExtraParams,
	reqGetFormNoList
};
