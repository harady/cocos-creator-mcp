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
            {
                name: "scene_cut_node",
                description: "Cut a node to clipboard (removes from scene).",
                inputSchema: {
                    type: "object",
                    properties: { uuid: { type: "string", description: "Node UUID" } },
                    required: ["uuid"],
                },
            },
            {
                name: "scene_reset_property",
                description: "Reset a specific property on a node or component to its default value.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node or component UUID" },
                        path: { type: "string", description: "Property path (e.g. 'position', 'color')" },
                    },
                    required: ["uuid", "path"],
                },
            },
            {
                name: "scene_reset_component",
                description: "Reset a component to its default state.",
                inputSchema: {
                    type: "object",
                    properties: { uuid: { type: "string", description: "Component UUID" } },
                    required: ["uuid"],
                },
            },
            {
                name: "scene_execute_component_method",
                description: "Call a method on a component at edit-time.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Component UUID" },
                        method: { type: "string", description: "Method name" },
                        args: { type: "array", description: "Method arguments", items: {} },
                    },
                    required: ["uuid", "method"],
                },
            },
            {
                name: "scene_move_array_element",
                description: "Move an array element to a new position in a property.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node or component UUID" },
                        path: { type: "string", description: "Array property path" },
                        target: { type: "number", description: "Current index" },
                        offset: { type: "number", description: "Move offset (+1 = down, -1 = up)" },
                    },
                    required: ["uuid", "path", "target", "offset"],
                },
            },
            {
                name: "scene_remove_array_element",
                description: "Remove an element from an array property by index.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node or component UUID" },
                        path: { type: "string", description: "Array property path" },
                        index: { type: "number", description: "Index to remove" },
                    },
                    required: ["uuid", "path", "index"],
                },
            },
            {
                name: "scene_snapshot_abort",
                description: "Abort the current undo snapshot.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_query_ready",
                description: "Check if the scene is fully loaded and ready.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_query_component_has_script",
                description: "Check if a component has an associated script file.",
                inputSchema: {
                    type: "object",
                    properties: { name: { type: "string", description: "Component class name" } },
                    required: ["name"],
                },
            },
            {
                name: "scene_restore_prefab",
                description: "Restore a prefab node to its original prefab state.",
                inputSchema: {
                    type: "object",
                    properties: { uuid: { type: "string", description: "Node UUID" } },
                    required: ["uuid"],
                },
            },
            {
                name: "scene_begin_undo",
                description: "Begin recording undo operations.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_end_undo",
                description: "End undo recording and save the undo step.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_cancel_undo",
                description: "Cancel the current undo recording.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "scene_save_as",
                description: "Save the current scene to a new file (shows save dialog).",
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
                    const dirty = await (Editor.Message.request as any)("scene", "query-dirty");
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
                case "scene_cut_node":
                    await (Editor.Message.request as any)("scene", "cut-node", args.uuid);
                    return ok({ success: true, uuid: args.uuid });
                case "scene_reset_property":
                    await (Editor.Message.request as any)("scene", "reset-property", { uuid: args.uuid, path: args.path });
                    return ok({ success: true });
                case "scene_reset_component":
                    await (Editor.Message.request as any)("scene", "reset-component", { uuid: args.uuid });
                    return ok({ success: true });
                case "scene_execute_component_method": {
                    const result = await (Editor.Message.request as any)("scene", "execute-component-method", { uuid: args.uuid, name: args.method, args: args.args || [] });
                    return ok({ success: true, result });
                }
                case "scene_move_array_element":
                    await (Editor.Message.request as any)("scene", "move-array-element", { uuid: args.uuid, path: args.path, target: args.target, offset: args.offset });
                    return ok({ success: true });
                case "scene_remove_array_element":
                    await (Editor.Message.request as any)("scene", "remove-array-element", { uuid: args.uuid, path: args.path, index: args.index });
                    return ok({ success: true });
                case "scene_snapshot_abort":
                    await (Editor.Message.request as any)("scene", "snapshot-abort");
                    return ok({ success: true });
                case "scene_query_ready": {
                    const ready = await (Editor.Message.request as any)("scene", "query-is-ready");
                    return ok({ success: true, ready });
                }
                case "scene_query_component_has_script": {
                    const hasScript = await (Editor.Message.request as any)("scene", "query-component-has-script", args.name);
                    return ok({ success: true, name: args.name, hasScript });
                }
                case "scene_restore_prefab":
                    await (Editor.Message.request as any)("scene", "restore-prefab", { uuid: args.uuid });
                    return ok({ success: true, uuid: args.uuid });
                case "scene_begin_undo":
                    await (Editor.Message.request as any)("scene", "begin-recording");
                    return ok({ success: true });
                case "scene_end_undo":
                    await (Editor.Message.request as any)("scene", "end-recording");
                    return ok({ success: true });
                case "scene_cancel_undo":
                    await (Editor.Message.request as any)("scene", "cancel-recording");
                    return ok({ success: true });
                case "scene_save_as": {
                    const result = await (Editor.Message.request as any)("scene", "save-as-scene");
                    return ok({ success: true, result });
                }
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
