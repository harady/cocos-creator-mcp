"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectTools = void 0;
const tool_base_1 = require("../tool-base");
class ProjectTools {
    constructor() {
        this.categoryName = "project";
    }
    getTools() {
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
    async execute(toolName, args) {
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
                    const config = await Editor.Message.request("project", "query-config", args.protocol || "general");
                    return (0, tool_base_1.ok)({ success: true, config });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "project_set_settings": {
                try {
                    await Editor.Message.request("project", "set-config", args.protocol, args.key, args.value);
                    return (0, tool_base_1.ok)({ success: true });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "project_get_engine_info": {
                try {
                    const info = await Editor.Message.request("engine", "query-info");
                    return (0, tool_base_1.ok)({ success: true, info });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "project_query_scripts": {
                try {
                    const scripts = await Editor.Message.request("programming", "query-sorted-plugins");
                    return (0, tool_base_1.ok)({ success: true, scripts });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            default:
                return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
        }
    }
    async getInfo() {
        try {
            return (0, tool_base_1.ok)({
                success: true,
                name: Editor.Project.name,
                path: Editor.Project.path,
                tmpDir: Editor.Project.tmpDir,
            });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async refreshAssets() {
        try {
            await Editor.Message.request("asset-db", "refresh-asset", "db://assets");
            return (0, tool_base_1.ok)({ success: true });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getAssetInfo(uuid) {
        try {
            const info = await Editor.Message.request("asset-db", "query-asset-info", uuid);
            return (0, tool_base_1.ok)({ success: true, info });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async findAsset(pattern) {
        try {
            const results = await Editor.Message.request("asset-db", "query-assets", { pattern });
            const assets = (results || []).map((a) => ({
                uuid: a.uuid,
                path: a.path || a.url,
                name: a.name,
                type: a.type,
            }));
            return (0, tool_base_1.ok)({ success: true, assets });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
}
exports.ProjectTools = ProjectTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9wcm9qZWN0LXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRDQUF1QztBQUV2QyxNQUFhLFlBQVk7SUFBekI7UUFDYSxpQkFBWSxHQUFHLFNBQVMsQ0FBQztJQWtLdEMsQ0FBQztJQWhLRyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLFdBQVcsRUFBRSx1REFBdUQ7Z0JBQ3BFLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSx3QkFBd0I7Z0JBQzlCLFdBQVcsRUFBRSxvREFBb0Q7Z0JBQ2pFLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSx3QkFBd0I7Z0JBQzlCLFdBQVcsRUFBRSx5Q0FBeUM7Z0JBQ3RELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFO3FCQUN0RDtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUM7aUJBQ3JCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsb0JBQW9CO2dCQUMxQixXQUFXLEVBQUUsNkVBQTZFO2dCQUMxRixXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHFFQUFxRSxFQUFFO3FCQUNsSDtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUM7aUJBQ3hC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QUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN0RixNQUFNLE1BQU0sR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzVDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtnQkFDWixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRztnQkFDckIsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO2dCQUNaLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTthQUNmLENBQUMsQ0FBQyxDQUFDO1lBQ0osT0FBTyxJQUFBLGNBQUUsRUFBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztZQUNkLE9BQU8sSUFBQSxlQUFHLEVBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBbktELG9DQW1LQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9qZWN0VG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJwcm9qZWN0XCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcm9qZWN0X2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgcHJvamVjdCBpbmZvcm1hdGlvbiAobmFtZSwgcGF0aCwgZW5naW5lIHZlcnNpb24pLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcm9qZWN0X3JlZnJlc2hfYXNzZXRzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZWZyZXNoIHRoZSBhc3NldCBkYXRhYmFzZSB0byBkZXRlY3QgZmlsZSBjaGFuZ2VzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcm9qZWN0X2dldF9hc3NldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgaW5mb3JtYXRpb24gYWJvdXQgYW4gYXNzZXQgYnkgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXNzZXQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJvamVjdF9maW5kX2Fzc2V0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJGaW5kIGFzc2V0cyBieSBuYW1lIHBhdHRlcm4gKGdsb2IpLiBSZXR1cm5zIG1hdGNoaW5nIGFzc2V0IHBhdGhzIGFuZCBVVUlEcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiR2xvYiBwYXR0ZXJuIChlLmcuICdkYjovL2Fzc2V0cy8qKi8qLnRzJywgJ2RiOi8vYXNzZXRzLyoqL0J1dHRvbionKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicGF0dGVyblwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJvamVjdF9nZXRfc2V0dGluZ3NcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBwcm9qZWN0IHNldHRpbmdzIGZvciBhIGdpdmVuIHByb3RvY29sLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2w6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2V0dGluZ3MgcHJvdG9jb2wgKGUuZy4gJ2dlbmVyYWwnLCAnZW5naW5lJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByb2plY3Rfc2V0X3NldHRpbmdzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgYSBwcm9qZWN0IHNldHRpbmcuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm90b2NvbDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7fSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwcm90b2NvbFwiLCBcImtleVwiLCBcInZhbHVlXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcm9qZWN0X2dldF9lbmdpbmVfaW5mb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGVuZ2luZSB2ZXJzaW9uIGFuZCBwYXRoIGluZm9ybWF0aW9uLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcm9qZWN0X3F1ZXJ5X3NjcmlwdHNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlF1ZXJ5IGFsbCBzY3JpcHQgcGx1Z2lucyBpbiB0aGUgcHJvamVjdC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcm9qZWN0X2dldF9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRJbmZvKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcm9qZWN0X3JlZnJlc2hfYXNzZXRzXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZyZXNoQXNzZXRzKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcm9qZWN0X2dldF9hc3NldF9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBc3NldEluZm8oYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcInByb2plY3RfZmluZF9hc3NldFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluZEFzc2V0KGFyZ3MucGF0dGVybik7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcm9qZWN0X2dldF9zZXR0aW5nc1wiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJwcm9qZWN0XCIsIFwicXVlcnktY29uZmlnXCIsIGFyZ3MucHJvdG9jb2wgfHwgXCJnZW5lcmFsXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNvbmZpZyB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcInByb2plY3Rfc2V0X3NldHRpbmdzXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInByb2plY3RcIiwgXCJzZXQtY29uZmlnXCIsIGFyZ3MucHJvdG9jb2wsIGFyZ3Mua2V5LCBhcmdzLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwicHJvamVjdF9nZXRfZW5naW5lX2luZm9cIjoge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImVuZ2luZVwiLCBcInF1ZXJ5LWluZm9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaW5mbyB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcInByb2plY3RfcXVlcnlfc2NyaXB0c1wiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdHMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwicHJvZ3JhbW1pbmdcIiwgXCJxdWVyeS1zb3J0ZWQtcGx1Z2luc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzY3JpcHRzIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEluZm8oKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBFZGl0b3IuUHJvamVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogRWRpdG9yLlByb2plY3QucGF0aCxcclxuICAgICAgICAgICAgICAgIHRtcERpcjogRWRpdG9yLlByb2plY3QudG1wRGlyLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZWZyZXNoQXNzZXRzKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcInJlZnJlc2gtYXNzZXRcIiwgXCJkYjovL2Fzc2V0c1wiKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBc3NldEluZm8odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgdXVpZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGluZm8gfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZmluZEFzc2V0KHBhdHRlcm46IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwgeyBwYXR0ZXJuIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBhc3NldHMgPSAocmVzdWx0cyB8fCBbXSkubWFwKChhOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICB1dWlkOiBhLnV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBhLnBhdGggfHwgYS51cmwsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBhLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBhLnR5cGUsXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYXNzZXRzIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=