import { Request, Response } from "express";
import * as admin from "firebase-admin";
import { Session } from "express-session";
import { ParsedQs } from "qs";
import { ParamsDictionary } from "express-serve-static-core";
import { auth } from "firebase-admin";

interface SessionUser {
	uid: string;
}

// セッションデータの型を拡張
interface CustomSessionData extends Session {
	user?: SessionUser;
}

// Request型を拡張
interface CustomRequest extends Request {
	session: CustomSessionData;
	headers: {
		username?: string;
		usergroup?: string;
		authorization?: string;
	};
}

// Firebase セッション情報 認証判定
const sessionAuthentication = async (req: CustomRequest, res: Response): Promise<boolean> => {
	if (req.session && req.session.user) {
		// セッションにユーザ情報が存在する場合は認証済みとして扱う
		console.log(req.headers.username, req.headers.usergroup, req.session, "session OK");
		return true;
	} else {
		try {
			if (!req.headers.authorization) {
				throw new Error("Authorization header is missing");
			}
			const decodedToken = await admin.auth().verifyIdToken(req.headers.authorization);
			const uid = decodedToken.uid;
			console.log(req.headers.username, req.headers.usergroup, uid, "authorization OK");
			req.session.user = { uid: uid }; // セッションにユーザ情報を保存
			return true;
		} catch (error) {
			console.log(req.headers.username, req.headers.usergroup, "authorization NG");
			res.sendStatus(401);
			return false;
		}
	}
};
//リクエストパラメータの取得
// function getRequestParams(req: Request<ParamsDictionary, any, any, ParsedQs>): {
//     screenid: string | ParsedQs | string[] | ParsedQs[] | undefined;
//     username: string | ParsedQs | string[] | ParsedQs[] | undefined;
//     usergroup: string | ParsedQs | string[] | ParsedQs[] | undefined;
//     authorization: string | undefined;
//   } {
//     return {
//       screenid: req.query.screenid,
//       username: req.query.username,
//       usergroup: req.query.usergroup,
//       authorization: req.headers.authorization
//     };
// }

function getRequestParams(req: Request): {
  screenid: string | undefined;
  username: string | undefined;
  usergroup: string | undefined;
  authorization: string | undefined;
} {
  return {
    screenid: typeof req.query.screenid === 'string' ? req.query.screenid : undefined,
    username: typeof req.query.username === 'string' ? req.query.username : undefined,
    usergroup: typeof req.query.usergroup === 'string' ? req.query.usergroup : undefined,
    authorization: typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined
  };
}


// パラメータのバリデーション
function validateParams(
	params: {
		screenid: any;
		username: any;
		usergroup: any;
		authorization: any;

	},
	res: Response
): boolean {
	// 必須パラメータの存在チェック
	if (!params.screenid || !params.username || !params.usergroup || !params.authorization) {
		res.status(400).json({
			error: "Missing required parameters",
			message: "screenid, username, usergroup, and authorization are required"
		});
		return false;
	}

	return true;
}
 

// Firebaseトークンの検証
async function verifyToken(authorization: string, res: Response): Promise<{ uid: string } | null> {
	try {
		//ダミーで追加
		if("true"=== process.env.DEBUG_AUTH){
			//認証ダミー
			console.log(`認証ダミー `);
			const decodedToken = {uid:"test@dymmy.com"};
			return decodedToken;
		}
		if (!authorization) {
			res.status(401).json({
			error: 'Unauthorized',
			message: 'No authorization token provided'
        });
        return null;
      }

      // Firebase Admin SDKを使用してトークンを検証
      const decodedToken = await auth().verifyIdToken(authorization);
      
      if (!decodedToken.uid) {
        res.status(401).json({
          error: 'Invalid token',
          message: 'Token verification failed'
        });
        return null;
      }

      return {
        uid: decodedToken.uid
      };

    } catch (error) {
      res.status(401).json({
        error: 'Token verification failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      return null;
	}
}

export { 
	sessionAuthentication, 
	getRequestParams, 
	validateParams, 
	verifyToken 
};
