"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceImageTools = void 0;
const tool_base_1 = require("../tool-base");
class ReferenceImageTools {
    constructor() {
        this.categoryName = "referenceImage";
    }
    getTools() {
        return [
            {
                name: "refimage_add",
                description: "Add a reference image to the scene view.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "Image file path or db:// path" },
                    },
                    required: ["path"],
                },
            },
            {
                name: "refimage_remove",
                description: "Remove a reference image by index.",
                inputSchema: {
                    type: "object",
                    properties: {
                        index: { type: "number", description: "Image index" },
                    },
                    required: ["index"],
                },
            },
            {
                name: "refimage_list",
                description: "List all reference images in the scene view.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "refimage_clear_all",
                description: "Remove all reference images.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "refimage_switch",
                description: "Switch to a specific reference image by index.",
                inputSchema: {
                    type: "object",
                    properties: {
                        index: { type: "number", description: "Image index to switch to" },
                    },
                    required: ["index"],
                },
            },
            {
                name: "refimage_set_position",
                description: "Set the position of the current reference image.",
                inputSchema: {
                    type: "object",
                    properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                    },
                    required: ["x", "y"],
                },
            },
            {
                name: "refimage_set_scale",
                description: "Set the scale of the current reference image.",
                inputSchema: {
                    type: "object",
                    properties: {
                        scale: { type: "number", description: "Scale factor" },
                    },
                    required: ["scale"],
                },
            },
            {
                name: "refimage_set_opacity",
                description: "Set the opacity of the current reference image.",
                inputSchema: {
                    type: "object",
                    properties: {
                        opacity: { type: "number", description: "Opacity (0-255)" },
                    },
                    required: ["opacity"],
                },
            },
            {
                name: "refimage_query_config",
                description: "Get the current reference image configuration.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "refimage_query_current",
                description: "Get info about the currently active reference image.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "refimage_refresh",
                description: "Refresh the reference image display.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }
    async execute(toolName, args) {
        try {
            switch (toolName) {
                case "refimage_add":
                    await Editor.Message.request("scene", "add-reference-image", args.path);
                    return (0, tool_base_1.ok)({ success: true, path: args.path });
                case "refimage_remove":
                    await Editor.Message.request("scene", "remove-reference-image", args.index);
                    return (0, tool_base_1.ok)({ success: true, index: args.index });
                case "refimage_list": {
                    const config = await Editor.Message.request("scene", "query-reference-image-config").catch(() => null);
                    return (0, tool_base_1.ok)({ success: true, config });
                }
                case "refimage_clear_all":
                    await Editor.Message.request("scene", "clear-all-reference-images");
                    return (0, tool_base_1.ok)({ success: true });
                case "refimage_switch":
                    await Editor.Message.request("scene", "switch-reference-image", args.index);
                    return (0, tool_base_1.ok)({ success: true, index: args.index });
                case "refimage_set_position":
                    await Editor.Message.request("scene", "set-reference-image-position", args.x, args.y);
                    return (0, tool_base_1.ok)({ success: true, x: args.x, y: args.y });
                case "refimage_set_scale":
                    await Editor.Message.request("scene", "set-reference-image-scale", args.scale);
                    return (0, tool_base_1.ok)({ success: true, scale: args.scale });
                case "refimage_set_opacity":
                    await Editor.Message.request("scene", "set-reference-image-opacity", args.opacity);
                    return (0, tool_base_1.ok)({ success: true, opacity: args.opacity });
                case "refimage_query_config": {
                    const config = await Editor.Message.request("scene", "query-reference-image-config").catch(() => null);
                    return (0, tool_base_1.ok)({ success: true, config });
                }
                case "refimage_query_current": {
                    const current = await Editor.Message.request("scene", "query-current-reference-image").catch(() => null);
                    return (0, tool_base_1.ok)({ success: true, current });
                }
                case "refimage_refresh":
                    await Editor.Message.request("scene", "refresh-reference-image");
                    return (0, tool_base_1.ok)({ success: true });
                default:
                    return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
            }
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
}
exports.ReferenceImageTools = ReferenceImageTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlLWltYWdlLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3JlZmVyZW5jZS1pbWFnZS10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0Q0FBdUM7QUFFdkMsTUFBYSxtQkFBbUI7SUFBaEM7UUFDYSxpQkFBWSxHQUFHLGdCQUFnQixDQUFDO0lBaUo3QyxDQUFDO0lBL0lHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFdBQVcsRUFBRSwwQ0FBMEM7Z0JBQ3ZELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsK0JBQStCLEVBQUU7cUJBQ3pFO29CQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztpQkFDckI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLFdBQVcsRUFBRSxvQ0FBb0M7Z0JBQ2pELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFO3FCQUN4RDtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUM7aUJBQ3RCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsZUFBZTtnQkFDckIsV0FBVyxFQUFFLDhDQUE4QztnQkFDM0QsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG9CQUFvQjtnQkFDMUIsV0FBVyxFQUFFLDhCQUE4QjtnQkFDM0MsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUs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SUFBQSxjQUFFLEVBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDakM7b0JBQ0ksT0FBTyxJQUFBLGVBQUcsRUFBQyxpQkFBaUIsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNoRCxDQUFDO1FBQ0wsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQWxKRCxrREFrSkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBUb29sUmVzdWx0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XHJcbmltcG9ydCB7IG9rLCBlcnIgfSBmcm9tIFwiLi4vdG9vbC1iYXNlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVmZXJlbmNlSW1hZ2VUb29scyBpbXBsZW1lbnRzIFRvb2xDYXRlZ29yeSB7XHJcbiAgICByZWFkb25seSBjYXRlZ29yeU5hbWUgPSBcInJlZmVyZW5jZUltYWdlXCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZWZpbWFnZV9hZGRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkZCBhIHJlZmVyZW5jZSBpbWFnZSB0byB0aGUgc2NlbmUgdmlldy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiSW1hZ2UgZmlsZSBwYXRoIG9yIGRiOi8vIHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInJlZmltYWdlX3JlbW92ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVtb3ZlIGEgcmVmZXJlbmNlIGltYWdlIGJ5IGluZGV4LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiSW1hZ2UgaW5kZXhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImluZGV4XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZWZpbWFnZV9saXN0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGFsbCByZWZlcmVuY2UgaW1hZ2VzIGluIHRoZSBzY2VuZSB2aWV3LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZWZpbWFnZV9jbGVhcl9hbGxcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlbW92ZSBhbGwgcmVmZXJlbmNlIGltYWdlcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicmVmaW1hZ2Vfc3dpdGNoXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTd2l0Y2ggdG8gYSBzcGVjaWZpYyByZWZlcmVuY2UgaW1hZ2UgYnkgaW5kZXguXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJJbWFnZSBpbmRleCB0byBzd2l0Y2ggdG9cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImluZGV4XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZWZpbWFnZV9zZXRfcG9zaXRpb25cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnJlbnQgcmVmZXJlbmNlIGltYWdlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiBcIm51bWJlclwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogXCJudW1iZXJcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInhcIiwgXCJ5XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJyZWZpbWFnZV9zZXRfc2NhbGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCB0aGUgc2NhbGUgb2YgdGhlIGN1cnJlbnQgcmVmZXJlbmNlIGltYWdlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiU2NhbGUgZmFjdG9yXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJzY2FsZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicmVmaW1hZ2Vfc2V0X29wYWNpdHlcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCB0aGUgb3BhY2l0eSBvZiB0aGUgY3VycmVudCByZWZlcmVuY2UgaW1hZ2UuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk9wYWNpdHkgKDAtMjU1KVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wib3BhY2l0eVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicmVmaW1hZ2VfcXVlcnlfY29uZmlnXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGhlIGN1cnJlbnQgcmVmZXJlbmNlIGltYWdlIGNvbmZpZ3VyYXRpb24uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInJlZmltYWdlX3F1ZXJ5X2N1cnJlbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBpbmZvIGFib3V0IHRoZSBjdXJyZW50bHkgYWN0aXZlIHJlZmVyZW5jZSBpbWFnZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicmVmaW1hZ2VfcmVmcmVzaFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVmcmVzaCB0aGUgcmVmZXJlbmNlIGltYWdlIGRpc3BsYXkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInJlZmltYWdlX2FkZFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImFkZC1yZWZlcmVuY2UtaW1hZ2VcIiwgYXJncy5wYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwYXRoOiBhcmdzLnBhdGggfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwicmVmaW1hZ2VfcmVtb3ZlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVtb3ZlLXJlZmVyZW5jZS1pbWFnZVwiLCBhcmdzLmluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBpbmRleDogYXJncy5pbmRleCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJyZWZpbWFnZV9saXN0XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb25maWcgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1yZWZlcmVuY2UtaW1hZ2UtY29uZmlnXCIpLmNhdGNoKCgpID0+IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNvbmZpZyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJyZWZpbWFnZV9jbGVhcl9hbGxcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjbGVhci1hbGwtcmVmZXJlbmNlLWltYWdlc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInJlZmltYWdlX3N3aXRjaFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInN3aXRjaC1yZWZlcmVuY2UtaW1hZ2VcIiwgYXJncy5pbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaW5kZXg6IGFyZ3MuaW5kZXggfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwicmVmaW1hZ2Vfc2V0X3Bvc2l0aW9uXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2V0LXJlZmVyZW5jZS1pbWFnZS1wb3NpdGlvblwiLCBhcmdzLngsIGFyZ3MueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgeDogYXJncy54LCB5OiBhcmdzLnkgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwicmVmaW1hZ2Vfc2V0X3NjYWxlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2V0LXJlZmVyZW5jZS1pbWFnZS1zY2FsZVwiLCBhcmdzLnNjYWxlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzY2FsZTogYXJncy5zY2FsZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJyZWZpbWFnZV9zZXRfb3BhY2l0eVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNldC1yZWZlcmVuY2UtaW1hZ2Utb3BhY2l0eVwiLCBhcmdzLm9wYWNpdHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG9wYWNpdHk6IGFyZ3Mub3BhY2l0eSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJyZWZpbWFnZV9xdWVyeV9jb25maWdcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LXJlZmVyZW5jZS1pbWFnZS1jb25maWdcIikuY2F0Y2goKCkgPT4gbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY29uZmlnIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInJlZmltYWdlX3F1ZXJ5X2N1cnJlbnRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jdXJyZW50LXJlZmVyZW5jZS1pbWFnZVwiKS5jYXRjaCgoKSA9PiBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBjdXJyZW50IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInJlZmltYWdlX3JlZnJlc2hcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZWZyZXNoLXJlZmVyZW5jZS1pbWFnZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19