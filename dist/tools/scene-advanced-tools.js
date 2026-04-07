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
                    try {
                        await Editor.Message.request("scene", "new-scene");
                        return (0, tool_base_1.ok)({ success: true });
                    }
                    catch (e) {
                        const msg = (e === null || e === void 0 ? void 0 : e.message) || String(e);
                        // Cocos Creator 3.8.x does not expose the scene:new-scene message
                        if (msg.includes("Message does not exist") || msg.includes("scene - new-scene")) {
                            return (0, tool_base_1.err)("scene_create is not supported on this Cocos Creator version " +
                                "(scene:new-scene message is unavailable). " +
                                "Workaround: write a .scene JSON file directly to db://assets/ and " +
                                "call project_refresh_assets to let the editor pick it up. " +
                                "See: https://github.com/harady/cocos-creator-mcp/issues/13");
                        }
                        return (0, tool_base_1.err)(msg);
                    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBRXZDLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBRXJDLE1BQWEsa0JBQWtCO0lBQS9CO1FBQ2EsaUJBQVksR0FBRyxlQUFlLENBQUM7SUFtWjVDLENBQUM7SUFqWkcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsc0JBQXNCO2dCQUM1QixXQUFXLEVBQUUsdURBQXVEO2dCQUNwRSxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLDBCQUEwQixFQUFFO3dCQUNuRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3FCQUN2RTtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ3ZCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixXQUFXLEVBQUUsd0RBQXdEO2dCQUNyRSxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7YUFDbEQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUsbUJBQW1CO2dCQUN6QixXQUFXLEVBQUUsaURBQWlEO2dCQUM5RCxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7YUFDbEQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixXQUFXLEVBQUUscURBQXFEO2dCQUNsRSxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUs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LEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRixPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQWMsRUFBRSxJQUFXO1FBQ2pELE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFO1lBQzNELElBQUksRUFBRSxRQUFRO1lBQ2QsTUFBTTtZQUNOLElBQUk7U0FDUCxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFwWkQsZ0RBb1pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5cclxuY29uc3QgRVhUX05BTUUgPSBcImNvY29zLWNyZWF0b3ItbWNwXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgU2NlbmVBZHZhbmNlZFRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwic2NlbmVBZHZhbmNlZFwiO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfZXhlY3V0ZV9zY3JpcHRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkV4ZWN1dGUgYSBzY2VuZSBzY3JpcHQgbWV0aG9kIGJ5IG5hbWUgd2l0aCBhcmd1bWVudHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2NlbmUgc2NyaXB0IG1ldGhvZCBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogeyB0eXBlOiBcImFycmF5XCIsIGRlc2NyaXB0aW9uOiBcIkFyZ3VtZW50cyB0byBwYXNzXCIsIGl0ZW1zOiB7fSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcIm1ldGhvZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfc25hcHNob3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRha2UgYSBzbmFwc2hvdCBvZiB0aGUgY3VycmVudCBzY2VuZSBzdGF0ZSAoZm9yIHVuZG8pLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9kaXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2sgaWYgdGhlIGN1cnJlbnQgc2NlbmUgaGFzIHVuc2F2ZWQgY2hhbmdlcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfY2xhc3Nlc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUXVlcnkgYWxsIGF2YWlsYWJsZSBjb21wb25lbnQgY2xhc3NlcyBpbiB0aGUgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X2NvbXBvbmVudHNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlF1ZXJ5IGF2YWlsYWJsZSBjb21wb25lbnRzIGZvciBhIGdpdmVuIG5vZGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfbm9kZV90cmVlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJRdWVyeSB0aGUgcmF3IG5vZGUgdHJlZSBmcm9tIHRoZSBlZGl0b3IgKGFsdGVybmF0aXZlIHRvIHNjZW5lX2dldF9oaWVyYXJjaHkpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9ub2Rlc19ieV9hc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRmluZCBhbGwgbm9kZXMgdGhhdCByZWZlcmVuY2UgYSBnaXZlbiBhc3NldCBVVUlELlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkFzc2V0IFVVSUQgdG8gc2VhcmNoIGZvclwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wiYXNzZXRVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zb2Z0X3JlbG9hZFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU29mdCByZWxvYWQgdGhlIGN1cnJlbnQgc2NlbmUgd2l0aG91dCBsb3Npbmcgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3Jlc2V0X25vZGVfdHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXNldCBhIG5vZGUncyB0cmFuc2Zvcm0gdG8gZGVmYXVsdCAocG9zaXRpb24gMCwwLDAgLyByb3RhdGlvbiAwLDAsMCAvIHNjYWxlIDEsMSwxKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9jb3B5X25vZGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNvcHkgYSBub2RlIHRvIGNsaXBib2FyZC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9wYXN0ZV9ub2RlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJQYXN0ZSBub2RlIGZyb20gY2xpcGJvYXJkIHVuZGVyIGEgcGFyZW50LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQYXJlbnQgbm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXJlbnRVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9jcmVhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIG5ldyBlbXB0eSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfY3V0X25vZGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkN1dCBhIG5vZGUgdG8gY2xpcGJvYXJkIChyZW1vdmVzIGZyb20gc2NlbmUpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3Jlc2V0X3Byb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXNldCBhIHNwZWNpZmljIHByb3BlcnR5IG9uIGEgbm9kZSBvciBjb21wb25lbnQgdG8gaXRzIGRlZmF1bHQgdmFsdWUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgb3IgY29tcG9uZW50IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IHBhdGggKGUuZy4gJ3Bvc2l0aW9uJywgJ2NvbG9yJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJwYXRoXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9yZXNldF9jb21wb25lbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlc2V0IGEgY29tcG9uZW50IHRvIGl0cyBkZWZhdWx0IHN0YXRlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgVVVJRFwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfZXhlY3V0ZV9jb21wb25lbnRfbWV0aG9kXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDYWxsIGEgbWV0aG9kIG9uIGEgY29tcG9uZW50IGF0IGVkaXQtdGltZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTWV0aG9kIG5hbWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7IHR5cGU6IFwiYXJyYXlcIiwgZGVzY3JpcHRpb246IFwiTWV0aG9kIGFyZ3VtZW50c1wiLCBpdGVtczoge30gfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwibWV0aG9kXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9tb3ZlX2FycmF5X2VsZW1lbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk1vdmUgYW4gYXJyYXkgZWxlbWVudCB0byBhIG5ldyBwb3NpdGlvbiBpbiBhIHByb3BlcnR5LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIG9yIGNvbXBvbmVudCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJBcnJheSBwcm9wZXJ0eSBwYXRoXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkN1cnJlbnQgaW5kZXhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTW92ZSBvZmZzZXQgKCsxID0gZG93biwgLTEgPSB1cClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJwYXRoXCIsIFwidGFyZ2V0XCIsIFwib2Zmc2V0XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9yZW1vdmVfYXJyYXlfZWxlbWVudFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVtb3ZlIGFuIGVsZW1lbnQgZnJvbSBhbiBhcnJheSBwcm9wZXJ0eSBieSBpbmRleC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBvciBjb21wb25lbnQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXJyYXkgcHJvcGVydHkgcGF0aFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkluZGV4IHRvIHJlbW92ZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIiwgXCJpbmRleFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfc25hcHNob3RfYWJvcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFib3J0IHRoZSBjdXJyZW50IHVuZG8gc25hcHNob3QuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X3JlYWR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDaGVjayBpZiB0aGUgc2NlbmUgaXMgZnVsbHkgbG9hZGVkIGFuZCByZWFkeS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfY29tcG9uZW50X2hhc19zY3JpcHRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNoZWNrIGlmIGEgY29tcG9uZW50IGhhcyBhbiBhc3NvY2lhdGVkIHNjcmlwdCBmaWxlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgbmFtZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgY2xhc3MgbmFtZVwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibmFtZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcmVzdG9yZV9wcmVmYWJcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlc3RvcmUgYSBwcmVmYWIgbm9kZSB0byBpdHMgb3JpZ2luYWwgcHJlZmFiIHN0YXRlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2JlZ2luX3VuZG9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkJlZ2luIHJlY29yZGluZyB1bmRvIG9wZXJhdGlvbnMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2VuZF91bmRvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFbmQgdW5kbyByZWNvcmRpbmcgYW5kIHNhdmUgdGhlIHVuZG8gc3RlcC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfY2FuY2VsX3VuZG9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNhbmNlbCB0aGUgY3VycmVudCB1bmRvIHJlY29yZGluZy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfc2F2ZV9hc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2F2ZSB0aGUgY3VycmVudCBzY2VuZSB0byBhIG5ldyBmaWxlIChzaG93cyBzYXZlIGRpYWxvZykuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyDilIDilIAg5Lul5LiL44CB5pei5a2YTUNQ5pyq5a++5b+c44GuRWRpdG9yIEFQSSDilIDilIBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zZXRfcGFyZW50XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXBhcmVudCBub2RlKHMpIHVzaW5nIHRoZSBvZmZpY2lhbCBFZGl0b3IgQVBJIChhbHRlcm5hdGl2ZSB0byBub2RlX21vdmUpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IHsgdHlwZTogXCJhcnJheVwiLCBpdGVtczogeyB0eXBlOiBcInN0cmluZ1wiIH0sIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRChzKSB0byBtb3ZlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5ldyBwYXJlbnQgbm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJLZWVwIHdvcmxkIHBvc2l0aW9uIChkZWZhdWx0IGZhbHNlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZHNcIiwgXCJwYXJlbnRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X25vZGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBhIGZ1bGwgcHJvcGVydHkgZHVtcCBvZiBhIG5vZGUgKGFsbCBzZXJpYWxpemVkIGRhdGEpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X2NvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGEgZnVsbCBwcm9wZXJ0eSBkdW1wIG9mIGEgY29tcG9uZW50IGJ5IGl0cyBVVUlELlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgVVVJRFwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfc2NlbmVfYm91bmRzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGhlIGJvdW5kaW5nIHJlY3Qgb2YgdGhlIGN1cnJlbnQgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2V4ZWN1dGVfc2NyaXB0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoYXJncy5tZXRob2QsIGFyZ3MuYXJncyB8fCBbXSkpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NuYXBzaG90XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNuYXBzaG90XCIpKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9kaXJ0eVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlydHkgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1kaXJ0eVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBkaXJ0eSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9jbGFzc2VzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktY2xhc3Nlc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBjbGFzc2VzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X2NvbXBvbmVudHNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktY29tcG9uZW50c1wiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNvbXBvbmVudHM6IGNvbXBzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X25vZGVfdHJlZVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHJlZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGUtdHJlZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB0cmVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X25vZGVzX2J5X2Fzc2V0XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGVzLWJ5LWFzc2V0LXV1aWRcIiwgYXJncy5hc3NldFV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGVzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NvZnRfcmVsb2FkXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic29mdC1yZWxvYWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9yZXNldF9ub2RlX3RyYW5zZm9ybVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0VHJhbnNmb3JtKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfY29weV9ub2RlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY29weS1ub2RlXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Bhc3RlX25vZGVcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInBhc3RlLW5vZGVcIiwgYXJncy5wYXJlbnRVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwibmV3LXNjZW5lXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtc2cgPSBlPy5tZXNzYWdlIHx8IFN0cmluZyhlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29jb3MgQ3JlYXRvciAzLjgueCBkb2VzIG5vdCBleHBvc2UgdGhlIHNjZW5lOm5ldy1zY2VuZSBtZXNzYWdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtc2cuaW5jbHVkZXMoXCJNZXNzYWdlIGRvZXMgbm90IGV4aXN0XCIpIHx8IG1zZy5pbmNsdWRlcyhcInNjZW5lIC0gbmV3LXNjZW5lXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic2NlbmVfY3JlYXRlIGlzIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBDb2NvcyBDcmVhdG9yIHZlcnNpb24gXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiKHNjZW5lOm5ldy1zY2VuZSBtZXNzYWdlIGlzIHVuYXZhaWxhYmxlKS4gXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiV29ya2Fyb3VuZDogd3JpdGUgYSAuc2NlbmUgSlNPTiBmaWxlIGRpcmVjdGx5IHRvIGRiOi8vYXNzZXRzLyBhbmQgXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2FsbCBwcm9qZWN0X3JlZnJlc2hfYXNzZXRzIHRvIGxldCB0aGUgZWRpdG9yIHBpY2sgaXQgdXAuIFwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlNlZTogaHR0cHM6Ly9naXRodWIuY29tL2hhcmFkeS9jb2Nvcy1jcmVhdG9yLW1jcC9pc3N1ZXMvMTNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycihtc2cpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9jdXRfbm9kZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImN1dC1ub2RlXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Jlc2V0X3Byb3BlcnR5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVzZXQtcHJvcGVydHlcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Jlc2V0X2NvbXBvbmVudFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJlc2V0LWNvbXBvbmVudFwiLCB7IHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZXhlY3V0ZS1jb21wb25lbnQtbWV0aG9kXCIsIHsgdXVpZDogYXJncy51dWlkLCBuYW1lOiBhcmdzLm1ldGhvZCwgYXJnczogYXJncy5hcmdzIHx8IFtdIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9tb3ZlX2FycmF5X2VsZW1lbnRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJtb3ZlLWFycmF5LWVsZW1lbnRcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCwgdGFyZ2V0OiBhcmdzLnRhcmdldCwgb2Zmc2V0OiBhcmdzLm9mZnNldCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3JlbW92ZV9hcnJheV9lbGVtZW50XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVtb3ZlLWFycmF5LWVsZW1lbnRcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCwgaW5kZXg6IGFyZ3MuaW5kZXggfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zbmFwc2hvdF9hYm9ydFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNuYXBzaG90LWFib3J0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfcmVhZHlcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlYWR5ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktaXMtcmVhZHlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVhZHkgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY29tcG9uZW50X2hhc19zY3JpcHRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc1NjcmlwdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudC1oYXMtc2NyaXB0XCIsIGFyZ3MubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbmFtZTogYXJncy5uYW1lLCBoYXNTY3JpcHQgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcmVzdG9yZV9wcmVmYWJcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZXN0b3JlLXByZWZhYlwiLCB7IHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkOiBhcmdzLnV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfYmVnaW5fdW5kb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImJlZ2luLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2VuZF91bmRvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZW5kLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2NhbmNlbF91bmRvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY2FuY2VsLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NhdmVfYXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNhdmUtYXMtc2NlbmVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NldF9wYXJlbnRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzZXQtcGFyZW50XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBhcmdzLnBhcmVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IGFyZ3MudXVpZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogYXJncy5rZWVwV29ybGRUcmFuc2Zvcm0gfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9ub2RlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktbm9kZVwiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGU6IGR1bXAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY29tcG9uZW50XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktY29tcG9uZW50XCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY29tcG9uZW50OiBkdW1wIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X3NjZW5lX2JvdW5kc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYm91bmRzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktc2NlbmUtYm91bmRzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGJvdW5kcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVzZXRUcmFuc2Zvcm0odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJwb3NpdGlvblwiLCB7IHg6IDAsIHk6IDAsIHo6IDAgfV0pO1xyXG4gICAgICAgIGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwicm90YXRpb25cIiwgeyB4OiAwLCB5OiAwLCB6OiAwIH1dKTtcclxuICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInNjYWxlXCIsIHsgeDogMSwgeTogMSwgejogMSB9XSk7XHJcbiAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=