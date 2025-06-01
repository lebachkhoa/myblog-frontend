///////////////////////////////////
// 稼働時間集計テーブル操作
// appItemCounter
//* Version 

import { Request, Response, NextFunction } from "express";
import fs from "fs";
import * as common from "./common";
import postgresKnex from "./postgresKnex";
import * as constants from "./constants";
import { __importStar } from "tslib";
import { loggerWork } from "./log4js";  //Logger(Log4js)
import xss from 'xss';

//TableName
const table_itemcounter = "db_item_countup"
const table_itemList = "db_countup_tabulate"
const db_item_limit = "db_item_limit"

//エンドポイント文字列 － フロントエンド 画面ページと共通値
const REQ_ITEMCOUNTER_LIST = "/api/itemcounterlist";
const REQ_ITEMCOUNTER_LIST_ID = "/api/itemcounterlist/:id"; //Update/Delete
const REQ_ITEMCOUNTER_EXPARAM = "/api/itemcounterexparam/:id"; //パラメタ変更
const REQ_ITEMCOUNTER_LIMITTBL = "/api/itemcounterLimit"; //項目ごと
const REQ_ITEMCOUNTER_LIMITTBL_ID = "/api/itemcounterLimit/:id"; //項目ごと
const REQ_GETCOUNTFILE = "/api/getitemcounter";
const REQ_GETITEMCOUNTER_SERIES = "/api/getitemcounterseries";


