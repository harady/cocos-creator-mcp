import http from "http";
import { ToolCategory, ToolDefinition, JsonRpcRequest, JsonRpcResponse, ServerConfig, DEFAULT_CONFIG } from "./types";

const MCP_PROTOCOL_VERSION = "2024-11-05";

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

        // Health check
        if (url === "/health" && req.method === "GET") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "ok", tools: this.getAllTools().length }));
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
                            version: "0.1.0",
                        },
                    },
                };
                break;

            case "notifications/initialized":
                // No response needed for notification
                if (wantSse) {
                    this.sendSse(res, []);
                } else {
                    res.writeHead(204);
                    res.end();
                }
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
                        const result = await category.execute(toolName, args);
                        response = {
                            jsonrpc: "2.0",
                            id: rpc.id,
                            result,
                        };
                    } catch (e: any) {
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
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
    }

    private sendSse(res: http.ServerResponse, messages: JsonRpcResponse[]): void {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
        });
        for (const msg of messages) {
            res.write(`event: message\ndata: ${JSON.stringify(msg)}\n\n`);
        }
        res.end();
    }
}

function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        req.on("error", reject);
    });
}
