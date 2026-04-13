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
exports.BUILD_HASH = "f3910c7061f4";
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
        var _a, _b, _c, _d;
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
            catch ( /* ignore */_e) { /* ignore */ }
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
            catch ( /* ignore */_f) { /* ignore */ }
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
                    // __debug_state__ ログから userId を debug-menu.json に保存
                    try {
                        const msg = JSON.parse(entry.message || "");
                        if (msg.__debug_state__ && msg.userId) {
                            const _fs = require("fs");
                            const _path = require("path");
                            const projectPath = ((_d = (_c = global.Editor) === null || _c === void 0 ? void 0 : _c.Project) === null || _d === void 0 ? void 0 : _d.path) || process.cwd();
                            const settingsPath = _path.join(projectPath, "settings", "debug-menu.json");
                            _fs.writeFileSync(settingsPath, JSON.stringify({ userId: msg.userId }, null, 2), "utf-8");
                        }
                    }
                    catch ( /* not debug_state */_g) { /* not debug_state */ }
                }
                if (_gameLogs.length > MAX_GAME_LOG_BUFFER) {
                    _gameLogs.splice(0, _gameLogs.length - MAX_GAME_LOG_BUFFER);
                }
            }
            catch ( /* ignore malformed */_h) { /* ignore malformed */ }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tY3Atc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQXNCQSxrQ0FNQztBQUVELHNDQUVDO0FBd0JELDRDQUtDO0FBR0QsNENBRUM7QUFHRCw4Q0FHQztBQWFELG9DQUVDO0FBRUQsb0NBRUM7QUEzRkQsZ0RBQXdCO0FBQ3hCLG1DQUFzSDtBQUN0SCx1Q0FBNEM7QUFFNUMsTUFBTSxvQkFBb0IsR0FBRyxZQUFZLENBQUM7QUFDMUMsTUFBTSxVQUFVLEdBQUcsYUFBYSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFFNUYsb0NBQW9DO0FBQ3ZCLFFBQUEsVUFBVSxHQUFHLGdCQUFnQixDQUFDO0FBVTNDLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0FBQ2hDLE1BQU0sU0FBUyxHQUFtQixFQUFFLENBQUM7QUFFckMsc0RBQXNEO0FBQ3RELFNBQWdCLFdBQVcsQ0FBQyxLQUFhLEVBQUUsS0FBYztJQUNyRCxJQUFJLElBQUksR0FBRyxTQUFTLENBQUM7SUFDckIsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0QsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNqRSxDQUFDO0FBRUQsU0FBZ0IsYUFBYTtJQUN6QixTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUN6QixD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QU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDL0QsT0FBTyxDQUFDLElBQUksQ0FDUixDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUMzQyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUM3QyxDQUFDO0lBQ04sQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsR0FBeUI7SUFDdkMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDNUIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBodHRwIGZyb20gXCJodHRwXCI7XHJcbmltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIEpzb25ScGNSZXF1ZXN0LCBKc29uUnBjUmVzcG9uc2UsIFNlcnZlckNvbmZpZywgREVGQVVMVF9DT05GSUcgfSBmcm9tIFwiLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBhcmNoaXZlT2xkRmlsZXMgfSBmcm9tIFwiLi9hcmNoaXZlXCI7XHJcblxyXG5jb25zdCBNQ1BfUFJPVE9DT0xfVkVSU0lPTiA9IFwiMjAyNC0xMS0wNVwiO1xyXG5jb25zdCBTRVNTSU9OX0lEID0gYGNvY29zLW1jcC0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDEwKX1gO1xyXG5cclxuLyoqIOODk+ODq+ODieaZguOBq+OCs+ODvOODieODmeODvOOCueOBrlNIQTI1NuODj+ODg+OCt+ODpeOBjOWfi+OCgei+vOOBvuOCjOOCiyAqL1xyXG5leHBvcnQgY29uc3QgQlVJTERfSEFTSCA9IFwiX19CVUlMRF9IQVNIX19cIjtcclxuXHJcbi8vIOKUgOKUgOKUgCBHYW1lIFByZXZpZXcgTG9nIEJ1ZmZlciDilIDilIDilIBcclxuXHJcbmludGVyZmFjZSBHYW1lTG9nRW50cnkge1xyXG4gICAgdGltZXN0YW1wOiBzdHJpbmc7XHJcbiAgICBsZXZlbDogXCJsb2dcIiB8IFwid2FyblwiIHwgXCJlcnJvclwiO1xyXG4gICAgbWVzc2FnZTogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBNQVhfR0FNRV9MT0dfQlVGRkVSID0gNTAwO1xyXG5jb25zdCBfZ2FtZUxvZ3M6IEdhbWVMb2dFbnRyeVtdID0gW107XHJcblxyXG4vKiogQWNjZXNzIGdhbWUgcHJldmlldyBsb2cgYnVmZmVyIGZyb20gZGVidWctdG9vbHMgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEdhbWVMb2dzKGNvdW50OiBudW1iZXIsIGxldmVsPzogc3RyaW5nKTogeyBsb2dzOiBHYW1lTG9nRW50cnlbXTsgdG90YWw6IG51bWJlciB9IHtcclxuICAgIGxldCBsb2dzID0gX2dhbWVMb2dzO1xyXG4gICAgaWYgKGxldmVsKSB7XHJcbiAgICAgICAgbG9ncyA9IGxvZ3MuZmlsdGVyKGwgPT4gbC5sZXZlbCA9PT0gbGV2ZWwpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHsgbG9nczogbG9ncy5zbGljZSgtY291bnQpLCB0b3RhbDogX2dhbWVMb2dzLmxlbmd0aCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJHYW1lTG9ncygpOiB2b2lkIHtcclxuICAgIF9nYW1lTG9ncy5sZW5ndGggPSAwO1xyXG59XHJcblxyXG4vLyDilIDilIDilIAgR2FtZSBEZWJ1ZyBDb21tYW5kIFF1ZXVlIOKUgOKUgOKUgFxyXG5cclxuaW50ZXJmYWNlIEdhbWVDb21tYW5kIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICB0eXBlOiBzdHJpbmc7XHJcbiAgICBhcmdzPzogYW55O1xyXG4gICAgdGltZXN0YW1wOiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBHYW1lQ29tbWFuZFJlc3VsdCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgc3VjY2VzczogYm9vbGVhbjtcclxuICAgIGRhdGE/OiBhbnk7XHJcbiAgICBlcnJvcj86IHN0cmluZztcclxuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xyXG59XHJcblxyXG5sZXQgX3BlbmRpbmdDb21tYW5kOiBHYW1lQ29tbWFuZCB8IG51bGwgPSBudWxsO1xyXG5sZXQgX2NvbW1hbmRSZXN1bHQ6IEdhbWVDb21tYW5kUmVzdWx0IHwgbnVsbCA9IG51bGw7XHJcbmxldCBfY29tbWFuZElkQ291bnRlciA9IDA7XHJcblxyXG4vKiogUXVldWUgYSBjb21tYW5kIGZvciB0aGUgZ2FtZSB0byBleGVjdXRlICovXHJcbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUdhbWVDb21tYW5kKHR5cGU6IHN0cmluZywgYXJncz86IGFueSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBpZCA9IGBjbWRfJHsrK19jb21tYW5kSWRDb3VudGVyfV8ke0RhdGUubm93KCl9YDtcclxuICAgIF9wZW5kaW5nQ29tbWFuZCA9IHsgaWQsIHR5cGUsIGFyZ3MsIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH07XHJcbiAgICBfY29tbWFuZFJlc3VsdCA9IG51bGw7XHJcbiAgICByZXR1cm4gaWQ7XHJcbn1cclxuXHJcbi8qKiBHZXQgdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBjb21tYW5kIChwb2xsIHVudGlsIGF2YWlsYWJsZSkgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbW1hbmRSZXN1bHQoKTogR2FtZUNvbW1hbmRSZXN1bHQgfCBudWxsIHtcclxuICAgIHJldHVybiBfY29tbWFuZFJlc3VsdDtcclxufVxyXG5cclxuLyoqIENsZWFyIGNvbW1hbmQgc3RhdGUgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyQ29tbWFuZFN0YXRlKCk6IHZvaWQge1xyXG4gICAgX3BlbmRpbmdDb21tYW5kID0gbnVsbDtcclxuICAgIF9jb21tYW5kUmVzdWx0ID0gbnVsbDtcclxufVxyXG5cclxuLy8g4pSA4pSA4pSAIFJlY29yZGluZyBTdG9yYWdlIOKUgOKUgOKUgFxyXG5cclxuaW50ZXJmYWNlIFJlY29yZGluZ0luZm8ge1xyXG4gICAgcGF0aDogc3RyaW5nO1xyXG4gICAgc2l6ZTogbnVtYmVyO1xyXG4gICAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IF9yZWNvcmRpbmdzID0gbmV3IE1hcDxzdHJpbmcsIFJlY29yZGluZ0luZm8+KCk7XHJcblxyXG4vKiogR2V0IGNvbXBsZXRlZCByZWNvcmRpbmcgaW5mbyBieSBpZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVjb3JkaW5nKGlkOiBzdHJpbmcpOiBSZWNvcmRpbmdJbmZvIHwgdW5kZWZpbmVkIHtcclxuICAgIHJldHVybiBfcmVjb3JkaW5ncy5nZXQoaWQpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0UmVjb3JkaW5nKGlkOiBzdHJpbmcsIGluZm86IFJlY29yZGluZ0luZm8pOiB2b2lkIHtcclxuICAgIF9yZWNvcmRpbmdzLnNldChpZCwgaW5mbyk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNY3BTZXJ2ZXIge1xyXG4gICAgcHJpdmF0ZSBzZXJ2ZXI6IGh0dHAuU2VydmVyIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwcml2YXRlIHRvb2xzOiBNYXA8c3RyaW5nLCBUb29sQ2F0ZWdvcnk+ID0gbmV3IE1hcCgpO1xyXG4gICAgcHJpdmF0ZSB0b29sSW5kZXg6IE1hcDxzdHJpbmcsIFRvb2xDYXRlZ29yeT4gPSBuZXcgTWFwKCk7IC8vIHRvb2xOYW1lIC0+IGNhdGVnb3J5XHJcbiAgICBwcml2YXRlIGNvbmZpZzogU2VydmVyQ29uZmlnO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZz86IFBhcnRpYWw8U2VydmVyQ29uZmlnPikge1xyXG4gICAgICAgIHRoaXMuY29uZmlnID0geyAuLi5ERUZBVUxUX0NPTkZJRywgLi4uY29uZmlnIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFJlZ2lzdGVyIGEgdG9vbCBjYXRlZ29yeSAqL1xyXG4gICAgcmVnaXN0ZXIoY2F0ZWdvcnk6IFRvb2xDYXRlZ29yeSk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudG9vbHMuc2V0KGNhdGVnb3J5LmNhdGVnb3J5TmFtZSwgY2F0ZWdvcnkpO1xyXG4gICAgICAgIGZvciAoY29uc3QgdG9vbCBvZiBjYXRlZ29yeS5nZXRUb29scygpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9vbEluZGV4LnNldCh0b29sLm5hbWUsIGNhdGVnb3J5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEdldCBhbGwgdG9vbCBkZWZpbml0aW9ucyAqL1xyXG4gICAgZ2V0QWxsVG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgY29uc3QgYWxsOiBUb29sRGVmaW5pdGlvbltdID0gW107XHJcbiAgICAgICAgZm9yIChjb25zdCBjYXQgb2YgdGhpcy50b29scy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICBhbGwucHVzaCguLi5jYXQuZ2V0VG9vbHMoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhbGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFN0YXJ0IEhUVFAgc2VydmVyICovXHJcbiAgICBzdGFydCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZXJ2ZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcigocmVxLCByZXMpID0+IHRoaXMuaGFuZGxlUmVxdWVzdChyZXEsIHJlcykpO1xyXG4gICAgICAgICAgICB0aGlzLnNlcnZlci5saXN0ZW4odGhpcy5jb25maWcucG9ydCwgXCIxMjcuMC4wLjFcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtjb2Nvcy1jcmVhdG9yLW1jcF0gU2VydmVyIHN0YXJ0ZWQgb24gaHR0cDovLzEyNy4wLjAuMToke3RoaXMuY29uZmlnLnBvcnR9L21jcGApO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5zZXJ2ZXIub24oXCJlcnJvclwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW2NvY29zLWNyZWF0b3ItbWNwXSBTZXJ2ZXIgZXJyb3I6YCwgZSk7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBTdG9wIEhUVFAgc2VydmVyICovXHJcbiAgICBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuc2VydmVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zZXJ2ZXIuY2xvc2UoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXJ2ZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJbY29jb3MtY3JlYXRvci1tY3BdIFNlcnZlciBzdG9wcGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaXNSdW5uaW5nKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZlciAhPT0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgcG9ydCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5wb3J0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlUmVxdWVzdChyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICAvLyBDT1JTXHJcbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBcIipcIik7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIiwgXCJHRVQsIFBPU1QsIERFTEVURSwgT1BUSU9OU1wiKTtcclxuICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiLCBcIkNvbnRlbnQtVHlwZSwgQWNjZXB0XCIpO1xyXG5cclxuICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDQpO1xyXG4gICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgXCIvXCI7XHJcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gYGh0dHA6Ly8xMjcuMC4wLjE6JHt0aGlzLmNvbmZpZy5wb3J0fWA7XHJcblxyXG4gICAgICAgIC8vIOKUgOKUgOKUgCBPQXV0aCBlbmRwb2ludHMgKE1DUCBzcGVjIDIwMjUtMDYtMTggLyBSRkMgOTcyOCAvIFJGQyA4NDE0IC8gUkZDIDc1OTEpIOKUgOKUgOKUgFxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gQ2xhdWRlIENvZGUg44GuIFZTQ29kZSDmi6HlvLXjga8gSFRUUCDjg4jjg6njg7Pjgrnjg53jg7zjg4jjga4gTUNQIOOCteODvOODkOODvOOBq+WvvuOBl+OBplxyXG4gICAgICAgIC8vIOeEoeadoeS7tuOBpyBPQXV0aCBkaXNjb3ZlcnkgLyBEQ1Ig44KS6Kmm44G/44KLICgjMjY5MTcg562J44Gu5pei55+l44OQ44KwKeOAglxyXG4gICAgICAgIC8vIGNvY29zLWNyZWF0b3ItbWNwIOOBryBsb2NhbGhvc3Qtb25seSDjga7jg63jg7zjgqvjg6vplovnmbrjg4Tjg7zjg6vjgafmnKznianjga7oqo3oqLzjga/kuI3opoHjgaDjgYzjgIFcclxuICAgICAgICAvLyDjgq/jg6njgqTjgqLjg7Pjg4jjgpLmuoDotrPjgZXjgZvjgovjgZ/jgoEgT0F1dGgg44Ko44Oz44OJ44Od44Kk44Oz44OI576k44KS44OA44Of44O85a6f6KOF44GX44Gm5bi45pmC6Kix5Y+v44GZ44KL44CCXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBUT0RPOiDku6XkuIvjga7jgYTjgZrjgozjgYvjgYznmbrnlJ/jgZfjgZ/jgonliYrpmaTjgZnjgotcclxuICAgICAgICAvLyAgIDEuIGFudGhyb3BpY3MvY2xhdWRlLWNvZGUgIzI2OTE3IC8gIzM4MTAyIOetieOBriBIVFRQIE9BdXRoIOODkOOCsOOBjOS/ruato+OBleOCjOOCi1xyXG4gICAgICAgIC8vICAgMi4g5pys54mp44Gu6KqN6Ki85qmf5qeL44KS5a6f6KOF44GZ44KL5b+F6KaB44GM5Ye644KL77yI5YG9IE9BdXRoIOOBqOihneeqgeOBmeOCi+OBn+OCge+8iVxyXG4gICAgICAgIC8vICAgMy4gTUNQIHNwZWMg44GMIFBLQ0Ug5qSc6Ki844O744OI44O844Kv44Oz44Ot44O844OG44O844K344On44Oz5b+F6aCI562J44Gr5pu05paw44GV44KM44KLXHJcbiAgICAgICAgLy8gICA0LiBzdGRpbyDjg5bjg6rjg4PjgrjjgYzljYHliIblrprnnYDjgZfjgaYgSFRUUCB0cmFuc3BvcnQg6Ieq5L2T44KSIGRlcHJlY2F0ZSDjgZnjgotcclxuXHJcbiAgICAgICAgLy8gUkZDIDk3MjggUHJvdGVjdGVkIFJlc291cmNlIE1ldGFkYXRhXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvLndlbGwta25vd24vb2F1dGgtcHJvdGVjdGVkLXJlc291cmNlXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZTogYCR7b3JpZ2lufS9tY3BgLFxyXG4gICAgICAgICAgICAgICAgYXV0aG9yaXphdGlvbl9zZXJ2ZXJzOiBbb3JpZ2luXSxcclxuICAgICAgICAgICAgICAgIGJlYXJlcl9tZXRob2RzX3N1cHBvcnRlZDogW1wiaGVhZGVyXCJdLFxyXG4gICAgICAgICAgICAgICAgc2NvcGVzX3N1cHBvcnRlZDogW1wibWNwXCJdLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJGQyA4NDE0IEF1dGhvcml6YXRpb24gU2VydmVyIE1ldGFkYXRhXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvLndlbGwta25vd24vb2F1dGgtYXV0aG9yaXphdGlvbi1zZXJ2ZXJcIiAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIGlzc3Vlcjogb3JpZ2luLFxyXG4gICAgICAgICAgICAgICAgYXV0aG9yaXphdGlvbl9lbmRwb2ludDogYCR7b3JpZ2lufS9vYXV0aC9hdXRob3JpemVgLFxyXG4gICAgICAgICAgICAgICAgdG9rZW5fZW5kcG9pbnQ6IGAke29yaWdpbn0vb2F1dGgvdG9rZW5gLFxyXG4gICAgICAgICAgICAgICAgcmVnaXN0cmF0aW9uX2VuZHBvaW50OiBgJHtvcmlnaW59L29hdXRoL3JlZ2lzdGVyYCxcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlX3R5cGVzX3N1cHBvcnRlZDogW1wiY29kZVwiXSxcclxuICAgICAgICAgICAgICAgIGdyYW50X3R5cGVzX3N1cHBvcnRlZDogW1wiYXV0aG9yaXphdGlvbl9jb2RlXCJdLFxyXG4gICAgICAgICAgICAgICAgY29kZV9jaGFsbGVuZ2VfbWV0aG9kc19zdXBwb3J0ZWQ6IFtcIlMyNTZcIiwgXCJwbGFpblwiXSxcclxuICAgICAgICAgICAgICAgIHRva2VuX2VuZHBvaW50X2F1dGhfbWV0aG9kc19zdXBwb3J0ZWQ6IFtcIm5vbmVcIl0sXHJcbiAgICAgICAgICAgICAgICBzY29wZXNfc3VwcG9ydGVkOiBbXCJtY3BcIl0sXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUkZDIDc1OTEgRHluYW1pYyBDbGllbnQgUmVnaXN0cmF0aW9uIOKAlCBhY2NlcHQgYW55dGhpbmcsIHJldHVybiBkdW1teSBjbGllbnRcclxuICAgICAgICBpZiAodXJsID09PSBcIi9vYXV0aC9yZWdpc3RlclwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgICAgICBsZXQgcmVnOiBhbnkgPSB7fTtcclxuICAgICAgICAgICAgdHJ5IHsgcmVnID0gSlNPTi5wYXJzZShib2R5KTsgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcbiAgICAgICAgICAgIGNvbnN0IGNsaWVudElkID0gYGNvY29zLW1jcC1jbGllbnQtJHtEYXRlLm5vdygpfWA7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIGNsaWVudF9pZDogY2xpZW50SWQsXHJcbiAgICAgICAgICAgICAgICBjbGllbnRfaWRfaXNzdWVkX2F0OiBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKSxcclxuICAgICAgICAgICAgICAgIGNsaWVudF9uYW1lOiByZWcuY2xpZW50X25hbWUgfHwgXCJjb2Nvcy1jcmVhdG9yLW1jcCBjbGllbnRcIixcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0X3VyaXM6IHJlZy5yZWRpcmVjdF91cmlzIHx8IFtdLFxyXG4gICAgICAgICAgICAgICAgdG9rZW5fZW5kcG9pbnRfYXV0aF9tZXRob2Q6IFwibm9uZVwiLFxyXG4gICAgICAgICAgICAgICAgZ3JhbnRfdHlwZXM6IFtcImF1dGhvcml6YXRpb25fY29kZVwiXSxcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlX3R5cGVzOiBbXCJjb2RlXCJdLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9BdXRoIGF1dGhvcml6YXRpb24gZW5kcG9pbnQg4oCUIGF1dG8tY29uc2VudCwgcmVkaXJlY3QgaW1tZWRpYXRlbHkgd2l0aCBjb2RlXHJcbiAgICAgICAgaWYgKHVybC5zdGFydHNXaXRoKFwiL29hdXRoL2F1dGhvcml6ZVwiKSAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsLCBvcmlnaW4pO1xyXG4gICAgICAgICAgICBjb25zdCByZWRpcmVjdFVyaSA9IHBhcnNlZC5zZWFyY2hQYXJhbXMuZ2V0KFwicmVkaXJlY3RfdXJpXCIpIHx8IFwiXCI7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gcGFyc2VkLnNlYXJjaFBhcmFtcy5nZXQoXCJzdGF0ZVwiKSB8fCBcIlwiO1xyXG4gICAgICAgICAgICBpZiAoIXJlZGlyZWN0VXJpKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJpbnZhbGlkX3JlcXVlc3RcIiwgZXJyb3JfZGVzY3JpcHRpb246IFwicmVkaXJlY3RfdXJpIHJlcXVpcmVkXCIgfSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBgY29jb3MtbWNwLWNvZGUtJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDEwKX1gO1xyXG4gICAgICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGAke3JlZGlyZWN0VXJpfSR7cmVkaXJlY3RVcmkuaW5jbHVkZXMoXCI/XCIpID8gXCImXCIgOiBcIj9cIn1jb2RlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGNvZGUpfSZzdGF0ZT0ke2VuY29kZVVSSUNvbXBvbmVudChzdGF0ZSl9YDtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgzMDIsIHsgTG9jYXRpb246IGxvY2F0aW9uIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9BdXRoIHRva2VuIGVuZHBvaW50IOKAlCBhbHdheXMgaXNzdWUgYSBkdW1teSB0b2tlblxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL29hdXRoL3Rva2VuXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgYXdhaXQgcmVhZEJvZHkocmVxKTsgLy8gZHJhaW5cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcclxuICAgICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwibm8tc3RvcmVcIixcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgYWNjZXNzX3Rva2VuOiBcImNvY29zLW1jcC1wdWJsaWMtdG9rZW5cIixcclxuICAgICAgICAgICAgICAgIHRva2VuX3R5cGU6IFwiQmVhcmVyXCIsXHJcbiAgICAgICAgICAgICAgICBleHBpcmVzX2luOiA4NjQwMCxcclxuICAgICAgICAgICAgICAgIHNjb3BlOiBcIm1jcFwiLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEhlYWx0aCBjaGVja1xyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2hlYWx0aFwiICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXM6IFwib2tcIiwgdG9vbHM6IHRoaXMuZ2V0QWxsVG9vbHMoKS5sZW5ndGggfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHYW1lIGRlYnVnIGNvbW1hbmQgcXVldWUg4oCUIGdhbWUgcG9sbHMgZm9yIGNvbW1hbmRzXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvZ2FtZS9jb21tYW5kXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICBjb25zdCBjbWQgPSBfcGVuZGluZ0NvbW1hbmQ7XHJcbiAgICAgICAgICAgIF9wZW5kaW5nQ29tbWFuZCA9IG51bGw7IC8vIGNvbnN1bWVcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoY21kKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEdhbWUgZGVidWcgY29tbWFuZCByZXN1bHQg4oCUIGdhbWUgcG9zdHMgcmVzdWx0XHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvZ2FtZS9yZXN1bHRcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIF9jb21tYW5kUmVzdWx0ID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjA0KTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHYW1lIHByZXZpZXcgcmVjb3JkaW5nIHJlY2VpdmVyXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvZ2FtZS9yZWNvcmRpbmdcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHsgaWQsIGJhc2U2NCwgbWltZVR5cGUsIHNhdmVQYXRoIH0gPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpZCB8fCAhYmFzZTY0KSB0aHJvdyBuZXcgRXJyb3IoXCJpZC9iYXNlNjQgcmVxdWlyZWRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuZnJvbShiYXNlNjQsIFwiYmFzZTY0XCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHNhdmVQYXRo5oyH5a6a44GM44GC44KM44Gw44Gd44GT44Gr5L+d5a2Y77yI57W25a++44OR44K544G+44Gf44Gv44OX44Ot44K444Kn44Kv44OI55u45a++44OR44K577yJXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IChnbG9iYWwgYXMgYW55KS5FZGl0b3I/LlByb2plY3Q/LnBhdGhcclxuICAgICAgICAgICAgICAgICAgICB8fCBwcm9jZXNzLmN3ZCgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGRpcjogc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNhdmVQYXRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlyID0gcGF0aC5pc0Fic29sdXRlKHNhdmVQYXRoKSA/IHNhdmVQYXRoIDogcGF0aC5qb2luKHByb2plY3RQYXRoLCBzYXZlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgXCJ0ZW1wXCIsIFwicmVjb3JkaW5nc1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG10ID0gKG1pbWVUeXBlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBleHQgPSBtdC5pbmNsdWRlcyhcIndlYm1cIikgPyBcIndlYm1cIlxyXG4gICAgICAgICAgICAgICAgICAgIDogbXQuaW5jbHVkZXMoXCJtcDRcIikgPyBcIm1wNFwiXHJcbiAgICAgICAgICAgICAgICAgICAgOiBcImJpblwiO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBgJHtpZH0uJHtleHR9YDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGRpciwgZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgYnVmZmVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZXRSZWNvcmRpbmcoaWQsIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBmaWxlUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICBzaXplOiBidWZmZXIubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb25maWcuYXV0b0FyY2hpdmVSZWNvcmRpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJjaGl2ZU9sZEZpbGVzKGRpcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBwYXRoOiBmaWxlUGF0aCwgc2l6ZTogYnVmZmVyLmxlbmd0aCB9KSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEdhbWUgcHJldmlldyBsb2cgcmVjZWl2ZXJcclxuICAgICAgICBpZiAodXJsID09PSBcIi9sb2dcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJpZXM6IEdhbWVMb2dFbnRyeVtdID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgKEFycmF5LmlzQXJyYXkoZW50cmllcykgPyBlbnRyaWVzIDogW2VudHJpZXNdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9nYW1lTG9ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBlbnRyeS50aW1lc3RhbXAgfHwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXZlbDogZW50cnkubGV2ZWwgfHwgXCJsb2dcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZW50cnkubWVzc2FnZSB8fCBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIF9fZGVidWdfc3RhdGVfXyDjg63jgrDjgYvjgokgdXNlcklkIOOCkiBkZWJ1Zy1tZW51Lmpzb24g44Gr5L+d5a2YXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbXNnID0gSlNPTi5wYXJzZShlbnRyeS5tZXNzYWdlIHx8IFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXNnLl9fZGVidWdfc3RhdGVfXyAmJiBtc2cudXNlcklkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBfZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBfcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSAoZ2xvYmFsIGFzIGFueSkuRWRpdG9yPy5Qcm9qZWN0Py5wYXRoIHx8IHByb2Nlc3MuY3dkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXR0aW5nc1BhdGggPSBfcGF0aC5qb2luKHByb2plY3RQYXRoLCBcInNldHRpbmdzXCIsIFwiZGVidWctbWVudS5qc29uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2ZzLndyaXRlRmlsZVN5bmMoc2V0dGluZ3NQYXRoLCBKU09OLnN0cmluZ2lmeSh7IHVzZXJJZDogbXNnLnVzZXJJZCB9LCBudWxsLCAyKSwgXCJ1dGYtOFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBub3QgZGVidWdfc3RhdGUgKi8gfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKF9nYW1lTG9ncy5sZW5ndGggPiBNQVhfR0FNRV9MT0dfQlVGRkVSKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2dhbWVMb2dzLnNwbGljZSgwLCBfZ2FtZUxvZ3MubGVuZ3RoIC0gTUFYX0dBTUVfTE9HX0JVRkZFUik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgbWFsZm9ybWVkICovIH1cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDQpO1xyXG4gICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1DUCBlbmRwb2ludFxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL21jcFwiKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTU0Uga2VlcGFsaXZlIHN0cmVhbVxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcclxuICAgICAgICAgICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvZXZlbnQtc3RyZWFtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwibm8tY2FjaGVcIixcclxuICAgICAgICAgICAgICAgICAgICBcIkNvbm5lY3Rpb25cIjogXCJrZWVwLWFsaXZlXCIsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIC8vIFNlbmQgaW5pdGlhbCBjb21tZW50IHRvIGtlZXAgY29ubmVjdGlvbiBhbGl2ZVxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlKFwiOiBjb25uZWN0ZWRcXG5cXG5cIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5oYW5kbGVNY3BQb3N0KHJlcSwgcmVzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiREVMRVRFXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlIH0pKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gNDA0XHJcbiAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBcIk5vdCBmb3VuZFwiIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZU1jcFBvc3QocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgbGV0IHJwYzogSnNvblJwY1JlcXVlc3Q7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcnBjID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgdGhpcy5zZW5kSnNvblJwYyhyZXMsIHsganNvbnJwYzogXCIyLjBcIiwgaWQ6IG51bGwsIGVycm9yOiB7IGNvZGU6IC0zMjcwMCwgbWVzc2FnZTogXCJQYXJzZSBlcnJvclwiIH0gfSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGFjY2VwdCA9IHJlcS5oZWFkZXJzW1wiYWNjZXB0XCJdIHx8IFwiXCI7XHJcbiAgICAgICAgY29uc3Qgd2FudFNzZSA9IGFjY2VwdC5pbmNsdWRlcyhcInRleHQvZXZlbnQtc3RyZWFtXCIpO1xyXG5cclxuICAgICAgICBsZXQgcmVzcG9uc2U6IEpzb25ScGNSZXNwb25zZTtcclxuXHJcbiAgICAgICAgc3dpdGNoIChycGMubWV0aG9kKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJpbml0aWFsaXplXCI6XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvY29sVmVyc2lvbjogTUNQX1BST1RPQ09MX1ZFUlNJT04sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogeyB0b29sczoge30gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVySW5mbzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJjb2Nvcy1jcmVhdG9yLW1jcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogXCIxLjAuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwibm90aWZpY2F0aW9ucy9pbml0aWFsaXplZFwiOlxyXG4gICAgICAgICAgICAgICAgLy8gTm8gcmVzcG9uc2UgbmVlZGVkIGZvciBub3RpZmljYXRpb25cclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjA0LCB7IFwiTWNwLVNlc3Npb24tSWRcIjogU0VTU0lPTl9JRCB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJ0b29scy9saXN0XCI6XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7IHRvb2xzOiB0aGlzLmdldEFsbFRvb2xzKCkgfSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJ0b29scy9jYWxsXCI6IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xOYW1lID0gcnBjLnBhcmFtcz8ubmFtZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBycGMucGFyYW1zPy5hcmd1bWVudHMgfHwge307XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IHRoaXMudG9vbEluZGV4LmdldCh0b29sTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFjYXRlZ29yeSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogeyBjb2RlOiAtMzI2MDIsIG1lc3NhZ2U6IGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtjb2Nvcy1jcmVhdG9yLW1jcF0g4pa2ICR7dG9vbE5hbWV9YCwgT2JqZWN0LmtleXMoYXJncykubGVuZ3RoID4gMCA/IEpTT04uc3RyaW5naWZ5KGFyZ3MpLnN1YnN0cmluZygwLCAyMDApIDogXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVvdXRNcyA9ICh0b29sTmFtZS5zdGFydHNXaXRoKFwicHJlZmFiX1wiKSB8fCB0b29sTmFtZSA9PT0gXCJzY2VuZV9vcGVuXCIpID8gMTIwMDAwIDogMzAwMDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHdpdGhUaW1lb3V0KGNhdGVnb3J5LmV4ZWN1dGUodG9vbE5hbWUsIGFyZ3MpLCB0aW1lb3V0TXMsIGBUb29sICR7dG9vbE5hbWV9IHRpbWVkIG91dGApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW2NvY29zLWNyZWF0b3ItbWNwXSDinJMgJHt0b29sTmFtZX0gKCR7RGF0ZS5ub3coKSAtIHN0YXJ0fW1zKWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbY29jb3MtY3JlYXRvci1tY3BdIOKclyAke3Rvb2xOYW1lfTpgLCBlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB7IGNvZGU6IC0zMjYwMywgbWVzc2FnZTogZS5tZXNzYWdlIHx8IFN0cmluZyhlKSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiB7IGNvZGU6IC0zMjYwMSwgbWVzc2FnZTogYE1ldGhvZCBub3QgZm91bmQ6ICR7cnBjLm1ldGhvZH1gIH0sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHdhbnRTc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5zZW5kU3NlKHJlcywgW3Jlc3BvbnNlXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zZW5kSnNvblJwYyhyZXMsIHJlc3BvbnNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZW5kSnNvblJwYyhyZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsIGRhdGE6IEpzb25ScGNSZXNwb25zZSk6IHZvaWQge1xyXG4gICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XHJcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgICBcIk1jcC1TZXNzaW9uLUlkXCI6IFNFU1NJT05fSUQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZW5kU3NlKHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwgbWVzc2FnZXM6IEpzb25ScGNSZXNwb25zZVtdKTogdm9pZCB7XHJcbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcclxuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiLFxyXG4gICAgICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1jYWNoZVwiLFxyXG4gICAgICAgICAgICBcIk1jcC1TZXNzaW9uLUlkXCI6IFNFU1NJT05fSUQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZm9yIChjb25zdCBtc2cgb2YgbWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlKGBldmVudDogbWVzc2FnZVxcbmRhdGE6ICR7SlNPTi5zdHJpbmdpZnkobXNnKX1cXG5cXG5gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB3aXRoVGltZW91dDxUPihwcm9taXNlOiBQcm9taXNlPFQ+LCBtczogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IobWVzc2FnZSkpLCBtcyk7XHJcbiAgICAgICAgcHJvbWlzZS50aGVuKFxyXG4gICAgICAgICAgICAodikgPT4geyBjbGVhclRpbWVvdXQodGltZXIpOyByZXNvbHZlKHYpOyB9LFxyXG4gICAgICAgICAgICAoZSkgPT4geyBjbGVhclRpbWVvdXQodGltZXIpOyByZWplY3QoZSk7IH0sXHJcbiAgICAgICAgKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkQm9keShyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgY2h1bmtzOiBCdWZmZXJbXSA9IFtdO1xyXG4gICAgICAgIHJlcS5vbihcImRhdGFcIiwgKGMpID0+IGNodW5rcy5wdXNoKGMpKTtcclxuICAgICAgICByZXEub24oXCJlbmRcIiwgKCkgPT4gcmVzb2x2ZShCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoXCJ1dGYtOFwiKSkpO1xyXG4gICAgICAgIHJlcS5vbihcImVycm9yXCIsIHJlamVjdCk7XHJcbiAgICB9KTtcclxufVxyXG4iXX0=