// Sanitize input to prevent XSS attacks
const sanitizeInput = (input: string) => {
    return xss(input);
};
//Get DataPick List
async function reqDataItemCounterList(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    let mergeJson: any[] = [];
    //認証チェッカ-->

    //<--

    try {
        // 自分のクラウドのデータを収集する
        await postgresKnex(table_itemList)
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
async function reqDataItemCounterOne(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    // Get a single item by ID
    //認証チェッカ-->

    //<--

    try {
        const itemId = sanitizeInput(req.params.id);
        const item = await postgresKnex(table_itemList).where({ c_id: itemId }).first();
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
        const msg = "reqDataPickListOne:" + error;
        loggerWork.info(msg);
    }
}
//1項目取得
async function reqGetItemCounterLimit(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {

    const authorization = req.headers.authorization;
    const username = req.headers.authorization;
    const usergroup = req.headers.usergroup; //ユーザグループ
    const carclass = req.headers.carclass;  //車系	
    const car_1num = req.headers.car_1num;  //車系	
    // Get a single item by ID
    //認証チェッカ-->

    //<--
    let mergeJson: any[] = [];
    try {
        // const Query = SELECT get_series_itemcount(2::smallint, 801::smallint);
        const Query = `SELECT * FROM ${db_item_limit} WHERE (c_car_shakei = '${carclass}' AND c_car_1num = '${car_1num}')`;
        await postgresKnex
            .raw(Query)
            .then(function (results: any) {
                mergeJson = results.rows;
                res.status(201).json(mergeJson);
            })
    } catch (err) {
        res.status(404);
        console.log(err);
    }
}
//項目取得 - 限界値 取得
//集計値series、設定上限値 limit 
async function reqGetItemCounterSeries(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {

    const authorization = req.headers.authorization;
    const username = req.headers.authorization;
    const usergroup = req.headers.usergroup; //ユーザグループ
    const carclass = req.headers.carclass;  //車系	
    const car_1num = req.headers.car_1num;  //車系	
    // Get a single item by ID
    //認証チェッカ-->

    if (carclass === "") {
        console.log("reqGetItemCounterSeries: invalid param ")
        res.status(404);
    }
    //<--
    //集計値series、設定上限値 limit 
    let mergeJson: { count?: any; limit?: any } = {};
    try {
        try {
            // const query1 = SELECT * FROM ${db_item_limit} WHERE (c_car_shakei='${carclass}' AND c_car_1num='${car_1num}');
            const query1 = `SELECT get_item_limit_json('${carclass}')`;
            const results1 = await postgresKnex.raw(query1);
            mergeJson.limit = results1.rows[0].get_item_limit_json;

            const query2 = `SELECT get_series_itemcount('${carclass}', '${car_1num}')`;
            console.log("call->", query2);
            const results2 = await postgresKnex.raw(query2);
            mergeJson.count = results2.rows[0].get_series_itemcount;

            res.status(201).json(mergeJson);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }

    } catch (err) {
        res.status(404);
        console.log(err);
    }
}

// Insert a new item
async function reqInsertDataPickList(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    //認証チェッカ-->

    //<--
    let mergeJson: any[] = [];
    try {
        // 自分のクラウドのデータを収集する
        await postgresKnex(table_itemList)
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

    // console.log(newItem);
    // const insertedItem = await postgresKnex(table_itemList).insert(newItem).returning("*");
    // res.status(201).json(insertedItem[0]);
    // } catch (error) {
    // 	const msg = "reqInsertDataPickList:" + error;
    // 	loggerWork.info(msg);		
    // 	res.status(500).json({ error: "Internal Server Error" });
    // }
}
// Update an item

async function reqUpdateDataItemCounter(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    //認証チェッカ-->

    //<--

    try {
        const itemId = sanitizeInput(req.params.id);
        const updatedItem = req.body;
        // Sanitize input for all fields to prevent XSS attacks
        Object.keys(updatedItem).forEach((key) => {
            updatedItem[key] = sanitizeInput(updatedItem[key]);
        });
        await postgresKnex(table_itemList).where({ c_id: itemId }).update(updatedItem);
        res.json(updatedItem);
    } catch (error) {
        const msg = "reqUpdateDataPickList:" + error;
        loggerWork.info(msg);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// Delete an item
async function reqDeleteDataPickList(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    //認証チェッカ-->

    //<--

    try {
        const itemId = sanitizeInput(req.body.id);
        const msg = "reqDeleteDataPickList:[" + req.body.id + "]";
        const filepath = constants.STR_CONFIG_DIR_COUNTDATA + req.body.filename;

        await postgresKnex(table_itemList).where({ c_id: itemId }).del();
        try {
            if (fs.existsSync(filepath)) {
                // ファイルを削除する
                fs.unlink(filepath, (err) => {
                    let msge = `(${msg}"ファイルが正常に削除されました)`
                    if (err) {
                        msge = `(${msg} ファイルの削除に失敗しました: ${err.message})`
                    }
                    loggerWork.info(msge);
                });
            }
        } catch (e: any) {
            const msg = "reqUpdateDataPickList:" + e.message;
            loggerWork.info(msg);
        }

        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        const msg = "reqUpdateDataPickList:" + error;
        loggerWork.info(msg);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

///////////////////////////////////
// Picked gzファイルのダウンロード
async function reqGetDataCountFile(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    //認証チェッカ-->

    //<--

    let filepath = constants.STR_CONFIG_DIR_COUNTDATA + req.body.filename;
    const msg = "reqGetDataPickFile:[" + req.body.id + "][" + req.body.filename + "]";

    try {
        if (req.body.filename !== "undefined") {
            if (fs.existsSync(filepath)) {
                res.sendFile(filepath, function (err) {
                    if (err) {
                        const msge = `(${msg}ファイル取得に失敗: ${err.message})`;
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

// 外部I/F
export {
    //Functions
    reqDataItemCounterList,
    reqDataItemCounterOne,
    reqInsertDataPickList,
    reqUpdateDataItemCounter,
    reqDeleteDataPickList,
    reqGetDataCountFile,
    reqGetItemCounterSeries,
    reqGetItemCounterLimit,
    //Endpoint
    REQ_ITEMCOUNTER_LIST,
    REQ_ITEMCOUNTER_LIST_ID,
    REQ_ITEMCOUNTER_EXPARAM,
    REQ_GETCOUNTFILE,
    REQ_GETITEMCOUNTER_SERIES,
    REQ_ITEMCOUNTER_LIMITTBL
};