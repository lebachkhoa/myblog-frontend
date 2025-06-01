///////////////////////////////////

// appDataPick
//* Version 

import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import * as common from "./common";
import postgresKnex from "./postgresKnex";
import * as constants from "./constants";
import { __importStar } from "tslib";
import { loggerWork } from "./log4js";  //Logger(Log4js)
import xss from 'xss';

const table_datapickdb = "datapicklist"

// Sanitize input to prevent XSS attacks
const sanitizeInput = (input: string) => {
    return xss(input);
};
//Get DataPick List
export async function reqDataPickList(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {	
	let mergeJson: any[] = [];
	try {
		// 自分のクラウドのデータを収集する
		await postgresKnex(table_datapickdb)
		.select("*")
		.then(function (results) {
			mergeJson = results;
		})
		.catch(function (err) {
			console.log(err);
		});
	
		res.send(JSON.stringify(mergeJson));

	} catch (error) {
		const msg = "reqDataPickList:" + error;
		loggerWork.info(msg);
		res.status(500).json({ error: "Internal Server Error" });
	}		
}

//1項目取得
export  async function reqDataPickListOne(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	// Get a single item by ID
	try {
		const itemId = sanitizeInput(req.params.id);
		const item = await postgresKnex(table_datapickdb).where({ c_id: itemId }).first();
		res.json(item);
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error" });
		const msg = "reqDataPickListOne:" + error;
		loggerWork.info(msg);		
	}
}
// Insert a new item
export async function reqInsertDataPickList(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const newItem = req.body;
		// Sanitize input for all fields to prevent XSS attacks
		Object.keys(newItem).forEach((key) => {
			newItem[key] = sanitizeInput(newItem[key]);
		});

		// console.log(newItem);
		const insertedItem = await postgresKnex(table_datapickdb).insert(newItem).returning("*");
		res.status(201).json(insertedItem[0]);
	} catch (error) {
		const msg = "reqInsertDataPickList:" + error;
		loggerWork.info(msg);		
		res.status(500).json({ error: "Internal Server Error" });
	}
}
	// Update an item

export async function reqUpdateDataPickList(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void>{	
	try {
		const itemId = sanitizeInput(req.params.id);
		const updatedItem = req.body;
		// Sanitize input for all fields to prevent XSS attacks
		Object.keys(updatedItem).forEach((key) => {
			updatedItem[key] = sanitizeInput(updatedItem[key]);
		});
		await postgresKnex(table_datapickdb).where({ c_id: itemId }).update(updatedItem);
		res.json(updatedItem);
	} catch (error) {
		const msg = "reqUpdateDataPickList:" + error;
		loggerWork.info(msg);	
		res.status(500).json({ error: "Internal Server Error" });
	}
}

// Delete an item
export async function reqDeleteDataPickList(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void>{	
	try {
		const itemId = sanitizeInput(req.body.id);
		const msg = "reqDeleteDataPickList:[" + req.body.id +"]";
		const filepath = constants.STR_CONFIG_DIR_PICKDATA + req.body.filename;
		
		await postgresKnex(table_datapickdb).where({ c_id: itemId }).del();
		try {
			if (fs.existsSync(filepath)) {
				// ファイルを削除する
				fs.unlink(filepath, (err) => {
					let msge = (`${msg}ファイルが正常に削除されました`)
					if (err) {
						msge = (`${msg}ファイルの削除に失敗しました: ${err.message}`)
					}
					loggerWork.info(msge);	
				});
			}
		} catch (e:any) {
			const msg = "reqUpdateDataPickList:" + e.message;
			loggerWork.info(msg);	
		}
		// } else 
		// {
		// 	// HTTPで他のマシンにリクエストを送信
		// 	const response = await fetch(req.body.url, {
		// 		method: "DELETE",
		// 		headers: {
		// 			"Content-Type": req.headers["content-type"],
		// 			Authorization: req.headers["authorization"],
		// 			UserName: req.headers["username"],
		// 			UserGroup: req.headers["usergroup"]
		// 		},
		// 		body: JSON.stringify(req.body)
		// 	});
		// }
		res.json({ message: "Item deleted successfully" });
	} catch (error) {
		const msg = "reqUpdateDataPickList:" + error;
		loggerWork.info(msg);			
		res.status(500).json({ error: "Internal Server Error" });
	}
}

///////////////////////////////////
// Picked gzファイルのダウンロード
export async function reqGetDataPickFile(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void>{	

	const targetpath = process.env.BASE_CONFIG_PATH as string;
	const filepath = path.resolve(targetpath, constants.STR_CONFIG_DIR_PICKDATA,  req.body.filename as string);
	const msg = "reqGetDataPickFile:[" + req.body.id +"]["+ req.body.filename+"]";

	try {
		if (req.body.filename !== "undefined") {
			if (fs.existsSync(filepath)) {
				console.log("reqGetDataPickFile call->", req.body.filename);
				res.sendFile(filepath, function (err) {
					if (err) {
						const msge = (`${msg}ファイル取得に失敗: ${err.message}`)
						loggerWork.info(msge);							
						// next(err);
					}
				});
			} 
		}
	} catch {
		loggerWork.info(msg + "ファイル取得に失敗");				
		res.send("404 Not Found");
	}
}

// データ保存ディレクトリ
const DATA_DIR = "./data";
//Get DataPick List


// 指定キー & タイムスタンプ範囲のファイルを取得
export async function reqGetDataStream(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void>{	


  const { id, start, end } = req.query;
  if (!id || !start || !end) {
	res.status(400).json("404 Not Found");
  }

  const startTime = Number(start);
  const endTime = Number(end);

//  try {
//    // ディレクトリ内のファイルを検索
//    const files = await fs.readdir(DATA_DIR);
//    const matchedFiles = files
//      .filter(f => f.startsWith(id) && f.endsWith(".gz")) // id_タイムスタンプ.bin
//      .map(f => {
//        const timestamp = Number(f.split("_")[1].replace(".gz", ""));
//        return { fileName: f, timestamp };
//      })
//      .filter(f => f.timestamp >= startTime && f.timestamp <= endTime)
//      .sort((a, b) => a.timestamp - b.timestamp);
//
//    // ファイルを順次読み込んで送信
//    const result = [];
//    for (const { fileName, timestamp } of matchedFiles) {
//      const filePath = path.join(DATA_DIR, fileName);
//      const buffer = await fs.readFile(filePath);
//      const base64Data = buffer.toString("base64");
//      result.push({ id, timestamp, data: base64Data });
//    }
//
//    res.json(result);
//  } catch (error) {
//    console.error("Error reading files:", error);
//    res.status(500).json({ error: "Server error" });
//  }
}



// 外部I/F
export default {
	reqDataPickList,
	reqDataPickListOne,
	reqInsertDataPickList,
	reqUpdateDataPickList,
	reqDeleteDataPickList,
	reqGetDataPickFile,
	reqGetDataStream
};
