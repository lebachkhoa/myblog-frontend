//*****************************
//* Pat-Monitor
//* 汎用定義 ファイル
//* define.ts

// NodeCache  Key
const NODE_CACHE_KEY_SSE_CLIENTLIST = "KEY_SSE_CLIENT";
const NODE_CACHE_KEY_FORMLIST = "KEY_FORMLIST";
const NODE_CACHE_KEY_TROUBLELIST = "KEY_TROUBLELIST";
const NODE_CACHE_KEY_PICKLIST = "KEY_PICKLIST";
const NODE_CACHE_KEY_COUNTERLIST = "KEY_COUNTERLIST";

// リクエスト SSE エンドポイント
const REQ_STATE_SSE = "/api/sse";

const REQ_STATE_SSE_STREAM = "/api/stream";
const REQ_STATE_SSE_STREAM_TRB = "/api/stream_trb";
const REQ_STATE_SSE_STREAM_TRB_NOW = "/api/stream_trbnow";

//const REQ_STATE_SSE = "/api/:screenId";
const DEFINED_SCREEN_IDS = [NODE_CACHE_KEY_FORMLIST, NODE_CACHE_KEY_TROUBLELIST];

// リクエスト エンドポイント
const REQ_STATEDB = "/api/statedb";
const REQ_TROUBLE_NOW = "/api/troubledb_now";
const REQ_TROUBLE_NOW_FORMORDER = "/api/troubledb_now_FormOrder";
const REQ_TROUBLE = "/api/troubledb";
const REQ_CANARY = "/api/canary";
// 指定編成画面
const REQ_GETGPSPOS = "/api/getGpspos";
const REQ_GETGPSPOS_DB = "/api/getGpsposdb";
const REQ_GETCARDATA_FORMORDER = "/api/getCarDataFormOrder";
const REQ_GETCONF_FORMORDER = "/api/getConfFormOrder";
const REQ_GET_DATASET = "/api/getConfDataset";
// 地図情報geojson 
const REQ_GET_GEOJSON_STATION = "/api/getJsonStation";
const REQ_GET_GEOJSON_STATIONPOINT = "/api/getJsonStationPoint";
const REQ_GET_GEOJSON_RAIL = "/api/getJsonRail";
const REQ_GET_GEOJSON_BASE = "/api/getJsonBase";
const REQ_GET_GEOJSON_ROSEN = "/api/getJsonRosen";
//任意項目抽出
const REQ_DATAPICK_LIST = "/api/datapicklist"; //Select/Insert
const REQ_DATAPICK_LIST_ID = "/api/datapicklist/:id"; //Update/Delete
const REQ_FORMNO_LIST = "/api/getformnolist"; 
const REQ_GETPICKGZFILE = "/api/getdatapickgzFile";
const REQ_GETPICKGZSTREAM = "/api/getdatapickgzStream";

const REQ_ITEMCOUNTER_LIST = "/api/itemcounterlist"; 
// ファイル取得
const REQ_GETGZFILE = "/api/getgzFile";
const REQ_GET_ZIPINIFILE = "/api/getZipiniFile";
const REQ_GET_GROUPINIFILE = "/api/getGroupIniFile";
const REQ_GET_USERCONF = "/api/getUserConf";
const STR_CONFIG_FILE = "config.zip";
// ファイル ディレクトリ
const STR_CONFIG_DIR_CONF = "config";
const STR_CONFIG_DIR_DATAASET = "dataset";
const STR_CONFIG_DIR_MAP = "config/map";
const STR_CONFIG_DIR_LOG = "log";
const STR_CONFIG_DIR_NOWDATA = "data/NOW";
const STR_CONFIG_DIR_BD = "data/BD";
const STR_CONFIG_DIR_TRBDATA = "data/TRBDATA";
const STR_CONFIG_DIR_PICKDATA = "data/PICKDATA";
const STR_CONFIG_DIR_COUNTDATA = "data/COUNTDATA";

//
const STR_STATUS_404 = "404 Not Found";
const STR_STATUS_500 = "Internal Server Error";

export {
	REQ_STATE_SSE,
	REQ_STATE_SSE_STREAM_TRB,REQ_STATE_SSE_STREAM,REQ_STATE_SSE_STREAM_TRB_NOW,
	DEFINED_SCREEN_IDS,
	REQ_STATEDB,
	REQ_TROUBLE_NOW,
	REQ_TROUBLE_NOW_FORMORDER,
	REQ_TROUBLE,
	REQ_CANARY,
	REQ_GETGPSPOS,
	REQ_GETGPSPOS_DB,
	REQ_GETGZFILE,
	REQ_GET_ZIPINIFILE,
	REQ_GET_GROUPINIFILE,
	REQ_GETCARDATA_FORMORDER,
	REQ_GETCONF_FORMORDER,
	REQ_GET_USERCONF,
	REQ_GET_GEOJSON_STATION,
	REQ_GET_GEOJSON_STATIONPOINT,
	REQ_GET_GEOJSON_RAIL,
	REQ_GET_GEOJSON_BASE,
	REQ_GET_GEOJSON_ROSEN,
	REQ_DATAPICK_LIST,
	REQ_DATAPICK_LIST_ID,
	REQ_GETPICKGZFILE,
	REQ_GETPICKGZSTREAM,
	REQ_FORMNO_LIST,
	
	REQ_GET_DATASET,
	STR_CONFIG_FILE,
	NODE_CACHE_KEY_SSE_CLIENTLIST,
	NODE_CACHE_KEY_FORMLIST,
	NODE_CACHE_KEY_TROUBLELIST ,
	NODE_CACHE_KEY_PICKLIST ,
	NODE_CACHE_KEY_COUNTERLIST,
	STR_CONFIG_DIR_CONF,
	STR_CONFIG_DIR_DATAASET,
	STR_CONFIG_DIR_MAP ,
	STR_CONFIG_DIR_LOG ,
	STR_CONFIG_DIR_NOWDATA,
	STR_CONFIG_DIR_BD ,
	STR_CONFIG_DIR_TRBDATA ,
	STR_CONFIG_DIR_PICKDATA,
	STR_CONFIG_DIR_COUNTDATA,
	STR_STATUS_404,
	STR_STATUS_500
};
