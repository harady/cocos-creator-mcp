import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

export class ProjectTools implements ToolCategory {
    readonly categoryName = "project";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "project_get_info",
                description: "Get project information (name, path, engine version).",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "project_refresh_assets",
                description: "Refresh the asset database to detect file changes.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "project_get_asset_info",
                description: "Get information about an asset by UUID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "project_find_asset",
                description: "Find assets by name pattern (glob). Returns matching asset paths and UUIDs.",
                inputSchema: {
                    type: "object",
                    properties: {
                        pattern: { type: "string", description: "Glob pattern (e.g. 'db://assets/**/*.ts', 'db://assets/**/Button*')" },
                    },
                    required: ["pattern"],
                },
            },
            {
                name: "project_get_settings",
                description: "Get project settings for a given protocol.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Settings protocol (e.g. 'general', 'engine')" },
                    },
                },
            },
            {
                name: "project_set_settings",
                description: "Set a project setting.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string" },
                        key: { type: "string" },
                        value: {},
                    },
                    required: ["protocol", "key", "value"],
                },
            },
            {
                name: "project_get_engine_info",
                description: "Get engine version and path information.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "project_query_scripts",
                description: "Query all script plugins in the project.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        switch (toolName) {
            case "project_get_info":
                return this.getInfo();
            case "project_refresh_assets":
                return this.refreshAssets();
            case "project_get_asset_info":
                return this.getAssetInfo(args.uuid);
            case "project_find_asset":
                return this.findAsset(args.pattern);
            case "project_get_settings": {
                try {
                    const config = await (Editor.Message.request as any)("project", "query-config", args.protocol || "general");
                    return ok({ success: true, config });
                } catch (e: any) { return err(e.message || String(e)); }
            }
            case "project_set_settings": {
                try {
                    await (Editor.Message.request as any)("project", "set-config", args.protocol, args.key, args.value);
                    return ok({ success: true });
                } catch (e: any) { return err(e.message || String(e)); }
            }
            case "project_get_engine_info": {
                try {
                    const info = await (Editor.Message.request as any)("engine", "query-info");
                    return ok({ success: true, info });
                } catch (e: any) { return err(e.message || String(e)); }
            }
            case "project_query_scripts": {
                try {
                    const scripts = await (Editor.Message.request as any)("programming", "query-sorted-plugins");
                    return ok({ success: true, scripts });
                } catch (e: any) { return err(e.message || String(e)); }
            }
            default:
                return err(`Unknown tool: ${toolName}`);
        }
    }

    private async getInfo(): Promise<ToolResult> {
        try {
            return ok({
                success: true,
                name: Editor.Project.name,
                path: Editor.Project.path,
                tmpDir: Editor.Project.tmpDir,
            });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async refreshAssets(): Promise<ToolResult> {
        try {
            await Editor.Message.request("asset-db", "refresh-asset", "db://assets");
            return ok({ success: true });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getAssetInfo(uuid: string): Promise<ToolResult> {
        try {
            const info = await (Editor.Message.request as any)("asset-db", "query-asset-info", uuid);
            return ok({ success: true, info });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async findAsset(pattern: string): Promise<ToolResult> {
        try {
            const results = await Editor.Message.request("asset-db", "query-assets", { pattern });
            const assets = (results || []).map((a: any) => ({
                uuid: a.uuid,
                path: a.path || a.url,
                name: a.name,
                type: a.type,
            }));
            return ok({ success: true, assets });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
