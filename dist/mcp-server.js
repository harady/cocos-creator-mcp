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
const MCP_PROTOCOL_VERSION = "2024-11-05";
const SESSION_ID = `cocos-mcp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
/** ビルド時にコードベースのSHA256ハッシュが埋め込まれる */
exports.BUILD_HASH = "3077b1bd8a2a";
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
            catch ( /* ignore */_c) { /* ignore */ }
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
            catch ( /* ignore malformed */_d) { /* ignore malformed */ }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWNwLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tY3Atc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQXFCQSxrQ0FNQztBQUVELHNDQUVDO0FBd0JELDRDQUtDO0FBR0QsNENBRUM7QUFHRCw4Q0FHQztBQWFELG9DQUVDO0FBRUQsb0NBRUM7QUExRkQsZ0RBQXdCO0FBQ3hCLG1DQUFzSDtBQUV0SCxNQUFNLG9CQUFvQixHQUFHLFlBQVksQ0FBQztBQUMxQyxNQUFNLFVBQVUsR0FBRyxhQUFhLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUU1RixvQ0FBb0M7QUFDdkIsUUFBQSxVQUFVLEdBQUcsZ0JBQWdCLENBQUM7QUFVM0MsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLENBQUM7QUFDaEMsTUFBTSxTQUFTLEdBQW1CLEVBQUUsQ0FBQztBQUVyQyxzREFBc0Q7QUFDdEQsU0FBZ0IsV0FBVyxDQUFDLEtBQWEsRUFBRSxLQUFjO0lBQ3JELElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQztJQUNyQixJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFDRCxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2pFLENBQUM7QUFFRCxTQUFnQixhQUFhO0lBQ3pCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLENBQUM7QUFtQkQsSUFB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LENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RSxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaHR0cCBmcm9tIFwiaHR0cFwiO1xyXG5pbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBKc29uUnBjUmVxdWVzdCwgSnNvblJwY1Jlc3BvbnNlLCBTZXJ2ZXJDb25maWcsIERFRkFVTFRfQ09ORklHIH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuXHJcbmNvbnN0IE1DUF9QUk9UT0NPTF9WRVJTSU9OID0gXCIyMDI0LTExLTA1XCI7XHJcbmNvbnN0IFNFU1NJT05fSUQgPSBgY29jb3MtbWNwLSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgMTApfWA7XHJcblxyXG4vKiog44OT44Or44OJ5pmC44Gr44Kz44O844OJ44OZ44O844K544GuU0hBMjU244OP44OD44K344Ol44GM5Z+L44KB6L6844G+44KM44KLICovXHJcbmV4cG9ydCBjb25zdCBCVUlMRF9IQVNIID0gXCJfX0JVSUxEX0hBU0hfX1wiO1xyXG5cclxuLy8g4pSA4pSA4pSAIEdhbWUgUHJldmlldyBMb2cgQnVmZmVyIOKUgOKUgOKUgFxyXG5cclxuaW50ZXJmYWNlIEdhbWVMb2dFbnRyeSB7XHJcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcclxuICAgIGxldmVsOiBcImxvZ1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCI7XHJcbiAgICBtZXNzYWdlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IE1BWF9HQU1FX0xPR19CVUZGRVIgPSA1MDA7XHJcbmNvbnN0IF9nYW1lTG9nczogR2FtZUxvZ0VudHJ5W10gPSBbXTtcclxuXHJcbi8qKiBBY2Nlc3MgZ2FtZSBwcmV2aWV3IGxvZyBidWZmZXIgZnJvbSBkZWJ1Zy10b29scyAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2FtZUxvZ3MoY291bnQ6IG51bWJlciwgbGV2ZWw/OiBzdHJpbmcpOiB7IGxvZ3M6IEdhbWVMb2dFbnRyeVtdOyB0b3RhbDogbnVtYmVyIH0ge1xyXG4gICAgbGV0IGxvZ3MgPSBfZ2FtZUxvZ3M7XHJcbiAgICBpZiAobGV2ZWwpIHtcclxuICAgICAgICBsb2dzID0gbG9ncy5maWx0ZXIobCA9PiBsLmxldmVsID09PSBsZXZlbCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geyBsb2dzOiBsb2dzLnNsaWNlKC1jb3VudCksIHRvdGFsOiBfZ2FtZUxvZ3MubGVuZ3RoIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhckdhbWVMb2dzKCk6IHZvaWQge1xyXG4gICAgX2dhbWVMb2dzLmxlbmd0aCA9IDA7XHJcbn1cclxuXHJcbi8vIOKUgOKUgOKUgCBHYW1lIERlYnVnIENvbW1hbmQgUXVldWUg4pSA4pSA4pSAXHJcblxyXG5pbnRlcmZhY2UgR2FtZUNvbW1hbmQge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHR5cGU6IHN0cmluZztcclxuICAgIGFyZ3M/OiBhbnk7XHJcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIEdhbWVDb21tYW5kUmVzdWx0IHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBzdWNjZXNzOiBib29sZWFuO1xyXG4gICAgZGF0YT86IGFueTtcclxuICAgIGVycm9yPzogc3RyaW5nO1xyXG4gICAgdGltZXN0YW1wOiBzdHJpbmc7XHJcbn1cclxuXHJcbmxldCBfcGVuZGluZ0NvbW1hbmQ6IEdhbWVDb21tYW5kIHwgbnVsbCA9IG51bGw7XHJcbmxldCBfY29tbWFuZFJlc3VsdDogR2FtZUNvbW1hbmRSZXN1bHQgfCBudWxsID0gbnVsbDtcclxubGV0IF9jb21tYW5kSWRDb3VudGVyID0gMDtcclxuXHJcbi8qKiBRdWV1ZSBhIGNvbW1hbmQgZm9yIHRoZSBnYW1lIHRvIGV4ZWN1dGUgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlR2FtZUNvbW1hbmQodHlwZTogc3RyaW5nLCBhcmdzPzogYW55KTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGlkID0gYGNtZF8keysrX2NvbW1hbmRJZENvdW50ZXJ9XyR7RGF0ZS5ub3coKX1gO1xyXG4gICAgX3BlbmRpbmdDb21tYW5kID0geyBpZCwgdHlwZSwgYXJncywgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfTtcclxuICAgIF9jb21tYW5kUmVzdWx0ID0gbnVsbDtcclxuICAgIHJldHVybiBpZDtcclxufVxyXG5cclxuLyoqIEdldCB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGNvbW1hbmQgKHBvbGwgdW50aWwgYXZhaWxhYmxlKSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbWFuZFJlc3VsdCgpOiBHYW1lQ29tbWFuZFJlc3VsdCB8IG51bGwge1xyXG4gICAgcmV0dXJuIF9jb21tYW5kUmVzdWx0O1xyXG59XHJcblxyXG4vKiogQ2xlYXIgY29tbWFuZCBzdGF0ZSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJDb21tYW5kU3RhdGUoKTogdm9pZCB7XHJcbiAgICBfcGVuZGluZ0NvbW1hbmQgPSBudWxsO1xyXG4gICAgX2NvbW1hbmRSZXN1bHQgPSBudWxsO1xyXG59XHJcblxyXG4vLyDilIDilIDilIAgUmVjb3JkaW5nIFN0b3JhZ2Ug4pSA4pSA4pSAXHJcblxyXG5pbnRlcmZhY2UgUmVjb3JkaW5nSW5mbyB7XHJcbiAgICBwYXRoOiBzdHJpbmc7XHJcbiAgICBzaXplOiBudW1iZXI7XHJcbiAgICBjcmVhdGVkQXQ6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgX3JlY29yZGluZ3MgPSBuZXcgTWFwPHN0cmluZywgUmVjb3JkaW5nSW5mbz4oKTtcclxuXHJcbi8qKiBHZXQgY29tcGxldGVkIHJlY29yZGluZyBpbmZvIGJ5IGlkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWNvcmRpbmcoaWQ6IHN0cmluZyk6IFJlY29yZGluZ0luZm8gfCB1bmRlZmluZWQge1xyXG4gICAgcmV0dXJuIF9yZWNvcmRpbmdzLmdldChpZCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRSZWNvcmRpbmcoaWQ6IHN0cmluZywgaW5mbzogUmVjb3JkaW5nSW5mbyk6IHZvaWQge1xyXG4gICAgX3JlY29yZGluZ3Muc2V0KGlkLCBpbmZvKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1jcFNlcnZlciB7XHJcbiAgICBwcml2YXRlIHNlcnZlcjogaHR0cC5TZXJ2ZXIgfCBudWxsID0gbnVsbDtcclxuICAgIHByaXZhdGUgdG9vbHM6IE1hcDxzdHJpbmcsIFRvb2xDYXRlZ29yeT4gPSBuZXcgTWFwKCk7XHJcbiAgICBwcml2YXRlIHRvb2xJbmRleDogTWFwPHN0cmluZywgVG9vbENhdGVnb3J5PiA9IG5ldyBNYXAoKTsgLy8gdG9vbE5hbWUgLT4gY2F0ZWdvcnlcclxuICAgIHByaXZhdGUgY29uZmlnOiBTZXJ2ZXJDb25maWc7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY29uZmlnPzogUGFydGlhbDxTZXJ2ZXJDb25maWc+KSB7XHJcbiAgICAgICAgdGhpcy5jb25maWcgPSB7IC4uLkRFRkFVTFRfQ09ORklHLCAuLi5jb25maWcgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogUmVnaXN0ZXIgYSB0b29sIGNhdGVnb3J5ICovXHJcbiAgICByZWdpc3RlcihjYXRlZ29yeTogVG9vbENhdGVnb3J5KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy50b29scy5zZXQoY2F0ZWdvcnkuY2F0ZWdvcnlOYW1lLCBjYXRlZ29yeSk7XHJcbiAgICAgICAgZm9yIChjb25zdCB0b29sIG9mIGNhdGVnb3J5LmdldFRvb2xzKCkpIHtcclxuICAgICAgICAgICAgdGhpcy50b29sSW5kZXguc2V0KHRvb2wubmFtZSwgY2F0ZWdvcnkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogR2V0IGFsbCB0b29sIGRlZmluaXRpb25zICovXHJcbiAgICBnZXRBbGxUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICBjb25zdCBhbGw6IFRvb2xEZWZpbml0aW9uW10gPSBbXTtcclxuICAgICAgICBmb3IgKGNvbnN0IGNhdCBvZiB0aGlzLnRvb2xzLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgIGFsbC5wdXNoKC4uLmNhdC5nZXRUb29scygpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKiogU3RhcnQgSFRUUCBzZXJ2ZXIgKi9cclxuICAgIHN0YXJ0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlcnZlcikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKChyZXEsIHJlcykgPT4gdGhpcy5oYW5kbGVSZXF1ZXN0KHJlcSwgcmVzKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLmxpc3Rlbih0aGlzLmNvbmZpZy5wb3J0LCBcIjEyNy4wLjAuMVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW2NvY29zLWNyZWF0b3ItbWNwXSBTZXJ2ZXIgc3RhcnRlZCBvbiBodHRwOi8vMTI3LjAuMC4xOiR7dGhpcy5jb25maWcucG9ydH0vbWNwYCk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnNlcnZlci5vbihcImVycm9yXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbY29jb3MtY3JlYXRvci1tY3BdIFNlcnZlciBlcnJvcjpgLCBlKTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFN0b3AgSFRUUCBzZXJ2ZXIgKi9cclxuICAgIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5zZXJ2ZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNlcnZlci5jbG9zZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIltjb2Nvcy1jcmVhdG9yLW1jcF0gU2VydmVyIHN0b3BwZWRcIik7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBpc1J1bm5pbmcoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmVyICE9PSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBwb3J0KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlnLnBvcnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVSZXF1ZXN0KHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIC8vIENPUlNcclxuICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsIFwiKlwiKTtcclxuICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kc1wiLCBcIkdFVCwgUE9TVCwgREVMRVRFLCBPUFRJT05TXCIpO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsIFwiQ29udGVudC1UeXBlLCBBY2NlcHRcIik7XHJcblxyXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwNCk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybCB8fCBcIi9cIjtcclxuXHJcbiAgICAgICAgLy8gSGVhbHRoIGNoZWNrXHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvaGVhbHRoXCIgJiYgcmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN0YXR1czogXCJva1wiLCB0b29sczogdGhpcy5nZXRBbGxUb29scygpLmxlbmd0aCB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEdhbWUgZGVidWcgY29tbWFuZCBxdWV1ZSDigJQgZ2FtZSBwb2xscyBmb3IgY29tbWFuZHNcclxuICAgICAgICBpZiAodXJsID09PSBcIi9nYW1lL2NvbW1hbmRcIiAmJiByZXEubWV0aG9kID09PSBcIkdFVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNtZCA9IF9wZW5kaW5nQ29tbWFuZDtcclxuICAgICAgICAgICAgX3BlbmRpbmdDb21tYW5kID0gbnVsbDsgLy8gY29uc3VtZVxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShjbWQpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2FtZSBkZWJ1ZyBjb21tYW5kIHJlc3VsdCDigJQgZ2FtZSBwb3N0cyByZXN1bHRcclxuICAgICAgICBpZiAodXJsID09PSBcIi9nYW1lL3Jlc3VsdFwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgX2NvbW1hbmRSZXN1bHQgPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDQpO1xyXG4gICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEdhbWUgcHJldmlldyByZWNvcmRpbmcgcmVjZWl2ZXJcclxuICAgICAgICBpZiAodXJsID09PSBcIi9nYW1lL3JlY29yZGluZ1wiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeyBpZCwgYmFzZTY0LCBtaW1lVHlwZSwgc2F2ZVBhdGggfSA9IEpTT04ucGFyc2UoYm9keSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlkIHx8ICFiYXNlNjQpIHRocm93IG5ldyBFcnJvcihcImlkL2Jhc2U2NCByZXF1aXJlZFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJhc2U2NCwgXCJiYXNlNjRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gc2F2ZVBhdGjmjIflrprjgYzjgYLjgozjgbDjgZ3jgZPjgavkv53lrZjvvIjntbblr77jg5Hjgrnjgb7jgZ/jga/jg5fjg63jgrjjgqfjgq/jg4jnm7jlr77jg5HjgrnvvIlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gKGdsb2JhbCBhcyBhbnkpLkVkaXRvcj8uUHJvamVjdD8ucGF0aFxyXG4gICAgICAgICAgICAgICAgICAgIHx8IHByb2Nlc3MuY3dkKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGlyOiBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2F2ZVBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmlzQWJzb2x1dGUoc2F2ZVBhdGgpID8gc2F2ZVBhdGggOiBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIHNhdmVQYXRoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlyID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCBcInRlbXBcIiwgXCJyZWNvcmRpbmdzXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbXQgPSAobWltZVR5cGUgfHwgXCJcIikudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV4dCA9IG10LmluY2x1ZGVzKFwid2VibVwiKSA/IFwid2VibVwiXHJcbiAgICAgICAgICAgICAgICAgICAgOiBtdC5pbmNsdWRlcyhcIm1wNFwiKSA/IFwibXA0XCJcclxuICAgICAgICAgICAgICAgICAgICA6IFwiYmluXCI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGAke2lkfS4ke2V4dH1gO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCBidWZmZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFJlY29yZGluZyhpZCwge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGZpbGVQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGJ1ZmZlci5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHBhdGg6IGZpbGVQYXRoLCBzaXplOiBidWZmZXIubGVuZ3RoIH0pKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2FtZSBwcmV2aWV3IGxvZyByZWNlaXZlclxyXG4gICAgICAgIGlmICh1cmwgPT09IFwiL2xvZ1wiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXEpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW50cmllczogR2FtZUxvZ0VudHJ5W10gPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiAoQXJyYXkuaXNBcnJheShlbnRyaWVzKSA/IGVudHJpZXMgOiBbZW50cmllc10pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2dhbWVMb2dzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IGVudHJ5LnRpbWVzdGFtcCB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsOiBlbnRyeS5sZXZlbCB8fCBcImxvZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlbnRyeS5tZXNzYWdlIHx8IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoX2dhbWVMb2dzLmxlbmd0aCA+IE1BWF9HQU1FX0xPR19CVUZGRVIpIHtcclxuICAgICAgICAgICAgICAgICAgICBfZ2FtZUxvZ3Muc3BsaWNlKDAsIF9nYW1lTG9ncy5sZW5ndGggLSBNQVhfR0FNRV9MT0dfQlVGRkVSKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSBtYWxmb3JtZWQgKi8gfVxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwNCk7XHJcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTUNQIGVuZHBvaW50XHJcbiAgICAgICAgaWYgKHVybCA9PT0gXCIvbWNwXCIpIHtcclxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFNTRSBrZWVwYWxpdmUgc3RyZWFtXHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9ldmVudC1zdHJlYW1cIixcclxuICAgICAgICAgICAgICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQ29ubmVjdGlvblwiOiBcImtlZXAtYWxpdmVcIixcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gU2VuZCBpbml0aWFsIGNvbW1lbnQgdG8ga2VlcCBjb25uZWN0aW9uIGFsaXZlXHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGUoXCI6IGNvbm5lY3RlZFxcblxcblwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZU1jcFBvc3QocmVxLCByZXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJERUxFVEVcIikge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUgfSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyA0MDRcclxuICAgICAgICByZXMud3JpdGVIZWFkKDQwNCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcclxuICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiTm90IGZvdW5kXCIgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlTWNwUG9zdChyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxKTtcclxuICAgICAgICBsZXQgcnBjOiBKc29uUnBjUmVxdWVzdDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBycGMgPSBKU09OLnBhcnNlKGJvZHkpO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICB0aGlzLnNlbmRKc29uUnBjKHJlcywgeyBqc29ucnBjOiBcIjIuMFwiLCBpZDogbnVsbCwgZXJyb3I6IHsgY29kZTogLTMyNzAwLCBtZXNzYWdlOiBcIlBhcnNlIGVycm9yXCIgfSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYWNjZXB0ID0gcmVxLmhlYWRlcnNbXCJhY2NlcHRcIl0gfHwgXCJcIjtcclxuICAgICAgICBjb25zdCB3YW50U3NlID0gYWNjZXB0LmluY2x1ZGVzKFwidGV4dC9ldmVudC1zdHJlYW1cIik7XHJcblxyXG4gICAgICAgIGxldCByZXNwb25zZTogSnNvblJwY1Jlc3BvbnNlO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHJwYy5tZXRob2QpIHtcclxuICAgICAgICAgICAgY2FzZSBcImluaXRpYWxpemVcIjpcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2xWZXJzaW9uOiBNQ1BfUFJPVE9DT0xfVkVSU0lPTixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiB7IHRvb2xzOiB7fSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJJbmZvOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBcIjEuMC4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJub3RpZmljYXRpb25zL2luaXRpYWxpemVkXCI6XHJcbiAgICAgICAgICAgICAgICAvLyBObyByZXNwb25zZSBuZWVkZWQgZm9yIG5vdGlmaWNhdGlvblxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDQsIHsgXCJNY3AtU2Vzc2lvbi1JZFwiOiBTRVNTSU9OX0lEIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInRvb2xzL2xpc3RcIjpcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHsgdG9vbHM6IHRoaXMuZ2V0QWxsVG9vbHMoKSB9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBcInRvb2xzL2NhbGxcIjoge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9vbE5hbWUgPSBycGMucGFyYW1zPy5uYW1lO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IHJwYy5wYXJhbXM/LmFyZ3VtZW50cyB8fCB7fTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdGhpcy50b29sSW5kZXguZ2V0KHRvb2xOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWNhdGVnb3J5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiB7IGNvZGU6IC0zMjYwMiwgbWVzc2FnZTogYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW2NvY29zLWNyZWF0b3ItbWNwXSDilrYgJHt0b29sTmFtZX1gLCBPYmplY3Qua2V5cyhhcmdzKS5sZW5ndGggPiAwID8gSlNPTi5zdHJpbmdpZnkoYXJncykuc3Vic3RyaW5nKDAsIDIwMCkgOiBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd2l0aFRpbWVvdXQoY2F0ZWdvcnkuZXhlY3V0ZSh0b29sTmFtZSwgYXJncyksIDMwMDAwLCBgVG9vbCAke3Rvb2xOYW1lfSB0aW1lZCBvdXRgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtjb2Nvcy1jcmVhdG9yLW1jcF0g4pyTICR7dG9vbE5hbWV9ICgke0RhdGUubm93KCkgLSBzdGFydH1tcylgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW2NvY29zLWNyZWF0b3ItbWNwXSDinJcgJHt0b29sTmFtZX06YCwgZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBycGMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogeyBjb2RlOiAtMzI2MDMsIG1lc3NhZ2U6IGUubWVzc2FnZSB8fCBTdHJpbmcoZSkgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJwYy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogeyBjb2RlOiAtMzI2MDEsIG1lc3NhZ2U6IGBNZXRob2Qgbm90IGZvdW5kOiAke3JwYy5tZXRob2R9YCB9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh3YW50U3NlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VuZFNzZShyZXMsIFtyZXNwb25zZV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VuZEpzb25ScGMocmVzLCByZXNwb25zZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2VuZEpzb25ScGMocmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBkYXRhOiBKc29uUnBjUmVzcG9uc2UpOiB2b2lkIHtcclxuICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwge1xyXG4gICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgXCJNY3AtU2Vzc2lvbi1JZFwiOiBTRVNTSU9OX0lELFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2VuZFNzZShyZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsIG1lc3NhZ2VzOiBKc29uUnBjUmVzcG9uc2VbXSk6IHZvaWQge1xyXG4gICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XHJcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9ldmVudC1zdHJlYW1cIixcclxuICAgICAgICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwibm8tY2FjaGVcIixcclxuICAgICAgICAgICAgXCJNY3AtU2Vzc2lvbi1JZFwiOiBTRVNTSU9OX0lELFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZvciAoY29uc3QgbXNnIG9mIG1lc3NhZ2VzKSB7XHJcbiAgICAgICAgICAgIHJlcy53cml0ZShgZXZlbnQ6IG1lc3NhZ2VcXG5kYXRhOiAke0pTT04uc3RyaW5naWZ5KG1zZyl9XFxuXFxuYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlcy5lbmQoKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gd2l0aFRpbWVvdXQ8VD4ocHJvbWlzZTogUHJvbWlzZTxUPiwgbXM6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTxUPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKG1lc3NhZ2UpKSwgbXMpO1xyXG4gICAgICAgIHByb21pc2UudGhlbihcclxuICAgICAgICAgICAgKHYpID0+IHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgcmVzb2x2ZSh2KTsgfSxcclxuICAgICAgICAgICAgKGUpID0+IHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgcmVqZWN0KGUpOyB9LFxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZEJvZHkocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNodW5rczogQnVmZmVyW10gPSBbXTtcclxuICAgICAgICByZXEub24oXCJkYXRhXCIsIChjKSA9PiBjaHVua3MucHVzaChjKSk7XHJcbiAgICAgICAgcmVxLm9uKFwiZW5kXCIsICgpID0+IHJlc29sdmUoQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKFwidXRmLThcIikpKTtcclxuICAgICAgICByZXEub24oXCJlcnJvclwiLCByZWplY3QpO1xyXG4gICAgfSk7XHJcbn1cclxuIl19