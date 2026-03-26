import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";
import { getGameLogs, clearGameLogs } from "../mcp-server";

export class DebugTools implements ToolCategory {
    readonly categoryName = "debug";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "debug_get_editor_info",
                description: "Get Cocos Creator editor information (version, platform, language).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_list_messages",
                description: "List available Editor messages for a given extension or built-in module.",
                inputSchema: {
                    type: "object",
                    properties: {
                        target: { type: "string", description: "Message target (e.g. 'scene', 'asset-db', 'extension')" },
                    },
                    required: ["target"],
                },
            },
            {
                name: "debug_execute_script",
                description: "Execute a custom scene script method. The method must be registered in scene.ts.",
                inputSchema: {
                    type: "object",
                    properties: {
                        method: { type: "string", description: "Method name from scene.ts" },
                        args: { type: "array", description: "Arguments to pass", items: {} },
                    },
                    required: ["method"],
                },
            },
            {
                name: "debug_get_console_logs",
                description: "Get recent console log entries. Automatically captures scene process logs (console.log/warn/error in scene scripts). Game preview logs can also be captured by sending POST requests to /log endpoint — see README for setup.",
                inputSchema: {
                    type: "object",
                    properties: {
                        count: { type: "number", description: "Max number of entries (default 50)" },
                        level: { type: "string", description: "Filter by level: 'log', 'warn', or 'error'" },
                    },
                },
            },
            {
                name: "debug_clear_console",
                description: "Clear the editor console.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_list_extensions",
                description: "List all installed extensions.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_get_project_logs",
                description: "Read recent project log entries from the log file.",
                inputSchema: {
                    type: "object",
                    properties: {
                        lines: { type: "number", description: "Number of lines to read (default 100)" },
                    },
                },
            },
            {
                name: "debug_search_project_logs",
                description: "Search for a pattern in project logs.",
                inputSchema: {
                    type: "object",
                    properties: {
                        pattern: { type: "string", description: "Search pattern (regex supported)" },
                    },
                    required: ["pattern"],
                },
            },
            {
                name: "debug_get_log_file_info",
                description: "Get information about the project log file (size, path, last modified).",
                inputSchema: { type: "object", properties: {} },
            },
            // ── 以下、既存MCP未対応のEditor API ──
            {
                name: "debug_query_devices",
                description: "List connected devices (for native debugging).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_open_url",
                description: "Open a URL in the system browser from the editor.",
                inputSchema: {
                    type: "object",
                    properties: { url: { type: "string", description: "URL to open" } },
                    required: ["url"],
                },
            },
            {
                name: "debug_validate_scene",
                description: "Validate the current scene for common issues.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_get_extension_info",
                description: "Get detailed information about a specific extension.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Extension name" },
                    },
                    required: ["name"],
                },
            },
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "debug_get_editor_info":
                    return this.getEditorInfo();
                case "debug_list_messages":
                    return this.listMessages(args.target);
                case "debug_execute_script":
                    return this.executeScript(args.method, args.args || []);
                case "debug_get_console_logs":
                    return this.getConsoleLogs(args.count || 50, args.level);
                case "debug_clear_console":
                    Editor.Message.send("console", "clear");
                    // Clear scene process log buffer
                    await Editor.Message.request("scene", "execute-scene-script", {
                        name: "cocos-creator-mcp",
                        method: "clearConsoleLogs",
                        args: [],
                    }).catch(() => {});
                    // Clear game preview log buffer
                    clearGameLogs();
                    return ok({ success: true });
                case "debug_list_extensions":
                    return this.listExtensions();
                case "debug_get_project_logs":
                    return this.getProjectLogs(args.lines || 100);
                case "debug_search_project_logs":
                    return this.searchProjectLogs(args.pattern);
                case "debug_get_log_file_info":
                    return this.getLogFileInfo();
                case "debug_query_devices": {
                    const devices = await (Editor.Message.request as any)("device", "query").catch(() => []);
                    return ok({ success: true, devices });
                }
                case "debug_open_url":
                    await (Editor.Message.request as any)("program", "open-url", args.url);
                    return ok({ success: true, url: args.url });
                case "debug_validate_scene":
                    return this.validateScene();
                case "debug_get_extension_info":
                    return this.getExtensionInfo(args.name);
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getEditorInfo(): Promise<ToolResult> {
        return ok({
            success: true,
            version: Editor.App.version,
            path: Editor.App.path,
            home: Editor.App.home,
            language: Editor.I18n?.getLanguage?.() || "unknown",
        });
    }

    private async listMessages(target: string): Promise<ToolResult> {
        try {
            const info = await (Editor.Message.request as any)("extension", "query-info", target);
            return ok({ success: true, target, info });
        } catch (e: any) {
            const knownMessages: Record<string, string[]> = {
                "scene": [
                    "query-node-tree", "create-node", "remove-node", "duplicate-node",
                    "set-property", "create-prefab", "save-scene", "execute-scene-script",
                    "query-is-dirty", "query-classes", "soft-reload", "snapshot",
                    "change-gizmo-tool", "query-gizmo-tool-name", "focus-camera-on-nodes",
                ],
                "asset-db": [
                    "query-assets", "query-asset-info", "query-asset-meta",
                    "refresh-asset", "save-asset", "create-asset", "delete-asset",
                    "move-asset", "copy-asset", "open-asset", "reimport-asset",
                    "query-path", "query-uuid", "query-url", "query-asset-depends",
                ],
            };
            const messages = knownMessages[target];
            if (messages) {
                return ok({ success: true, target, messages, note: "Static list (query failed)" });
            }
            return err(e.message || String(e));
        }
    }

    private async executeScript(method: string, args: any[]): Promise<ToolResult> {
        const result = await Editor.Message.request("scene", "execute-scene-script", {
            name: "cocos-creator-mcp",
            method,
            args,
        });
        return ok(result);
    }

    private async getConsoleLogs(count: number, level?: string): Promise<ToolResult> {
        // Collect from both sources: scene process + game preview
        let sceneLogs: any[] = [];
        let gameLogs: any[] = [];

        // 1. Scene process logs
        try {
            const result = await Editor.Message.request("scene", "execute-scene-script", {
                name: "cocos-creator-mcp",
                method: "getConsoleLogs",
                args: [count * 2, level], // request more, will trim after merge
            });
            if (result?.logs) {
                sceneLogs = result.logs.map((l: any) => ({ ...l, source: "scene" }));
            }
        } catch { /* scene not available */ }

        // 2. Game preview logs
        const gameResult = getGameLogs(count * 2, level);
        gameLogs = gameResult.logs.map((l: any) => ({ ...l, source: "game" }));

        // Merge and sort by timestamp, take last `count`
        const merged = [...sceneLogs, ...gameLogs]
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
            .slice(-count);

        return ok({
            success: true,
            logs: merged,
            total: { scene: sceneLogs.length, game: gameResult.total },
        });
    }

    private async listExtensions(): Promise<ToolResult> {
        try {
            const list = await (Editor.Message.request as any)("extension", "query-all");
            return ok({ success: true, extensions: list });
        } catch {
            return ok({ success: true, extensions: [], note: "Extension query not supported" });
        }
    }

    private async getExtensionInfo(name: string): Promise<ToolResult> {
        try {
            const info = await (Editor.Message.request as any)("extension", "query-info", name);
            return ok({ success: true, name, info });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getProjectLogs(lines: number): Promise<ToolResult> {
        try {
            const fs = require("fs");
            const path = require("path");
            const logPath = path.join(Editor.Project.tmpDir, "logs", "project.log");
            if (!fs.existsSync(logPath)) return ok({ success: true, logs: [], note: "Log file not found" });
            const content = fs.readFileSync(logPath, "utf-8");
            const allLines = content.split("\n");
            const recent = allLines.slice(-lines);
            return ok({ success: true, lines: recent.length, logs: recent });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async searchProjectLogs(pattern: string): Promise<ToolResult> {
        try {
            const fs = require("fs");
            const path = require("path");
            const logPath = path.join(Editor.Project.tmpDir, "logs", "project.log");
            if (!fs.existsSync(logPath)) return ok({ success: true, matches: [] });
            const content = fs.readFileSync(logPath, "utf-8");
            const regex = new RegExp(pattern, "gi");
            const matches = content.split("\n").filter((line: string) => regex.test(line));
            return ok({ success: true, pattern, count: matches.length, matches: matches.slice(0, 100) });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getLogFileInfo(): Promise<ToolResult> {
        try {
            const fs = require("fs");
            const path = require("path");
            const logPath = path.join(Editor.Project.tmpDir, "logs", "project.log");
            if (!fs.existsSync(logPath)) return ok({ success: true, exists: false });
            const stat = fs.statSync(logPath);
            return ok({ success: true, exists: true, path: logPath, size: stat.size, modified: stat.mtime });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async validateScene(): Promise<ToolResult> {
        try {
            const tree = await Editor.Message.request("scene", "query-node-tree");
            const issues: string[] = [];
            const checkNodes = (nodes: any[]) => {
                if (!nodes) return;
                for (const node of nodes) {
                    if (!node.name) issues.push(`Node ${node.uuid} has no name`);
                    if (node.children) checkNodes(node.children);
                }
            };
            if (Array.isArray(tree)) checkNodes(tree);
            return ok({ success: true, issueCount: issues.length, issues });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
