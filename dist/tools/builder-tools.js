"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderTools = void 0;
const tool_base_1 = require("../tool-base");
class BuilderTools {
    constructor() {
        this.categoryName = "builder";
    }
    getTools() {
        return [
            {
                name: "builder_open_panel",
                description: "Open the Build panel in the editor.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "builder_get_settings",
                description: "Get the current build settings/configuration.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "builder_query_tasks",
                description: "Query active build tasks.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "builder_run_preview",
                description: "Start the preview server for browser testing.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "builder_stop_preview",
                description: "Stop the preview server.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }
    async execute(toolName, _args) {
        try {
            switch (toolName) {
                case "builder_open_panel":
                    Editor.Panel.open("builder");
                    return (0, tool_base_1.ok)({ success: true });
                case "builder_get_settings": {
                    const settings = await Editor.Message.request("builder", "query-build-options").catch(() => null);
                    return (0, tool_base_1.ok)({ success: true, settings });
                }
                case "builder_query_tasks": {
                    const tasks = await Editor.Message.request("builder", "query-tasks").catch(() => []);
                    return (0, tool_base_1.ok)({ success: true, tasks });
                }
                case "builder_run_preview":
                    await Editor.Message.request("preview", "start");
                    return (0, tool_base_1.ok)({ success: true, message: "Preview started" });
                case "builder_stop_preview":
                    await Editor.Message.request("preview", "stop");
                    return (0, tool_base_1.ok)({ success: true, message: "Preview stopped" });
                default:
                    return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
            }
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
}
exports.BuilderTools = BuilderTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9idWlsZGVyLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRDQUF1QztBQUV2QyxNQUFhLFlBQVk7SUFBekI7UUFDYSxpQkFBWSxHQUFHLFNBQVMsQ0FBQztJQTJEdEMsQ0FBQztJQXpERyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxvQkFBb0I7Z0JBQzFCLFdBQVcsRUFBRSxxQ0FBcUM7Z0JBQ2xELFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTthQUNsRDtZQUNEO2dCQUNJLElBQUksRUFBRSxzQkFBc0I7Z0JBQzVCLFdBQVcsRUFBRSwrQ0FBK0M7Z0JBQzVELFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTthQUNsRDtZQUNEO2dCQUNJLElBQUksRUFBRSxxQkFBcUI7Z0JBQzNCLFdBQVcsRUFBRSwyQkFBMkI7Z0JBQ3hDLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTthQUNsRDtZQUNEO2dCQUNJLElBQUksRUFBRSxxQkFBcUI7Z0JBQzNCLFdBQVcsRUFBRSwrQ0FBK0M7Z0JBQzVELFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTthQUNsRDtZQUNEO2dCQUNJLElBQUksRUFBRSxzQkFBc0I7Z0JBQzVCLFdBQVcsRUFBRSwwQkFBMEI7Z0JBQ3ZDLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTthQUNsRDtTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLEtBQTBCO1FBQ3RELElBQUksQ0FBQztZQUNELFFBQVEsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxvQkFBb0I7b0JBQ3JCLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM3QixPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLEtBQUssc0JBQXNCLENBQUMsQ0FBQyxDQUFDO29CQUMxQixNQUFNLFFBQVEsR0FBRyxNQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBZSxDQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDM0csT0FBTyxJQUFBLGNBQUUsRUFBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDM0MsQ0FBQztnQkFDRCxLQUFLLHFCQUFxQixDQUFDLENBQUMsQ0FBQztvQkFDekIsTUFBTSxLQUFLLEdBQUcsTUFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWUsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM5RixPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO2dCQUNELEtBQUsscUJBQXFCO29CQUN0QixNQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBZSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDMUQsT0FBTyxJQUFBLGNBQUUsRUFBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztnQkFDN0QsS0FBSyxzQkFBc0I7b0JBQ3ZCLE1BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFlLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUN6RCxPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO2dCQUM3RDtvQkFDSSxPQUFPLElBQUEsZUFBRyxFQUFDLGlCQUFpQixRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztZQUNkLE9BQU8sSUFBQSxlQUFHLEVBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBNURELG9DQTREQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBCdWlsZGVyVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJidWlsZGVyXCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJidWlsZGVyX29wZW5fcGFuZWxcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk9wZW4gdGhlIEJ1aWxkIHBhbmVsIGluIHRoZSBlZGl0b3IuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImJ1aWxkZXJfZ2V0X3NldHRpbmdzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGhlIGN1cnJlbnQgYnVpbGQgc2V0dGluZ3MvY29uZmlndXJhdGlvbi5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiYnVpbGRlcl9xdWVyeV90YXNrc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUXVlcnkgYWN0aXZlIGJ1aWxkIHRhc2tzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJidWlsZGVyX3J1bl9wcmV2aWV3XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTdGFydCB0aGUgcHJldmlldyBzZXJ2ZXIgZm9yIGJyb3dzZXIgdGVzdGluZy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiYnVpbGRlcl9zdG9wX3ByZXZpZXdcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlN0b3AgdGhlIHByZXZpZXcgc2VydmVyLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgX2FyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYnVpbGRlcl9vcGVuX3BhbmVsXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oXCJidWlsZGVyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYnVpbGRlcl9nZXRfc2V0dGluZ3NcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImJ1aWxkZXJcIiwgXCJxdWVyeS1idWlsZC1vcHRpb25zXCIpLmNhdGNoKCgpID0+IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNldHRpbmdzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImJ1aWxkZXJfcXVlcnlfdGFza3NcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhc2tzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImJ1aWxkZXJcIiwgXCJxdWVyeS10YXNrc1wiKS5jYXRjaCgoKSA9PiBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdGFza3MgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYnVpbGRlcl9ydW5fcHJldmlld1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJwcmV2aWV3XCIsIFwic3RhcnRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogXCJQcmV2aWV3IHN0YXJ0ZWRcIiB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJidWlsZGVyX3N0b3BfcHJldmlld1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJwcmV2aWV3XCIsIFwic3RvcFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBcIlByZXZpZXcgc3RvcHBlZFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19