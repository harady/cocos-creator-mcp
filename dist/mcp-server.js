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
exports.BUILD_HASH = "60e146d23b96";
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
                        const result = await withTimeout(category.execute(toolName, args), 30000, `Tool ${toolName} timed out`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tY3Atc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQXNCQSxrQ0FNQztBQUVELHNDQUVDO0FBd0JELDRDQUtDO0FBR0QsNENBRUM7QUFHRCw4Q0FHQztBQWFELG9DQUVDO0FBRUQsb0NBRUM7QUEzRkQsZ0RBQXdCO0FBQ3hCLG1DQUFzSDtBQUN0SCx1Q0FBNEM7QUFFNUMsTUFBTSxvQkFBb0IsR0FBRyxZQUFZLENBQUM7QUFDMUMsTUFBTSxVQUFVLEdBQUcsYUFBYSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFFNUYsb0NBQW9DO0FBQ3ZCLFFBQUEsVUFBVSxHQUFHLGdCQUFnQixDQUFDO0FBVTNDLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0FBQ2hDLE1BQU0sU0FBUyxHQUFtQixFQUFFLENBQUM7QUFFckMsc0RBQXNEO0FBQ3RELFNBQWdCLFdBQVcsQ0FBQyxLQUFhLEVBQUUsS0FBYztJQUNyRCxJQUFJLElBQUksR0FBRyxTQUFTLENBQUM7SUFDckIsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0QsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNqRSxDQUFDO0FBRUQsU0FBZ0IsYUFBYTtJQUN6QixTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUN6QixD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QUFNLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaHR0cCBmcm9tIFwiaHR0cFwiO1xyXG5pbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBKc29uUnBjUmVxdWVzdCwgSnNvblJwY1Jlc3BvbnNlLCBTZXJ2ZXJDb25maWcsIERFRkFVTFRfQ09ORklHIH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgYXJjaGl2ZU9sZEZpbGVzIH0gZnJvbSBcIi4vYXJjaGl2ZVwiO1xyXG5cclxuY29uc3QgTUNQX1BST1RPQ09MX1ZFUlNJT04gPSBcIjIwMjQtMTEtMDVcIjtcclxuY29uc3QgU0VTU0lPTl9JRCA9IGBjb2Nvcy1tY3AtJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCAxMCl9YDtcclxuXHJcbi8qKiDjg5Pjg6vjg4nmmYLjgavjgrPjg7zjg4njg5njg7zjgrnjga5TSEEyNTbjg4/jg4Pjgrfjg6XjgYzln4vjgoHovrzjgb7jgozjgosgKi9cclxuZXhwb3J0IGNvbnN0IEJVSUxEX0hBU0ggPSBcIl9fQlVJTERfSEFTSF9fXCI7XHJcblxyXG4vLyDilIDilIDilIAgR2FtZSBQcmV2aWV3IExvZyBCdWZmZXIg4pSA4pSA4pSAXHJcblxyXG5pbnRlcmZhY2UgR2FtZUxvZ0VudHJ5IHtcclxuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xyXG4gICAgbGV2ZWw6IFwibG9nXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIjtcclxuICAgIG1lc3NhZ2U6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgTUFYX0dBTUVfTE9HX0JVRkZFUiA9IDUwMDtcclxuY29uc3QgX2dhbWVMb2dzOiBHYW1lTG9nRW50cnlbXSA9IFtdO1xyXG5cclxuLyoqIEFjY2VzcyBnYW1lIHByZXZpZXcgbG9nIGJ1ZmZlciBmcm9tIGRlYnVnLXRvb2xzICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRHYW1lTG9ncyhjb3VudDogbnVtYmVyLCBsZXZlbD86IHN0cmluZyk6IHsgbG9nczogR2FtZUxvZ0VudHJ5W107IHRvdGFsOiBudW1iZXIgfSB7XHJcbiAgICBsZXQgbG9ncyA9IF9nYW1lTG9ncztcclxuICAgIGlmIChsZXZlbCkge1xyXG4gICAgICAgIGxvZ3MgPSBsb2dzLmZpbHRlcihsID0+IGwubGV2ZWwgPT09IGxldmVsKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7IGxvZ3M6IGxvZ3Muc2xpY2UoLWNvdW50KSwgdG90YWw6IF9nYW1lTG9ncy5sZW5ndGggfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyR2FtZUxvZ3MoKTogdm9pZCB7XHJcbiAgICBfZ2FtZUxvZ3MubGVuZ3RoID0gMDtcclxufVxyXG5cclxuLy8g4pSA4pSA4pSAIEdhbWUgRGVidWcgQ29tbWFuZCBRdWV1ZSDilIDilIDilIBcclxuXHJcbmludGVyZmFjZSBHYW1lQ29tbWFuZCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgdHlwZTogc3RyaW5nO1xyXG4gICAgYXJncz86IGFueTtcclxuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgR2FtZUNvbW1hbmRSZXN1bHQge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XHJcbiAgICBkYXRhPzogYW55O1xyXG4gICAgZXJyb3I/OiBzdHJpbmc7XHJcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcclxufVxyXG5cclxubGV0IF9wZW5kaW5nQ29tbWFuZDogR2FtZUNvbW1hbmQgfCBudWxsID0gbnVsbDtcclxubGV0IF9jb21tYW5kUmVzdWx0OiBHYW1lQ29tbWFuZFJlc3VsdCB8IG51bGwgPSBudWxsO1xyXG5sZXQgX2NvbW1hbmRJZENvdW50ZXIgPSAwO1xyXG5cclxuLyoqIFF1ZXVlIGEgY29tbWFuZCBmb3IgdGhlIGdhbWUgdG8gZXhlY3V0ZSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcXVldWVHYW1lQ29tbWFuZCh0eXBlOiBzdHJpbmcsIGFyZ3M/OiBhbnkpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgaWQgPSBgY21kXyR7KytfY29tbWFuZElkQ291bnRlcn1fJHtEYXRlLm5vdygpfWA7XHJcbiAgICBfcGVuZGluZ0NvbW1hbmQgPSB7IGlkLCB0eXBlLCBhcmdzLCB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9O1xyXG4gICAgX2NvbW1hbmRSZXN1bHQgPSBudWxsO1xyXG4gICAgcmV0dXJuIGlkO1xyXG59XHJcblxyXG4vKiogR2V0IHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgY29tbWFuZCAocG9sbCB1bnRpbCBhdmFpbGFibGUpICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21tYW5kUmVzdWx0KCk6IEdhbWVDb21tYW5kUmVzdWx0IHwgbnVsbCB7XHJcbiAgICByZXR1cm4gX2NvbW1hbmRSZXN1bHQ7XHJcbn1cclxuXHJcbi8qKiBDbGVhciBjb21tYW5kIHN0YXRlICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhckNvbW1hbmRTdGF0ZSgpOiB2b2lkIHtcclxuICAgIF9wZW5kaW5nQ29tbWFuZCA9IG51bGw7XHJcbiAgICBfY29tbWFuZFJlc3VsdCA9IG51bGw7XHJcbn1cclxuXHJcbi8vIOKUgOKUgOKUgCBSZWNvcmRpbmcgU3RvcmFnZSDilIDilIDilIBcclxuXHJcbmludGVyZmFjZSBSZWNvcmRpbmdJbmZvIHtcclxuICAgIHBhdGg6IHN0cmluZztcclxuICAgIHNpemU6IG51bWJlcjtcclxuICAgIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBfcmVjb3JkaW5ncyA9IG5ldyBNYXA8c3RyaW5nLCBSZWNvcmRpbmdJbmZvPigpO1xyXG5cclxuLyoqIEdldCBjb21wbGV0ZWQgcmVjb3JkaW5nIGluZm8gYnkgaWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlY29yZGluZyhpZDogc3RyaW5nKTogUmVjb3JkaW5nSW5mbyB8IHVuZGVmaW5lZCB7XHJcbiAgICByZXR1cm4gX3JlY29yZGluZ3MuZ2V0KGlkKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFJlY29yZGluZyhpZDogc3RyaW5nLCBpbmZvOiBSZWNvcmRpbmdJbmZvKTogdm9pZCB7XHJcbiAgICBfcmVjb3JkaW5ncy5zZXQoaWQsIGluZm8pO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWNwU2VydmVyIHtcclxuICAgIHByaXZhdGUgc2VydmVyOiBodHRwLlNlcnZlciB8IG51bGwgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSB0b29sczogTWFwPHN0cmluZywgVG9vbENhdGVnb3J5PiA9IG5ldyBNYXAoKTtcclxuICAgIHByaXZhdGUgdG9vbEluZGV4OiBNYXA8c3RyaW5nLCBUb29sQ2F0ZWdvcnk+ID0gbmV3IE1hcCgpOyAvLyB0b29sTmFtZSAtPiBjYXRlZ29yeVxyXG4gICAgcHJpdmF0ZSBjb25maWc6IFNlcnZlckNvbmZpZztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihjb25maWc/OiBQYXJ0aWFsPFNlcnZlckNvbmZpZz4pIHtcclxuICAgICAgICB0aGlzLmNvbmZpZyA9IHsgLi4uREVGQVVMVF9DT05GSUcsIC4uLmNvbmZpZyB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBSZWdpc3RlciBhIHRvb2wgY2F0ZWdvcnkgKi9cclxuICAgIHJlZ2lzdGVyKGNhdGVnb3J5OiBUb29sQ2F0ZWdvcnkpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnRvb2xzLnNldChjYXRlZ29yeS5jYXRlZ29yeU5hbWUsIGNhdGVnb3J5KTtcclxuICAgICAgICBmb3IgKGNvbnN0IHRvb2wgb2YgY2F0ZWdvcnkuZ2V0VG9vbHMoKSkge1xyXG4gICAgICAgICAgICB0aGlzLnRvb2xJbmRleC5zZXQodG9vbC5uYW1lLCBjYXRlZ29yeSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBHZXQgYWxsIHRvb2wgZGVmaW5pdGlvbnMgKi9cclxuICAgIGdldEFsbFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIGNvbnN0IGFsbDogVG9vbERlZmluaXRpb25bXSA9IFtdO1xyXG4gICAgICAgIGZvciAoY29uc3QgY2F0IG9mIHRoaXMudG9vbHMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgYWxsLnB1c2goLi4uY2F0LmdldFRvb2xzKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBTdGFydCBIVFRQIHNlcnZlciAqL1xyXG4gICAgc3RhcnQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VydmVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIoKHJlcSwgcmVzKSA9PiB0aGlzLmhhbmRsZVJlcXVlc3QocmVxLCByZXMpKTtcclxuICAgICAgICAgICAgdGhpcy5zZXJ2ZXIubGlzdGVuKHRoaXMuY29uZmlnLnBvcnQsIFwiMTI3LjAuMC4xXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbY29jb3MtY3JlYXRvci1tY3BdIFNlcnZlciBzdGFydGVkIG9uIGh0dHA6Ly8xMjcuMC4wLjE6JHt0aGlzLmNvbmZpZy5wb3J0fS9tY3BgKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLm9uKFwiZXJyb3JcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtjb2Nvcy1jcmVhdG9yLW1jcF0gU2VydmVyIGVycm9yOmAsIGUpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogU3RvcCBIVFRQIHNlcnZlciAqL1xyXG4gICAgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnNlcnZlcikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLmNsb3NlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VydmVyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiW2NvY29zLWNyZWF0b3ItbWNwXSBTZXJ2ZXIgc3RvcHBlZFwiKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGlzUnVubmluZygpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2ZXIgIT09IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHBvcnQoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25maWcucG9ydDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVJlcXVlc3QocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgLy8gQ09SU1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiR0VULCBQT1NULCBERUxFVEUsIE9QVElPTlNcIik7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIiwgXCJDb250ZW50LVR5cGUsIEFjY2VwdFwiKTtcclxuXHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjA0KTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB1cmwgPSByZXEudXJsIHx8IFwiL1wiO1xyXG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IGBodHRwOi8vMTI3LjAuMC4xOiR7dGhpcy5jb25maWcucG9ydH1gO1xyXG5cclxuICAgICAgICAvLyDilIDilIDilIAgT0F1dGggZW5kcG9pbnRzIChNQ1Agc3BlYyAyMDI1LTA2LTE4IC8gUkZDIDk3MjggLyBSRkMgODQxNCAvIFJGQyA3NTkxKSDilIDilIDilIBcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIENsYXVkZSBDb2RlIOOBriBWU0NvZGUg5ouh5by144GvIEhUVFAg44OI44Op44Oz44K544Od44O844OI44GuIE1DUCDjgrXjg7zjg5Djg7zjgavlr77jgZfjgaZcclxuICAgICAgICAvLyDnhKHmnaHku7bjgacgT0F1dGggZGlzY292ZXJ5IC8gRENSIOOCkuippuOBv+OCiyAoIzI2OTE3IOetieOBruaXouefpeODkOOCsCnjgIJcclxuICAgICAgICAvLyBjb2Nvcy1jcmVhdG9yLW1jcCDjga8gbG9jYWxob3N0LW9ubHkg44Gu44Ot44O844Kr44Or6ZaL55m644OE44O844Or44Gn5pys54mp44Gu6KqN6Ki844Gv5LiN6KaB44Gg44GM44CBXHJcbiAgICAgICAgLy8g44Kv44Op44Kk44Ki44Oz44OI44KS5rqA6Laz44GV44Gb44KL44Gf44KBIE9BdXRoIOOCqOODs+ODieODneOCpOODs+ODiOe+pOOCkuODgOODn+ODvOWun+ijheOBl+OBpuW4uOaZguioseWPr+OBmeOCi+OAglxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gVE9ETzog5Lul5LiL44Gu44GE44Ga44KM44GL44GM55m655Sf44GX44Gf44KJ5YmK6Zmk44GZ44KLXHJcbiAgICAgICAgLy8gICAxLiBhbnRocm9waWNzL2NsYXVkZS1jb2RlICMyNjkxNyAvICMzODEwMiDnrYnjga4gSFRUUCBPQXV0aCDjg5DjgrDjgYzkv67mraPjgZXjgozjgotcclxuICAgICAgICAvLyAgIDIuIOacrOeJqeOBruiqjeiovOapn+ani+OCkuWun+ijheOBmeOCi+W/heimgeOBjOWHuuOCi++8iOWBvSBPQXV0aCDjgajooZ3nqoHjgZnjgovjgZ/jgoHvvIlcclxuICAgICAgICAvLyAgIDMuIE1DUCBzcGVjIOOBjCBQS0NFIOaknOiovOODu+ODiOODvOOCr+ODs+ODreODvOODhuODvOOCt+ODp+ODs+W/hemgiOetieOBq+abtOaWsOOBleOCjOOCi1xyXG4gICAgICAgIC8vICAgNC4gc3RkaW8g44OW44Oq44OD44K444GM5Y2B5YiG5a6a552A44GX44GmIEhUVFAgdHJhbnNwb3J0IOiHquS9k+OCkiBkZXByZWNhdGUg44GZ44KLXHJcblxyXG4gICAgICAgIC8vIFJGQyA5NzI4IFByb3RlY3RlZCBSZXNvdXJjZSBNZXRhZGF0YVxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiLy53ZWxsLWtub3duL29hdXRoLXByb3RlY3RlZC1yZXNvdXJjZVwiICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2U6IGAke29yaWdpbn0vbWNwYCxcclxuICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25fc2VydmVyczogW29yaWdpbl0sXHJcbiAgICAgICAgICAgICAgICBiZWFyZXJfbWV0aG9kc19zdXBwb3J0ZWQ6IFtcImhlYWRlclwiXSxcclxuICAgICAgICAgICAgICAgIHNjb3Blc19zdXBwb3J0ZWQ6IFtcIm1jcFwiXSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSRkMgODQxNCBBdXRob3JpemF0aW9uIFNlcnZlciBNZXRhZGF0YVxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiLy53ZWxsLWtub3duL29hdXRoLWF1dGhvcml6YXRpb24tc2VydmVyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBpc3N1ZXI6IG9yaWdpbixcclxuICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25fZW5kcG9pbnQ6IGAke29yaWdpbn0vb2F1dGgvYXV0aG9yaXplYCxcclxuICAgICAgICAgICAgICAgIHRva2VuX2VuZHBvaW50OiBgJHtvcmlnaW59L29hdXRoL3Rva2VuYCxcclxuICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbl9lbmRwb2ludDogYCR7b3JpZ2lufS9vYXV0aC9yZWdpc3RlcmAsXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZV90eXBlc19zdXBwb3J0ZWQ6IFtcImNvZGVcIl0sXHJcbiAgICAgICAgICAgICAgICBncmFudF90eXBlc19zdXBwb3J0ZWQ6IFtcImF1dGhvcml6YXRpb25fY29kZVwiXSxcclxuICAgICAgICAgICAgICAgIGNvZGVfY2hhbGxlbmdlX21ldGhvZHNfc3VwcG9ydGVkOiBbXCJTMjU2XCIsIFwicGxhaW5cIl0sXHJcbiAgICAgICAgICAgICAgICB0b2tlbl9lbmRwb2ludF9hdXRoX21ldGhvZHNfc3VwcG9ydGVkOiBbXCJub25lXCJdLFxyXG4gICAgICAgICAgICAgICAgc2NvcGVzX3N1cHBvcnRlZDogW1wibWNwXCJdLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJGQyA3NTkxIER5bmFtaWMgQ2xpZW50IFJlZ2lzdHJhdGlvbiDigJQgYWNjZXB0IGFueXRoaW5nLCByZXR1cm4gZHVtbXkgY2xpZW50XHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvb2F1dGgvcmVnaXN0ZXJcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcclxuICAgICAgICAgICAgbGV0IHJlZzogYW55ID0ge307XHJcbiAgICAgICAgICAgIHRyeSB7IHJlZyA9IEpTT04ucGFyc2UoYm9keSk7IH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxyXG4gICAgICAgICAgICBjb25zdCBjbGllbnRJZCA9IGBjb2Nvcy1tY3AtY2xpZW50LSR7RGF0ZS5ub3coKX1gO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBjbGllbnRfaWQ6IGNsaWVudElkLFxyXG4gICAgICAgICAgICAgICAgY2xpZW50X2lkX2lzc3VlZF9hdDogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXHJcbiAgICAgICAgICAgICAgICBjbGllbnRfbmFtZTogcmVnLmNsaWVudF9uYW1lIHx8IFwiY29jb3MtY3JlYXRvci1tY3AgY2xpZW50XCIsXHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdF91cmlzOiByZWcucmVkaXJlY3RfdXJpcyB8fCBbXSxcclxuICAgICAgICAgICAgICAgIHRva2VuX2VuZHBvaW50X2F1dGhfbWV0aG9kOiBcIm5vbmVcIixcclxuICAgICAgICAgICAgICAgIGdyYW50X3R5cGVzOiBbXCJhdXRob3JpemF0aW9uX2NvZGVcIl0sXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZV90eXBlczogW1wiY29kZVwiXSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPQXV0aCBhdXRob3JpemF0aW9uIGVuZHBvaW50IOKAlCBhdXRvLWNvbnNlbnQsIHJlZGlyZWN0IGltbWVkaWF0ZWx5IHdpdGggY29kZVxyXG4gICAgICAgIGlmICh1cmwuc3RhcnRzV2l0aChcIi9vYXV0aC9hdXRob3JpemVcIikgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCwgb3JpZ2luKTtcclxuICAgICAgICAgICAgY29uc3QgcmVkaXJlY3RVcmkgPSBwYXJzZWQuc2VhcmNoUGFyYW1zLmdldChcInJlZGlyZWN0X3VyaVwiKSB8fCBcIlwiO1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0ZSA9IHBhcnNlZC5zZWFyY2hQYXJhbXMuZ2V0KFwic3RhdGVcIikgfHwgXCJcIjtcclxuICAgICAgICAgICAgaWYgKCFyZWRpcmVjdFVyaSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiaW52YWxpZF9yZXF1ZXN0XCIsIGVycm9yX2Rlc2NyaXB0aW9uOiBcInJlZGlyZWN0X3VyaSByZXF1aXJlZFwiIH0pKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjb2RlID0gYGNvY29zLW1jcC1jb2RlLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCAxMCl9YDtcclxuICAgICAgICAgICAgY29uc3QgbG9jYXRpb24gPSBgJHtyZWRpcmVjdFVyaX0ke3JlZGlyZWN0VXJpLmluY2x1ZGVzKFwiP1wiKSA/IFwiJlwiIDogXCI/XCJ9Y29kZT0ke2VuY29kZVVSSUNvbXBvbmVudChjb2RlKX0mc3RhdGU9JHtlbmNvZGVVUklDb21wb25lbnQoc3RhdGUpfWA7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMzAyLCB7IExvY2F0aW9uOiBsb2NhdGlvbiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPQXV0aCB0b2tlbiBlbmRwb2ludCDigJQgYWx3YXlzIGlzc3VlIGEgZHVtbXkgdG9rZW5cclxuICAgICAgICBpZiAodXJsID09PSBcIi9vYXV0aC90b2tlblwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlYWRCb2R5KHJlcSk7IC8vIGRyYWluXHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XHJcbiAgICAgICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLXN0b3JlXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIGFjY2Vzc190b2tlbjogXCJjb2Nvcy1tY3AtcHVibGljLXRva2VuXCIsXHJcbiAgICAgICAgICAgICAgICB0b2tlbl90eXBlOiBcIkJlYXJlclwiLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJlc19pbjogODY0MDAsXHJcbiAgICAgICAgICAgICAgICBzY29wZTogXCJtY3BcIixcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBIZWFsdGggY2hlY2tcclxuICAgICAgICBpZiAodXJsID09PSBcIi9oZWFsdGhcIiAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3RhdHVzOiBcIm9rXCIsIHRvb2xzOiB0aGlzLmdldEFsbFRvb2xzKCkubGVuZ3RoIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2FtZSBkZWJ1ZyBjb21tYW5kIHF1ZXVlIOKAlCBnYW1lIHBvbGxzIGZvciBjb21tYW5kc1xyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2dhbWUvY29tbWFuZFwiICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgY21kID0gX3BlbmRpbmdDb21tYW5kO1xyXG4gICAgICAgICAgICBfcGVuZGluZ0NvbW1hbmQgPSBudWxsOyAvLyBjb25zdW1lXHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGNtZCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHYW1lIGRlYnVnIGNvbW1hbmQgcmVzdWx0IOKAlCBnYW1lIHBvc3RzIHJlc3VsdFxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2dhbWUvcmVzdWx0XCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBfY29tbWFuZFJlc3VsdCA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwNCk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2FtZSBwcmV2aWV3IHJlY29yZGluZyByZWNlaXZlclxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2dhbWUvcmVjb3JkaW5nXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7IGlkLCBiYXNlNjQsIG1pbWVUeXBlLCBzYXZlUGF0aCB9ID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICAgICAgICAgIGlmICghaWQgfHwgIWJhc2U2NCkgdGhyb3cgbmV3IEVycm9yKFwiaWQvYmFzZTY0IHJlcXVpcmVkXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmZyb20oYmFzZTY0LCBcImJhc2U2NFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzYXZlUGF0aOaMh+WumuOBjOOBguOCjOOBsOOBneOBk+OBq+S/neWtmO+8iOe1tuWvvuODkeOCueOBvuOBn+OBr+ODl+ODreOCuOOCp+OCr+ODiOebuOWvvuODkeOCue+8iVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSAoZ2xvYmFsIGFzIGFueSkuRWRpdG9yPy5Qcm9qZWN0Py5wYXRoXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgcHJvY2Vzcy5jd2QoKTtcclxuICAgICAgICAgICAgICAgIGxldCBkaXI6IHN0cmluZztcclxuICAgICAgICAgICAgICAgIGlmIChzYXZlUGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpciA9IHBhdGguaXNBYnNvbHV0ZShzYXZlUGF0aCkgPyBzYXZlUGF0aCA6IHBhdGguam9pbihwcm9qZWN0UGF0aCwgc2F2ZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIFwidGVtcFwiLCBcInJlY29yZGluZ3NcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtdCA9IChtaW1lVHlwZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXh0ID0gbXQuaW5jbHVkZXMoXCJ3ZWJtXCIpID8gXCJ3ZWJtXCJcclxuICAgICAgICAgICAgICAgICAgICA6IG10LmluY2x1ZGVzKFwibXA0XCIpID8gXCJtcDRcIlxyXG4gICAgICAgICAgICAgICAgICAgIDogXCJiaW5cIjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gYCR7aWR9LiR7ZXh0fWA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIGJ1ZmZlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgc2V0UmVjb3JkaW5nKGlkLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogZmlsZVBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogYnVmZmVyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmF1dG9BcmNoaXZlUmVjb3JkaW5ncykge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyY2hpdmVPbGRGaWxlcyhkaXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgcGF0aDogZmlsZVBhdGgsIHNpemU6IGJ1ZmZlci5sZW5ndGggfSkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHYW1lIHByZXZpZXcgbG9nIHJlY2VpdmVyXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvbG9nXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyaWVzOiBHYW1lTG9nRW50cnlbXSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIChBcnJheS5pc0FycmF5KGVudHJpZXMpID8gZW50cmllcyA6IFtlbnRyaWVzXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBfZ2FtZUxvZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogZW50cnkudGltZXN0YW1wIHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IGVudHJ5LmxldmVsIHx8IFwibG9nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVudHJ5Lm1lc3NhZ2UgfHwgXCJcIixcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChfZ2FtZUxvZ3MubGVuZ3RoID4gTUFYX0dBTUVfTE9HX0JVRkZFUikge1xyXG4gICAgICAgICAgICAgICAgICAgIF9nYW1lTG9ncy5zcGxpY2UoMCwgX2dhbWVMb2dzLmxlbmd0aCAtIE1BWF9HQU1FX0xPR19CVUZGRVIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogaWdub3JlIG1hbGZvcm1lZCAqLyB9XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjA0KTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNQ1AgZW5kcG9pbnRcclxuICAgICAgICBpZiAodXJsID09PSBcIi9tY3BcIikge1xyXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICAgICAgLy8gU1NFIGtlZXBhbGl2ZSBzdHJlYW1cclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJDb25uZWN0aW9uXCI6IFwia2VlcC1hbGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAvLyBTZW5kIGluaXRpYWwgY29tbWVudCB0byBrZWVwIGNvbm5lY3Rpb24gYWxpdmVcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZShcIjogY29ubmVjdGVkXFxuXFxuXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlTWNwUG9zdChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIkRFTEVURVwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBvazogdHJ1ZSB9KSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDQwNFxyXG4gICAgICAgIHJlcy53cml0ZUhlYWQoNDA0LCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJOb3QgZm91bmRcIiB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVNY3BQb3N0KHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgIGxldCBycGM6IEpzb25ScGNSZXF1ZXN0O1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJwYyA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VuZEpzb25ScGMocmVzLCB7IGpzb25ycGM6IFwiMi4wXCIsIGlkOiBudWxsLCBlcnJvcjogeyBjb2RlOiAtMzI3MDAsIG1lc3NhZ2U6IFwiUGFyc2UgZXJyb3JcIiB9IH0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhY2NlcHQgPSByZXEuaGVhZGVyc1tcImFjY2VwdFwiXSB8fCBcIlwiO1xyXG4gICAgICAgIGNvbnN0IHdhbnRTc2UgPSBhY2NlcHQuaW5jbHVkZXMoXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiKTtcclxuXHJcbiAgICAgICAgbGV0IHJlc3BvbnNlOiBKc29uUnBjUmVzcG9uc2U7XHJcblxyXG4gICAgICAgIHN3aXRjaCAocnBjLm1ldGhvZCkge1xyXG4gICAgICAgICAgICBjYXNlIFwiaW5pdGlhbGl6ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm90b2NvbFZlcnNpb246IE1DUF9QUk9UT0NPTF9WRVJTSU9OLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHsgdG9vbHM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckluZm86IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IFwiMS4wLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcIm5vdGlmaWNhdGlvbnMvaW5pdGlhbGl6ZWRcIjpcclxuICAgICAgICAgICAgICAgIC8vIE5vIHJlc3BvbnNlIG5lZWRlZCBmb3Igbm90aWZpY2F0aW9uXHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwNCwgeyBcIk1jcC1TZXNzaW9uLUlkXCI6IFNFU1NJT05fSUQgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwidG9vbHMvbGlzdFwiOlxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogeyB0b29sczogdGhpcy5nZXRBbGxUb29scygpIH0sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwidG9vbHMvY2FsbFwiOiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b29sTmFtZSA9IHJwYy5wYXJhbXM/Lm5hbWU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gcnBjLnBhcmFtcz8uYXJndW1lbnRzIHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSB0aGlzLnRvb2xJbmRleC5nZXQodG9vbE5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY2F0ZWdvcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHsgY29kZTogLTMyNjAyLCBtZXNzYWdlOiBgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbY29jb3MtY3JlYXRvci1tY3BdIOKWtiAke3Rvb2xOYW1lfWAsIE9iamVjdC5rZXlzKGFyZ3MpLmxlbmd0aCA+IDAgPyBKU09OLnN0cmluZ2lmeShhcmdzKS5zdWJzdHJpbmcoMCwgMjAwKSA6IFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3aXRoVGltZW91dChjYXRlZ29yeS5leGVjdXRlKHRvb2xOYW1lLCBhcmdzKSwgMzAwMDAsIGBUb29sICR7dG9vbE5hbWV9IHRpbWVkIG91dGApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW2NvY29zLWNyZWF0b3ItbWNwXSDinJMgJHt0b29sTmFtZX0gKCR7RGF0ZS5ub3coKSAtIHN0YXJ0fW1zKWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbY29jb3MtY3JlYXRvci1tY3BdIOKclyAke3Rvb2xOYW1lfTpgLCBlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB7IGNvZGU6IC0zMjYwMywgbWVzc2FnZTogZS5tZXNzYWdlIHx8IFN0cmluZyhlKSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiB7IGNvZGU6IC0zMjYwMSwgbWVzc2FnZTogYE1ldGhvZCBub3QgZm91bmQ6ICR7cnBjLm1ldGhvZH1gIH0sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHdhbnRTc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5zZW5kU3NlKHJlcywgW3Jlc3BvbnNlXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zZW5kSnNvblJwYyhyZXMsIHJlc3BvbnNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZW5kSnNvblJwYyhyZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsIGRhdGE6IEpzb25ScGNSZXNwb25zZSk6IHZvaWQge1xyXG4gICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XHJcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgICBcIk1jcC1TZXNzaW9uLUlkXCI6IFNFU1NJT05fSUQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZW5kU3NlKHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwgbWVzc2FnZXM6IEpzb25ScGNSZXNwb25zZVtdKTogdm9pZCB7XHJcbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcclxuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiLFxyXG4gICAgICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1jYWNoZVwiLFxyXG4gICAgICAgICAgICBcIk1jcC1TZXNzaW9uLUlkXCI6IFNFU1NJT05fSUQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZm9yIChjb25zdCBtc2cgb2YgbWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlKGBldmVudDogbWVzc2FnZVxcbmRhdGE6ICR7SlNPTi5zdHJpbmdpZnkobXNnKX1cXG5cXG5gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB3aXRoVGltZW91dDxUPihwcm9taXNlOiBQcm9taXNlPFQ+LCBtczogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IobWVzc2FnZSkpLCBtcyk7XHJcbiAgICAgICAgcHJvbWlzZS50aGVuKFxyXG4gICAgICAgICAgICAodikgPT4geyBjbGVhclRpbWVvdXQodGltZXIpOyByZXNvbHZlKHYpOyB9LFxyXG4gICAgICAgICAgICAoZSkgPT4geyBjbGVhclRpbWVvdXQodGltZXIpOyByZWplY3QoZSk7IH0sXHJcbiAgICAgICAgKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkQm9keShyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgY2h1bmtzOiBCdWZmZXJbXSA9IFtdO1xyXG4gICAgICAgIHJlcS5vbihcImRhdGFcIiwgKGMpID0+IGNodW5rcy5wdXNoKGMpKTtcclxuICAgICAgICByZXEub24oXCJlbmRcIiwgKCkgPT4gcmVzb2x2ZShCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoXCJ1dGYtOFwiKSkpO1xyXG4gICAgICAgIHJlcS5vbihcImVycm9yXCIsIHJlamVjdCk7XHJcbiAgICB9KTtcclxufVxyXG4iXX0=