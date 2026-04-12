"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServer = exports.BUILD_HASH = void 0;
exports.getGameLogs = getGameLogs;
exports.clearGameLogs = clearGameLogs;
exports.queueGameCommand = queueGameCommand;
exports.getCommandResult = getCommandResult;
exports.clearCommandState = clearCommandState;
exports.getRecording = getRecording;
exports.setRecording = setRecording;
const http_1 = __importDefault(require("http"));
const types_1 = require("./types");
const archive_1 = require("./archive");
const MCP_PROTOCOL_VERSION = "2024-11-05";
const SESSION_ID = `cocos-mcp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
/** ビルド時にコードベースのSHA256ハッシュが埋め込まれる */
exports.BUILD_HASH = "5440ae135e3c";
const MAX_GAME_LOG_BUFFER = 500;
const _gameLogs = [];
/** Access game preview log buffer from debug-tools */
function getGameLogs(count, level) {
    let logs = _gameLogs;
    if (level) {
        logs = logs.filter(l => l.level === level);
    }
    return { logs: logs.slice(-count), total: _gameLogs.length };
}
function clearGameLogs() {
    _gameLogs.length = 0;
}
let _pendingCommand = null;
let _commandResult = null;
let _commandIdCounter = 0;
/** Queue a command for the game to execute */
function queueGameCommand(type, args) {
    const id = `cmd_${++_commandIdCounter}_${Date.now()}`;
    _pendingCommand = { id, type, args, timestamp: new Date().toISOString() };
    _commandResult = null;
    return id;
}
/** Get the result of the last command (poll until available) */
function getCommandResult() {
    return _commandResult;
}
/** Clear command state */
function clearCommandState() {
    _pendingCommand = null;
    _commandResult = null;
}
const _recordings = new Map();
/** Get completed recording info by id */
function getRecording(id) {
    return _recordings.get(id);
}
function setRecording(id, info) {
    _recordings.set(id, info);
}
class McpServer {
    constructor(config) {
        this.server = null;
        this.tools = new Map();
        this.toolIndex = new Map(); // toolName -> category
        this.config = Object.assign(Object.assign({}, types_1.DEFAULT_CONFIG), config);
    }
    /** Register a tool category */
    register(category) {
        this.tools.set(category.categoryName, category);
        for (const tool of category.getTools()) {
            this.toolIndex.set(tool.name, category);
        }
    }
    /** Get all tool definitions */
    getAllTools() {
        const all = [];
        for (const cat of this.tools.values()) {
            all.push(...cat.getTools());
        }
        return all;
    }
    /** Start HTTP server */
    start() {
        return new Promise((resolve, reject) => {
            if (this.server) {
                resolve();
                return;
            }
            this.server = http_1.default.createServer((req, res) => this.handleRequest(req, res));
            this.server.listen(this.config.port, "127.0.0.1", () => {
                console.log(`[cocos-creator-mcp] Server started on http://127.0.0.1:${this.config.port}/mcp`);
                resolve();
            });
            this.server.on("error", (e) => {
                console.error(`[cocos-creator-mcp] Server error:`, e);
                reject(e);
            });
        });
    }
    /** Stop HTTP server */
    stop() {
        return new Promise((resolve) => {
            if (!this.server) {
                resolve();
                return;
            }
            this.server.close(() => {
                this.server = null;
                console.log("[cocos-creator-mcp] Server stopped");
                resolve();
            });
        });
    }
    get isRunning() {
        return this.server !== null;
    }
    get port() {
        return this.config.port;
    }
    async handleRequest(req, res) {
        var _a, _b;
        // CORS
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }
        const url = req.url || "/";
        const origin = `http://127.0.0.1:${this.config.port}`;
        // ─── OAuth endpoints (MCP spec 2025-06-18 / RFC 9728 / RFC 8414 / RFC 7591) ───
        //
        // Claude Code の VSCode 拡張は HTTP トランスポートの MCP サーバーに対して
        // 無条件で OAuth discovery / DCR を試みる (#26917 等の既知バグ)。
        // cocos-creator-mcp は localhost-only のローカル開発ツールで本物の認証は不要だが、
        // クライアントを満足させるため OAuth エンドポイント群をダミー実装して常時許可する。
        //
        // TODO: 以下のいずれかが発生したら削除する
        //   1. anthropics/claude-code #26917 / #38102 等の HTTP OAuth バグが修正される
        //   2. 本物の認証機構を実装する必要が出る（偽 OAuth と衝突するため）
        //   3. MCP spec が PKCE 検証・トークンローテーション必須等に更新される
        //   4. stdio ブリッジが十分定着して HTTP transport 自体を deprecate する
        // RFC 9728 Protected Resource Metadata
        if (url === "/.well-known/oauth-protected-resource" && req.method === "GET") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                resource: `${origin}/mcp`,
                authorization_servers: [origin],
                bearer_methods_supported: ["header"],
                scopes_supported: ["mcp"],
            }));
            return;
        }
        // RFC 8414 Authorization Server Metadata
        if (url === "/.well-known/oauth-authorization-server" && req.method === "GET") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                issuer: origin,
                authorization_endpoint: `${origin}/oauth/authorize`,
                token_endpoint: `${origin}/oauth/token`,
                registration_endpoint: `${origin}/oauth/register`,
                response_types_supported: ["code"],
                grant_types_supported: ["authorization_code"],
                code_challenge_methods_supported: ["S256", "plain"],
                token_endpoint_auth_methods_supported: ["none"],
                scopes_supported: ["mcp"],
            }));
            return;
        }
        // RFC 7591 Dynamic Client Registration — accept anything, return dummy client
        if (url === "/oauth/register" && req.method === "POST") {
            const body = await readBody(req);
            let reg = {};
            try {
                reg = JSON.parse(body);
            }
            catch ( /* ignore */_c) { /* ignore */ }
            const clientId = `cocos-mcp-client-${Date.now()}`;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                client_id: clientId,
                client_id_issued_at: Math.floor(Date.now() / 1000),
                client_name: reg.client_name || "cocos-creator-mcp client",
                redirect_uris: reg.redirect_uris || [],
                token_endpoint_auth_method: "none",
                grant_types: ["authorization_code"],
                response_types: ["code"],
            }));
            return;
        }
        // OAuth authorization endpoint — auto-consent, redirect immediately with code
        if (url.startsWith("/oauth/authorize") && req.method === "GET") {
            const parsed = new URL(url, origin);
            const redirectUri = parsed.searchParams.get("redirect_uri") || "";
            const state = parsed.searchParams.get("state") || "";
            if (!redirectUri) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "invalid_request", error_description: "redirect_uri required" }));
                return;
            }
            const code = `cocos-mcp-code-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            const location = `${redirectUri}${redirectUri.includes("?") ? "&" : "?"}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
            res.writeHead(302, { Location: location });
            res.end();
            return;
        }
        // OAuth token endpoint — always issue a dummy token
        if (url === "/oauth/token" && req.method === "POST") {
            await readBody(req); // drain
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
            });
            res.end(JSON.stringify({
                access_token: "cocos-mcp-public-token",
                token_type: "Bearer",
                expires_in: 86400,
                scope: "mcp",
            }));
            return;
        }
        // Health check
        if (url === "/health" && req.method === "GET") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "ok", tools: this.getAllTools().length }));
            return;
        }
        // Game debug command queue — game polls for commands
        if (url === "/game/command" && req.method === "GET") {
            const cmd = _pendingCommand;
            _pendingCommand = null; // consume
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(cmd));
            return;
        }
        // Game debug command result — game posts result
        if (url === "/game/result" && req.method === "POST") {
            const body = await readBody(req);
            try {
                _commandResult = JSON.parse(body);
            }
            catch ( /* ignore */_d) { /* ignore */ }
            res.writeHead(204);
            res.end();
            return;
        }
        // Game preview recording receiver
        if (url === "/game/recording" && req.method === "POST") {
            const body = await readBody(req);
            try {
                const { id, base64, mimeType, savePath } = JSON.parse(body);
                if (!id || !base64)
                    throw new Error("id/base64 required");
                const fs = require("fs");
                const path = require("path");
                const buffer = Buffer.from(base64, "base64");
                // savePath指定があればそこに保存（絶対パスまたはプロジェクト相対パス）
                const projectPath = ((_b = (_a = global.Editor) === null || _a === void 0 ? void 0 : _a.Project) === null || _b === void 0 ? void 0 : _b.path)
                    || process.cwd();
                let dir;
                if (savePath) {
                    dir = path.isAbsolute(savePath) ? savePath : path.join(projectPath, savePath);
                }
                else {
                    dir = path.join(projectPath, "temp", "recordings");
                }
                if (!fs.existsSync(dir))
                    fs.mkdirSync(dir, { recursive: true });
                const mt = (mimeType || "").toLowerCase();
                const ext = mt.includes("webm") ? "webm"
                    : mt.includes("mp4") ? "mp4"
                        : "bin";
                const fileName = `${id}.${ext}`;
                const filePath = path.join(dir, fileName);
                fs.writeFileSync(filePath, buffer);
                setRecording(id, {
                    path: filePath,
                    size: buffer.length,
                    createdAt: new Date().toISOString(),
                });
                if (this.config.autoArchiveRecordings) {
                    (0, archive_1.archiveOldFiles)(dir);
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, path: filePath, size: buffer.length }));
            }
            catch (e) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
            return;
        }
        // Game preview log receiver
        if (url === "/log" && req.method === "POST") {
            const body = await readBody(req);
            try {
                const entries = JSON.parse(body);
                for (const entry of (Array.isArray(entries) ? entries : [entries])) {
                    _gameLogs.push({
                        timestamp: entry.timestamp || new Date().toISOString(),
                        level: entry.level || "log",
                        message: entry.message || "",
                    });
                }
                if (_gameLogs.length > MAX_GAME_LOG_BUFFER) {
                    _gameLogs.splice(0, _gameLogs.length - MAX_GAME_LOG_BUFFER);
                }
            }
            catch ( /* ignore malformed */_e) { /* ignore malformed */ }
            res.writeHead(204);
            res.end();
            return;
        }
        // MCP endpoint
        if (url === "/mcp") {
            if (req.method === "GET") {
                // SSE keepalive stream
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                });
                // Send initial comment to keep connection alive
                res.write(": connected\n\n");
                return;
            }
            if (req.method === "POST") {
                await this.handleMcpPost(req, res);
                return;
            }
            if (req.method === "DELETE") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true }));
                return;
            }
        }
        // 404
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
    }
    async handleMcpPost(req, res) {
        var _a, _b;
        const body = await readBody(req);
        let rpc;
        try {
            rpc = JSON.parse(body);
        }
        catch (_c) {
            this.sendJsonRpc(res, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
            return;
        }
        const accept = req.headers["accept"] || "";
        const wantSse = accept.includes("text/event-stream");
        let response;
        switch (rpc.method) {
            case "initialize":
                response = {
                    jsonrpc: "2.0",
                    id: rpc.id,
                    result: {
                        protocolVersion: MCP_PROTOCOL_VERSION,
                        capabilities: { tools: {} },
                        serverInfo: {
                            name: "cocos-creator-mcp",
                            version: "1.0.0",
                        },
                    },
                };
                break;
            case "notifications/initialized":
                // No response needed for notification
                res.writeHead(204, { "Mcp-Session-Id": SESSION_ID });
                res.end();
                return;
            case "tools/list":
                response = {
                    jsonrpc: "2.0",
                    id: rpc.id,
                    result: { tools: this.getAllTools() },
                };
                break;
            case "tools/call": {
                const toolName = (_a = rpc.params) === null || _a === void 0 ? void 0 : _a.name;
                const args = ((_b = rpc.params) === null || _b === void 0 ? void 0 : _b.arguments) || {};
                const category = this.toolIndex.get(toolName);
                if (!category) {
                    response = {
                        jsonrpc: "2.0",
                        id: rpc.id,
                        error: { code: -32602, message: `Unknown tool: ${toolName}` },
                    };
                }
                else {
                    try {
                        const start = Date.now();
                        console.log(`[cocos-creator-mcp] ▶ ${toolName}`, Object.keys(args).length > 0 ? JSON.stringify(args).substring(0, 200) : "");
                        const timeoutMs = (toolName.startsWith("prefab_") || toolName === "scene_open") ? 120000 : 30000;
                        const result = await withTimeout(category.execute(toolName, args), timeoutMs, `Tool ${toolName} timed out`);
                        console.log(`[cocos-creator-mcp] ✓ ${toolName} (${Date.now() - start}ms)`);
                        response = {
                            jsonrpc: "2.0",
                            id: rpc.id,
                            result,
                        };
                    }
                    catch (e) {
                        console.error(`[cocos-creator-mcp] ✗ ${toolName}:`, e.message || String(e));
                        response = {
                            jsonrpc: "2.0",
                            id: rpc.id,
                            error: { code: -32603, message: e.message || String(e) },
                        };
                    }
                }
                break;
            }
            default:
                response = {
                    jsonrpc: "2.0",
                    id: rpc.id,
                    error: { code: -32601, message: `Method not found: ${rpc.method}` },
                };
        }
        if (wantSse) {
            this.sendSse(res, [response]);
        }
        else {
            this.sendJsonRpc(res, response);
        }
    }
    sendJsonRpc(res, data) {
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Mcp-Session-Id": SESSION_ID,
        });
        res.end(JSON.stringify(data));
    }
    sendSse(res, messages) {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Mcp-Session-Id": SESSION_ID,
        });
        for (const msg of messages) {
            res.write(`event: message\ndata: ${JSON.stringify(msg)}\n\n`);
        }
        res.end();
    }
}
exports.McpServer = McpServer;
function withTimeout(promise, ms, message) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), ms);
        promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
    });
}
function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        req.on("error", reject);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tY3Atc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQXNCQSxrQ0FNQztBQUVELHNDQUVDO0FBd0JELDRDQUtDO0FBR0QsNENBRUM7QUFHRCw4Q0FHQztBQWFELG9DQUVDO0FBRUQsb0NBRUM7QUEzRkQsZ0RBQXdCO0FBQ3hCLG1DQUFzSDtBQUN0SCx1Q0FBNEM7QUFFNUMsTUFBTSxvQkFBb0IsR0FBRyxZQUFZLENBQUM7QUFDMUMsTUFBTSxVQUFVLEdBQUcsYUFBYSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFFNUYsb0NBQW9DO0FBQ3ZCLFFBQUEsVUFBVSxHQUFHLGdCQUFnQixDQUFDO0FBVTNDLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0FBQ2hDLE1BQU0sU0FBUyxHQUFtQixFQUFFLENBQUM7QUFFckMsc0RBQXNEO0FBQ3RELFNBQWdCLFdBQVcsQ0FBQyxLQUFhLEVBQUUsS0FBYztJQUNyRCxJQUFJLElBQUksR0FBRyxTQUFTLENBQUM7SUFDckIsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0QsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNqRSxDQUFDO0FBRUQsU0FBZ0IsYUFBYTtJQUN6QixTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUN6QixD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RUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGh0dHAgZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgSnNvblJwY1JlcXVlc3QsIEpzb25ScGNSZXNwb25zZSwgU2VydmVyQ29uZmlnLCBERUZBVUxUX0NPTkZJRyB9IGZyb20gXCIuL3R5cGVzXCI7XHJcbmltcG9ydCB7IGFyY2hpdmVPbGRGaWxlcyB9IGZyb20gXCIuL2FyY2hpdmVcIjtcclxuXHJcbmNvbnN0IE1DUF9QUk9UT0NPTF9WRVJTSU9OID0gXCIyMDI0LTExLTA1XCI7XHJcbmNvbnN0IFNFU1NJT05fSUQgPSBgY29jb3MtbWNwLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgMTApfWA7XHJcblxyXG4vKiog44OT44Or44OJ5pmC44Gr44Kz44O844OJ44OZ44O844K544GuU0hBMjU244OP44OD44K344Ol44GM5Z+L44KB6L6844G+44KM44KLICovXHJcbmV4cG9ydCBjb25zdCBCVUlMRF9IQVNIID0gXCJfX0JVSUxEX0hBU0hfX1wiO1xyXG5cclxuLy8g4pSA4pSA4pSAIEdhbWUgUHJldmlldyBMb2cgQnVmZmVyIOKUgOKUgOKUgFxyXG5cclxuaW50ZXJmYWNlIEdhbWVMb2dFbnRyeSB7XHJcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcclxuICAgIGxldmVsOiBcImxvZ1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCI7XHJcbiAgICBtZXNzYWdlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IE1BWF9HQU1FX0xPR19CVUZGRVIgPSA1MDA7XHJcbmNvbnN0IF9nYW1lTG9nczogR2FtZUxvZ0VudHJ5W10gPSBbXTtcclxuXHJcbi8qKiBBY2Nlc3MgZ2FtZSBwcmV2aWV3IGxvZyBidWZmZXIgZnJvbSBkZWJ1Zy10b29scyAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2FtZUxvZ3MoY291bnQ6IG51bWJlciwgbGV2ZWw/OiBzdHJpbmcpOiB7IGxvZ3M6IEdhbWVMb2dFbnRyeVtdOyB0b3RhbDogbnVtYmVyIH0ge1xyXG4gICAgbGV0IGxvZ3MgPSBfZ2FtZUxvZ3M7XHJcbiAgICBpZiAobGV2ZWwpIHtcclxuICAgICAgICBsb2dzID0gbG9ncy5maWx0ZXIobCA9PiBsLmxldmVsID09PSBsZXZlbCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geyBsb2dzOiBsb2dzLnNsaWNlKC1jb3VudCksIHRvdGFsOiBfZ2FtZUxvZ3MubGVuZ3RoIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhckdhbWVMb2dzKCk6IHZvaWQge1xyXG4gICAgX2dhbWVMb2dzLmxlbmd0aCA9IDA7XHJcbn1cclxuXHJcbi8vIOKUgOKUgOKUgCBHYW1lIERlYnVnIENvbW1hbmQgUXVldWUg4pSA4pSA4pSAXHJcblxyXG5pbnRlcmZhY2UgR2FtZUNvbW1hbmQge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHR5cGU6IHN0cmluZztcclxuICAgIGFyZ3M/OiBhbnk7XHJcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIEdhbWVDb21tYW5kUmVzdWx0IHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBzdWNjZXNzOiBib29sZWFuO1xyXG4gICAgZGF0YT86IGFueTtcclxuICAgIGVycm9yPzogc3RyaW5nO1xyXG4gICAgdGltZXN0YW1wOiBzdHJpbmc7XHJcbn1cclxuXHJcbmxldCBfcGVuZGluZ0NvbW1hbmQ6IEdhbWVDb21tYW5kIHwgbnVsbCA9IG51bGw7XHJcbmxldCBfY29tbWFuZFJlc3VsdDogR2FtZUNvbW1hbmRSZXN1bHQgfCBudWxsID0gbnVsbDtcclxubGV0IF9jb21tYW5kSWRDb3VudGVyID0gMDtcclxuXHJcbi8qKiBRdWV1ZSBhIGNvbW1hbmQgZm9yIHRoZSBnYW1lIHRvIGV4ZWN1dGUgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlR2FtZUNvbW1hbmQodHlwZTogc3RyaW5nLCBhcmdzPzogYW55KTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGlkID0gYGNtZF8keysrX2NvbW1hbmRJZENvdW50ZXJ9XyR7RGF0ZS5ub3coKX1gO1xyXG4gICAgX3BlbmRpbmdDb21tYW5kID0geyBpZCwgdHlwZSwgYXJncywgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfTtcclxuICAgIF9jb21tYW5kUmVzdWx0ID0gbnVsbDtcclxuICAgIHJldHVybiBpZDtcclxufVxyXG5cclxuLyoqIEdldCB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGNvbW1hbmQgKHBvbGwgdW50aWwgYXZhaWxhYmxlKSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbWFuZFJlc3VsdCgpOiBHYW1lQ29tbWFuZFJlc3VsdCB8IG51bGwge1xyXG4gICAgcmV0dXJuIF9jb21tYW5kUmVzdWx0O1xyXG59XHJcblxyXG4vKiogQ2xlYXIgY29tbWFuZCBzdGF0ZSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJDb21tYW5kU3RhdGUoKTogdm9pZCB7XHJcbiAgICBfcGVuZGluZ0NvbW1hbmQgPSBudWxsO1xyXG4gICAgX2NvbW1hbmRSZXN1bHQgPSBudWxsO1xyXG59XHJcblxyXG4vLyDilIDilIDilIAgUmVjb3JkaW5nIFN0b3JhZ2Ug4pSA4pSA4pSAXHJcblxyXG5pbnRlcmZhY2UgUmVjb3JkaW5nSW5mbyB7XHJcbiAgICBwYXRoOiBzdHJpbmc7XHJcbiAgICBzaXplOiBudW1iZXI7XHJcbiAgICBjcmVhdGVkQXQ6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgX3JlY29yZGluZ3MgPSBuZXcgTWFwPHN0cmluZywgUmVjb3JkaW5nSW5mbz4oKTtcclxuXHJcbi8qKiBHZXQgY29tcGxldGVkIHJlY29yZGluZyBpbmZvIGJ5IGlkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWNvcmRpbmcoaWQ6IHN0cmluZyk6IFJlY29yZGluZ0luZm8gfCB1bmRlZmluZWQge1xyXG4gICAgcmV0dXJuIF9yZWNvcmRpbmdzLmdldChpZCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRSZWNvcmRpbmcoaWQ6IHN0cmluZywgaW5mbzogUmVjb3JkaW5nSW5mbyk6IHZvaWQge1xyXG4gICAgX3JlY29yZGluZ3Muc2V0KGlkLCBpbmZvKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1jcFNlcnZlciB7XHJcbiAgICBwcml2YXRlIHNlcnZlcjogaHR0cC5TZXJ2ZXIgfCBudWxsID0gbnVsbDtcclxuICAgIHByaXZhdGUgdG9vbHM6IE1hcDxzdHJpbmcsIFRvb2xDYXRlZ29yeT4gPSBuZXcgTWFwKCk7XHJcbiAgICBwcml2YXRlIHRvb2xJbmRleDogTWFwPHN0cmluZywgVG9vbENhdGVnb3J5PiA9IG5ldyBNYXAoKTsgLy8gdG9vbE5hbWUgLT4gY2F0ZWdvcnlcclxuICAgIHByaXZhdGUgY29uZmlnOiBTZXJ2ZXJDb25maWc7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY29uZmlnPzogUGFydGlhbDxTZXJ2ZXJDb25maWc+KSB7XHJcbiAgICAgICAgdGhpcy5jb25maWcgPSB7IC4uLkRFRkFVTFRfQ09ORklHLCAuLi5jb25maWcgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogUmVnaXN0ZXIgYSB0b29sIGNhdGVnb3J5ICovXHJcbiAgICByZWdpc3RlcihjYXRlZ29yeTogVG9vbENhdGVnb3J5KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy50b29scy5zZXQoY2F0ZWdvcnkuY2F0ZWdvcnlOYW1lLCBjYXRlZ29yeSk7XHJcbiAgICAgICAgZm9yIChjb25zdCB0b29sIG9mIGNhdGVnb3J5LmdldFRvb2xzKCkpIHtcclxuICAgICAgICAgICAgdGhpcy50b29sSW5kZXguc2V0KHRvb2wubmFtZSwgY2F0ZWdvcnkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogR2V0IGFsbCB0b29sIGRlZmluaXRpb25zICovXHJcbiAgICBnZXRBbGxUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICBjb25zdCBhbGw6IFRvb2xEZWZpbml0aW9uW10gPSBbXTtcclxuICAgICAgICBmb3IgKGNvbnN0IGNhdCBvZiB0aGlzLnRvb2xzLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIGFsbC5wdXNoKC4uLmNhdC5nZXRUb29scygpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKiogU3RhcnQgSFRUUCBzZXJ2ZXIgKi9cclxuICAgIHN0YXJ0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlcnZlcikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKChyZXEsIHJlcykgPT4gdGhpcy5oYW5kbGVSZXF1ZXN0KHJlcSwgcmVzKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLmxpc3Rlbih0aGlzLmNvbmZpZy5wb3J0LCBcIjEyNy4wLjAuMVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW2NvY29zLWNyZWF0b3ItbWNwXSBTZXJ2ZXIgc3RhcnRlZCBvbiBodHRwOi8vMTI3LjAuMC4xOiR7dGhpcy5jb25maWcucG9ydH0vbWNwYCk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnNlcnZlci5vbihcImVycm9yXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbY29jb3MtY3JlYXRvci1tY3BdIFNlcnZlciBlcnJvcjpgLCBlKTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFN0b3AgSFRUUCBzZXJ2ZXIgKi9cclxuICAgIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5zZXJ2ZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNlcnZlci5jbG9zZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIltjb2Nvcy1jcmVhdG9yLW1jcF0gU2VydmVyIHN0b3BwZWRcIik7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBpc1J1bm5pbmcoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmVyICE9PSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBwb3J0KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlnLnBvcnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVSZXF1ZXN0KHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIC8vIENPUlNcclxuICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsIFwiKlwiKTtcclxuICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiLCBcIkdFVCwgUE9TVCwgREVMRVRFLCBPUFRJT05TXCIpO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsIFwiQ29udGVudC1UeXBlLCBBY2NlcHRcIik7XHJcblxyXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwNCk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybCB8fCBcIi9cIjtcclxuICAgICAgICBjb25zdCBvcmlnaW4gPSBgaHR0cDovLzEyNy4wLjAuMToke3RoaXMuY29uZmlnLnBvcnR9YDtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSA4pSAIE9BdXRoIGVuZHBvaW50cyAoTUNQIHNwZWMgMjAyNS0wNi0xOCAvIFJGQyA5NzI4IC8gUkZDIDg0MTQgLyBSRkMgNzU5MSkg4pSA4pSA4pSAXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBDbGF1ZGUgQ29kZSDjga4gVlNDb2RlIOaLoeW8teOBryBIVFRQIOODiOODqeODs+OCueODneODvOODiOOBriBNQ1Ag44K144O844OQ44O844Gr5a++44GX44GmXHJcbiAgICAgICAgLy8g54Sh5p2h5Lu244GnIE9BdXRoIGRpc2NvdmVyeSAvIERDUiDjgpLoqabjgb/jgosgKCMyNjkxNyDnrYnjga7ml6Lnn6Xjg5DjgrAp44CCXHJcbiAgICAgICAgLy8gY29jb3MtY3JlYXRvci1tY3Ag44GvIGxvY2FsaG9zdC1vbmx5IOOBruODreODvOOCq+ODq+mWi+eZuuODhOODvOODq+OBp+acrOeJqeOBruiqjeiovOOBr+S4jeimgeOBoOOBjOOAgVxyXG4gICAgICAgIC8vIOOCr+ODqeOCpOOCouODs+ODiOOCkua6gOi2s+OBleOBm+OCi+OBn+OCgSBPQXV0aCDjgqjjg7Pjg4njg53jgqTjg7Pjg4jnvqTjgpLjg4Djg5/jg7zlrp/oo4XjgZfjgabluLjmmYLoqLHlj6/jgZnjgovjgIJcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIFRPRE86IOS7peS4i+OBruOBhOOBmuOCjOOBi+OBjOeZuueUn+OBl+OBn+OCieWJiumZpOOBmeOCi1xyXG4gICAgICAgIC8vICAgMS4gYW50aHJvcGljcy9jbGF1ZGUtY29kZSAjMjY5MTcgLyAjMzgxMDIg562J44GuIEhUVFAgT0F1dGgg44OQ44Kw44GM5L+u5q2j44GV44KM44KLXHJcbiAgICAgICAgLy8gICAyLiDmnKznianjga7oqo3oqLzmqZ/mp4vjgpLlrp/oo4XjgZnjgovlv4XopoHjgYzlh7rjgovvvIjlgb0gT0F1dGgg44Go6KGd56qB44GZ44KL44Gf44KB77yJXHJcbiAgICAgICAgLy8gICAzLiBNQ1Agc3BlYyDjgYwgUEtDRSDmpJzoqLzjg7vjg4jjg7zjgq/jg7Pjg63jg7zjg4bjg7zjgrfjg6fjg7Plv4XpoIjnrYnjgavmm7TmlrDjgZXjgozjgotcclxuICAgICAgICAvLyAgIDQuIHN0ZGlvIOODluODquODg+OCuOOBjOWNgeWIhuWumuedgOOBl+OBpiBIVFRQIHRyYW5zcG9ydCDoh6rkvZPjgpIgZGVwcmVjYXRlIOOBmeOCi1xyXG5cclxuICAgICAgICAvLyBSRkMgOTcyOCBQcm90ZWN0ZWQgUmVzb3VyY2UgTWV0YWRhdGFcclxuICAgICAgICBpZiAodXJsID09PSBcIi8ud2VsbC1rbm93bi9vYXV0aC1wcm90ZWN0ZWQtcmVzb3VyY2VcIiAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlOiBgJHtvcmlnaW59L21jcGAsXHJcbiAgICAgICAgICAgICAgICBhdXRob3JpemF0aW9uX3NlcnZlcnM6IFtvcmlnaW5dLFxyXG4gICAgICAgICAgICAgICAgYmVhcmVyX21ldGhvZHNfc3VwcG9ydGVkOiBbXCJoZWFkZXJcIl0sXHJcbiAgICAgICAgICAgICAgICBzY29wZXNfc3VwcG9ydGVkOiBbXCJtY3BcIl0sXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUkZDIDg0MTQgQXV0aG9yaXphdGlvbiBTZXJ2ZXIgTWV0YWRhdGFcclxuICAgICAgICBpZiAodXJsID09PSBcIi8ud2VsbC1rbm93bi9vYXV0aC1hdXRob3JpemF0aW9uLXNlcnZlclwiICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgaXNzdWVyOiBvcmlnaW4sXHJcbiAgICAgICAgICAgICAgICBhdXRob3JpemF0aW9uX2VuZHBvaW50OiBgJHtvcmlnaW59L29hdXRoL2F1dGhvcml6ZWAsXHJcbiAgICAgICAgICAgICAgICB0b2tlbl9lbmRwb2ludDogYCR7b3JpZ2lufS9vYXV0aC90b2tlbmAsXHJcbiAgICAgICAgICAgICAgICByZWdpc3RyYXRpb25fZW5kcG9pbnQ6IGAke29yaWdpbn0vb2F1dGgvcmVnaXN0ZXJgLFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VfdHlwZXNfc3VwcG9ydGVkOiBbXCJjb2RlXCJdLFxyXG4gICAgICAgICAgICAgICAgZ3JhbnRfdHlwZXNfc3VwcG9ydGVkOiBbXCJhdXRob3JpemF0aW9uX2NvZGVcIl0sXHJcbiAgICAgICAgICAgICAgICBjb2RlX2NoYWxsZW5nZV9tZXRob2RzX3N1cHBvcnRlZDogW1wiUzI1NlwiLCBcInBsYWluXCJdLFxyXG4gICAgICAgICAgICAgICAgdG9rZW5fZW5kcG9pbnRfYXV0aF9tZXRob2RzX3N1cHBvcnRlZDogW1wibm9uZVwiXSxcclxuICAgICAgICAgICAgICAgIHNjb3Blc19zdXBwb3J0ZWQ6IFtcIm1jcFwiXSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSRkMgNzU5MSBEeW5hbWljIENsaWVudCBSZWdpc3RyYXRpb24g4oCUIGFjY2VwdCBhbnl0aGluZywgcmV0dXJuIGR1bW15IGNsaWVudFxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL29hdXRoL3JlZ2lzdGVyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIGxldCByZWc6IGFueSA9IHt9O1xyXG4gICAgICAgICAgICB0cnkgeyByZWcgPSBKU09OLnBhcnNlKGJvZHkpOyB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cclxuICAgICAgICAgICAgY29uc3QgY2xpZW50SWQgPSBgY29jb3MtbWNwLWNsaWVudC0ke0RhdGUubm93KCl9YDtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgY2xpZW50X2lkOiBjbGllbnRJZCxcclxuICAgICAgICAgICAgICAgIGNsaWVudF9pZF9pc3N1ZWRfYXQ6IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApLFxyXG4gICAgICAgICAgICAgICAgY2xpZW50X25hbWU6IHJlZy5jbGllbnRfbmFtZSB8fCBcImNvY29zLWNyZWF0b3ItbWNwIGNsaWVudFwiLFxyXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RfdXJpczogcmVnLnJlZGlyZWN0X3VyaXMgfHwgW10sXHJcbiAgICAgICAgICAgICAgICB0b2tlbl9lbmRwb2ludF9hdXRoX21ldGhvZDogXCJub25lXCIsXHJcbiAgICAgICAgICAgICAgICBncmFudF90eXBlczogW1wiYXV0aG9yaXphdGlvbl9jb2RlXCJdLFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VfdHlwZXM6IFtcImNvZGVcIl0sXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT0F1dGggYXV0aG9yaXphdGlvbiBlbmRwb2ludCDigJQgYXV0by1jb25zZW50LCByZWRpcmVjdCBpbW1lZGlhdGVseSB3aXRoIGNvZGVcclxuICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoXCIvb2F1dGgvYXV0aG9yaXplXCIpICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTCh1cmwsIG9yaWdpbik7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZGlyZWN0VXJpID0gcGFyc2VkLnNlYXJjaFBhcmFtcy5nZXQoXCJyZWRpcmVjdF91cmlcIikgfHwgXCJcIjtcclxuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSBwYXJzZWQuc2VhcmNoUGFyYW1zLmdldChcInN0YXRlXCIpIHx8IFwiXCI7XHJcbiAgICAgICAgICAgIGlmICghcmVkaXJlY3RVcmkpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcImludmFsaWRfcmVxdWVzdFwiLCBlcnJvcl9kZXNjcmlwdGlvbjogXCJyZWRpcmVjdF91cmkgcmVxdWlyZWRcIiB9KSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY29kZSA9IGBjb2Nvcy1tY3AtY29kZS0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgMTApfWA7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvY2F0aW9uID0gYCR7cmVkaXJlY3RVcml9JHtyZWRpcmVjdFVyaS5pbmNsdWRlcyhcIj9cIikgPyBcIiZcIiA6IFwiP1wifWNvZGU9JHtlbmNvZGVVUklDb21wb25lbnQoY29kZSl9JnN0YXRlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlKX1gO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDMwMiwgeyBMb2NhdGlvbjogbG9jYXRpb24gfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT0F1dGggdG9rZW4gZW5kcG9pbnQg4oCUIGFsd2F5cyBpc3N1ZSBhIGR1bW15IHRva2VuXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvb2F1dGgvdG9rZW5cIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBhd2FpdCByZWFkQm9keShyZXEpOyAvLyBkcmFpblxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwge1xyXG4gICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1zdG9yZVwiLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBhY2Nlc3NfdG9rZW46IFwiY29jb3MtbWNwLXB1YmxpYy10b2tlblwiLFxyXG4gICAgICAgICAgICAgICAgdG9rZW5fdHlwZTogXCJCZWFyZXJcIixcclxuICAgICAgICAgICAgICAgIGV4cGlyZXNfaW46IDg2NDAwLFxyXG4gICAgICAgICAgICAgICAgc2NvcGU6IFwibWNwXCIsXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGVhbHRoIGNoZWNrXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvaGVhbHRoXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN0YXR1czogXCJva1wiLCB0b29sczogdGhpcy5nZXRBbGxUb29scygpLmxlbmd0aCB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEdhbWUgZGVidWcgY29tbWFuZCBxdWV1ZSDigJQgZ2FtZSBwb2xscyBmb3IgY29tbWFuZHNcclxuICAgICAgICBpZiAodXJsID09PSBcIi9nYW1lL2NvbW1hbmRcIiAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNtZCA9IF9wZW5kaW5nQ29tbWFuZDtcclxuICAgICAgICAgICAgX3BlbmRpbmdDb21tYW5kID0gbnVsbDsgLy8gY29uc3VtZVxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShjbWQpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2FtZSBkZWJ1ZyBjb21tYW5kIHJlc3VsdCDigJQgZ2FtZSBwb3N0cyByZXN1bHRcclxuICAgICAgICBpZiAodXJsID09PSBcIi9nYW1lL3Jlc3VsdFwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgX2NvbW1hbmRSZXN1bHQgPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDQpO1xyXG4gICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEdhbWUgcHJldmlldyByZWNvcmRpbmcgcmVjZWl2ZXJcclxuICAgICAgICBpZiAodXJsID09PSBcIi9nYW1lL3JlY29yZGluZ1wiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeyBpZCwgYmFzZTY0LCBtaW1lVHlwZSwgc2F2ZVBhdGggfSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlkIHx8ICFiYXNlNjQpIHRocm93IG5ldyBFcnJvcihcImlkL2Jhc2U2NCByZXF1aXJlZFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJhc2U2NCwgXCJiYXNlNjRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gc2F2ZVBhdGjmjIflrprjgYzjgYLjgozjgbDjgZ3jgZPjgavkv53lrZjvvIjntbblr77jg5Hjgrnjgb7jgZ/jga/jg5fjg63jgrjjgqfjgq/jg4jnm7jlr77jg5HjgrnvvIlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gKGdsb2JhbCBhcyBhbnkpLkVkaXRvcj8uUHJvamVjdD8ucGF0aFxyXG4gICAgICAgICAgICAgICAgICAgIHx8IHByb2Nlc3MuY3dkKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGlyOiBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2F2ZVBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmlzQWJzb2x1dGUoc2F2ZVBhdGgpID8gc2F2ZVBhdGggOiBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHNhdmVQYXRoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlyID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCBcInRlbXBcIiwgXCJyZWNvcmRpbmdzXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbXQgPSAobWltZVR5cGUgfHwgXCJcIikudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV4dCA9IG10LmluY2x1ZGVzKFwid2VibVwiKSA/IFwid2VibVwiXHJcbiAgICAgICAgICAgICAgICAgICAgOiBtdC5pbmNsdWRlcyhcIm1wNFwiKSA/IFwibXA0XCJcclxuICAgICAgICAgICAgICAgICAgICA6IFwiYmluXCI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGAke2lkfS4ke2V4dH1gO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCBidWZmZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFJlY29yZGluZyhpZCwge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGZpbGVQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGJ1ZmZlci5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5hdXRvQXJjaGl2ZVJlY29yZGluZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBhcmNoaXZlT2xkRmlsZXMoZGlyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHBhdGg6IGZpbGVQYXRoLCBzaXplOiBidWZmZXIubGVuZ3RoIH0pKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2FtZSBwcmV2aWV3IGxvZyByZWNlaXZlclxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2xvZ1wiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW50cmllczogR2FtZUxvZ0VudHJ5W10gPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiAoQXJyYXkuaXNBcnJheShlbnRyaWVzKSA/IGVudHJpZXMgOiBbZW50cmllc10pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2dhbWVMb2dzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IGVudHJ5LnRpbWVzdGFtcCB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsOiBlbnRyeS5sZXZlbCB8fCBcImxvZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlbnRyeS5tZXNzYWdlIHx8IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoX2dhbWVMb2dzLmxlbmd0aCA+IE1BWF9HQU1FX0xPR19CVUZGRVIpIHtcclxuICAgICAgICAgICAgICAgICAgICBfZ2FtZUxvZ3Muc3BsaWNlKDAsIF9nYW1lTG9ncy5sZW5ndGggLSBNQVhfR0FNRV9MT0dfQlVGRkVSKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSBtYWxmb3JtZWQgKi8gfVxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwNCk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTUNQIGVuZHBvaW50XHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvbWNwXCIpIHtcclxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFNTRSBrZWVwYWxpdmUgc3RyZWFtXHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9ldmVudC1zdHJlYW1cIixcclxuICAgICAgICAgICAgICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQ29ubmVjdGlvblwiOiBcImtlZXAtYWxpdmVcIixcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gU2VuZCBpbml0aWFsIGNvbW1lbnQgdG8ga2VlcCBjb25uZWN0aW9uIGFsaXZlXHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGUoXCI6IGNvbm5lY3RlZFxcblxcblwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZU1jcFBvc3QocmVxLCByZXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJERUxFVEVcIikge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUgfSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyA0MDRcclxuICAgICAgICByZXMud3JpdGVIZWFkKDQwNCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiTm90IGZvdW5kXCIgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTWNwUG9zdChyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcclxuICAgICAgICBsZXQgcnBjOiBKc29uUnBjUmVxdWVzdDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBycGMgPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICB0aGlzLnNlbmRKc29uUnBjKHJlcywgeyBqc29ucnBjOiBcIjIuMFwiLCBpZDogbnVsbCwgZXJyb3I6IHsgY29kZTogLTMyNzAwLCBtZXNzYWdlOiBcIlBhcnNlIGVycm9yXCIgfSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYWNjZXB0ID0gcmVxLmhlYWRlcnNbXCJhY2NlcHRcIl0gfHwgXCJcIjtcclxuICAgICAgICBjb25zdCB3YW50U3NlID0gYWNjZXB0LmluY2x1ZGVzKFwidGV4dC9ldmVudC1zdHJlYW1cIik7XHJcblxyXG4gICAgICAgIGxldCByZXNwb25zZTogSnNvblJwY1Jlc3BvbnNlO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHJwYy5tZXRob2QpIHtcclxuICAgICAgICAgICAgY2FzZSBcImluaXRpYWxpemVcIjpcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2xWZXJzaW9uOiBNQ1BfUFJPVE9DT0xfVkVSU0lPTixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiB7IHRvb2xzOiB7fSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJJbmZvOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBcIjEuMC4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJub3RpZmljYXRpb25zL2luaXRpYWxpemVkXCI6XHJcbiAgICAgICAgICAgICAgICAvLyBObyByZXNwb25zZSBuZWVkZWQgZm9yIG5vdGlmaWNhdGlvblxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDQsIHsgXCJNY3AtU2Vzc2lvbi1JZFwiOiBTRVNTSU9OX0lEIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInRvb2xzL2xpc3RcIjpcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHsgdG9vbHM6IHRoaXMuZ2V0QWxsVG9vbHMoKSB9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInRvb2xzL2NhbGxcIjoge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9vbE5hbWUgPSBycGMucGFyYW1zPy5uYW1lO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IHJwYy5wYXJhbXM/LmFyZ3VtZW50cyB8fCB7fTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdGhpcy50b29sSW5kZXguZ2V0KHRvb2xOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWNhdGVnb3J5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB7IGNvZGU6IC0zMjYwMiwgbWVzc2FnZTogYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW2NvY29zLWNyZWF0b3ItbWNwXSDilrYgJHt0b29sTmFtZX1gLCBPYmplY3Qua2V5cyhhcmdzKS5sZW5ndGggPiAwID8gSlNPTi5zdHJpbmdpZnkoYXJncykuc3Vic3RyaW5nKDAsIDIwMCkgOiBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGltZW91dE1zID0gKHRvb2xOYW1lLnN0YXJ0c1dpdGgoXCJwcmVmYWJfXCIpIHx8IHRvb2xOYW1lID09PSBcInNjZW5lX29wZW5cIikgPyAxMjAwMDAgOiAzMDAwMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd2l0aFRpbWVvdXQoY2F0ZWdvcnkuZXhlY3V0ZSh0b29sTmFtZSwgYXJncyksIHRpbWVvdXRNcywgYFRvb2wgJHt0b29sTmFtZX0gdGltZWQgb3V0YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbY29jb3MtY3JlYXRvci1tY3BdIOKckyAke3Rvb2xOYW1lfSAoJHtEYXRlLm5vdygpIC0gc3RhcnR9bXMpYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtjb2Nvcy1jcmVhdG9yLW1jcF0g4pyXICR7dG9vbE5hbWV9OmAsIGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHsgY29kZTogLTMyNjAzLCBtZXNzYWdlOiBlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHsgY29kZTogLTMyNjAxLCBtZXNzYWdlOiBgTWV0aG9kIG5vdCBmb3VuZDogJHtycGMubWV0aG9kfWAgfSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAod2FudFNzZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbmRTc2UocmVzLCBbcmVzcG9uc2VdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNlbmRKc29uUnBjKHJlcywgcmVzcG9uc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNlbmRKc29uUnBjKHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwgZGF0YTogSnNvblJwY1Jlc3BvbnNlKTogdm9pZCB7XHJcbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcclxuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgIFwiTWNwLVNlc3Npb24tSWRcIjogU0VTU0lPTl9JRCxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNlbmRTc2UocmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBtZXNzYWdlczogSnNvblJwY1Jlc3BvbnNlW10pOiB2b2lkIHtcclxuICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwge1xyXG4gICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvZXZlbnQtc3RyZWFtXCIsXHJcbiAgICAgICAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLWNhY2hlXCIsXHJcbiAgICAgICAgICAgIFwiTWNwLVNlc3Npb24tSWRcIjogU0VTU0lPTl9JRCxcclxuICAgICAgICB9KTtcclxuICAgICAgICBmb3IgKGNvbnN0IG1zZyBvZiBtZXNzYWdlcykge1xyXG4gICAgICAgICAgICByZXMud3JpdGUoYGV2ZW50OiBtZXNzYWdlXFxuZGF0YTogJHtKU09OLnN0cmluZ2lmeShtc2cpfVxcblxcbmApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXMuZW5kKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdpdGhUaW1lb3V0PFQ+KHByb21pc2U6IFByb21pc2U8VD4sIG1zOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8VD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihtZXNzYWdlKSksIG1zKTtcclxuICAgICAgICBwcm9taXNlLnRoZW4oXHJcbiAgICAgICAgICAgICh2KSA9PiB7IGNsZWFyVGltZW91dCh0aW1lcik7IHJlc29sdmUodik7IH0sXHJcbiAgICAgICAgICAgIChlKSA9PiB7IGNsZWFyVGltZW91dCh0aW1lcik7IHJlamVjdChlKTsgfSxcclxuICAgICAgICApO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRCb2R5KHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XHJcbiAgICAgICAgcmVxLm9uKFwiZGF0YVwiLCAoYykgPT4gY2h1bmtzLnB1c2goYykpO1xyXG4gICAgICAgIHJlcS5vbihcImVuZFwiLCAoKSA9PiByZXNvbHZlKEJ1ZmZlci5jb25jYXQoY2h1bmtzKS50b1N0cmluZyhcInV0Zi04XCIpKSk7XHJcbiAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcclxuICAgIH0pO1xyXG59XHJcbiJdfQ==