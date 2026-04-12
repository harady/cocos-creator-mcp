import http from "http";
import { ToolCategory, ToolDefinition, JsonRpcRequest, JsonRpcResponse, ServerConfig, DEFAULT_CONFIG } from "./types";
import { archiveOldFiles } from "./archive";

const MCP_PROTOCOL_VERSION = "2024-11-05";
const SESSION_ID = `cocos-mcp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

/** ビルド時にコードベースのSHA256ハッシュが埋め込まれる */
export const BUILD_HASH = "__BUILD_HASH__";

// ─── Game Preview Log Buffer ───

interface GameLogEntry {
    timestamp: string;
    level: "log" | "warn" | "error";
    message: string;
}

const MAX_GAME_LOG_BUFFER = 500;
const _gameLogs: GameLogEntry[] = [];

/** Access game preview log buffer from debug-tools */
export function getGameLogs(count: number, level?: string): { logs: GameLogEntry[]; total: number } {
    let logs = _gameLogs;
    if (level) {
        logs = logs.filter(l => l.level === level);
    }
    return { logs: logs.slice(-count), total: _gameLogs.length };
}

export function clearGameLogs(): void {
    _gameLogs.length = 0;
}

// ─── Game Debug Command Queue ───

interface GameCommand {
    id: string;
    type: string;
    args?: any;
    timestamp: string;
}

interface GameCommandResult {
    id: string;
    success: boolean;
    data?: any;
    error?: string;
    timestamp: string;
}

let _pendingCommand: GameCommand | null = null;
let _commandResult: GameCommandResult | null = null;
let _commandIdCounter = 0;

/** Queue a command for the game to execute */
export function queueGameCommand(type: string, args?: any): string {
    const id = `cmd_${++_commandIdCounter}_${Date.now()}`;
    _pendingCommand = { id, type, args, timestamp: new Date().toISOString() };
    _commandResult = null;
    return id;
}

/** Get the result of the last command (poll until available) */
export function getCommandResult(): GameCommandResult | null {
    return _commandResult;
}

/** Clear command state */
export function clearCommandState(): void {
    _pendingCommand = null;
    _commandResult = null;
}

// ─── Recording Storage ───

interface RecordingInfo {
    path: string;
    size: number;
    createdAt: string;
}

const _recordings = new Map<string, RecordingInfo>();

/** Get completed recording info by id */
export function getRecording(id: string): RecordingInfo | undefined {
    return _recordings.get(id);
}

export function setRecording(id: string, info: RecordingInfo): void {
    _recordings.set(id, info);
}

export class McpServer {
    private server: http.Server | null = null;
    private tools: Map<string, ToolCategory> = new Map();
    private toolIndex: Map<string, ToolCategory> = new Map(); // toolName -> category
    private config: ServerConfig;

    constructor(config?: Partial<ServerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /** Register a tool category */
    register(category: ToolCategory): void {
        this.tools.set(category.categoryName, category);
        for (const tool of category.getTools()) {
            this.toolIndex.set(tool.name, category);
        }
    }

    /** Get all tool definitions */
    getAllTools(): ToolDefinition[] {
        const all: ToolDefinition[] = [];
        for (const cat of this.tools.values()) {
            all.push(...cat.getTools());
        }
        return all;
    }

    /** Start HTTP server */
    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                resolve();
                return;
            }

            this.server = http.createServer((req, res) => this.handleRequest(req, res));
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
    stop(): Promise<void> {
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

    get isRunning(): boolean {
        return this.server !== null;
    }

    get port(): number {
        return this.config.port;
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
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
            let reg: any = {};
            try { reg = JSON.parse(body); } catch { /* ignore */ }
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
            } catch { /* ignore */ }
            res.writeHead(204);
            res.end();
            return;
        }

        // Game preview recording receiver
        if (url === "/game/recording" && req.method === "POST") {
            const body = await readBody(req);
            try {
                const { id, base64, mimeType, savePath } = JSON.parse(body);
                if (!id || !base64) throw new Error("id/base64 required");

                const fs = require("fs");
                const path = require("path");
                const buffer = Buffer.from(base64, "base64");

                // savePath指定があればそこに保存（絶対パスまたはプロジェクト相対パス）
                const projectPath = (global as any).Editor?.Project?.path
                    || process.cwd();
                let dir: string;
                if (savePath) {
                    dir = path.isAbsolute(savePath) ? savePath : path.join(projectPath, savePath);
                } else {
                    dir = path.join(projectPath, "temp", "recordings");
                }
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
                    archiveOldFiles(dir);
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, path: filePath, size: buffer.length }));
            } catch (e: any) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
            return;
        }

        // Game preview log receiver
        if (url === "/log" && req.method === "POST") {
            const body = await readBody(req);
            try {
                const entries: GameLogEntry[] = JSON.parse(body);
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
                            const projectPath = (global as any).Editor?.Project?.path || process.cwd();
                            const settingsPath = _path.join(projectPath, "settings", "debug-menu.json");
                            _fs.writeFileSync(settingsPath, JSON.stringify({ userId: msg.userId }, null, 2), "utf-8");
                        }
                    } catch { /* not debug_state */ }
                }
                if (_gameLogs.length > MAX_GAME_LOG_BUFFER) {
                    _gameLogs.splice(0, _gameLogs.length - MAX_GAME_LOG_BUFFER);
                }
            } catch { /* ignore malformed */ }
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

    private async handleMcpPost(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const body = await readBody(req);
        let rpc: JsonRpcRequest;
        try {
            rpc = JSON.parse(body);
        } catch {
            this.sendJsonRpc(res, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
            return;
        }

        const accept = req.headers["accept"] || "";
        const wantSse = accept.includes("text/event-stream");

        let response: JsonRpcResponse;

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
                const toolName = rpc.params?.name;
                const args = rpc.params?.arguments || {};
                const category = this.toolIndex.get(toolName);

                if (!category) {
                    response = {
                        jsonrpc: "2.0",
                        id: rpc.id,
                        error: { code: -32602, message: `Unknown tool: ${toolName}` },
                    };
                } else {
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
                    } catch (e: any) {
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
        } else {
            this.sendJsonRpc(res, response);
        }
    }

    private sendJsonRpc(res: http.ServerResponse, data: JsonRpcResponse): void {
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Mcp-Session-Id": SESSION_ID,
        });
        res.end(JSON.stringify(data));
    }

    private sendSse(res: http.ServerResponse, messages: JsonRpcResponse[]): void {
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

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), ms);
        promise.then(
            (v) => { clearTimeout(timer); resolve(v); },
            (e) => { clearTimeout(timer); reject(e); },
        );
    });
}

function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        req.on("error", reject);
    });
}
