#!/usr/bin/env node
/**
 * cocos-creator-mcp stdio bridge
 *
 * stdin で line-delimited JSON-RPC を読み取り、HTTP MCP エンドポイントに転送する。
 * レスポンスは stdout に 1 行ずつ書き出す。
 *
 * Claude Code VSCode 拡張の HTTP MCP OAuth 強制バグ (#26917 等) を回避するための
 * 代替トランスポート。ユーザーは .mcp.json で stdio 型として設定する:
 *
 *   {
 *     "mcpServers": {
 *       "cocos-creator-mcp": {
 *         "command": "node",
 *         "args": [
 *           "C:/path/to/cocos-creator-mcp/client/stdio-bridge.js"
 *         ]
 *       }
 *     }
 *   }
 *
 * Optional 環境変数:
 *   COCOS_MCP_URL  - MCP サーバーの URL (default: http://127.0.0.1:3000/mcp)
 */

"use strict";

const http = require("http");
const { URL } = require("url");
const readline = require("readline");

const DEFAULT_URL = "http://127.0.0.1:3000/mcp";
const serverUrl = new URL(process.env.COCOS_MCP_URL || DEFAULT_URL);

let sessionId = null;

function log(...args) {
    // デバッグログは stderr に出す（stdout は JSON-RPC 応答専用）
    console.error("[stdio-bridge]", ...args);
}

function postJsonRpc(body) {
    return new Promise((resolve, reject) => {
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Content-Length": Buffer.byteLength(body),
        };
        if (sessionId) headers["Mcp-Session-Id"] = sessionId;

        const req = http.request(
            {
                hostname: serverUrl.hostname,
                port: serverUrl.port || 80,
                path: serverUrl.pathname,
                method: "POST",
                headers,
            },
            (res) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () => {
                    const responseSession = res.headers["mcp-session-id"];
                    if (responseSession && !sessionId) {
                        sessionId = responseSession;
                        log("session established:", sessionId);
                    }
                    const text = Buffer.concat(chunks).toString("utf8");
                    resolve({ status: res.statusCode || 0, body: text });
                });
            }
        );

        req.on("error", (err) => reject(err));
        req.write(body);
        req.end();
    });
}

function writeResponse(obj) {
    process.stdout.write(JSON.stringify(obj) + "\n");
}

async function handleLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    let request;
    try {
        request = JSON.parse(trimmed);
    } catch (e) {
        writeResponse({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error", data: e.message },
        });
        return;
    }

    try {
        const { status, body } = await postJsonRpc(trimmed);
        // Notifications (no id) may yield empty body
        if (!body) {
            if (request.id !== undefined) {
                writeResponse({
                    jsonrpc: "2.0",
                    id: request.id,
                    error: { code: -32603, message: "Empty response from server", data: { status } },
                });
            }
            return;
        }
        // Pass through server response (single JSON object per line)
        try {
            const parsed = JSON.parse(body);
            writeResponse(parsed);
        } catch {
            // サーバーが SSE 等で返した場合のフォールバック
            process.stdout.write(body + (body.endsWith("\n") ? "" : "\n"));
        }
    } catch (err) {
        writeResponse({
            jsonrpc: "2.0",
            id: request.id !== undefined ? request.id : null,
            error: {
                code: -32603,
                message: "HTTP bridge error",
                data: err && err.message ? err.message : String(err),
            },
        });
    }
}

let inflight = 0;
let stdinClosed = false;

function maybeExit() {
    if (stdinClosed && inflight === 0) {
        log("stdin closed, no inflight, exiting");
        process.exit(0);
    }
}

function main() {
    log(`starting, target=${serverUrl.href}`);

    const rl = readline.createInterface({
        input: process.stdin,
        terminal: false,
    });

    rl.on("line", (line) => {
        inflight++;
        handleLine(line)
            .catch((e) => log("handler error:", e))
            .finally(() => {
                inflight--;
                maybeExit();
            });
    });

    rl.on("close", () => {
        stdinClosed = true;
        maybeExit();
    });

    process.on("SIGINT", () => process.exit(0));
    process.on("SIGTERM", () => process.exit(0));
}

main();
