import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

export class SceneViewTools implements ToolCategory {
    readonly categoryName = "sceneView";

    getTools(): ToolDefinition[] {
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
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "view_change_gizmo_tool":
                    await (Editor.Message.request as any)("scene", "change-gizmo-tool", args.tool);
                    return ok({ success: true, tool: args.tool });
                case "view_query_gizmo_tool": {
                    const tool = await (Editor.Message.request as any)("scene", "query-gizmo-tool-name");
                    return ok({ success: true, tool });
                }
                case "view_change_gizmo_pivot":
                    await (Editor.Message.request as any)("scene", "change-gizmo-pivot", args.pivot);
                    return ok({ success: true, pivot: args.pivot });
                case "view_query_gizmo_pivot": {
                    const pivot = await (Editor.Message.request as any)("scene", "query-gizmo-pivot");
                    return ok({ success: true, pivot });
                }
                case "view_change_gizmo_coordinate":
                    await (Editor.Message.request as any)("scene", "change-gizmo-coordinate", args.coordinate);
                    return ok({ success: true, coordinate: args.coordinate });
                case "view_query_gizmo_coordinate": {
                    const coord = await (Editor.Message.request as any)("scene", "query-gizmo-coordinate");
                    return ok({ success: true, coordinate: coord });
                }
                case "view_change_mode_2d_3d":
                    await (Editor.Message.request as any)("scene", "change-view-mode-2d-3d", args.mode);
                    return ok({ success: true, mode: args.mode });
                case "view_query_mode_2d_3d": {
                    const mode = await (Editor.Message.request as any)("scene", "query-view-mode-2d-3d");
                    return ok({ success: true, mode });
                }
                case "view_set_grid_visible":
                    await (Editor.Message.request as any)("scene", "set-grid-visible", args.visible);
                    return ok({ success: true, visible: args.visible });
                case "view_query_grid_visible": {
                    const visible = await (Editor.Message.request as any)("scene", "query-grid-visible");
                    return ok({ success: true, visible });
                }
                case "view_focus_on_node":
                    await (Editor.Message.request as any)("scene", "focus-camera-on-nodes", args.uuids);
                    return ok({ success: true, uuids: args.uuids });
                case "view_get_status": {
                    const [tool, pivot, coord, mode, grid] = await Promise.all([
                        (Editor.Message.request as any)("scene", "query-gizmo-tool-name").catch(() => null),
                        (Editor.Message.request as any)("scene", "query-gizmo-pivot").catch(() => null),
                        (Editor.Message.request as any)("scene", "query-gizmo-coordinate").catch(() => null),
                        (Editor.Message.request as any)("scene", "query-view-mode-2d-3d").catch(() => null),
                        (Editor.Message.request as any)("scene", "query-grid-visible").catch(() => null),
                    ]);
                    return ok({ success: true, tool, pivot, coordinate: coord, mode, gridVisible: grid });
                }
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
