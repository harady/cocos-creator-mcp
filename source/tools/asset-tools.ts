import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

export class AssetTools implements ToolCategory {
    readonly categoryName = "asset";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "asset_create",
                description: "Create a new asset file in the project.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "db:// path for the new asset" },
                        content: { type: "string", description: "File content (for text-based assets)" },
                    },
                    required: ["path"],
                },
            },
            {
                name: "asset_delete",
                description: "Delete an asset from the project.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "db:// path of the asset to delete" },
                    },
                    required: ["path"],
                },
            },
            {
                name: "asset_move",
                description: "Move/rename an asset.",
                inputSchema: {
                    type: "object",
                    properties: {
                        source: { type: "string", description: "Current db:// path" },
                        destination: { type: "string", description: "New db:// path" },
                    },
                    required: ["source", "destination"],
                },
            },
            {
                name: "asset_copy",
                description: "Copy an asset to a new location.",
                inputSchema: {
                    type: "object",
                    properties: {
                        source: { type: "string", description: "Source db:// path" },
                        destination: { type: "string", description: "Destination db:// path" },
                    },
                    required: ["source", "destination"],
                },
            },
            {
                name: "asset_save",
                description: "Save an asset by UUID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "asset_reimport",
                description: "Re-import an asset to refresh it.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "db:// path of the asset" },
                    },
                    required: ["path"],
                },
            },
            {
                name: "asset_query_path",
                description: "Get the file path for an asset UUID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "asset_query_uuid",
                description: "Get the UUID for an asset path.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "db:// path of the asset" },
                    },
                    required: ["path"],
                },
            },
            {
                name: "asset_query_url",
                description: "Get the URL for an asset UUID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "asset_get_details",
                description: "Get detailed metadata for an asset (type, size, importer, etc.).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "asset_get_dependencies",
                description: "Get all assets that a given asset depends on.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "asset_open_external",
                description: "Open an asset in the system's default external editor.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "db:// path of the asset" },
                    },
                    required: ["path"],
                },
            },
            {
                name: "asset_import",
                description: "Import an external file into the project assets.",
                inputSchema: {
                    type: "object",
                    properties: {
                        source: { type: "string", description: "Source file path on disk" },
                        target: { type: "string", description: "Target db:// path in project" },
                    },
                    required: ["source", "target"],
                },
            },
            {
                name: "asset_save_meta",
                description: "Save asset meta information (importer settings, etc.).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Asset UUID" },
                        meta: { type: "string", description: "Meta JSON string" },
                    },
                    required: ["uuid", "meta"],
                },
            },
            {
                name: "asset_generate_available_url",
                description: "Generate a non-conflicting asset URL (avoids name collisions).",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "Desired db:// path" },
                    },
                    required: ["url"],
                },
            },
            {
                name: "asset_query_ready",
                description: "Check if the asset database is ready.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "asset_create":
                    await (Editor.Message.request as any)("asset-db", "create-asset", args.path, args.content || null);
                    return ok({ success: true, path: args.path });
                case "asset_delete":
                    await (Editor.Message.request as any)("asset-db", "delete-asset", args.path);
                    return ok({ success: true, path: args.path });
                case "asset_move":
                    await (Editor.Message.request as any)("asset-db", "move-asset", args.source, args.destination);
                    return ok({ success: true, source: args.source, destination: args.destination });
                case "asset_copy":
                    await (Editor.Message.request as any)("asset-db", "copy-asset", args.source, args.destination);
                    return ok({ success: true, source: args.source, destination: args.destination });
                case "asset_save":
                    await (Editor.Message.request as any)("asset-db", "save-asset", args.uuid);
                    return ok({ success: true, uuid: args.uuid });
                case "asset_reimport":
                    await (Editor.Message.request as any)("asset-db", "reimport-asset", args.path);
                    return ok({ success: true, path: args.path });
                case "asset_query_path": {
                    const path = await (Editor.Message.request as any)("asset-db", "query-path", args.uuid);
                    return ok({ success: true, uuid: args.uuid, path });
                }
                case "asset_query_uuid": {
                    const uuid = await (Editor.Message.request as any)("asset-db", "query-uuid", args.path);
                    return ok({ success: true, path: args.path, uuid });
                }
                case "asset_query_url": {
                    const url = await (Editor.Message.request as any)("asset-db", "query-url", args.uuid);
                    return ok({ success: true, uuid: args.uuid, url });
                }
                case "asset_get_details": {
                    const info = await (Editor.Message.request as any)("asset-db", "query-asset-info", args.uuid);
                    const meta = await (Editor.Message.request as any)("asset-db", "query-asset-meta", args.uuid).catch(() => null);
                    return ok({ success: true, info, meta });
                }
                case "asset_get_dependencies": {
                    // Try multiple API names as they vary by CocosCreator version
                    let deps;
                    try {
                        deps = await (Editor.Message.request as any)("asset-db", "query-depends", args.uuid);
                    } catch {
                        try {
                            deps = await (Editor.Message.request as any)("asset-db", "query-asset-depends", args.uuid);
                        } catch {
                            deps = [];
                        }
                    }
                    return ok({ success: true, uuid: args.uuid, dependencies: deps });
                }
                case "asset_open_external":
                    await (Editor.Message.request as any)("asset-db", "open-asset", args.path);
                    return ok({ success: true, path: args.path });
                case "asset_import":
                    await (Editor.Message.request as any)("asset-db", "import-asset", args.source, args.target);
                    return ok({ success: true, source: args.source, target: args.target });
                case "asset_save_meta":
                    await (Editor.Message.request as any)("asset-db", "save-asset-meta", args.uuid, args.meta);
                    return ok({ success: true, uuid: args.uuid });
                case "asset_generate_available_url": {
                    const url = await (Editor.Message.request as any)("asset-db", "generate-available-url", args.url);
                    return ok({ success: true, url });
                }
                case "asset_query_ready": {
                    const ready = await (Editor.Message.request as any)("asset-db", "query-ready");
                    return ok({ success: true, ready });
                }
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
