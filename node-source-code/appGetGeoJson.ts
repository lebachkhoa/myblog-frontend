/////////////////////////////////
//* Pat-Monitor
//* webAPI- appGetGeoJson.ts 
//*         各種geoJsonダウンロード
//* 機能： WebAPI endoointからコールをうけ
//*        appGetGeoJsonデータを応答
//*        endpoint/Processの分離

import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

const FILE_MAP_DIR = "config/map";
//const FILE_STATION="Station.geojson";
//const FILE_STATION_POINT="Station_point.geojson";
//const FILE_RAILROAD_SECTION="RailroadSection.geojson";
//const FILE_BASE_AREA="Base.geojson";
//const FILE_ROSEN_NAME = "Rosen.geojson";
const FILE_STATION="Station.geojson.gz";
const FILE_STATION_POINT="Station_point.geojson.gz";
const FILE_RAILROAD_SECTION="RailroadSection.geojson.gz";
const FILE_BASE_AREA="Base.geojson.gz";
const FILE_ROSEN_NAME = "Rosen.geojson.gz";

//地図用Geojsonpath
function makePathMapConf(gzfile: string, usergrp: string) {
	const BASE_CONFIG_PATH = process.env.BASE_CONFIG_PATH as string;
	const usergroup = usergrp;
	// base /config/map/ ..targetfile
	const filepath = path.resolve(BASE_CONFIG_PATH, FILE_MAP_DIR, `${usergroup}_${gzfile}`);
	return filepath;
}

/////////////////////////////////
// 各種geoJsonダウンロード


// 駅範囲 取得 Station.geojson.gz
export async function getJsonStation(
	req: Request,
	res: Response,
	next: NextFunction
):Promise<void> {
	// ヘッダーからユーザーグループを取得
	const usergrp = req.headers["usergroup"];

	// ユーザーグループが定義されているか確認
	if (usergrp !== undefined) {
		// ファイルパスを構築
		const filepath = makePathMapConf(FILE_STATION, usergrp as string);
		if (fs.existsSync(filepath)) {
			// ファイルをクライアントに送信
			res.sendFile(filepath, (err: Error) => {
				if (err) {
					next(err);
				}
			});
		} else {
			console.log("getJsonStation:" +  "File Not Found",filepath);			
			res.status(404).send("404 Not Found");
		}
	} else {
		// パラメータがない場合
		console.log("getJsonStation" +  "Not Param");			
		res.status(404).send("404 Not Found");
	}
};

// 駅アイコン配置用 駅地点ポイント Station_point.geojson.gz (WebMapの動作に影響がでるので未使用)
export async function getJsonStationPoint(
	req: Request,
	res: Response,
	next: NextFunction
):Promise<void> {

	const usergrp = req.headers["usergroup"];
	if (usergrp !== "undefined") {
		const filepath = makePathMapConf(FILE_STATION_POINT, usergrp as string);
		if (fs.existsSync(filepath)) {
			res.sendFile(filepath, function (err) {
				if (err) {
					next(err);
				}
			});
		} else {
			console.log("getJsonStationPoint:" +  "File Not Found",filepath);			
			res.send("404 Not Found ");
		}
	} else {
		//パラメタ無し
		console.log("getJsonStationPoint" +  "Not Param");			
		res.send("404 Not Found ");
	}
};

//線路情報 "RailroadSection.geojson.gz"
export async function getJsonRail(
	req: Request,
	res: Response,
	next: NextFunction
):Promise<void> {
	const usergrp = req.headers["usergroup"];
	if (usergrp !== "undefined") {
		const filepath = makePathMapConf(FILE_RAILROAD_SECTION, usergrp as string);
		if (fs.existsSync(filepath)) {
			res.sendFile(filepath, function (err) {
				if (err) {
					next(err);
				}
			});
		} else {
			console.log("getJsonRail:" +  "File Not Found",filepath);			
			res.send("404 Not Found ");
		}
	} else {
		//パラメタ無し
		console.log("getJsonRail:" +  "Not Param");				
		res.send("404 Not Found ");
	}
};

//車両基地範囲 _Base.geojson.gz"
export async function getJsonBase(
	req: Request,
	res: Response,
	next: NextFunction
):Promise<void> {
	const usergrp = req.headers["usergroup"];
	if (usergrp !== "undefined") {
		const filepath = makePathMapConf(FILE_BASE_AREA, usergrp as string);
		if (fs.existsSync(filepath)) {
			res.sendFile(filepath, function (err) {
				if (err) {
					next(err);
				}
			});
		} else {
			console.log("getJsonBase:" +  "File Not Found",filepath);
			res.send("404 Not Found ");
		}
	} else {
		//パラメタ無し
		console.log("getJsonBase" +  "Not Param");			
		res.send("404 Not Found ");
	}
};

// 路線名 "_Rosen.geojson.gz"  
export async function getJsonRosen(
	req: Request,
	res: Response,
	next: NextFunction
):Promise<void> {
	const usergrp = req.headers["usergroup"];
	if (usergrp !== "undefined") {
		const filepath = makePathMapConf(FILE_ROSEN_NAME, usergrp as string);
		if (fs.existsSync(filepath)) {
			res.sendFile(filepath, function (err) {
				if (err) {
					next(err);
				}
			});
		} else {
			console.log("getJsonBase:" +  "File Not Found",filepath);				
			res.send("404 Not Found ");
		}
	} else {
		//パラメタ無し
		console.log("getJsonBase" +  "Not Param");			
		res.send("404 Not Found ");
	}
};

//外部I/F
export default {
	getJsonStation ,
	getJsonStationPoint ,
	getJsonRail, 
	getJsonBase, 
	getJsonRosen
};
