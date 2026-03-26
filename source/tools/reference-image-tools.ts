import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

export class ReferenceImageTools implements ToolCategory {
    readonly categoryName = "referenceImage";

    getTools(): ToolDefinition[] {
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

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "refimage_add":
                    await (Editor.Message.request as any)("scene", "add-reference-image", args.path);
                    return ok({ success: true, path: args.path });
                case "refimage_remove":
                    await (Editor.Message.request as any)("scene", "remove-reference-image", args.index);
                    return ok({ success: true, index: args.index });
                case "refimage_list": {
                    const config = await (Editor.Message.request as any)("scene", "query-reference-image-config").catch(() => null);
                    return ok({ success: true, config });
                }
                case "refimage_clear_all":
                    await (Editor.Message.request as any)("scene", "clear-all-reference-images");
                    return ok({ success: true });
                case "refimage_switch":
                    await (Editor.Message.request as any)("scene", "switch-reference-image", args.index);
                    return ok({ success: true, index: args.index });
                case "refimage_set_position":
                    await (Editor.Message.request as any)("scene", "set-reference-image-position", args.x, args.y);
                    return ok({ success: true, x: args.x, y: args.y });
                case "refimage_set_scale":
                    await (Editor.Message.request as any)("scene", "set-reference-image-scale", args.scale);
                    return ok({ success: true, scale: args.scale });
                case "refimage_set_opacity":
                    await (Editor.Message.request as any)("scene", "set-reference-image-opacity", args.opacity);
                    return ok({ success: true, opacity: args.opacity });
                case "refimage_query_config": {
                    const config = await (Editor.Message.request as any)("scene", "query-reference-image-config").catch(() => null);
                    return ok({ success: true, config });
                }
                case "refimage_query_current": {
                    const current = await (Editor.Message.request as any)("scene", "query-current-reference-image").catch(() => null);
                    return ok({ success: true, current });
                }
                case "refimage_refresh":
                    await (Editor.Message.request as any)("scene", "refresh-reference-image");
                    return ok({ success: true });
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
