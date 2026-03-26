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
