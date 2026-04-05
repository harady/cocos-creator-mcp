import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";
import { BUILD_HASH } from "../mcp-server";

export class ServerTools implements ToolCategory {
    readonly categoryName = "server";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "server_query_ip_list",
                description: "Get the list of IP addresses the editor server is listening on.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "server_query_port",
                description: "Get the port number of the editor's built-in server.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "server_get_status",
                description: "Get the editor server status (IP, port, connectivity).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "server_get_build_hash",
                description: "Get the build hash of the MCP server. The hash is derived from the code content, so identical code always produces the same hash.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "server_check_connectivity",
                description: "Check if the editor server is reachable.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "server_get_network_interfaces",
                description: "Get detailed network interface information.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "server_check_code_sync",
                description: "Check if the running MCP extension code matches the latest build. Compares the runtime BUILD_HASH with the hash of dist/ files. Returns whether extension reload or CC restart is needed.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }

    async execute(toolName: string, _args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "server_query_ip_list": {
                    const ips = await (Editor.Message.request as any)("server", "query-ip-list");
                    return ok({ success: true, ips });
                }
                case "server_query_port": {
                    const port = await (Editor.Message.request as any)("server", "query-port");
                    return ok({ success: true, port });
                }
                case "server_get_status": {
                    const [ips, port] = await Promise.all([
                        (Editor.Message.request as any)("server", "query-ip-list").catch(() => []),
                        (Editor.Message.request as any)("server", "query-port").catch(() => null),
                    ]);
                    return ok({ success: true, ips, port, buildId: BUILD_HASH });
                }
                case "server_get_build_hash": {
                    return ok({ success: true, buildHash: BUILD_HASH });
                }
                case "server_check_connectivity": {
                    try {
                        const port = await (Editor.Message.request as any)("server", "query-port");
                        return ok({ success: true, reachable: true, port });
                    } catch {
                        return ok({ success: true, reachable: false });
                    }
                }
                case "server_get_network_interfaces": {
                    const os = require("os");
                    const interfaces = os.networkInterfaces();
                    return ok({ success: true, interfaces });
                }
                case "server_check_code_sync": {
                    try {
                        const fs = require("fs");
                        const path = require("path");
                        const crypto = require("crypto");
                        const extDir = path.join(Editor.Project.path, "extensions", "cocos-creator-mcp", "dist");
                        if (!fs.existsSync(extDir)) {
                            return ok({ success: true, synced: false, note: "Extension dist/ not found", runtimeHash: BUILD_HASH });
                        }
                        const hash = crypto.createHash("sha256");
                        const collectJs = (dir: string, prefix = ""): string[] => {
                            let files: string[] = [];
                            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                                const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                                if (entry.isDirectory()) files = files.concat(collectJs(path.join(dir, entry.name), rel));
                                else if (entry.name.endsWith(".js")) files.push(rel);
                            }
                            return files;
                        };
                        for (const file of collectJs(extDir).sort()) {
                            let content = fs.readFileSync(path.join(extDir, file), "utf8");
                            // mcp-server.js の baked hash を postbuild 前と同じプレースホルダに逆置換
                            // (postbuild は __BUILD_HASH__ が残った状態でハッシュ計算しているため、同じ入力にする)
                            if (file === "mcp-server.js") {
                                content = content.replace(/exports\.BUILD_HASH = "[a-f0-9]{12}"/, 'exports.BUILD_HASH = "__BUILD_HASH__"');
                            }
                            hash.update(content.replace(/__BUILD_HASH__/g, ""));
                        }
                        const diskHash = hash.digest("hex").substring(0, 12);
                        const synced = diskHash === BUILD_HASH;
                        return ok({
                            success: true,
                            synced,
                            runtimeHash: BUILD_HASH,
                            diskHash,
                            action: synced ? "none" : "Extension reload or CC restart needed",
                        });
                    } catch (e: any) {
                        return ok({ success: true, synced: false, error: e.message, runtimeHash: BUILD_HASH });
                    }
                }
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
