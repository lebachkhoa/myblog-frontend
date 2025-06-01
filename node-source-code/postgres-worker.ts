// postgres-worker.ts
import { parentPort, workerData, isMainThread } from 'worker_threads';
// import { Client } from 'pg';
import knex from 'knex';
import * as common from "./common";
import * as constants from "./constants"; //定義値
import postgresKnex from "./postgresKnex";
// import NodeCache from "node-cache";

//DB 取得Cache
// const workerCache = new NodeCache();

const db = knex({
  client: 'pg', // 使用するDBクライアント（ここではPostgreSQL）
  connection: workerData // workerDataに接続情報が渡されていると仮定
});

// 編成一覧データ取得
async function runQueryFormList() {
	// console.log("statedb:",process.env.DATABASE_NAME, process.env.DATABASE_PSWD, process.env.DATABASE_USER, Number(process.env.DATABASE_PORT))

	let mergeJson: any[] = [];
	// "db_formlist" 編成一覧データを取得
	await postgresKnex(process.env.OutputFormlist as string)
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
	setFormListCache(mergeJson);
	return mergeJson;
//   console.log(mergeJson)
}

// 編成一覧データ取得
async function runQueryTroubleList() {
	// console.log("troublelist:",process.env.DATABASE_NAME, process.env.DATABASE_PSWD, process.env.DATABASE_USER, Number(process.env.DATABASE_PORT))

	let mergeJson: any[] = [];
	await postgresKnex(process.env.Troublelist as string)
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

	// ステータス順にソート
	// mergeJson.sort(common.sort_formpriority);
	setTrbListCache(mergeJson);
	return mergeJson;
}

// Setter/Getter
// NODE_CACHE_KEY_FORMLIST -> キャッシュ
function setFormListCache(data: any) {
//   workerCache.set(constants.NODE_CACHE_KEY_FORMLIST, data); 
  if (parentPort) {
    parentPort.postMessage({
      type: 'cacheUpdate',
      key: constants.NODE_CACHE_KEY_FORMLIST,
      data: data
    });
  } else if (!isMainThread) {
    console.warn('parentPort is null but not in main thread. Unable to send cache update.');
  }
}

// NODE_CACHE_KEY_TROUBLELIST -> キャッシュ
function setTrbListCache(data: any) {
	// workerCache.set(constants.NODE_CACHE_KEY_TROUBLELIST, data); 
	if (parentPort) {
	  parentPort.postMessage({
		type: 'cacheUpdate',
		key: constants.NODE_CACHE_KEY_TROUBLELIST,
		data: data
	  });
	} else if (!isMainThread) {
	  console.warn('parentPort is null but not in main thread. Unable to send cache update.');
	}	
}
// NODE_CACHE_KEY_PICKLIST -> キャッシュ
function setPickListCache(data: any) {
	// workerCache.set(constants.NODE_CACHE_KEY_TROUBLELIST, data); 
	if (parentPort) {
	  parentPort.postMessage({
		type: 'cacheUpdate',
		key: constants.NODE_CACHE_KEY_PICKLIST,
		data: data
	  });
	} else if (!isMainThread) {
	  console.warn('parentPort is null but not in main thread. Unable to send cache update.');
	}	
}

//定期更新 1sec
function scheduleNextRun() {
  setTimeout(async () => {
    await runQueryFormList();
    await runQueryTroubleList();
    scheduleNextRun();
  }, Number(process.env.UPDATE_INTERVAL) );
}

// 初期データ取得とスケジューリング開始
async function initialize() {
	await runQueryFormList();
	await runQueryTroubleList();
	scheduleNextRun();
  }

if (parentPort) {
	// Workerとして実行されている場合
	parentPort.on('message', (message) => {
	  if (message.type === 'initialFetch') {
		initialize();
	  }
	});
  } else if (!isMainThread) {
	console.warn('Running as a worker, but parentPort is null. This is unexpected.');
  } else {
	// メインスレッドとして実行されている場合
	console.log('Running in main thread. Initializing...');
	initialize();
  }
