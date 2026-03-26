import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

export class DebugTools implements ToolCategory {
    readonly categoryName = "debug";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "debug_get_editor_info",
                description: "Get Cocos Creator editor information (version, platform, language).",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
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
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        switch (toolName) {
            case "debug_get_editor_info":
                return this.getEditorInfo();
            case "debug_list_messages":
                return this.listMessages(args.target);
            default:
                return err(`Unknown tool: ${toolName}`);
        }
    }

    private async getEditorInfo(): Promise<ToolResult> {
        try {
            return ok({
                success: true,
                version: Editor.App.version,
                path: Editor.App.path,
                home: Editor.App.home,
                language: Editor.I18n?.getLanguage?.() || "unknown",
            });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async listMessages(target: string): Promise<ToolResult> {
        try {
            // Query available messages via Editor API
            const info = await (Editor.Message.request as any)("extension", "query-info", target);
            return ok({ success: true, target, info });
        } catch (e: any) {
            // Fallback: return known messages for common targets
            const knownMessages: Record<string, string[]> = {
                "scene": [
                    "query-node-tree", "create-node", "remove-node", "duplicate-node",
                    "set-property", "create-prefab", "save-scene",
                    "execute-scene-script",
                ],
                "asset-db": [
                    "query-assets", "query-asset-info", "refresh-asset",
                    "save-asset", "create-asset", "open-asset",
                ],
            };
            const messages = knownMessages[target];
            if (messages) {
                return ok({ success: true, target, messages, note: "Static list (query failed)" });
            }
            return err(e.message || String(e));
        }
    }
}
