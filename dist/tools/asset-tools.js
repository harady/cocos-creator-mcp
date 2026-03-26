"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetTools = void 0;
const tool_base_1 = require("../tool-base");
class AssetTools {
    constructor() {
        this.categoryName = "asset";
    }
    getTools() {
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
            // ── 以下、既存MCP未対応のEditor API ──
            {
                name: "asset_query_users",
                description: "Find all assets that use/reference a given asset.",
                inputSchema: {
                    type: "object",
                    properties: { uuid: { type: "string", description: "Asset UUID" } },
                    required: ["uuid"],
                },
            },
            {
                name: "asset_query_missing",
                description: "Check if an asset has missing references.",
                inputSchema: {
                    type: "object",
                    properties: { uuid: { type: "string", description: "Asset UUID" } },
                    required: ["uuid"],
                },
            },
        ];
    }
    async execute(toolName, args) {
        try {
            switch (toolName) {
                case "asset_create":
                    await Editor.Message.request("asset-db", "create-asset", args.path, args.content || null);
                    return (0, tool_base_1.ok)({ success: true, path: args.path });
                case "asset_delete":
                    await Editor.Message.request("asset-db", "delete-asset", args.path);
                    return (0, tool_base_1.ok)({ success: true, path: args.path });
                case "asset_move":
                    await Editor.Message.request("asset-db", "move-asset", args.source, args.destination);
                    return (0, tool_base_1.ok)({ success: true, source: args.source, destination: args.destination });
                case "asset_copy":
                    await Editor.Message.request("asset-db", "copy-asset", args.source, args.destination);
                    return (0, tool_base_1.ok)({ success: true, source: args.source, destination: args.destination });
                case "asset_save":
                    await Editor.Message.request("asset-db", "save-asset", args.uuid);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid });
                case "asset_reimport":
                    await Editor.Message.request("asset-db", "reimport-asset", args.path);
                    return (0, tool_base_1.ok)({ success: true, path: args.path });
                case "asset_query_path": {
                    const path = await Editor.Message.request("asset-db", "query-path", args.uuid);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid, path });
                }
                case "asset_query_uuid": {
                    const uuid = await Editor.Message.request("asset-db", "query-uuid", args.path);
                    return (0, tool_base_1.ok)({ success: true, path: args.path, uuid });
                }
                case "asset_query_url": {
                    const url = await Editor.Message.request("asset-db", "query-url", args.uuid);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid, url });
                }
                case "asset_get_details": {
                    const info = await Editor.Message.request("asset-db", "query-asset-info", args.uuid);
                    const meta = await Editor.Message.request("asset-db", "query-asset-meta", args.uuid).catch(() => null);
                    return (0, tool_base_1.ok)({ success: true, info, meta });
                }
                case "asset_get_dependencies": {
                    // Try multiple API names as they vary by CocosCreator version
                    let deps;
                    try {
                        deps = await Editor.Message.request("asset-db", "query-depends", args.uuid);
                    }
                    catch (_a) {
                        try {
                            deps = await Editor.Message.request("asset-db", "query-asset-depends", args.uuid);
                        }
                        catch (_b) {
                            deps = [];
                        }
                    }
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid, dependencies: deps });
                }
                case "asset_open_external":
                    await Editor.Message.request("asset-db", "open-asset", args.path);
                    return (0, tool_base_1.ok)({ success: true, path: args.path });
                case "asset_import":
                    await Editor.Message.request("asset-db", "import-asset", args.source, args.target);
                    return (0, tool_base_1.ok)({ success: true, source: args.source, target: args.target });
                case "asset_save_meta":
                    await Editor.Message.request("asset-db", "save-asset-meta", args.uuid, args.meta);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid });
                case "asset_generate_available_url": {
                    const url = await Editor.Message.request("asset-db", "generate-available-url", args.url);
                    return (0, tool_base_1.ok)({ success: true, url });
                }
                case "asset_query_ready": {
                    const ready = await Editor.Message.request("asset-db", "query-ready");
                    return (0, tool_base_1.ok)({ success: true, ready });
                }
                case "asset_query_users": {
                    const users = await Editor.Message.request("asset-db", "query-asset-users", args.uuid).catch(() => []);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid, users });
                }
                case "asset_query_missing": {
                    const missing = await Editor.Message.request("asset-db", "query-missing-asset-info", args.uuid).catch(() => null);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid, missing, hasMissing: !!missing });
                }
                default:
                    return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
            }
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
}
exports.AssetTools = AssetTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvYXNzZXQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBRXZDLE1BQWEsVUFBVTtJQUF2QjtRQUNhLGlCQUFZLEdBQUcsT0FBTyxDQUFDO0lBNlJwQyxDQUFDO0lBM1JHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFdBQVcsRUFBRSx5Q0FBeUM7Z0JBQ3RELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsOEJBQThCLEVBQUU7d0JBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHNDQUFzQyxFQUFFO3FCQUNuRjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUM7aUJBQ3JCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsY0FBYztnQkFDcEIsV0FBVyxFQUFFLG1DQUFtQztnQkFDaEQsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxtQ0FBbUMsRUFBRTtxQkFDN0U7b0JBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDO2lCQUNyQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLFdBQVcsRUFBRSx1QkFBdUI7Z0JBQ3BDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsb0JBQW9CLEVBQUU7d0JBQzdELFdBQVcsRUFB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QyxDQUFDO29CQUMzSCxPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRixDQUFDO2dCQUNEO29CQUNJLE9BQU8sSUFBQSxlQUFHLEVBQUMsaUJBQWlCLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxJQUFBLGVBQUcsRUFBQyxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUE5UkQsZ0NBOFJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFzc2V0VG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJhc3NldFwiO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiYXNzZXRfY3JlYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDcmVhdGUgYSBuZXcgYXNzZXQgZmlsZSBpbiB0aGUgcHJvamVjdC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBmb3IgdGhlIG5ldyBhc3NldFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiRmlsZSBjb250ZW50IChmb3IgdGV4dC1iYXNlZCBhc3NldHMpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXRoXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9kZWxldGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkRlbGV0ZSBhbiBhc3NldCBmcm9tIHRoZSBwcm9qZWN0LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJkYjovLyBwYXRoIG9mIHRoZSBhc3NldCB0byBkZWxldGVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImFzc2V0X21vdmVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk1vdmUvcmVuYW1lIGFuIGFzc2V0LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkN1cnJlbnQgZGI6Ly8gcGF0aFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5ldyBkYjovLyBwYXRoXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJzb3VyY2VcIiwgXCJkZXN0aW5hdGlvblwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiYXNzZXRfY29weVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ29weSBhbiBhc3NldCB0byBhIG5ldyBsb2NhdGlvbi5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTb3VyY2UgZGI6Ly8gcGF0aFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkRlc3RpbmF0aW9uIGRiOi8vIHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInNvdXJjZVwiLCBcImRlc3RpbmF0aW9uXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9zYXZlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTYXZlIGFuIGFzc2V0IGJ5IFVVSUQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkFzc2V0IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImFzc2V0X3JlaW1wb3J0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZS1pbXBvcnQgYW4gYXNzZXQgdG8gcmVmcmVzaCBpdC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBvZiB0aGUgYXNzZXRcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImFzc2V0X3F1ZXJ5X3BhdGhcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgZmlsZSBwYXRoIGZvciBhbiBhc3NldCBVVUlELlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJBc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9xdWVyeV91dWlkXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGhlIFVVSUQgZm9yIGFuIGFzc2V0IHBhdGguXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcImRiOi8vIHBhdGggb2YgdGhlIGFzc2V0XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXRoXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9xdWVyeV91cmxcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgVVJMIGZvciBhbiBhc3NldCBVVUlELlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJBc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9nZXRfZGV0YWlsc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGRldGFpbGVkIG1ldGFkYXRhIGZvciBhbiBhc3NldCAodHlwZSwgc2l6ZSwgaW1wb3J0ZXIsIGV0Yy4pLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJBc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9nZXRfZGVwZW5kZW5jaWVzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgYWxsIGFzc2V0cyB0aGF0IGEgZ2l2ZW4gYXNzZXQgZGVwZW5kcyBvbi5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXNzZXQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiYXNzZXRfb3Blbl9leHRlcm5hbFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiT3BlbiBhbiBhc3NldCBpbiB0aGUgc3lzdGVtJ3MgZGVmYXVsdCBleHRlcm5hbCBlZGl0b3IuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcImRiOi8vIHBhdGggb2YgdGhlIGFzc2V0XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXRoXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9pbXBvcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkltcG9ydCBhbiBleHRlcm5hbCBmaWxlIGludG8gdGhlIHByb2plY3QgYXNzZXRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlNvdXJjZSBmaWxlIHBhdGggb24gZGlza1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJUYXJnZXQgZGI6Ly8gcGF0aCBpbiBwcm9qZWN0XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJzb3VyY2VcIiwgXCJ0YXJnZXRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImFzc2V0X3NhdmVfbWV0YVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2F2ZSBhc3NldCBtZXRhIGluZm9ybWF0aW9uIChpbXBvcnRlciBzZXR0aW5ncywgZXRjLikuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkFzc2V0IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRhOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk1ldGEgSlNPTiBzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJtZXRhXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9nZW5lcmF0ZV9hdmFpbGFibGVfdXJsXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZW5lcmF0ZSBhIG5vbi1jb25mbGljdGluZyBhc3NldCBVUkwgKGF2b2lkcyBuYW1lIGNvbGxpc2lvbnMpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkRlc2lyZWQgZGI6Ly8gcGF0aFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXJsXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhc3NldF9xdWVyeV9yZWFkeVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2sgaWYgdGhlIGFzc2V0IGRhdGFiYXNlIGlzIHJlYWR5LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8g4pSA4pSAIOS7peS4i+OAgeaXouWtmE1DUOacquWvvuW/nOOBrkVkaXRvciBBUEkg4pSA4pSAXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiYXNzZXRfcXVlcnlfdXNlcnNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkZpbmQgYWxsIGFzc2V0cyB0aGF0IHVzZS9yZWZlcmVuY2UgYSBnaXZlbiBhc3NldC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXNzZXQgVVVJRFwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiYXNzZXRfcXVlcnlfbWlzc2luZ1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2sgaWYgYW4gYXNzZXQgaGFzIG1pc3NpbmcgcmVmZXJlbmNlcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXNzZXQgVVVJRFwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYXNzZXRfY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwiY3JlYXRlLWFzc2V0XCIsIGFyZ3MucGF0aCwgYXJncy5jb250ZW50IHx8IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHBhdGg6IGFyZ3MucGF0aCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJhc3NldF9kZWxldGVcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJkZWxldGUtYXNzZXRcIiwgYXJncy5wYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwYXRoOiBhcmdzLnBhdGggfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYXNzZXRfbW92ZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcIm1vdmUtYXNzZXRcIiwgYXJncy5zb3VyY2UsIGFyZ3MuZGVzdGluYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNvdXJjZTogYXJncy5zb3VyY2UsIGRlc3RpbmF0aW9uOiBhcmdzLmRlc3RpbmF0aW9uIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X2NvcHlcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJjb3B5LWFzc2V0XCIsIGFyZ3Muc291cmNlLCBhcmdzLmRlc3RpbmF0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzb3VyY2U6IGFyZ3Muc291cmNlLCBkZXN0aW5hdGlvbjogYXJncy5kZXN0aW5hdGlvbiB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJhc3NldF9zYXZlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwic2F2ZS1hc3NldFwiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJhc3NldF9yZWltcG9ydFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInJlaW1wb3J0LWFzc2V0XCIsIGFyZ3MucGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcGF0aDogYXJncy5wYXRoIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X3F1ZXJ5X3BhdGhcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1wYXRoXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkLCBwYXRoIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X3F1ZXJ5X3V1aWRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS11dWlkXCIsIGFyZ3MucGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcGF0aDogYXJncy5wYXRoLCB1dWlkIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X3F1ZXJ5X3VybFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXJsID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktdXJsXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkLCB1cmwgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYXNzZXRfZ2V0X2RldGFpbHNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldC1pbmZvXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWV0YSA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LW1ldGFcIiwgYXJncy51dWlkKS5jYXRjaCgoKSA9PiBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBpbmZvLCBtZXRhIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X2dldF9kZXBlbmRlbmNpZXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeSBtdWx0aXBsZSBBUEkgbmFtZXMgYXMgdGhleSB2YXJ5IGJ5IENvY29zQ3JlYXRvciB2ZXJzaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlcHM7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWRlcGVuZHNcIiwgYXJncy51dWlkKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldC1kZXBlbmRzXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCwgZGVwZW5kZW5jaWVzOiBkZXBzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X29wZW5fZXh0ZXJuYWxcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJvcGVuLWFzc2V0XCIsIGFyZ3MucGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcGF0aDogYXJncy5wYXRoIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X2ltcG9ydFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcImltcG9ydC1hc3NldFwiLCBhcmdzLnNvdXJjZSwgYXJncy50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNvdXJjZTogYXJncy5zb3VyY2UsIHRhcmdldDogYXJncy50YXJnZXQgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYXNzZXRfc2F2ZV9tZXRhXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwic2F2ZS1hc3NldC1tZXRhXCIsIGFyZ3MudXVpZCwgYXJncy5tZXRhKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkOiBhcmdzLnV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYXNzZXRfZ2VuZXJhdGVfYXZhaWxhYmxlX3VybFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXJsID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwiZ2VuZXJhdGUtYXZhaWxhYmxlLXVybFwiLCBhcmdzLnVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXJsIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X3F1ZXJ5X3JlYWR5XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWFkeSA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LXJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlYWR5IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFzc2V0X3F1ZXJ5X3VzZXJzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VycyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LXVzZXJzXCIsIGFyZ3MudXVpZCkuY2F0Y2goKCkgPT4gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCwgdXNlcnMgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYXNzZXRfcXVlcnlfbWlzc2luZ1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWlzc2luZyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LW1pc3NpbmctYXNzZXQtaW5mb1wiLCBhcmdzLnV1aWQpLmNhdGNoKCgpID0+IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCwgbWlzc2luZywgaGFzTWlzc2luZzogISFtaXNzaW5nIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19