import express from "express";
import * as https from "https";
import * as fs from "fs";
import path from "path";
import { cert } from "firebase-admin/app";

const dbgflg = true;

const app = express();
// app.use(exppressMiddleWare);

const PORT = 8080;

if(dbgflg) {
    const server = app.listen(PORT, function () {
        "log"
    });
} else {
    try {
        const options: https.ServerOptions = {
            key: fs.readFileSync(path.resolve(__dirname, "/ssl/localhost-key.pem")),
            cert: fs.readFileSync(path.resolve(__dirname, "/ssl/localhost.pem"))
        };
    } catch (e) {
        const server = app.listen(PORT, function(){
            "log"
        });
    }
}

