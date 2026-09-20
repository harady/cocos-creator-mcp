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
const registry_1 = require("./resources/registry");
const definitions_1 = require("./resources/definitions");
const MCP_PROTOCOL_VERSION = "2024-11-05";
const SESSION_ID = `cocos-mcp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
/** ビルド時にコードベースのSHA256ハッシュが埋め込まれる */
exports.BUILD_HASH = "45611bcef8d2";
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
        this.resources = new registry_1.ResourceRegistry();
        this.config = Object.assign(Object.assign({}, types_1.DEFAULT_CONFIG), config);
        this.resources.register(...definitions_1.ALL_RESOURCES);
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
        var _a, _b, _c;
        const body = await readBody(req);
        let rpc;
        try {
            rpc = JSON.parse(body);
        }
        catch (_d) {
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
                        capabilities: { tools: {}, resources: {} },
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
            case "resources/list":
                response = {
                    jsonrpc: "2.0",
                    id: rpc.id,
                    result: { resources: this.resources.listFixed() },
                };
                break;
            case "resources/templates/list":
                response = {
                    jsonrpc: "2.0",
                    id: rpc.id,
                    result: { resourceTemplates: this.resources.listTemplates() },
                };
                break;
            case "resources/read": {
                const uri = (_c = rpc.params) === null || _c === void 0 ? void 0 : _c.uri;
                if (typeof uri !== "string" || !uri) {
                    response = {
                        jsonrpc: "2.0",
                        id: rpc.id,
                        error: { code: -32602, message: "resources/read: 'uri' is required" },
                    };
                    break;
                }
                const match = this.resources.match(uri);
                if (!match) {
                    response = {
                        jsonrpc: "2.0",
                        id: rpc.id,
                        error: { code: -32602, message: `Unknown resource URI: ${uri}` },
                    };
                    break;
                }
                try {
                    const start = Date.now();
                    console.log(`[cocos-creator-mcp] ▶ resource ${uri}`);
                    const data = await withTimeout(match.def.read(match.params), 30000, `Resource ${uri} timed out`);
                    console.log(`[cocos-creator-mcp] ✓ resource ${uri} (${Date.now() - start}ms)`);
                    response = {
                        jsonrpc: "2.0",
                        id: rpc.id,
                        result: {
                            contents: [{
                                    uri,
                                    mimeType: match.def.mimeType || "application/json",
                                    text: JSON.stringify(data, null, 2),
                                }],
                        },
                    };
                }
                catch (e) {
                    console.error(`[cocos-creator-mcp] ✗ resource ${uri}:`, e.message || String(e));
                    response = {
                        jsonrpc: "2.0",
                        id: rpc.id,
                        error: { code: -32603, message: e.message || String(e) },
                    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tY3Atc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQXdCQSxrQ0FNQztBQUVELHNDQUVDO0FBd0JELDRDQUtDO0FBR0QsNENBRUM7QUFHRCw4Q0FHQztBQWFELG9DQUVDO0FBRUQsb0NBRUM7QUE3RkQsZ0RBQXdCO0FBQ3hCLG1DQUFzSDtBQUN0SCx1Q0FBNEM7QUFDNUMsbURBQXdEO0FBQ3hELHlEQUF3RDtBQUV4RCxNQUFNLG9CQUFvQixHQUFHLFlBQVksQ0FBQztBQUMxQyxNQUFNLFVBQVUsR0FBRyxhQUFhLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUU1RixvQ0FBb0M7QUFDdkIsUUFBQSxVQUFVLEdBQUcsZ0JBQWdCLENBQUM7QUFVM0MsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLENBQUM7QUFDaEMsTUFBTSxTQUFTLEdBQW1CLEVBQUUsQ0FBQztBQUVyQyxzREFBc0Q7QUFDdEQsU0FBZ0IsV0FBVyxDQUFDLEtBQWEsRUFBRSxLQUFjO0lBQ3JELElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQztJQUNyQixJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFDRCxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2pFLENBQUM7QUFFRCxTQUFnQixhQUFhO0lBQ3pCLFNBQVMsQ0FBQyxN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QUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBodHRwIGZyb20gXCJodHRwXCI7XHJcbmltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIEpzb25ScGNSZXF1ZXN0LCBKc29uUnBjUmVzcG9uc2UsIFNlcnZlckNvbmZpZywgREVGQVVMVF9DT05GSUcgfSBmcm9tIFwiLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBhcmNoaXZlT2xkRmlsZXMgfSBmcm9tIFwiLi9hcmNoaXZlXCI7XHJcbmltcG9ydCB7IFJlc291cmNlUmVnaXN0cnkgfSBmcm9tIFwiLi9yZXNvdXJjZXMvcmVnaXN0cnlcIjtcclxuaW1wb3J0IHsgQUxMX1JFU09VUkNFUyB9IGZyb20gXCIuL3Jlc291cmNlcy9kZWZpbml0aW9uc1wiO1xyXG5cclxuY29uc3QgTUNQX1BST1RPQ09MX1ZFUlNJT04gPSBcIjIwMjQtMTEtMDVcIjtcclxuY29uc3QgU0VTU0lPTl9JRCA9IGBjb2Nvcy1tY3AtJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCAxMCl9YDtcclxuXHJcbi8qKiDjg5Pjg6vjg4nmmYLjgavjgrPjg7zjg4njg5njg7zjgrnjga5TSEEyNTbjg4/jg4Pjgrfjg6XjgYzln4vjgoHovrzjgb7jgozjgosgKi9cclxuZXhwb3J0IGNvbnN0IEJVSUxEX0hBU0ggPSBcIl9fQlVJTERfSEFTSF9fXCI7XHJcblxyXG4vLyDilIDilIDilIAgR2FtZSBQcmV2aWV3IExvZyBCdWZmZXIg4pSA4pSA4pSAXHJcblxyXG5pbnRlcmZhY2UgR2FtZUxvZ0VudHJ5IHtcclxuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xyXG4gICAgbGV2ZWw6IFwibG9nXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIjtcclxuICAgIG1lc3NhZ2U6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgTUFYX0dBTUVfTE9HX0JVRkZFUiA9IDUwMDtcclxuY29uc3QgX2dhbWVMb2dzOiBHYW1lTG9nRW50cnlbXSA9IFtdO1xyXG5cclxuLyoqIEFjY2VzcyBnYW1lIHByZXZpZXcgbG9nIGJ1ZmZlciBmcm9tIGRlYnVnLXRvb2xzICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRHYW1lTG9ncyhjb3VudDogbnVtYmVyLCBsZXZlbD86IHN0cmluZyk6IHsgbG9nczogR2FtZUxvZ0VudHJ5W107IHRvdGFsOiBudW1iZXIgfSB7XHJcbiAgICBsZXQgbG9ncyA9IF9nYW1lTG9ncztcclxuICAgIGlmIChsZXZlbCkge1xyXG4gICAgICAgIGxvZ3MgPSBsb2dzLmZpbHRlcihsID0+IGwubGV2ZWwgPT09IGxldmVsKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7IGxvZ3M6IGxvZ3Muc2xpY2UoLWNvdW50KSwgdG90YWw6IF9nYW1lTG9ncy5sZW5ndGggfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyR2FtZUxvZ3MoKTogdm9pZCB7XHJcbiAgICBfZ2FtZUxvZ3MubGVuZ3RoID0gMDtcclxufVxyXG5cclxuLy8g4pSA4pSA4pSAIEdhbWUgRGVidWcgQ29tbWFuZCBRdWV1ZSDilIDilIDilIBcclxuXHJcbmludGVyZmFjZSBHYW1lQ29tbWFuZCB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgdHlwZTogc3RyaW5nO1xyXG4gICAgYXJncz86IGFueTtcclxuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgR2FtZUNvbW1hbmRSZXN1bHQge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XHJcbiAgICBkYXRhPzogYW55O1xyXG4gICAgZXJyb3I/OiBzdHJpbmc7XHJcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcclxufVxyXG5cclxubGV0IF9wZW5kaW5nQ29tbWFuZDogR2FtZUNvbW1hbmQgfCBudWxsID0gbnVsbDtcclxubGV0IF9jb21tYW5kUmVzdWx0OiBHYW1lQ29tbWFuZFJlc3VsdCB8IG51bGwgPSBudWxsO1xyXG5sZXQgX2NvbW1hbmRJZENvdW50ZXIgPSAwO1xyXG5cclxuLyoqIFF1ZXVlIGEgY29tbWFuZCBmb3IgdGhlIGdhbWUgdG8gZXhlY3V0ZSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcXVldWVHYW1lQ29tbWFuZCh0eXBlOiBzdHJpbmcsIGFyZ3M/OiBhbnkpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgaWQgPSBgY21kXyR7KytfY29tbWFuZElkQ291bnRlcn1fJHtEYXRlLm5vdygpfWA7XHJcbiAgICBfcGVuZGluZ0NvbW1hbmQgPSB7IGlkLCB0eXBlLCBhcmdzLCB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9O1xyXG4gICAgX2NvbW1hbmRSZXN1bHQgPSBudWxsO1xyXG4gICAgcmV0dXJuIGlkO1xyXG59XHJcblxyXG4vKiogR2V0IHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgY29tbWFuZCAocG9sbCB1bnRpbCBhdmFpbGFibGUpICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21tYW5kUmVzdWx0KCk6IEdhbWVDb21tYW5kUmVzdWx0IHwgbnVsbCB7XHJcbiAgICByZXR1cm4gX2NvbW1hbmRSZXN1bHQ7XHJcbn1cclxuXHJcbi8qKiBDbGVhciBjb21tYW5kIHN0YXRlICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhckNvbW1hbmRTdGF0ZSgpOiB2b2lkIHtcclxuICAgIF9wZW5kaW5nQ29tbWFuZCA9IG51bGw7XHJcbiAgICBfY29tbWFuZFJlc3VsdCA9IG51bGw7XHJcbn1cclxuXHJcbi8vIOKUgOKUgOKUgCBSZWNvcmRpbmcgU3RvcmFnZSDilIDilIDilIBcclxuXHJcbmludGVyZmFjZSBSZWNvcmRpbmdJbmZvIHtcclxuICAgIHBhdGg6IHN0cmluZztcclxuICAgIHNpemU6IG51bWJlcjtcclxuICAgIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBfcmVjb3JkaW5ncyA9IG5ldyBNYXA8c3RyaW5nLCBSZWNvcmRpbmdJbmZvPigpO1xyXG5cclxuLyoqIEdldCBjb21wbGV0ZWQgcmVjb3JkaW5nIGluZm8gYnkgaWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlY29yZGluZyhpZDogc3RyaW5nKTogUmVjb3JkaW5nSW5mbyB8IHVuZGVmaW5lZCB7XHJcbiAgICByZXR1cm4gX3JlY29yZGluZ3MuZ2V0KGlkKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFJlY29yZGluZyhpZDogc3RyaW5nLCBpbmZvOiBSZWNvcmRpbmdJbmZvKTogdm9pZCB7XHJcbiAgICBfcmVjb3JkaW5ncy5zZXQoaWQsIGluZm8pO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWNwU2VydmVyIHtcclxuICAgIHByaXZhdGUgc2VydmVyOiBodHRwLlNlcnZlciB8IG51bGwgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSB0b29sczogTWFwPHN0cmluZywgVG9vbENhdGVnb3J5PiA9IG5ldyBNYXAoKTtcclxuICAgIHByaXZhdGUgdG9vbEluZGV4OiBNYXA8c3RyaW5nLCBUb29sQ2F0ZWdvcnk+ID0gbmV3IE1hcCgpOyAvLyB0b29sTmFtZSAtPiBjYXRlZ29yeVxyXG4gICAgcHJpdmF0ZSByZXNvdXJjZXM6IFJlc291cmNlUmVnaXN0cnkgPSBuZXcgUmVzb3VyY2VSZWdpc3RyeSgpO1xyXG4gICAgcHJpdmF0ZSBjb25maWc6IFNlcnZlckNvbmZpZztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihjb25maWc/OiBQYXJ0aWFsPFNlcnZlckNvbmZpZz4pIHtcclxuICAgICAgICB0aGlzLmNvbmZpZyA9IHsgLi4uREVGQVVMVF9DT05GSUcsIC4uLmNvbmZpZyB9O1xyXG4gICAgICAgIHRoaXMucmVzb3VyY2VzLnJlZ2lzdGVyKC4uLkFMTF9SRVNPVVJDRVMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBSZWdpc3RlciBhIHRvb2wgY2F0ZWdvcnkgKi9cclxuICAgIHJlZ2lzdGVyKGNhdGVnb3J5OiBUb29sQ2F0ZWdvcnkpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnRvb2xzLnNldChjYXRlZ29yeS5jYXRlZ29yeU5hbWUsIGNhdGVnb3J5KTtcclxuICAgICAgICBmb3IgKGNvbnN0IHRvb2wgb2YgY2F0ZWdvcnkuZ2V0VG9vbHMoKSkge1xyXG4gICAgICAgICAgICB0aGlzLnRvb2xJbmRleC5zZXQodG9vbC5uYW1lLCBjYXRlZ29yeSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBHZXQgYWxsIHRvb2wgZGVmaW5pdGlvbnMgKi9cclxuICAgIGdldEFsbFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIGNvbnN0IGFsbDogVG9vbERlZmluaXRpb25bXSA9IFtdO1xyXG4gICAgICAgIGZvciAoY29uc3QgY2F0IG9mIHRoaXMudG9vbHMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgYWxsLnB1c2goLi4uY2F0LmdldFRvb2xzKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBTdGFydCBIVFRQIHNlcnZlciAqL1xyXG4gICAgc3RhcnQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VydmVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIoKHJlcSwgcmVzKSA9PiB0aGlzLmhhbmRsZVJlcXVlc3QocmVxLCByZXMpKTtcclxuICAgICAgICAgICAgdGhpcy5zZXJ2ZXIubGlzdGVuKHRoaXMuY29uZmlnLnBvcnQsIFwiMTI3LjAuMC4xXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbY29jb3MtY3JlYXRvci1tY3BdIFNlcnZlciBzdGFydGVkIG9uIGh0dHA6Ly8xMjcuMC4wLjE6JHt0aGlzLmNvbmZpZy5wb3J0fS9tY3BgKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLm9uKFwiZXJyb3JcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtjb2Nvcy1jcmVhdG9yLW1jcF0gU2VydmVyIGVycm9yOmAsIGUpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogU3RvcCBIVFRQIHNlcnZlciAqL1xyXG4gICAgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnNlcnZlcikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLmNsb3NlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VydmVyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiW2NvY29zLWNyZWF0b3ItbWNwXSBTZXJ2ZXIgc3RvcHBlZFwiKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGlzUnVubmluZygpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2ZXIgIT09IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHBvcnQoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25maWcucG9ydDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVJlcXVlc3QocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgLy8gQ09SU1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgXCIqXCIpO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiR0VULCBQT1NULCBERUxFVEUsIE9QVElPTlNcIik7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIiwgXCJDb250ZW50LVR5cGUsIEFjY2VwdFwiKTtcclxuXHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjA0KTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB1cmwgPSByZXEudXJsIHx8IFwiL1wiO1xyXG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IGBodHRwOi8vMTI3LjAuMC4xOiR7dGhpcy5jb25maWcucG9ydH1gO1xyXG5cclxuICAgICAgICAvLyDilIDilIDilIAgT0F1dGggZW5kcG9pbnRzIChNQ1Agc3BlYyAyMDI1LTA2LTE4IC8gUkZDIDk3MjggLyBSRkMgODQxNCAvIFJGQyA3NTkxKSDilIDilIDilIBcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIENsYXVkZSBDb2RlIOOBriBWU0NvZGUg5ouh5by144GvIEhUVFAg44OI44Op44Oz44K544Od44O844OI44GuIE1DUCDjgrXjg7zjg5Djg7zjgavlr77jgZfjgaZcclxuICAgICAgICAvLyDnhKHmnaHku7bjgacgT0F1dGggZGlzY292ZXJ5IC8gRENSIOOCkuippuOBv+OCiyAoIzI2OTE3IOetieOBruaXouefpeODkOOCsCnjgIJcclxuICAgICAgICAvLyBjb2Nvcy1jcmVhdG9yLW1jcCDjga8gbG9jYWxob3N0LW9ubHkg44Gu44Ot44O844Kr44Or6ZaL55m644OE44O844Or44Gn5pys54mp44Gu6KqN6Ki844Gv5LiN6KaB44Gg44GM44CBXHJcbiAgICAgICAgLy8g44Kv44Op44Kk44Ki44Oz44OI44KS5rqA6Laz44GV44Gb44KL44Gf44KBIE9BdXRoIOOCqOODs+ODieODneOCpOODs+ODiOe+pOOCkuODgOODn+ODvOWun+ijheOBl+OBpuW4uOaZguioseWPr+OBmeOCi+OAglxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gVE9ETzog5Lul5LiL44Gu44GE44Ga44KM44GL44GM55m655Sf44GX44Gf44KJ5YmK6Zmk44GZ44KLXHJcbiAgICAgICAgLy8gICAxLiBhbnRocm9waWNzL2NsYXVkZS1jb2RlICMyNjkxNyAvICMzODEwMiDnrYnjga4gSFRUUCBPQXV0aCDjg5DjgrDjgYzkv67mraPjgZXjgozjgotcclxuICAgICAgICAvLyAgIDIuIOacrOeJqeOBruiqjeiovOapn+ani+OCkuWun+ijheOBmeOCi+W/heimgeOBjOWHuuOCi++8iOWBvSBPQXV0aCDjgajooZ3nqoHjgZnjgovjgZ/jgoHvvIlcclxuICAgICAgICAvLyAgIDMuIE1DUCBzcGVjIOOBjCBQS0NFIOaknOiovOODu+ODiOODvOOCr+ODs+ODreODvOODhuODvOOCt+ODp+ODs+W/hemgiOetieOBq+abtOaWsOOBleOCjOOCi1xyXG4gICAgICAgIC8vICAgNC4gc3RkaW8g44OW44Oq44OD44K444GM5Y2B5YiG5a6a552A44GX44GmIEhUVFAgdHJhbnNwb3J0IOiHquS9k+OCkiBkZXByZWNhdGUg44GZ44KLXHJcblxyXG4gICAgICAgIC8vIFJGQyA5NzI4IFByb3RlY3RlZCBSZXNvdXJjZSBNZXRhZGF0YVxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiLy53ZWxsLWtub3duL29hdXRoLXByb3RlY3RlZC1yZXNvdXJjZVwiICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2U6IGAke29yaWdpbn0vbWNwYCxcclxuICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25fc2VydmVyczogW29yaWdpbl0sXHJcbiAgICAgICAgICAgICAgICBiZWFyZXJfbWV0aG9kc19zdXBwb3J0ZWQ6IFtcImhlYWRlclwiXSxcclxuICAgICAgICAgICAgICAgIHNjb3Blc19zdXBwb3J0ZWQ6IFtcIm1jcFwiXSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSRkMgODQxNCBBdXRob3JpemF0aW9uIFNlcnZlciBNZXRhZGF0YVxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiLy53ZWxsLWtub3duL29hdXRoLWF1dGhvcml6YXRpb24tc2VydmVyXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBpc3N1ZXI6IG9yaWdpbixcclxuICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25fZW5kcG9pbnQ6IGAke29yaWdpbn0vb2F1dGgvYXV0aG9yaXplYCxcclxuICAgICAgICAgICAgICAgIHRva2VuX2VuZHBvaW50OiBgJHtvcmlnaW59L29hdXRoL3Rva2VuYCxcclxuICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbl9lbmRwb2ludDogYCR7b3JpZ2lufS9vYXV0aC9yZWdpc3RlcmAsXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZV90eXBlc19zdXBwb3J0ZWQ6IFtcImNvZGVcIl0sXHJcbiAgICAgICAgICAgICAgICBncmFudF90eXBlc19zdXBwb3J0ZWQ6IFtcImF1dGhvcml6YXRpb25fY29kZVwiXSxcclxuICAgICAgICAgICAgICAgIGNvZGVfY2hhbGxlbmdlX21ldGhvZHNfc3VwcG9ydGVkOiBbXCJTMjU2XCIsIFwicGxhaW5cIl0sXHJcbiAgICAgICAgICAgICAgICB0b2tlbl9lbmRwb2ludF9hdXRoX21ldGhvZHNfc3VwcG9ydGVkOiBbXCJub25lXCJdLFxyXG4gICAgICAgICAgICAgICAgc2NvcGVzX3N1cHBvcnRlZDogW1wibWNwXCJdLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJGQyA3NTkxIER5bmFtaWMgQ2xpZW50IFJlZ2lzdHJhdGlvbiDigJQgYWNjZXB0IGFueXRoaW5nLCByZXR1cm4gZHVtbXkgY2xpZW50XHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvb2F1dGgvcmVnaXN0ZXJcIiAmJiByZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcclxuICAgICAgICAgICAgbGV0IHJlZzogYW55ID0ge307XHJcbiAgICAgICAgICAgIHRyeSB7IHJlZyA9IEpTT04ucGFyc2UoYm9keSk7IH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxyXG4gICAgICAgICAgICBjb25zdCBjbGllbnRJZCA9IGBjb2Nvcy1tY3AtY2xpZW50LSR7RGF0ZS5ub3coKX1gO1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBjbGllbnRfaWQ6IGNsaWVudElkLFxyXG4gICAgICAgICAgICAgICAgY2xpZW50X2lkX2lzc3VlZF9hdDogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCksXHJcbiAgICAgICAgICAgICAgICBjbGllbnRfbmFtZTogcmVnLmNsaWVudF9uYW1lIHx8IFwiY29jb3MtY3JlYXRvci1tY3AgY2xpZW50XCIsXHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdF91cmlzOiByZWcucmVkaXJlY3RfdXJpcyB8fCBbXSxcclxuICAgICAgICAgICAgICAgIHRva2VuX2VuZHBvaW50X2F1dGhfbWV0aG9kOiBcIm5vbmVcIixcclxuICAgICAgICAgICAgICAgIGdyYW50X3R5cGVzOiBbXCJhdXRob3JpemF0aW9uX2NvZGVcIl0sXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZV90eXBlczogW1wiY29kZVwiXSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPQXV0aCBhdXRob3JpemF0aW9uIGVuZHBvaW50IOKAlCBhdXRvLWNvbnNlbnQsIHJlZGlyZWN0IGltbWVkaWF0ZWx5IHdpdGggY29kZVxyXG4gICAgICAgIGlmICh1cmwuc3RhcnRzV2l0aChcIi9vYXV0aC9hdXRob3JpemVcIikgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCwgb3JpZ2luKTtcclxuICAgICAgICAgICAgY29uc3QgcmVkaXJlY3RVcmkgPSBwYXJzZWQuc2VhcmNoUGFyYW1zLmdldChcInJlZGlyZWN0X3VyaVwiKSB8fCBcIlwiO1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0ZSA9IHBhcnNlZC5zZWFyY2hQYXJhbXMuZ2V0KFwic3RhdGVcIikgfHwgXCJcIjtcclxuICAgICAgICAgICAgaWYgKCFyZWRpcmVjdFVyaSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiaW52YWxpZF9yZXF1ZXN0XCIsIGVycm9yX2Rlc2NyaXB0aW9uOiBcInJlZGlyZWN0X3VyaSByZXF1aXJlZFwiIH0pKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjb2RlID0gYGNvY29zLW1jcC1jb2RlLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCAxMCl9YDtcclxuICAgICAgICAgICAgY29uc3QgbG9jYXRpb24gPSBgJHtyZWRpcmVjdFVyaX0ke3JlZGlyZWN0VXJpLmluY2x1ZGVzKFwiP1wiKSA/IFwiJlwiIDogXCI/XCJ9Y29kZT0ke2VuY29kZVVSSUNvbXBvbmVudChjb2RlKX0mc3RhdGU9JHtlbmNvZGVVUklDb21wb25lbnQoc3RhdGUpfWA7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMzAyLCB7IExvY2F0aW9uOiBsb2NhdGlvbiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPQXV0aCB0b2tlbiBlbmRwb2ludCDigJQgYWx3YXlzIGlzc3VlIGEgZHVtbXkgdG9rZW5cclxuICAgICAgICBpZiAodXJsID09PSBcIi9vYXV0aC90b2tlblwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHJlYWRCb2R5KHJlcSk7IC8vIGRyYWluXHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XHJcbiAgICAgICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLXN0b3JlXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIGFjY2Vzc190b2tlbjogXCJjb2Nvcy1tY3AtcHVibGljLXRva2VuXCIsXHJcbiAgICAgICAgICAgICAgICB0b2tlbl90eXBlOiBcIkJlYXJlclwiLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJlc19pbjogODY0MDAsXHJcbiAgICAgICAgICAgICAgICBzY29wZTogXCJtY3BcIixcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBIZWFsdGggY2hlY2tcclxuICAgICAgICBpZiAodXJsID09PSBcIi9oZWFsdGhcIiAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3RhdHVzOiBcIm9rXCIsIHRvb2xzOiB0aGlzLmdldEFsbFRvb2xzKCkubGVuZ3RoIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2FtZSBkZWJ1ZyBjb21tYW5kIHF1ZXVlIOKAlCBnYW1lIHBvbGxzIGZvciBjb21tYW5kc1xyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2dhbWUvY29tbWFuZFwiICYmIHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgY21kID0gX3BlbmRpbmdDb21tYW5kO1xyXG4gICAgICAgICAgICBfcGVuZGluZ0NvbW1hbmQgPSBudWxsOyAvLyBjb25zdW1lXHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGNtZCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHYW1lIGRlYnVnIGNvbW1hbmQgcmVzdWx0IOKAlCBnYW1lIHBvc3RzIHJlc3VsdFxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2dhbWUvcmVzdWx0XCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBfY29tbWFuZFJlc3VsdCA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwNCk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2FtZSBwcmV2aWV3IHJlY29yZGluZyByZWNlaXZlclxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2dhbWUvcmVjb3JkaW5nXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7IGlkLCBiYXNlNjQsIG1pbWVUeXBlLCBzYXZlUGF0aCB9ID0gSlNPTi5wYXJzZShib2R5KTtcclxuICAgICAgICAgICAgICAgIGlmICghaWQgfHwgIWJhc2U2NCkgdGhyb3cgbmV3IEVycm9yKFwiaWQvYmFzZTY0IHJlcXVpcmVkXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmZyb20oYmFzZTY0LCBcImJhc2U2NFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzYXZlUGF0aOaMh+WumuOBjOOBguOCjOOBsOOBneOBk+OBq+S/neWtmO+8iOe1tuWvvuODkeOCueOBvuOBn+OBr+ODl+ODreOCuOOCp+OCr+ODiOebuOWvvuODkeOCue+8iVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSAoZ2xvYmFsIGFzIGFueSkuRWRpdG9yPy5Qcm9qZWN0Py5wYXRoXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgcHJvY2Vzcy5jd2QoKTtcclxuICAgICAgICAgICAgICAgIGxldCBkaXI6IHN0cmluZztcclxuICAgICAgICAgICAgICAgIGlmIChzYXZlUGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpciA9IHBhdGguaXNBYnNvbHV0ZShzYXZlUGF0aCkgPyBzYXZlUGF0aCA6IHBhdGguam9pbihwcm9qZWN0UGF0aCwgc2F2ZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIFwidGVtcFwiLCBcInJlY29yZGluZ3NcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtdCA9IChtaW1lVHlwZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXh0ID0gbXQuaW5jbHVkZXMoXCJ3ZWJtXCIpID8gXCJ3ZWJtXCJcclxuICAgICAgICAgICAgICAgICAgICA6IG10LmluY2x1ZGVzKFwibXA0XCIpID8gXCJtcDRcIlxyXG4gICAgICAgICAgICAgICAgICAgIDogXCJiaW5cIjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gYCR7aWR9LiR7ZXh0fWA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIGJ1ZmZlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgc2V0UmVjb3JkaW5nKGlkLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogZmlsZVBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogYnVmZmVyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmF1dG9BcmNoaXZlUmVjb3JkaW5ncykge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyY2hpdmVPbGRGaWxlcyhkaXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgcGF0aDogZmlsZVBhdGgsIHNpemU6IGJ1ZmZlci5sZW5ndGggfSkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHYW1lIHByZXZpZXcgbG9nIHJlY2VpdmVyXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvbG9nXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcSk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyaWVzOiBHYW1lTG9nRW50cnlbXSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIChBcnJheS5pc0FycmF5KGVudHJpZXMpID8gZW50cmllcyA6IFtlbnRyaWVzXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBfZ2FtZUxvZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogZW50cnkudGltZXN0YW1wIHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IGVudHJ5LmxldmVsIHx8IFwibG9nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVudHJ5Lm1lc3NhZ2UgfHwgXCJcIixcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBfX2RlYnVnX3N0YXRlX18g44Ot44Kw44GL44KJIHVzZXJJZCDjgpIgZGVidWctbWVudS5qc29uIOOBq+S/neWtmFxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1zZyA9IEpTT04ucGFyc2UoZW50cnkubWVzc2FnZSB8fCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1zZy5fX2RlYnVnX3N0YXRlX18gJiYgbXNnLnVzZXJJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgX2ZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgX3BhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gKGdsb2JhbCBhcyBhbnkpLkVkaXRvcj8uUHJvamVjdD8ucGF0aCB8fCBwcm9jZXNzLmN3ZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NQYXRoID0gX3BhdGguam9pbihwcm9qZWN0UGF0aCwgXCJzZXR0aW5nc1wiLCBcImRlYnVnLW1lbnUuanNvblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9mcy53cml0ZUZpbGVTeW5jKHNldHRpbmdzUGF0aCwgSlNPTi5zdHJpbmdpZnkoeyB1c2VySWQ6IG1zZy51c2VySWQgfSwgbnVsbCwgMiksIFwidXRmLThcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogbm90IGRlYnVnX3N0YXRlICovIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChfZ2FtZUxvZ3MubGVuZ3RoID4gTUFYX0dBTUVfTE9HX0JVRkZFUikge1xyXG4gICAgICAgICAgICAgICAgICAgIF9nYW1lTG9ncy5zcGxpY2UoMCwgX2dhbWVMb2dzLmxlbmd0aCAtIE1BWF9HQU1FX0xPR19CVUZGRVIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogaWdub3JlIG1hbGZvcm1lZCAqLyB9XHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjA0KTtcclxuICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNQ1AgZW5kcG9pbnRcclxuICAgICAgICBpZiAodXJsID09PSBcIi9tY3BcIikge1xyXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICAgICAgLy8gU1NFIGtlZXBhbGl2ZSBzdHJlYW1cclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJDb25uZWN0aW9uXCI6IFwia2VlcC1hbGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAvLyBTZW5kIGluaXRpYWwgY29tbWVudCB0byBrZWVwIGNvbm5lY3Rpb24gYWxpdmVcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZShcIjogY29ubmVjdGVkXFxuXFxuXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlTWNwUG9zdChyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIkRFTEVURVwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBvazogdHJ1ZSB9KSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDQwNFxyXG4gICAgICAgIHJlcy53cml0ZUhlYWQoNDA0LCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJOb3QgZm91bmRcIiB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVNY3BQb3N0KHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgIGxldCBycGM6IEpzb25ScGNSZXF1ZXN0O1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJwYyA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VuZEpzb25ScGMocmVzLCB7IGpzb25ycGM6IFwiMi4wXCIsIGlkOiBudWxsLCBlcnJvcjogeyBjb2RlOiAtMzI3MDAsIG1lc3NhZ2U6IFwiUGFyc2UgZXJyb3JcIiB9IH0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhY2NlcHQgPSByZXEuaGVhZGVyc1tcImFjY2VwdFwiXSB8fCBcIlwiO1xyXG4gICAgICAgIGNvbnN0IHdhbnRTc2UgPSBhY2NlcHQuaW5jbHVkZXMoXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiKTtcclxuXHJcbiAgICAgICAgbGV0IHJlc3BvbnNlOiBKc29uUnBjUmVzcG9uc2U7XHJcblxyXG4gICAgICAgIHN3aXRjaCAocnBjLm1ldGhvZCkge1xyXG4gICAgICAgICAgICBjYXNlIFwiaW5pdGlhbGl6ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm90b2NvbFZlcnNpb246IE1DUF9QUk9UT0NPTF9WRVJTSU9OLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHsgdG9vbHM6IHt9LCByZXNvdXJjZXM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckluZm86IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IFwiMS4wLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcIm5vdGlmaWNhdGlvbnMvaW5pdGlhbGl6ZWRcIjpcclxuICAgICAgICAgICAgICAgIC8vIE5vIHJlc3BvbnNlIG5lZWRlZCBmb3Igbm90aWZpY2F0aW9uXHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwNCwgeyBcIk1jcC1TZXNzaW9uLUlkXCI6IFNFU1NJT05fSUQgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwidG9vbHMvbGlzdFwiOlxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICBpZDogcnBjLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogeyB0b29sczogdGhpcy5nZXRBbGxUb29scygpIH0sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwidG9vbHMvY2FsbFwiOiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b29sTmFtZSA9IHJwYy5wYXJhbXM/Lm5hbWU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gcnBjLnBhcmFtcz8uYXJndW1lbnRzIHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSB0aGlzLnRvb2xJbmRleC5nZXQodG9vbE5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY2F0ZWdvcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHsgY29kZTogLTMyNjAyLCBtZXNzYWdlOiBgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbY29jb3MtY3JlYXRvci1tY3BdIOKWtiAke3Rvb2xOYW1lfWAsIE9iamVjdC5rZXlzKGFyZ3MpLmxlbmd0aCA+IDAgPyBKU09OLnN0cmluZ2lmeShhcmdzKS5zdWJzdHJpbmcoMCwgMjAwKSA6IFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0aW1lb3V0TXMgPSAodG9vbE5hbWUuc3RhcnRzV2l0aChcInByZWZhYl9cIikgfHwgdG9vbE5hbWUgPT09IFwic2NlbmVfb3BlblwiKSA/IDEyMDAwMCA6IDMwMDAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3aXRoVGltZW91dChjYXRlZ29yeS5leGVjdXRlKHRvb2xOYW1lLCBhcmdzKSwgdGltZW91dE1zLCBgVG9vbCAke3Rvb2xOYW1lfSB0aW1lZCBvdXRgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtjb2Nvcy1jcmVhdG9yLW1jcF0g4pyTICR7dG9vbE5hbWV9ICgke0RhdGUubm93KCkgLSBzdGFydH1tcylgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW2NvY29zLWNyZWF0b3ItbWNwXSDinJcgJHt0b29sTmFtZX06YCwgZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogeyBjb2RlOiAtMzI2MDMsIG1lc3NhZ2U6IGUubWVzc2FnZSB8fCBTdHJpbmcoZSkgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJlc291cmNlcy9saXN0XCI6XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7IHJlc291cmNlczogdGhpcy5yZXNvdXJjZXMubGlzdEZpeGVkKCkgfSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJyZXNvdXJjZXMvdGVtcGxhdGVzL2xpc3RcIjpcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHsgcmVzb3VyY2VUZW1wbGF0ZXM6IHRoaXMucmVzb3VyY2VzLmxpc3RUZW1wbGF0ZXMoKSB9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInJlc291cmNlcy9yZWFkXCI6IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHVyaSA9IHJwYy5wYXJhbXM/LnVyaTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdXJpICE9PSBcInN0cmluZ1wiIHx8ICF1cmkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHsgY29kZTogLTMyNjAyLCBtZXNzYWdlOiBcInJlc291cmNlcy9yZWFkOiAndXJpJyBpcyByZXF1aXJlZFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gdGhpcy5yZXNvdXJjZXMubWF0Y2godXJpKTtcclxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHsgY29kZTogLTMyNjAyLCBtZXNzYWdlOiBgVW5rbm93biByZXNvdXJjZSBVUkk6ICR7dXJpfWAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtjb2Nvcy1jcmVhdG9yLW1jcF0g4pa2IHJlc291cmNlICR7dXJpfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB3aXRoVGltZW91dChtYXRjaC5kZWYucmVhZChtYXRjaC5wYXJhbXMpLCAzMDAwMCwgYFJlc291cmNlICR7dXJpfSB0aW1lZCBvdXRgKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW2NvY29zLWNyZWF0b3ItbWNwXSDinJMgcmVzb3VyY2UgJHt1cml9ICgke0RhdGUubm93KCkgLSBzdGFydH1tcylgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50czogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWltZVR5cGU6IG1hdGNoLmRlZi5taW1lVHlwZSB8fCBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbY29jb3MtY3JlYXRvci1tY3BdIOKclyByZXNvdXJjZSAke3VyaX06YCwgZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB7IGNvZGU6IC0zMjYwMywgbWVzc2FnZTogZS5tZXNzYWdlIHx8IFN0cmluZyhlKSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogeyBjb2RlOiAtMzI2MDEsIG1lc3NhZ2U6IGBNZXRob2Qgbm90IGZvdW5kOiAke3JwYy5tZXRob2R9YCB9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh3YW50U3NlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VuZFNzZShyZXMsIFtyZXNwb25zZV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VuZEpzb25ScGMocmVzLCByZXNwb25zZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2VuZEpzb25ScGMocmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBkYXRhOiBKc29uUnBjUmVzcG9uc2UpOiB2b2lkIHtcclxuICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwge1xyXG4gICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgXCJNY3AtU2Vzc2lvbi1JZFwiOiBTRVNTSU9OX0lELFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2VuZFNzZShyZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsIG1lc3NhZ2VzOiBKc29uUnBjUmVzcG9uc2VbXSk6IHZvaWQge1xyXG4gICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XHJcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9ldmVudC1zdHJlYW1cIixcclxuICAgICAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwibm8tY2FjaGVcIixcclxuICAgICAgICAgICAgXCJNY3AtU2Vzc2lvbi1JZFwiOiBTRVNTSU9OX0lELFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZvciAoY29uc3QgbXNnIG9mIG1lc3NhZ2VzKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZShgZXZlbnQ6IG1lc3NhZ2VcXG5kYXRhOiAke0pTT04uc3RyaW5naWZ5KG1zZyl9XFxuXFxuYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlcy5lbmQoKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gd2l0aFRpbWVvdXQ8VD4ocHJvbWlzZTogUHJvbWlzZTxUPiwgbXM6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTxUPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKG1lc3NhZ2UpKSwgbXMpO1xyXG4gICAgICAgIHByb21pc2UudGhlbihcclxuICAgICAgICAgICAgKHYpID0+IHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgcmVzb2x2ZSh2KTsgfSxcclxuICAgICAgICAgICAgKGUpID0+IHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgcmVqZWN0KGUpOyB9LFxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZEJvZHkocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNodW5rczogQnVmZmVyW10gPSBbXTtcclxuICAgICAgICByZXEub24oXCJkYXRhXCIsIChjKSA9PiBjaHVua3MucHVzaChjKSk7XHJcbiAgICAgICAgcmVxLm9uKFwiZW5kXCIsICgpID0+IHJlc29sdmUoQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKFwidXRmLThcIikpKTtcclxuICAgICAgICByZXEub24oXCJlcnJvclwiLCByZWplY3QpO1xyXG4gICAgfSk7XHJcbn1cclxuIl19