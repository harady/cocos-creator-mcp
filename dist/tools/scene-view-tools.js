"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneViewTools = void 0;
const tool_base_1 = require("../tool-base");
class SceneViewTools {
    constructor() {
        this.categoryName = "sceneView";
    }
    getTools() {
        return [
            {
                name: "view_change_gizmo_tool",
                description: "Change the gizmo tool (move, rotate, scale, rect).",
                inputSchema: {
                    type: "object",
                    properties: {
                        tool: { type: "string", enum: ["move", "rotate", "scale", "rect"], description: "Gizmo tool name" },
                    },
                    required: ["tool"],
                },
            },
            {
                name: "view_query_gizmo_tool",
                description: "Get the currently active gizmo tool.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_change_gizmo_pivot",
                description: "Change gizmo pivot mode (center or pivot).",
                inputSchema: {
                    type: "object",
                    properties: {
                        pivot: { type: "string", enum: ["center", "pivot"], description: "Pivot mode" },
                    },
                    required: ["pivot"],
                },
            },
            {
                name: "view_query_gizmo_pivot",
                description: "Get the current gizmo pivot mode.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_change_gizmo_coordinate",
                description: "Change gizmo coordinate system (local or global).",
                inputSchema: {
                    type: "object",
                    properties: {
                        coordinate: { type: "string", enum: ["local", "global"], description: "Coordinate system" },
                    },
                    required: ["coordinate"],
                },
            },
            {
                name: "view_query_gizmo_coordinate",
                description: "Get the current gizmo coordinate system.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_change_mode_2d_3d",
                description: "Switch between 2D and 3D view mode.",
                inputSchema: {
                    type: "object",
                    properties: {
                        mode: { type: "string", enum: ["2d", "3d"], description: "View mode" },
                    },
                    required: ["mode"],
                },
            },
            {
                name: "view_query_mode_2d_3d",
                description: "Get the current 2D/3D view mode.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_set_grid_visible",
                description: "Show or hide the scene grid.",
                inputSchema: {
                    type: "object",
                    properties: {
                        visible: { type: "boolean", description: "Whether to show the grid" },
                    },
                    required: ["visible"],
                },
            },
            {
                name: "view_query_grid_visible",
                description: "Check if the scene grid is visible.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_focus_on_node",
                description: "Focus the scene camera on specific node(s).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuids: { type: "array", items: { type: "string" }, description: "Node UUIDs to focus on" },
                    },
                    required: ["uuids"],
                },
            },
            {
                name: "view_get_status",
                description: "Get the current scene view status (gizmo tool, pivot, coordinate, grid, etc.).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_set_icon_gizmo_3d",
                description: "Toggle 3D icon gizmos on/off.",
                inputSchema: {
                    type: "object",
                    properties: { enabled: { type: "boolean" } },
                    required: ["enabled"],
                },
            },
            {
                name: "view_query_icon_gizmo_3d",
                description: "Check if 3D icon gizmos are enabled.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_set_icon_gizmo_size",
                description: "Set the icon gizmo size.",
                inputSchema: {
                    type: "object",
                    properties: { size: { type: "number" } },
                    required: ["size"],
                },
            },
            {
                name: "view_query_icon_gizmo_size",
                description: "Get the current icon gizmo size.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_align_with_view",
                description: "Align the selected node with the current camera view.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_align_view_with_node",
                description: "Align the camera view with the selected node.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "view_reset",
                description: "Reset the scene view to default state.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }
    async execute(toolName, args) {
        try {
            switch (toolName) {
                case "view_change_gizmo_tool":
                    await Editor.Message.request("scene", "change-gizmo-tool", args.tool);
                    return (0, tool_base_1.ok)({ success: true, tool: args.tool });
                case "view_query_gizmo_tool": {
                    const tool = await Editor.Message.request("scene", "query-gizmo-tool-name");
                    return (0, tool_base_1.ok)({ success: true, tool });
                }
                case "view_change_gizmo_pivot":
                    await Editor.Message.request("scene", "change-gizmo-pivot", args.pivot);
                    return (0, tool_base_1.ok)({ success: true, pivot: args.pivot });
                case "view_query_gizmo_pivot": {
                    const pivot = await Editor.Message.request("scene", "query-gizmo-pivot");
                    return (0, tool_base_1.ok)({ success: true, pivot });
                }
                case "view_change_gizmo_coordinate":
                    await Editor.Message.request("scene", "change-gizmo-coordinate", args.coordinate);
                    return (0, tool_base_1.ok)({ success: true, coordinate: args.coordinate });
                case "view_query_gizmo_coordinate": {
                    const coord = await Editor.Message.request("scene", "query-gizmo-coordinate");
                    return (0, tool_base_1.ok)({ success: true, coordinate: coord });
                }
                case "view_change_mode_2d_3d":
                    await Editor.Message.request("scene", "change-view-mode-2d-3d", args.mode);
                    return (0, tool_base_1.ok)({ success: true, mode: args.mode });
                case "view_query_mode_2d_3d": {
                    const mode = await Editor.Message.request("scene", "query-view-mode-2d-3d");
                    return (0, tool_base_1.ok)({ success: true, mode });
                }
                case "view_set_grid_visible":
                    await Editor.Message.request("scene", "set-grid-visible", args.visible);
                    return (0, tool_base_1.ok)({ success: true, visible: args.visible });
                case "view_query_grid_visible": {
                    const visible = await Editor.Message.request("scene", "query-grid-visible");
                    return (0, tool_base_1.ok)({ success: true, visible });
                }
                case "view_focus_on_node":
                    await Editor.Message.request("scene", "focus-camera-on-nodes", args.uuids);
                    return (0, tool_base_1.ok)({ success: true, uuids: args.uuids });
                case "view_get_status": {
                    const [tool, pivot, coord, mode, grid] = await Promise.all([
                        Editor.Message.request("scene", "query-gizmo-tool-name").catch(() => null),
                        Editor.Message.request("scene", "query-gizmo-pivot").catch(() => null),
                        Editor.Message.request("scene", "query-gizmo-coordinate").catch(() => null),
                        Editor.Message.request("scene", "query-view-mode-2d-3d").catch(() => null),
                        Editor.Message.request("scene", "query-grid-visible").catch(() => null),
                    ]);
                    return (0, tool_base_1.ok)({ success: true, tool, pivot, coordinate: coord, mode, gridVisible: grid });
                }
                case "view_set_icon_gizmo_3d":
                    await Editor.Message.request("scene", "set-icon-gizmo-3d", args.enabled);
                    return (0, tool_base_1.ok)({ success: true, enabled: args.enabled });
                case "view_query_icon_gizmo_3d": {
                    const enabled = await Editor.Message.request("scene", "query-is-icon-gizmo-3d");
                    return (0, tool_base_1.ok)({ success: true, enabled });
                }
                case "view_set_icon_gizmo_size":
                    await Editor.Message.request("scene", "set-icon-gizmo-size", args.size);
                    return (0, tool_base_1.ok)({ success: true, size: args.size });
                case "view_query_icon_gizmo_size": {
                    const size = await Editor.Message.request("scene", "query-icon-gizmo-size");
                    return (0, tool_base_1.ok)({ success: true, size });
                }
                case "view_align_with_view":
                    await Editor.Message.request("scene", "align-with-view");
                    return (0, tool_base_1.ok)({ success: true });
                case "view_align_view_with_node":
                    await Editor.Message.request("scene", "align-view-with-node");
                    return (0, tool_base_1.ok)({ success: true });
                case "view_reset":
                    await Editor.Message.request("scene", "reset-scene-view");
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
exports.SceneViewTools = SceneViewTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdmlldy10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9zY2VuZS12aWV3LXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRDQUF1QztBQUV2QyxNQUFhLGNBQWM7SUFBM0I7UUFDYSxpQkFBWSxHQUFHLFdBQVcsQ0FBQztJQW1PeEMsQ0FBQztJQWpPRyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSx3QkFBd0I7Z0JBQzlCLFdBQVcsRUFBRSxvREFBb0Q7Z0JBQ2pFLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUU7cUJBQ3RHO29CQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztpQkFDckI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSx1QkFBdUI7Z0JBQzdCLFdBQVcsRUFBRSxzQ0FBc0M7Z0JBQ25ELFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTthQUNsRDtZQUNEO2dCQUNJLElBQUksRUFBRSx5QkFBeUI7Z0JBQy9CLFdBQVcsRUFBRSw0Q0FBNEM7Z0JBQ3pELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRTtxQkFDbEY7b0JBQ0QsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDO2lCQUN0QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFB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b2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTY2VuZVZpZXdUb29scyBpbXBsZW1lbnRzIFRvb2xDYXRlZ29yeSB7XHJcbiAgICByZWFkb25seSBjYXRlZ29yeU5hbWUgPSBcInNjZW5lVmlld1wiO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwidmlld19jaGFuZ2VfZ2l6bW9fdG9vbFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hhbmdlIHRoZSBnaXptbyB0b29sIChtb3ZlLCByb3RhdGUsIHNjYWxlLCByZWN0KS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2w6IHsgdHlwZTogXCJzdHJpbmdcIiwgZW51bTogW1wibW92ZVwiLCBcInJvdGF0ZVwiLCBcInNjYWxlXCIsIFwicmVjdFwiXSwgZGVzY3JpcHRpb246IFwiR2l6bW8gdG9vbCBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ0b29sXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ2aWV3X3F1ZXJ5X2dpem1vX3Rvb2xcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgY3VycmVudGx5IGFjdGl2ZSBnaXptbyB0b29sLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ2aWV3X2NoYW5nZV9naXptb19waXZvdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hhbmdlIGdpem1vIHBpdm90IG1vZGUgKGNlbnRlciBvciBwaXZvdCkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaXZvdDogeyB0eXBlOiBcInN0cmluZ1wiLCBlbnVtOiBbXCJjZW50ZXJcIiwgXCJwaXZvdFwiXSwgZGVzY3JpcHRpb246IFwiUGl2b3QgbW9kZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicGl2b3RcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInZpZXdfcXVlcnlfZ2l6bW9fcGl2b3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgY3VycmVudCBnaXptbyBwaXZvdCBtb2RlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ2aWV3X2NoYW5nZV9naXptb19jb29yZGluYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDaGFuZ2UgZ2l6bW8gY29vcmRpbmF0ZSBzeXN0ZW0gKGxvY2FsIG9yIGdsb2JhbCkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb29yZGluYXRlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGVudW06IFtcImxvY2FsXCIsIFwiZ2xvYmFsXCJdLCBkZXNjcmlwdGlvbjogXCJDb29yZGluYXRlIHN5c3RlbVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wiY29vcmRpbmF0ZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwidmlld19xdWVyeV9naXptb19jb29yZGluYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGhlIGN1cnJlbnQgZ2l6bW8gY29vcmRpbmF0ZSBzeXN0ZW0uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInZpZXdfY2hhbmdlX21vZGVfMmRfM2RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlN3aXRjaCBiZXR3ZWVuIDJEIGFuZCAzRCB2aWV3IG1vZGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGVudW06IFtcIjJkXCIsIFwiM2RcIl0sIGRlc2NyaXB0aW9uOiBcIlZpZXcgbW9kZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibW9kZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwidmlld19xdWVyeV9tb2RlXzJkXzNkXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGhlIGN1cnJlbnQgMkQvM0QgdmlldyBtb2RlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ2aWV3X3NldF9ncmlkX3Zpc2libGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3cgb3IgaGlkZSB0aGUgc2NlbmUgZ3JpZC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGU6IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIldoZXRoZXIgdG8gc2hvdyB0aGUgZ3JpZFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widmlzaWJsZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwidmlld19xdWVyeV9ncmlkX3Zpc2libGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNoZWNrIGlmIHRoZSBzY2VuZSBncmlkIGlzIHZpc2libGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInZpZXdfZm9jdXNfb25fbm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRm9jdXMgdGhlIHNjZW5lIGNhbWVyYSBvbiBzcGVjaWZpYyBub2RlKHMpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IHsgdHlwZTogXCJhcnJheVwiLCBpdGVtczogeyB0eXBlOiBcInN0cmluZ1wiIH0sIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRHMgdG8gZm9jdXMgb25cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRzXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ2aWV3X2dldF9zdGF0dXNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgY3VycmVudCBzY2VuZSB2aWV3IHN0YXR1cyAoZ2l6bW8gdG9vbCwgcGl2b3QsIGNvb3JkaW5hdGUsIGdyaWQsIGV0Yy4pLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ2aWV3X3NldF9pY29uX2dpem1vXzNkXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJUb2dnbGUgM0QgaWNvbiBnaXptb3Mgb24vb2ZmLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgZW5hYmxlZDogeyB0eXBlOiBcImJvb2xlYW5cIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImVuYWJsZWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInZpZXdfcXVlcnlfaWNvbl9naXptb18zZFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2sgaWYgM0QgaWNvbiBnaXptb3MgYXJlIGVuYWJsZWQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInZpZXdfc2V0X2ljb25fZ2l6bW9fc2l6ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2V0IHRoZSBpY29uIGdpem1vIHNpemUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyBzaXplOiB7IHR5cGU6IFwibnVtYmVyXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJzaXplXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ2aWV3X3F1ZXJ5X2ljb25fZ2l6bW9fc2l6ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IHRoZSBjdXJyZW50IGljb24gZ2l6bW8gc2l6ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwidmlld19hbGlnbl93aXRoX3ZpZXdcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFsaWduIHRoZSBzZWxlY3RlZCBub2RlIHdpdGggdGhlIGN1cnJlbnQgY2FtZXJhIHZpZXcuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInZpZXdfYWxpZ25fdmlld193aXRoX25vZGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFsaWduIHRoZSBjYW1lcmEgdmlldyB3aXRoIHRoZSBzZWxlY3RlZCBub2RlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJ2aWV3X3Jlc2V0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXNldCB0aGUgc2NlbmUgdmlldyB0byBkZWZhdWx0IHN0YXRlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ2aWV3X2NoYW5nZV9naXptb190b29sXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY2hhbmdlLWdpem1vLXRvb2xcIiwgYXJncy50b29sKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB0b29sOiBhcmdzLnRvb2wgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19xdWVyeV9naXptb190b29sXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b29sID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktZ2l6bW8tdG9vbC1uYW1lXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHRvb2wgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19jaGFuZ2VfZ2l6bW9fcGl2b3RcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjaGFuZ2UtZ2l6bW8tcGl2b3RcIiwgYXJncy5waXZvdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcGl2b3Q6IGFyZ3MucGl2b3QgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19xdWVyeV9naXptb19waXZvdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGl2b3QgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1naXptby1waXZvdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwaXZvdCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ2aWV3X2NoYW5nZV9naXptb19jb29yZGluYXRlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY2hhbmdlLWdpem1vLWNvb3JkaW5hdGVcIiwgYXJncy5jb29yZGluYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBjb29yZGluYXRlOiBhcmdzLmNvb3JkaW5hdGUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19xdWVyeV9naXptb19jb29yZGluYXRlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb29yZCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWdpem1vLWNvb3JkaW5hdGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY29vcmRpbmF0ZTogY29vcmQgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19jaGFuZ2VfbW9kZV8yZF8zZFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImNoYW5nZS12aWV3LW1vZGUtMmQtM2RcIiwgYXJncy5tb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBtb2RlOiBhcmdzLm1vZGUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19xdWVyeV9tb2RlXzJkXzNkXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RlID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktdmlldy1tb2RlLTJkLTNkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG1vZGUgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19zZXRfZ3JpZF92aXNpYmxlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2V0LWdyaWQtdmlzaWJsZVwiLCBhcmdzLnZpc2libGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHZpc2libGU6IGFyZ3MudmlzaWJsZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ2aWV3X3F1ZXJ5X2dyaWRfdmlzaWJsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlzaWJsZSA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWdyaWQtdmlzaWJsZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB2aXNpYmxlIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInZpZXdfZm9jdXNfb25fbm9kZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImZvY3VzLWNhbWVyYS1vbi1ub2Rlc1wiLCBhcmdzLnV1aWRzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkczogYXJncy51dWlkcyB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ2aWV3X2dldF9zdGF0dXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFt0b29sLCBwaXZvdCwgY29vcmQsIG1vZGUsIGdyaWRdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1naXptby10b29sLW5hbWVcIikuY2F0Y2goKCkgPT4gbnVsbCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWdpem1vLXBpdm90XCIpLmNhdGNoKCgpID0+IG51bGwpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1naXptby1jb29yZGluYXRlXCIpLmNhdGNoKCgpID0+IG51bGwpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS12aWV3LW1vZGUtMmQtM2RcIikuY2F0Y2goKCkgPT4gbnVsbCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWdyaWQtdmlzaWJsZVwiKS5jYXRjaCgoKSA9PiBudWxsKSxcclxuICAgICAgICAgICAgICAgICAgICBdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB0b29sLCBwaXZvdCwgY29vcmRpbmF0ZTogY29vcmQsIG1vZGUsIGdyaWRWaXNpYmxlOiBncmlkIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInZpZXdfc2V0X2ljb25fZ2l6bW9fM2RcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzZXQtaWNvbi1naXptby0zZFwiLCBhcmdzLmVuYWJsZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGVuYWJsZWQ6IGFyZ3MuZW5hYmxlZCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ2aWV3X3F1ZXJ5X2ljb25fZ2l6bW9fM2RcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1pcy1pY29uLWdpem1vLTNkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGVuYWJsZWQgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19zZXRfaWNvbl9naXptb19zaXplXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2V0LWljb24tZ2l6bW8tc2l6ZVwiLCBhcmdzLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNpemU6IGFyZ3Muc2l6ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJ2aWV3X3F1ZXJ5X2ljb25fZ2l6bW9fc2l6ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWljb24tZ2l6bW8tc2l6ZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzaXplIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInZpZXdfYWxpZ25fd2l0aF92aWV3XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiYWxpZ24td2l0aC12aWV3XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19hbGlnbl92aWV3X3dpdGhfbm9kZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImFsaWduLXZpZXctd2l0aC1ub2RlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwidmlld19yZXNldFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJlc2V0LXNjZW5lLXZpZXdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiJdfQ==