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
                    return ok({ success: true, ips, port });
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
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
