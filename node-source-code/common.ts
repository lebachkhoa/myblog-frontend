//* common.ts
//* 機能：共通関数定義ファイル
import { Request } from "express";
import { DateTime } from "luxon";
import path from "path";
import * as fs from "fs";
import { Logger } from 'log4js';
import * as dotenv from "dotenv";
dotenv.config();

//汎用Key/Value IF
export interface comonKeyValue {
    [key: string] : string
}
//起動時メッセージ
// loggerは上位からのlog4js instance
function bootlog(logobj :Logger , appver : comonKeyValue) 
{
	logobj.info(`[ ${appver.PROG_NO} ][ ${appver.PROG_NAME} (${appver.PROG_VERSION}) ]`);
	logobj.info(`[ ${appver.PROG_ROLE}:${appver.PORT} ]`);
	logobj.info(`[ ${appver.USER_NAME} (${appver.GROUP_CODE})]`);
	logobj.info(`DEBUG:[${(appver.DEBUG === "true")?appver.DEBUG:"false"}] BasePath[${appver.BASE_CONFIG_PATH}]`);
	logobj.info(`DB: ${appver.DATABASE_HOST}:${appver.DATABASE_PORT} `);
}

//外部共通 汎用 Key/Value interface
interface ExtraParams {
	[key: string]: string;
}
declare module "express-serve-static-core" {
	interface Request {
		extraParams?: ExtraParams;
	}
}
function getFormattedTimestamp(): string {
	const now = DateTime.now(); // 現在の日時を取得
	return now.toFormat("yyyy/MM/dd HH:mm:ss"); // 指定されたフォーマットで出力
}
// TypeScriptの型定義
type TrbItem = {
	trb_time: string;
	c_trb_code: string;
};

type FormItem = {
	trouble: string;
	shaban: string;
};

// JSON Binding
// これらの関数は TypeScript のモジュールシステムをサポートするためのヘルパー関数です
// TypeScriptでは通常これらは不要なので、削除または無視することができます

// ソート処理(故障発生日時の降順)
function sort_trbtime(val1: TrbItem, val2: TrbItem): number {
	const time1 = val1.trb_time;
	const time2 = val2.trb_time;

	// 故障発生日時で並び替え
	if (time1 > time2) {
		return -1;
	}
	if (time1 < time2) {
		return 1;
	}
	return 0;
}

// ソート処理(故障優先度の昇順、故障発生日時の降順)
function sort_trbpriority(val1: TrbItem, val2: TrbItem): number {
	const code1 = val1.c_trb_code;
	const code2 = val2.c_trb_code;
	const time1 = val1.trb_time;
	const time2 = val2.trb_time;

	// 故障優先度で並び替え
	if (code1 !== code2) {
		return code1 > code2 ? 1 : -1;
	}
	// 故障発生日時で並び替え
	if (time1 !== time2) {
		return time1 > time2 ? -1 : 1;
	}
	return 0;
}

// フォームの優先度でソート
function sort_formpriority(val1: FormItem, val2: FormItem): number {
	const state1 = Number(val1.trouble) !== 0 ? 1 : 0;
	const state2 = Number(val2.trouble) !== 0 ? 1 : 0;
	const shaban1 = Number(val1.shaban);
	const shaban2 = Number(val2.shaban);

	// ステータスで並び替え
	if (state1 !== state2) {
		return state1 > state2 ? -1 : 1;
	}

	// 編成番号で並び替え
	if (shaban1 !== shaban2) {
		return shaban1 < shaban2 ? -1 : 1;
	}

	return 0;
}

// ArrayBufferをBase64文字列に変換
function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
	const buffer = Buffer.from(arrayBuffer);
	return buffer.toString("base64");
}

// クライアントのIPアドレスを取得（プロキシ経由の場合も対応）
const getClientIp = (req: Request): string => {
	const forwardedIpsStr = req.header("x-forwarded-for");
	if (forwardedIpsStr) {
		// "クライアントIP, プロキシ1 IP, プロキシ2 IP"
		// 最も右のIPアドレスがクライアントのIPアドレス
		const forwardedIps = forwardedIpsStr.split(",");
		return forwardedIps[0].trim();
	}
	return req.ip || "unknown";
};

//**********************************************
//JSON Config Read Func -Common-
function loadJsonConfig(jsonpath: string): { [key: string]: string } {
	let tgtpath: string = path.resolve(jsonpath as string);
	if (!fs.existsSync(tgtpath)) {
		throw new Error(`Config file not found at path: ${tgtpath}`);
	}
	const configData = fs.readFileSync(tgtpath, "utf-8");
	return JSON.parse(configData);
}
// 外部I/F
export {
	ExtraParams,
	bootlog,
	sort_trbtime,
	sort_trbpriority,
	sort_formpriority,
	arrayBufferToBase64,
	getClientIp,
	getFormattedTimestamp,
	loadJsonConfig
};
