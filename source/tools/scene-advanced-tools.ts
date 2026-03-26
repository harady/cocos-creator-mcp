import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

const EXT_NAME = "cocos-creator-mcp";

export class SceneAdvancedTools implements ToolCategory {
    readonly categoryName = "sceneAdvanced";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "scene_execute_script",
                description: "Execute a scene script method by name with arguments.",
                inputSchema: {
                    type: "object",
                    properties: {
                        method: { type: "string", description: "Scene script method name" },
                        args: { type: "array", description: "Arguments to pass", items: {} },
                    },
                    required: ["method"],
                },
            },
            {
                name: "scene_snapshot",
                description: "Take a snapshot of the current scene state (for undo).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_query_dirty",
                description: "Check if the current scene has unsaved changes.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_query_classes",
                description: "Query all available component classes in the scene.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_query_components",
                description: "Query available components for a given node.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "scene_query_node_tree",
                description: "Query the raw node tree from the editor (alternative to scene_get_hierarchy).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_query_nodes_by_asset",
                description: "Find all nodes that reference a given asset UUID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        assetUuid: { type: "string", description: "Asset UUID to search for" },
                    },
                    required: ["assetUuid"],
                },
            },
            {
                name: "scene_soft_reload",
                description: "Soft reload the current scene without losing state.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_reset_node_transform",
                description: "Reset a node's transform to default (position 0,0,0 / rotation 0,0,0 / scale 1,1,1).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "scene_copy_node",
                description: "Copy a node to clipboard.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "scene_paste_node",
                description: "Paste node from clipboard under a parent.",
                inputSchema: {
                    type: "object",
                    properties: {
                        parentUuid: { type: "string", description: "Parent node UUID" },
                    },
                    required: ["parentUuid"],
                },
            },
            {
                name: "scene_create",
                description: "Create a new empty scene.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "scene_execute_script":
                    return ok(await this.sceneScript(args.method, args.args || []));
                case "scene_snapshot":
                    return ok(await (Editor.Message.request as any)("scene", "snapshot"));
                case "scene_query_dirty": {
                    const dirty = await (Editor.Message.request as any)("scene", "query-is-dirty");
                    return ok({ success: true, dirty });
                }
                case "scene_query_classes": {
                    const classes = await (Editor.Message.request as any)("scene", "query-classes");
                    return ok({ success: true, classes });
                }
                case "scene_query_components": {
                    const comps = await (Editor.Message.request as any)("scene", "query-components", args.uuid);
                    return ok({ success: true, components: comps });
                }
                case "scene_query_node_tree": {
                    const tree = await Editor.Message.request("scene", "query-node-tree");
                    return ok({ success: true, tree });
                }
                case "scene_query_nodes_by_asset": {
                    const nodes = await (Editor.Message.request as any)("scene", "query-nodes-by-asset-uuid", args.assetUuid);
                    return ok({ success: true, nodes });
                }
                case "scene_soft_reload":
                    await (Editor.Message.request as any)("scene", "soft-reload");
                    return ok({ success: true });
                case "scene_reset_node_transform":
                    return await this.resetTransform(args.uuid);
                case "scene_copy_node":
                    await (Editor.Message.request as any)("scene", "copy-node", args.uuid);
                    return ok({ success: true, uuid: args.uuid });
                case "scene_paste_node": {
                    const result = await (Editor.Message.request as any)("scene", "paste-node", args.parentUuid);
                    return ok({ success: true, result });
                }
                case "scene_create":
                    await (Editor.Message.request as any)("scene", "new-scene");
                    return ok({ success: true });
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async resetTransform(uuid: string): Promise<ToolResult> {
        const result = await this.sceneScript("setNodeProperty", [uuid, "position", { x: 0, y: 0, z: 0 }]);
        await this.sceneScript("setNodeProperty", [uuid, "rotation", { x: 0, y: 0, z: 0 }]);
        await this.sceneScript("setNodeProperty", [uuid, "scale", { x: 1, y: 1, z: 1 }]);
        return ok({ success: true, uuid });
    }

    private async sceneScript(method: string, args: any[]): Promise<any> {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
