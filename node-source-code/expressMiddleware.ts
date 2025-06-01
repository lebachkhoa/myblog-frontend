//*****************************
//* Pat-Monitor
//* expressMiddleware
//* 機能： Node/js / Express の共通設定
//*
//* const app = express();
//* app.use(expressMiddleware);

//* Version
let appVer: string = "A1.0.0";
//モジュールをインポート
import express, { Request, Response, NextFunction } from "express"; // Expressフレームワークと型定義
import bodyParser from "body-parser"; // リクエストボディのパース用（この例では使用していないが、一般的によく使用される）
import helmet from "helmet"; // HTTPヘッダーセキュリティ
import cors from "cors"; // Cross-Origin Resource Sharing (CORS) の設定
import passport from "passport"; // 認証ミドルウェア
import session from "express-session"; // セッション管理
import compression from "compression"; // レスポンス圧縮
import dotenv from "dotenv"; // 環境変数の管理

//環境変数
dotenv.config();

// Express 共通設定 *************************
const expressMiddleware = express();

// URLエンコードされたボディをパースするミドルウェアを設定（拡張モードを有効化）
expressMiddleware.use(express.urlencoded({ extended: true }));
// JSONボディをパースするミドルウェアを設定
expressMiddleware.use(express.json());

// エラーハンドリングミドルウェア：サーバーエラー時に500ステータスコードを返す
expressMiddleware.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err.stack);
	res.status(500).send("Something broke!");
});

// セキュリティ設定 **************************
// セッション設定オプション
const sessionOptions: session.SessionOptions = {
	secret: process.env.COOKIE_SECRET || "default_secret", // セッションIDの暗号化に使用する秘密鍵
	resave: false, // セッションデータが変更されていない場合も強制的に保存しない
	name: "pat-train", // セッションIDのクッキー名
	saveUninitialized: true, // 初期化されていないセッションも保存する
	cookie: {
		secure: true, // HTTPS経由でのみクッキーを送信
		httpOnly: true,
		sameSite: "strict",
		maxAge: 24 * 60 * 60 * 1000 // クッキーの有効期限（1日）
	}
};

// セッションミドルウェアを設定
expressMiddleware.use(session(sessionOptions));


const allowedOrigins = process.env.WHITELIST
	? process.env.WHITELIST.split(",")
			.map((origin) => origin.replace(/\s|\n/g, "").trim()) // 改行と空白を削除
			.filter((origin) => origin) // 空の要素を削除
	: [];
	
if( process.env.DEBUG_FLG === 'true') {
	console.log("CORS whitelist",allowedOrigins);
}
// CORSオプション：すべてのオリジンからのリクエストを許可
// const corsOptions: cors.CorsOptions = {
// 	origin: "*"
// };
// CORSミドルウェアの設定
expressMiddleware.use(
	cors({
		// origin: "*" //Debug
		// 以下リリース時
		origin: (origin, callback) => {
			// リクエストのオリジンがホワイトリストに含まれているか確認
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true); // 許可
			} else {
				callback(new Error("Not allowed by CORS")); // 許可しない
			}
		},
		methods: ["GET", "POST", "PUT", "DELETE"],
		allowedHeaders: ["screeid", "username", "usergroup","carclass","car_1num", "authorization", "Content-Type"],
		credentials: true ,// 認証情報を含める場合
   		optionsSuccessStatus: 200 //レスポンスstatusを200に設定
	})
);

// レスポンス圧縮ミドルウェアを設定（圧縮レベル最大）
expressMiddleware.use(compression({ level: 9 }));
// Passportの初期化
expressMiddleware.use(passport.initialize());
// Passportでセッションを使用
expressMiddleware.use(passport.session());

// Helmetによる各種セキュリティヘッダの設定
expressMiddleware.use(helmet.dnsPrefetchControl()); // DNSプリフェッチの制御
expressMiddleware.use(helmet.frameguard()); // クリックジャッキング防止
expressMiddleware.use(helmet.hidePoweredBy()); // X-Powered-Byヘッダーの削除
expressMiddleware.use(helmet.ieNoOpen()); // IEでのファイルダウンロードの制御
expressMiddleware.use(helmet.noSniff()); // MIMEタイプスニッフィングの防止
expressMiddleware.use(helmet.permittedCrossDomainPolicies()); // クロスドメインポリシーの設定
// expressMiddleware.use(helmet.referrerPolicy()); // リファラーポリシーの設定
expressMiddleware.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));

expressMiddleware.use(helmet.xssFilter()); // XSS保護の有効化
expressMiddleware.use(helmet.hsts()); // HTTP Strict Transport Security
expressMiddleware.use(
	helmet.hsts({
		maxAge: process.env.NODE_ENV === "production" ? 63072000 : 0, // 本番環境でのみ2年間
		includeSubDomains: true,
		preload: true
	})
);

// エクスポート **********************
export default expressMiddleware;