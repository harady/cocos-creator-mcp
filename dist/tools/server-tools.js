"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerTools = void 0;
const tool_base_1 = require("../tool-base");
const mcp_server_1 = require("../mcp-server");
class ServerTools {
    constructor() {
        this.categoryName = "server";
    }
    getTools() {
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
    async execute(toolName, _args) {
        try {
            switch (toolName) {
                case "server_query_ip_list": {
                    const ips = await Editor.Message.request("server", "query-ip-list");
                    return (0, tool_base_1.ok)({ success: true, ips });
                }
                case "server_query_port": {
                    const port = await Editor.Message.request("server", "query-port");
                    return (0, tool_base_1.ok)({ success: true, port });
                }
                case "server_get_status": {
                    const [ips, port] = await Promise.all([
                        Editor.Message.request("server", "query-ip-list").catch(() => []),
                        Editor.Message.request("server", "query-port").catch(() => null),
                    ]);
                    return (0, tool_base_1.ok)({ success: true, ips, port, buildId: mcp_server_1.BUILD_ID });
                }
                case "server_check_connectivity": {
                    try {
                        const port = await Editor.Message.request("server", "query-port");
                        return (0, tool_base_1.ok)({ success: true, reachable: true, port });
                    }
                    catch (_a) {
                        return (0, tool_base_1.ok)({ success: true, reachable: false });
                    }
                }
                case "server_get_network_interfaces": {
                    const os = require("os");
                    const interfaces = os.networkInterfaces();
                    return (0, tool_base_1.ok)({ success: true, interfaces });
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
exports.ServerTools = ServerTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3NlcnZlci10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0Q0FBdUM7QUFDdkMsOENBQXlDO0FBRXpDLE1BQWEsV0FBVztJQUF4QjtRQUNhLGlCQUFZLEdBQUcsUUFBUSxDQUFDO0lBc0VyQyxDQUFDO0lBcEVHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsV0FBVyxFQUFFLGlFQUFpRTtnQkFDOUUsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG1CQUFtQjtnQkFDekIsV0FBVyxFQUFFLHNEQUFzRDtnQkFDbkUsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG1CQUFtQjtnQkFDekIsV0FBVyxFQUFFLHdEQUF3RDtnQkFDckUsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLDJCQUEyQjtnQkFDakMsV0FBVyxFQUFFLDBDQUEwQztnQkFDdkQsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLCtCQUErQjtnQkFDckMsV0FBVyxFQUFFLDZDQUE2QztnQkFDMUQsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQWdCLEVBQUUsS0FBMEI7UUFDdEQsSUFBSSxDQUFDO1lBQ0QsUUFBUSxRQUFRLEVBQUUsQ0FBQztnQkFDZixLQUFLLHNCQUFzQixDQUFDLENBQUMsQ0FBQztvQkFDMUIsTUFBTSxHQUFHLEdBQUcsTUFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWUsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQzdFLE9BQU8sSUFBQSxjQUFFLEVBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7Z0JBQ0QsS0FBSyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZCLE1BQU0sSUFBSSxHQUFHLE1BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFlLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO29CQUMzRSxPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUNELEtBQUssbUJBQW1CLENBQUMsQ0FBQyxDQUFDO29CQUN2QixNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQzt3QkFDakMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFlLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQ3pFLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBZSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO3FCQUM1RSxDQUFDLENBQUM7b0JBQ0gsT0FBTyxJQUFBLGNBQUUsRUFBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUscUJBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQy9ELENBQUM7Z0JBQ0QsS0FBSywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7b0JBQy9CLElBQUksQ0FBQzt3QkFDRCxNQUFNLElBQUksR0FBRyxNQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBZSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQzt3QkFDM0UsT0FBTyxJQUFBLGNBQUUsRUFBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUN4RCxDQUFDO29CQUFDLFdBQU0sQ0FBQzt3QkFDTCxPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztvQkFDbkQsQ0FBQztnQkFDTCxDQUFDO2dCQUNELEtBQUssK0JBQStCLENBQUMsQ0FBQyxDQUFDO29CQUNuQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pCLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUMxQyxPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO2dCQUNEO29CQUNJLE9BQU8sSUFBQSxlQUFHLEVBQUMsaUJBQWlCLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxJQUFBLGVBQUcsRUFBQyxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUF2RUQsa0NBdUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5pbXBvcnQgeyBCVUlMRF9JRCB9IGZyb20gXCIuLi9tY3Atc2VydmVyXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgU2VydmVyVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJzZXJ2ZXJcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNlcnZlcl9xdWVyeV9pcF9saXN0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGhlIGxpc3Qgb2YgSVAgYWRkcmVzc2VzIHRoZSBlZGl0b3Igc2VydmVyIGlzIGxpc3RlbmluZyBvbi5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2VydmVyX3F1ZXJ5X3BvcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgcG9ydCBudW1iZXIgb2YgdGhlIGVkaXRvcidzIGJ1aWx0LWluIHNlcnZlci5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2VydmVyX2dldF9zdGF0dXNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgZWRpdG9yIHNlcnZlciBzdGF0dXMgKElQLCBwb3J0LCBjb25uZWN0aXZpdHkpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzZXJ2ZXJfY2hlY2tfY29ubmVjdGl2aXR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDaGVjayBpZiB0aGUgZWRpdG9yIHNlcnZlciBpcyByZWFjaGFibGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNlcnZlcl9nZXRfbmV0d29ya19pbnRlcmZhY2VzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgbmV0d29yayBpbnRlcmZhY2UgaW5mb3JtYXRpb24uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBfYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzZXJ2ZXJfcXVlcnlfaXBfbGlzdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXBzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNlcnZlclwiLCBcInF1ZXJ5LWlwLWxpc3RcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaXBzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNlcnZlcl9xdWVyeV9wb3J0XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3J0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNlcnZlclwiLCBcInF1ZXJ5LXBvcnRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcG9ydCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzZXJ2ZXJfZ2V0X3N0YXR1c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW2lwcywgcG9ydF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzZXJ2ZXJcIiwgXCJxdWVyeS1pcC1saXN0XCIpLmNhdGNoKCgpID0+IFtdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNlcnZlclwiLCBcInF1ZXJ5LXBvcnRcIikuY2F0Y2goKCkgPT4gbnVsbCksXHJcbiAgICAgICAgICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaXBzLCBwb3J0LCBidWlsZElkOiBCVUlMRF9JRCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzZXJ2ZXJfY2hlY2tfY29ubmVjdGl2aXR5XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3J0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNlcnZlclwiLCBcInF1ZXJ5LXBvcnRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlYWNoYWJsZTogdHJ1ZSwgcG9ydCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVhY2hhYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2VydmVyX2dldF9uZXR3b3JrX2ludGVyZmFjZXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9zID0gcmVxdWlyZShcIm9zXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVyZmFjZXMgPSBvcy5uZXR3b3JrSW50ZXJmYWNlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGludGVyZmFjZXMgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=