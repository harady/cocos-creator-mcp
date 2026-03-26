import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

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
                description: "Get recent console log entries from the editor.",
                inputSchema: {
                    type: "object",
                    properties: {
                        count: { type: "number", description: "Max number of entries (default 50)" },
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
                    return this.getConsoleLogs(args.count || 50);
                case "debug_clear_console":
                    Editor.Message.send("console", "clear");
                    return ok({ success: true });
                case "debug_list_extensions":
                    return this.listExtensions();
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

    private async getConsoleLogs(_count: number): Promise<ToolResult> {
        try {
            const logs = await (Editor.Message.request as any)("console", "query-last-logs", _count);
            return ok({ success: true, logs });
        } catch {
            return ok({ success: true, logs: [], note: "Console log query not supported in this editor version" });
        }
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
}
