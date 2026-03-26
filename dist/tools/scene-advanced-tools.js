"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAdvancedTools = void 0;
const tool_base_1 = require("../tool-base");
const EXT_NAME = "cocos-creator-mcp";
class SceneAdvancedTools {
    constructor() {
        this.categoryName = "sceneAdvanced";
    }
    getTools() {
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
            // ── 以下、既存MCP未対応のEditor API ──
            {
                name: "scene_set_parent",
                description: "Reparent node(s) using the official Editor API (alternative to node_move).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuids: { type: "array", items: { type: "string" }, description: "Node UUID(s) to move" },
                        parent: { type: "string", description: "New parent node UUID" },
                        keepWorldTransform: { type: "boolean", description: "Keep world position (default false)" },
                    },
                    required: ["uuids", "parent"],
                },
            },
            {
                name: "scene_query_node",
                description: "Get a full property dump of a node (all serialized data).",
                inputSchema: {
                    type: "object",
                    properties: { uuid: { type: "string", description: "Node UUID" } },
                    required: ["uuid"],
                },
            },
            {
                name: "scene_query_component",
                description: "Get a full property dump of a component by its UUID.",
                inputSchema: {
                    type: "object",
                    properties: { uuid: { type: "string", description: "Component UUID" } },
                    required: ["uuid"],
                },
            },
            {
                name: "scene_query_scene_bounds",
                description: "Get the bounding rect of the current scene.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }
    async execute(toolName, args) {
        try {
            switch (toolName) {
                case "scene_execute_script":
                    return (0, tool_base_1.ok)(await this.sceneScript(args.method, args.args || []));
                case "scene_snapshot":
                    return (0, tool_base_1.ok)(await Editor.Message.request("scene", "snapshot"));
                case "scene_query_dirty": {
                    const dirty = await Editor.Message.request("scene", "query-dirty");
                    return (0, tool_base_1.ok)({ success: true, dirty });
                }
                case "scene_query_classes": {
                    const classes = await Editor.Message.request("scene", "query-classes");
                    return (0, tool_base_1.ok)({ success: true, classes });
                }
                case "scene_query_components": {
                    const comps = await Editor.Message.request("scene", "query-components", args.uuid);
                    return (0, tool_base_1.ok)({ success: true, components: comps });
                }
                case "scene_query_node_tree": {
                    const tree = await Editor.Message.request("scene", "query-node-tree");
                    return (0, tool_base_1.ok)({ success: true, tree });
                }
                case "scene_query_nodes_by_asset": {
                    const nodes = await Editor.Message.request("scene", "query-nodes-by-asset-uuid", args.assetUuid);
                    return (0, tool_base_1.ok)({ success: true, nodes });
                }
                case "scene_soft_reload":
                    await Editor.Message.request("scene", "soft-reload");
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_reset_node_transform":
                    return await this.resetTransform(args.uuid);
                case "scene_copy_node":
                    await Editor.Message.request("scene", "copy-node", args.uuid);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid });
                case "scene_paste_node": {
                    const result = await Editor.Message.request("scene", "paste-node", args.parentUuid);
                    return (0, tool_base_1.ok)({ success: true, result });
                }
                case "scene_create":
                    await Editor.Message.request("scene", "new-scene");
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_cut_node":
                    await Editor.Message.request("scene", "cut-node", args.uuid);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid });
                case "scene_reset_property":
                    await Editor.Message.request("scene", "reset-property", { uuid: args.uuid, path: args.path });
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_reset_component":
                    await Editor.Message.request("scene", "reset-component", { uuid: args.uuid });
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_execute_component_method": {
                    const result = await Editor.Message.request("scene", "execute-component-method", { uuid: args.uuid, name: args.method, args: args.args || [] });
                    return (0, tool_base_1.ok)({ success: true, result });
                }
                case "scene_move_array_element":
                    await Editor.Message.request("scene", "move-array-element", { uuid: args.uuid, path: args.path, target: args.target, offset: args.offset });
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_remove_array_element":
                    await Editor.Message.request("scene", "remove-array-element", { uuid: args.uuid, path: args.path, index: args.index });
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_snapshot_abort":
                    await Editor.Message.request("scene", "snapshot-abort");
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_query_ready": {
                    const ready = await Editor.Message.request("scene", "query-is-ready");
                    return (0, tool_base_1.ok)({ success: true, ready });
                }
                case "scene_query_component_has_script": {
                    const hasScript = await Editor.Message.request("scene", "query-component-has-script", args.name);
                    return (0, tool_base_1.ok)({ success: true, name: args.name, hasScript });
                }
                case "scene_restore_prefab":
                    await Editor.Message.request("scene", "restore-prefab", { uuid: args.uuid });
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid });
                case "scene_begin_undo":
                    await Editor.Message.request("scene", "begin-recording");
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_end_undo":
                    await Editor.Message.request("scene", "end-recording");
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_cancel_undo":
                    await Editor.Message.request("scene", "cancel-recording");
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_save_as": {
                    const result = await Editor.Message.request("scene", "save-as-scene");
                    return (0, tool_base_1.ok)({ success: true, result });
                }
                case "scene_set_parent":
                    await Editor.Message.request("scene", "set-parent", {
                        parent: args.parent,
                        uuids: args.uuids,
                        keepWorldTransform: args.keepWorldTransform || false,
                    });
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_query_node": {
                    const dump = await Editor.Message.request("scene", "query-node", args.uuid);
                    return (0, tool_base_1.ok)({ success: true, node: dump });
                }
                case "scene_query_component": {
                    const dump = await Editor.Message.request("scene", "query-component", args.uuid);
                    return (0, tool_base_1.ok)({ success: true, component: dump });
                }
                case "scene_query_scene_bounds": {
                    const bounds = await Editor.Message.request("scene", "query-scene-bounds");
                    return (0, tool_base_1.ok)({ success: true, bounds });
                }
                default:
                    return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
            }
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async resetTransform(uuid) {
        const result = await this.sceneScript("setNodeProperty", [uuid, "position", { x: 0, y: 0, z: 0 }]);
        await this.sceneScript("setNodeProperty", [uuid, "rotation", { x: 0, y: 0, z: 0 }]);
        await this.sceneScript("setNodeProperty", [uuid, "scale", { x: 1, y: 1, z: 1 }]);
        return (0, tool_base_1.ok)({ success: true, uuid });
    }
    async sceneScript(method, args) {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
exports.SceneAdvancedTools = SceneAdvancedTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBRXZDLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBRXJDLE1BQWEsa0JBQWtCO0lBQS9CO1FBQ2EsaUJBQVksR0FBRyxlQUFlLENBQUM7SUFvWTVDLENBQUM7SUFsWUcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsc0JBQXNCO2dCQUM1QixXQUFXLEVBQUUsdURBQXVEO2dCQUNwRSxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLDBCQUEwQixFQUFFO3dCQUNuRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3FCQUN2RTtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ3ZCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixXQUFXLEVBQUUsd0RBQXdEO2dCQUNyRSxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7YUFDbEQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUsbUJBQW1CO2dCQUN6QixXQUFXLEVBQUUsaURBQWlEO2dCQUM5RCxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7YUFDbEQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixXQUFXLEVBQUUscURBQXFEO2dCQUNsRSxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUs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LENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFZO1FBQ3JDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNuRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEYsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLE9BQU8sSUFBQSxjQUFFLEVBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYyxFQUFFLElBQVc7UUFDakQsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7WUFDM0QsSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNO1lBQ04sSUFBSTtTQUNQLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXJZRCxnREFxWUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBUb29sUmVzdWx0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XHJcbmltcG9ydCB7IG9rLCBlcnIgfSBmcm9tIFwiLi4vdG9vbC1iYXNlXCI7XHJcblxyXG5jb25zdCBFWFRfTkFNRSA9IFwiY29jb3MtY3JlYXRvci1tY3BcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTY2VuZUFkdmFuY2VkVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJzY2VuZUFkdmFuY2VkXCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9leGVjdXRlX3NjcmlwdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRXhlY3V0ZSBhIHNjZW5lIHNjcmlwdCBtZXRob2QgYnkgbmFtZSB3aXRoIGFyZ3VtZW50cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTY2VuZSBzY3JpcHQgbWV0aG9kIG5hbWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7IHR5cGU6IFwiYXJyYXlcIiwgZGVzY3JpcHRpb246IFwiQXJndW1lbnRzIHRvIHBhc3NcIiwgaXRlbXM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibWV0aG9kXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zbmFwc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGFrZSBhIHNuYXBzaG90IG9mIHRoZSBjdXJyZW50IHNjZW5lIHN0YXRlIChmb3IgdW5kbykuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X2RpcnR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDaGVjayBpZiB0aGUgY3VycmVudCBzY2VuZSBoYXMgdW5zYXZlZCBjaGFuZ2VzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9jbGFzc2VzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJRdWVyeSBhbGwgYXZhaWxhYmxlIGNvbXBvbmVudCBjbGFzc2VzIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfY29tcG9uZW50c1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUXVlcnkgYXZhaWxhYmxlIGNvbXBvbmVudHMgZm9yIGEgZ2l2ZW4gbm9kZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9ub2RlX3RyZWVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlF1ZXJ5IHRoZSByYXcgbm9kZSB0cmVlIGZyb20gdGhlIGVkaXRvciAoYWx0ZXJuYXRpdmUgdG8gc2NlbmVfZ2V0X2hpZXJhcmNoeSkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X25vZGVzX2J5X2Fzc2V0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJGaW5kIGFsbCBub2RlcyB0aGF0IHJlZmVyZW5jZSBhIGdpdmVuIGFzc2V0IFVVSUQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXNzZXQgVVVJRCB0byBzZWFyY2ggZm9yXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJhc3NldFV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NvZnRfcmVsb2FkXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTb2Z0IHJlbG9hZCB0aGUgY3VycmVudCBzY2VuZSB3aXRob3V0IGxvc2luZyBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcmVzZXRfbm9kZV90cmFuc2Zvcm1cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlc2V0IGEgbm9kZSdzIHRyYW5zZm9ybSB0byBkZWZhdWx0IChwb3NpdGlvbiAwLDAsMCAvIHJvdGF0aW9uIDAsMCwwIC8gc2NhbGUgMSwxLDEpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2NvcHlfbm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ29weSBhIG5vZGUgdG8gY2xpcGJvYXJkLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3Bhc3RlX25vZGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlBhc3RlIG5vZGUgZnJvbSBjbGlwYm9hcmQgdW5kZXIgYSBwYXJlbnQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlBhcmVudCBub2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhcmVudFV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2NyZWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3JlYXRlIGEgbmV3IGVtcHR5IHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9jdXRfbm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3V0IGEgbm9kZSB0byBjbGlwYm9hcmQgKHJlbW92ZXMgZnJvbSBzY2VuZSkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcmVzZXRfcHJvcGVydHlcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlc2V0IGEgc3BlY2lmaWMgcHJvcGVydHkgb24gYSBub2RlIG9yIGNvbXBvbmVudCB0byBpdHMgZGVmYXVsdCB2YWx1ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBvciBjb21wb25lbnQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJvcGVydHkgcGF0aCAoZS5nLiAncG9zaXRpb24nLCAnY29sb3InKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3Jlc2V0X2NvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVzZXQgYSBjb21wb25lbnQgdG8gaXRzIGRlZmF1bHQgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBVVUlEXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9leGVjdXRlX2NvbXBvbmVudF9tZXRob2RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNhbGwgYSBtZXRob2Qgb24gYSBjb21wb25lbnQgYXQgZWRpdC10aW1lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJNZXRob2QgbmFtZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IHsgdHlwZTogXCJhcnJheVwiLCBkZXNjcmlwdGlvbjogXCJNZXRob2QgYXJndW1lbnRzXCIsIGl0ZW1zOiB7fSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJtZXRob2RcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX21vdmVfYXJyYXlfZWxlbWVudFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTW92ZSBhbiBhcnJheSBlbGVtZW50IHRvIGEgbmV3IHBvc2l0aW9uIGluIGEgcHJvcGVydHkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgb3IgY29tcG9uZW50IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkFycmF5IHByb3BlcnR5IHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiQ3VycmVudCBpbmRleFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNb3ZlIG9mZnNldCAoKzEgPSBkb3duLCAtMSA9IHVwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIiwgXCJ0YXJnZXRcIiwgXCJvZmZzZXRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3JlbW92ZV9hcnJheV9lbGVtZW50XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZW1vdmUgYW4gZWxlbWVudCBmcm9tIGFuIGFycmF5IHByb3BlcnR5IGJ5IGluZGV4LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIG9yIGNvbXBvbmVudCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJBcnJheSBwcm9wZXJ0eSBwYXRoXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiSW5kZXggdG8gcmVtb3ZlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiLCBcImluZGV4XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zbmFwc2hvdF9hYm9ydFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQWJvcnQgdGhlIGN1cnJlbnQgdW5kbyBzbmFwc2hvdC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfcmVhZHlcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNoZWNrIGlmIHRoZSBzY2VuZSBpcyBmdWxseSBsb2FkZWQgYW5kIHJlYWR5LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9jb21wb25lbnRfaGFzX3NjcmlwdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2sgaWYgYSBjb21wb25lbnQgaGFzIGFuIGFzc29jaWF0ZWQgc2NyaXB0IGZpbGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJuYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9yZXN0b3JlX3ByZWZhYlwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVzdG9yZSBhIHByZWZhYiBub2RlIHRvIGl0cyBvcmlnaW5hbCBwcmVmYWIgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfYmVnaW5fdW5kb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQmVnaW4gcmVjb3JkaW5nIHVuZG8gb3BlcmF0aW9ucy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfZW5kX3VuZG9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkVuZCB1bmRvIHJlY29yZGluZyBhbmQgc2F2ZSB0aGUgdW5kbyBzdGVwLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9jYW5jZWxfdW5kb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2FuY2VsIHRoZSBjdXJyZW50IHVuZG8gcmVjb3JkaW5nLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zYXZlX2FzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTYXZlIHRoZSBjdXJyZW50IHNjZW5lIHRvIGEgbmV3IGZpbGUgKHNob3dzIHNhdmUgZGlhbG9nKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIOKUgOKUgCDku6XkuIvjgIHml6LlrZhNQ1DmnKrlr77lv5zjga5FZGl0b3IgQVBJIOKUgOKUgFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NldF9wYXJlbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlcGFyZW50IG5vZGUocykgdXNpbmcgdGhlIG9mZmljaWFsIEVkaXRvciBBUEkgKGFsdGVybmF0aXZlIHRvIG5vZGVfbW92ZSkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkczogeyB0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiB7IHR5cGU6IFwic3RyaW5nXCIgfSwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEKHMpIHRvIG1vdmVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTmV3IHBhcmVudCBub2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm06IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIktlZXAgd29ybGQgcG9zaXRpb24gKGRlZmF1bHQgZmFsc2UpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkc1wiLCBcInBhcmVudFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfbm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGEgZnVsbCBwcm9wZXJ0eSBkdW1wIG9mIGEgbm9kZSAoYWxsIHNlcmlhbGl6ZWQgZGF0YSkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfY29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgYSBmdWxsIHByb3BlcnR5IGR1bXAgb2YgYSBjb21wb25lbnQgYnkgaXRzIFVVSUQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBVVUlEXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9zY2VuZV9ib3VuZHNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgYm91bmRpbmcgcmVjdCBvZiB0aGUgY3VycmVudCBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfZXhlY3V0ZV9zY3JpcHRcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChhcmdzLm1ldGhvZCwgYXJncy5hcmdzIHx8IFtdKSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfc25hcHNob3RcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic25hcHNob3RcIikpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X2RpcnR5XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXJ0eSA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWRpcnR5XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGRpcnR5IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X2NsYXNzZXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jbGFzc2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNsYXNzZXMgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY29tcG9uZW50c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcHMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jb21wb25lbnRzXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY29tcG9uZW50czogY29tcHMgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfbm9kZV90cmVlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmVlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwicXVlcnktbm9kZS10cmVlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHRyZWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfbm9kZXNfYnlfYXNzZXRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktbm9kZXMtYnktYXNzZXQtdXVpZFwiLCBhcmdzLmFzc2V0VXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm9kZXMgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfc29mdF9yZWxvYWRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzb2Z0LXJlbG9hZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Jlc2V0X25vZGVfdHJhbnNmb3JtXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVzZXRUcmFuc2Zvcm0oYXJncy51dWlkKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9jb3B5X25vZGVcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjb3B5LW5vZGVcIiwgYXJncy51dWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkOiBhcmdzLnV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcGFzdGVfbm9kZVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicGFzdGUtbm9kZVwiLCBhcmdzLnBhcmVudFV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9jcmVhdGVcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJuZXctc2NlbmVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9jdXRfbm9kZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImN1dC1ub2RlXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Jlc2V0X3Byb3BlcnR5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVzZXQtcHJvcGVydHlcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Jlc2V0X2NvbXBvbmVudFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJlc2V0LWNvbXBvbmVudFwiLCB7IHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZXhlY3V0ZS1jb21wb25lbnQtbWV0aG9kXCIsIHsgdXVpZDogYXJncy51dWlkLCBuYW1lOiBhcmdzLm1ldGhvZCwgYXJnczogYXJncy5hcmdzIHx8IFtdIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9tb3ZlX2FycmF5X2VsZW1lbnRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJtb3ZlLWFycmF5LWVsZW1lbnRcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCwgdGFyZ2V0OiBhcmdzLnRhcmdldCwgb2Zmc2V0OiBhcmdzLm9mZnNldCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3JlbW92ZV9hcnJheV9lbGVtZW50XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVtb3ZlLWFycmF5LWVsZW1lbnRcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCwgaW5kZXg6IGFyZ3MuaW5kZXggfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zbmFwc2hvdF9hYm9ydFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNuYXBzaG90LWFib3J0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfcmVhZHlcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlYWR5ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktaXMtcmVhZHlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVhZHkgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY29tcG9uZW50X2hhc19zY3JpcHRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc1NjcmlwdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudC1oYXMtc2NyaXB0XCIsIGFyZ3MubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbmFtZTogYXJncy5uYW1lLCBoYXNTY3JpcHQgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcmVzdG9yZV9wcmVmYWJcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZXN0b3JlLXByZWZhYlwiLCB7IHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkOiBhcmdzLnV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfYmVnaW5fdW5kb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImJlZ2luLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2VuZF91bmRvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZW5kLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2NhbmNlbF91bmRvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY2FuY2VsLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NhdmVfYXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNhdmUtYXMtc2NlbmVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NldF9wYXJlbnRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzZXQtcGFyZW50XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBhcmdzLnBhcmVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IGFyZ3MudXVpZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogYXJncy5rZWVwV29ybGRUcmFuc2Zvcm0gfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9ub2RlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktbm9kZVwiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGU6IGR1bXAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY29tcG9uZW50XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktY29tcG9uZW50XCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY29tcG9uZW50OiBkdW1wIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X3NjZW5lX2JvdW5kc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYm91bmRzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktc2NlbmUtYm91bmRzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGJvdW5kcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVzZXRUcmFuc2Zvcm0odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJwb3NpdGlvblwiLCB7IHg6IDAsIHk6IDAsIHo6IDAgfV0pO1xyXG4gICAgICAgIGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwicm90YXRpb25cIiwgeyB4OiAwLCB5OiAwLCB6OiAwIH1dKTtcclxuICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInNjYWxlXCIsIHsgeDogMSwgeTogMSwgejogMSB9XSk7XHJcbiAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=