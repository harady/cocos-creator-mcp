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
                description: "Create a new empty 2D scene. If path is omitted, uses the editor's built-in new-scene command (may not work on CC 3.8.x). If path is specified, creates a .scene file via asset-db as a fallback.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "Scene asset path (e.g. 'db://assets/scenes/NewScene.scene'). If omitted, uses editor's new-scene command." },
                    },
                },
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
                    return this.createScene(args.path);
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
    async createScene(path) {
        // まず scene:new-scene を試行（path 未指定時のみ）
        if (!path) {
            try {
                await Editor.Message.request("scene", "new-scene");
                return (0, tool_base_1.ok)({ success: true });
            }
            catch (e) {
                const msg = (e === null || e === void 0 ? void 0 : e.message) || String(e);
                if (msg.includes("Message does not exist") || msg.includes("scene - new-scene")) {
                    // CC 3.8.x → asset-db fallback にフォール
                    const fallbackPath = await this.generateAvailableScenePath();
                    return this.createSceneViaAssetDb(fallbackPath);
                }
                return (0, tool_base_1.err)(msg);
            }
        }
        // path 指定 → asset-db fallback
        return this.createSceneViaAssetDb(path);
    }
    async generateAvailableScenePath() {
        const basePath = "db://assets/NewScene.scene";
        try {
            const result = await Editor.Message.request("asset-db", "generate-available-url", basePath);
            if (result)
                return result;
        }
        catch ( /* fallback */_a) { /* fallback */ }
        return `db://assets/NewScene_${Date.now()}.scene`;
    }
    async createSceneViaAssetDb(path) {
        try {
            if (!path.endsWith(".scene"))
                path += ".scene";
            const sceneName = path.split("/").pop().replace(".scene", "");
            const uid = () => { var _a, _b; return (_b = (_a = crypto.randomUUID) === null || _a === void 0 ? void 0 : _a.call(crypto)) !== null && _b !== void 0 ? _b : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; };
            const sid = () => {
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                let s = "";
                for (let i = 0; i < 21; i++)
                    s += chars[Math.floor(Math.random() * chars.length)];
                return s;
            };
            const sceneJson = this.buildMinimalSceneJson(sceneName, uid, sid);
            const content = JSON.stringify(sceneJson, null, 2);
            await Editor.Message.request("asset-db", "create-asset", path, content);
            // シーンを開く
            try {
                const queryResult = await Editor.Message.request("asset-db", "query-uuid", path);
                if (queryResult) {
                    await Editor.Message.request("scene", "open-scene", queryResult);
                }
            }
            catch ( /* open failure is not critical */_a) { /* open failure is not critical */ }
            return (0, tool_base_1.ok)({ success: true, path, method: "asset-db-fallback" });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    buildMinimalSceneJson(name, uid, sid) {
        const sceneId = uid();
        const canvasNodeId = sid();
        const cameraNodeId = sid();
        const vec3 = (x, y, z) => ({ __type__: "cc.Vec3", x, y, z });
        const quat = () => ({ __type__: "cc.Quat", x: 0, y: 0, z: 0, w: 1 });
        return [
            // [0] SceneAsset
            {
                __type__: "cc.SceneAsset",
                _name: name,
                _objFlags: 0,
                __editorExtras__: {},
                _native: "",
                scene: { __id__: 1 },
            },
            // [1] Scene
            {
                __type__: "cc.Scene",
                _name: name,
                _objFlags: 0,
                __editorExtras__: {},
                _parent: null,
                _children: [{ __id__: 2 }],
                _active: true,
                _components: [],
                _prefab: null,
                _lpos: vec3(0, 0, 0),
                _lrot: quat(),
                _lscale: vec3(1, 1, 1),
                _mobility: 0,
                _layer: 1073741824,
                _euler: vec3(0, 0, 0),
                autoReleaseAssets: false,
                _globals: { __id__: 10 },
                _id: sceneId,
            },
            // [2] Canvas node
            {
                __type__: "cc.Node",
                _name: "Canvas",
                _objFlags: 0,
                __editorExtras__: {},
                _parent: { __id__: 1 },
                _children: [{ __id__: 3 }],
                _active: true,
                _components: [{ __id__: 5 }, { __id__: 6 }, { __id__: 7 }],
                _prefab: null,
                _lpos: vec3(0, 0, 0),
                _lrot: quat(),
                _lscale: vec3(1, 1, 1),
                _mobility: 0,
                _layer: 33554432,
                _euler: vec3(0, 0, 0),
                _id: canvasNodeId,
            },
            // [3] Camera node
            {
                __type__: "cc.Node",
                _name: "Camera",
                _objFlags: 0,
                __editorExtras__: {},
                _parent: { __id__: 2 },
                _children: [],
                _active: true,
                _components: [{ __id__: 4 }],
                _prefab: null,
                _lpos: vec3(0, 0, 1000),
                _lrot: quat(),
                _lscale: vec3(1, 1, 1),
                _mobility: 0,
                _layer: 1073741824,
                _euler: vec3(0, 0, 0),
                _id: cameraNodeId,
            },
            // [4] Camera component
            {
                __type__: "cc.Camera",
                _name: "",
                _objFlags: 0,
                __editorExtras__: {},
                node: { __id__: 3 },
                _enabled: true,
                _projection: 1,
                _priority: 0,
                _fov: 45,
                _fovAxis: 0,
                _orthoHeight: 10,
                _near: 1,
                _far: 2000,
                _color: { __type__: "cc.Color", r: 0, g: 0, b: 0, a: 255 },
                _depth: 1,
                _stencil: 0,
                _clearFlags: 6,
                _rect: { __type__: "cc.Rect", x: 0, y: 0, width: 1, height: 1 },
                _visibility: 1108344832,
                _id: "",
            },
            // [5] UITransform on Canvas
            {
                __type__: "cc.UITransform",
                _name: "",
                _objFlags: 0,
                __editorExtras__: {},
                node: { __id__: 2 },
                _enabled: true,
                _contentSize: { __type__: "cc.Size", width: 720, height: 1280 },
                _anchorPoint: { __type__: "cc.Vec2", x: 0.5, y: 0.5 },
                _id: "",
            },
            // [6] Canvas component
            {
                __type__: "cc.Canvas",
                _name: "",
                _objFlags: 0,
                __editorExtras__: {},
                node: { __id__: 2 },
                _enabled: true,
                _cameraComponent: { __id__: 4 },
                _alignCanvasWithScreen: true,
                _id: "",
            },
            // [7] Widget on Canvas (fullscreen)
            {
                __type__: "cc.Widget",
                _name: "",
                _objFlags: 0,
                __editorExtras__: {},
                node: { __id__: 2 },
                _enabled: true,
                _alignFlags: 45,
                _target: null,
                _left: 0,
                _right: 0,
                _top: 0,
                _bottom: 0,
                _isAbsLeft: true,
                _isAbsRight: true,
                _isAbsTop: true,
                _isAbsBottom: true,
                _originalWidth: 0,
                _originalHeight: 0,
                _id: "",
            },
            // [8] cc.PrefabInfo for scene
            // [9] (reserved)
            // [10] SceneGlobals
            {
                __type__: "cc.SceneGlobals",
                ambient: { __id__: 11 },
                shadows: { __id__: 12 },
                _skybox: { __id__: 13 },
                fog: { __id__: 14 },
            },
            // [11] AmbientInfo
            { __type__: "cc.AmbientInfo", _skyLightingColor: { __type__: "cc.Vec4", x: 0.2, y: 0.2, z: 0.2, w: 1 } },
            // [12] ShadowsInfo
            { __type__: "cc.ShadowsInfo" },
            // [13] SkyboxInfo
            { __type__: "cc.SkyboxInfo" },
            // [14] FogInfo
            { __type__: "cc.FogInfo" },
        ];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBRXZDLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBRXJDLE1BQWEsa0JBQWtCO0lBQS9CO1FBQ2EsaUJBQVksR0FBRyxlQUFlLENBQUM7SUE2bUI1QyxDQUFDO0lBM21CRyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxzQkFBc0I7Z0JBQzVCLFdBQVcsRUFBRSx1REFBdUQ7Z0JBQ3BFLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsMEJBQTBCLEVBQUU7d0JBQ25FLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7cUJBQ3ZFO29CQUNELFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQztpQkFDdkI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLFdBQVcsRUFBRSx3REFBd0Q7Z0JBQ3JFLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTthQUNsRDtZQUNEO2dCQUNJLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLFdBQVcsRUFBRSxpREFBaUQ7Z0JBQzlELFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTthQUNsRDtZQUNEO2dCQUNJLElBQUksRUFBRSxxQkFBcUI7Z0JBQzNCLFdBQVcsRUFBRSxxREFBcUQ7Z0JBQ2xFLFdBQVcsRUFBRSxFQUFFLElBQUksRUFB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RTthQUNWO1lBQ0QsOEJBQThCO1lBQzlCLGlCQUFpQjtZQUNqQixvQkFBb0I7WUFDcEI7Z0JBQ0ksUUFBUSxFQUFFLGlCQUFpQjtnQkFDM0IsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtnQkFDdkIsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtnQkFDdkIsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtnQkFDdkIsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTthQUN0QjtZQUNELG1CQUFtQjtZQUNuQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hHLG1CQUFtQjtZQUNuQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRTtZQUM5QixrQkFBa0I7WUFDbEIsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFO1lBQzdCLGVBQWU7WUFDZixFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUU7U0FDN0IsQ0FBQztJQUNOLENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQWMsRUFBRSxJQUFXO1FBQ2pELE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFO1lBQzNELElBQUksRUFBRSxRQUFRO1lBQ2QsTUFBTTtZQUNOLElBQUk7U0FDUCxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUE5bUJELGdEQThtQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBUb29sUmVzdWx0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XHJcbmltcG9ydCB7IG9rLCBlcnIgfSBmcm9tIFwiLi4vdG9vbC1iYXNlXCI7XHJcblxyXG5jb25zdCBFWFRfTkFNRSA9IFwiY29jb3MtY3JlYXRvci1tY3BcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTY2VuZUFkdmFuY2VkVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJzY2VuZUFkdmFuY2VkXCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9leGVjdXRlX3NjcmlwdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRXhlY3V0ZSBhIHNjZW5lIHNjcmlwdCBtZXRob2QgYnkgbmFtZSB3aXRoIGFyZ3VtZW50cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTY2VuZSBzY3JpcHQgbWV0aG9kIG5hbWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7IHR5cGU6IFwiYXJyYXlcIiwgZGVzY3JpcHRpb246IFwiQXJndW1lbnRzIHRvIHBhc3NcIiwgaXRlbXM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibWV0aG9kXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zbmFwc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGFrZSBhIHNuYXBzaG90IG9mIHRoZSBjdXJyZW50IHNjZW5lIHN0YXRlIChmb3IgdW5kbykuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X2RpcnR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDaGVjayBpZiB0aGUgY3VycmVudCBzY2VuZSBoYXMgdW5zYXZlZCBjaGFuZ2VzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9jbGFzc2VzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJRdWVyeSBhbGwgYXZhaWxhYmxlIGNvbXBvbmVudCBjbGFzc2VzIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfY29tcG9uZW50c1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUXVlcnkgYXZhaWxhYmxlIGNvbXBvbmVudHMgZm9yIGEgZ2l2ZW4gbm9kZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9ub2RlX3RyZWVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlF1ZXJ5IHRoZSByYXcgbm9kZSB0cmVlIGZyb20gdGhlIGVkaXRvciAoYWx0ZXJuYXRpdmUgdG8gc2NlbmVfZ2V0X2hpZXJhcmNoeSkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X25vZGVzX2J5X2Fzc2V0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJGaW5kIGFsbCBub2RlcyB0aGF0IHJlZmVyZW5jZSBhIGdpdmVuIGFzc2V0IFVVSUQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXNzZXQgVVVJRCB0byBzZWFyY2ggZm9yXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJhc3NldFV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NvZnRfcmVsb2FkXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTb2Z0IHJlbG9hZCB0aGUgY3VycmVudCBzY2VuZSB3aXRob3V0IGxvc2luZyBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcmVzZXRfbm9kZV90cmFuc2Zvcm1cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlc2V0IGEgbm9kZSdzIHRyYW5zZm9ybSB0byBkZWZhdWx0IChwb3NpdGlvbiAwLDAsMCAvIHJvdGF0aW9uIDAsMCwwIC8gc2NhbGUgMSwxLDEpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2NvcHlfbm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ29weSBhIG5vZGUgdG8gY2xpcGJvYXJkLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3Bhc3RlX25vZGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlBhc3RlIG5vZGUgZnJvbSBjbGlwYm9hcmQgdW5kZXIgYSBwYXJlbnQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlBhcmVudCBub2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhcmVudFV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2NyZWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3JlYXRlIGEgbmV3IGVtcHR5IDJEIHNjZW5lLiBJZiBwYXRoIGlzIG9taXR0ZWQsIHVzZXMgdGhlIGVkaXRvcidzIGJ1aWx0LWluIG5ldy1zY2VuZSBjb21tYW5kIChtYXkgbm90IHdvcmsgb24gQ0MgMy44LngpLiBJZiBwYXRoIGlzIHNwZWNpZmllZCwgY3JlYXRlcyBhIC5zY2VuZSBmaWxlIHZpYSBhc3NldC1kYiBhcyBhIGZhbGxiYWNrLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTY2VuZSBhc3NldCBwYXRoIChlLmcuICdkYjovL2Fzc2V0cy9zY2VuZXMvTmV3U2NlbmUuc2NlbmUnKS4gSWYgb21pdHRlZCwgdXNlcyBlZGl0b3IncyBuZXctc2NlbmUgY29tbWFuZC5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2N1dF9ub2RlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDdXQgYSBub2RlIHRvIGNsaXBib2FyZCAocmVtb3ZlcyBmcm9tIHNjZW5lKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9yZXNldF9wcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVzZXQgYSBzcGVjaWZpYyBwcm9wZXJ0eSBvbiBhIG5vZGUgb3IgY29tcG9uZW50IHRvIGl0cyBkZWZhdWx0IHZhbHVlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIG9yIGNvbXBvbmVudCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcm9wZXJ0eSBwYXRoIChlLmcuICdwb3NpdGlvbicsICdjb2xvcicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcmVzZXRfY29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXNldCBhIGNvbXBvbmVudCB0byBpdHMgZGVmYXVsdCBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSURcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2FsbCBhIG1ldGhvZCBvbiBhIGNvbXBvbmVudCBhdCBlZGl0LXRpbWUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk1ldGhvZCBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogeyB0eXBlOiBcImFycmF5XCIsIGRlc2NyaXB0aW9uOiBcIk1ldGhvZCBhcmd1bWVudHNcIiwgaXRlbXM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcIm1ldGhvZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfbW92ZV9hcnJheV9lbGVtZW50XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJNb3ZlIGFuIGFycmF5IGVsZW1lbnQgdG8gYSBuZXcgcG9zaXRpb24gaW4gYSBwcm9wZXJ0eS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBvciBjb21wb25lbnQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXJyYXkgcHJvcGVydHkgcGF0aFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJDdXJyZW50IGluZGV4XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1vdmUgb2Zmc2V0ICgrMSA9IGRvd24sIC0xID0gdXApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiLCBcInRhcmdldFwiLCBcIm9mZnNldFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcmVtb3ZlX2FycmF5X2VsZW1lbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlbW92ZSBhbiBlbGVtZW50IGZyb20gYW4gYXJyYXkgcHJvcGVydHkgYnkgaW5kZXguXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgb3IgY29tcG9uZW50IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkFycmF5IHByb3BlcnR5IHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJJbmRleCB0byByZW1vdmVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJwYXRoXCIsIFwiaW5kZXhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NuYXBzaG90X2Fib3J0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBYm9ydCB0aGUgY3VycmVudCB1bmRvIHNuYXBzaG90LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9yZWFkeVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2sgaWYgdGhlIHNjZW5lIGlzIGZ1bGx5IGxvYWRlZCBhbmQgcmVhZHkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDaGVjayBpZiBhIGNvbXBvbmVudCBoYXMgYW4gYXNzb2NpYXRlZCBzY3JpcHQgZmlsZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IG5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IGNsYXNzIG5hbWVcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcIm5hbWVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3Jlc3RvcmVfcHJlZmFiXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXN0b3JlIGEgcHJlZmFiIG5vZGUgdG8gaXRzIG9yaWdpbmFsIHByZWZhYiBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9iZWdpbl91bmRvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJCZWdpbiByZWNvcmRpbmcgdW5kbyBvcGVyYXRpb25zLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9lbmRfdW5kb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRW5kIHVuZG8gcmVjb3JkaW5nIGFuZCBzYXZlIHRoZSB1bmRvIHN0ZXAuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2NhbmNlbF91bmRvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDYW5jZWwgdGhlIGN1cnJlbnQgdW5kbyByZWNvcmRpbmcuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NhdmVfYXNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNhdmUgdGhlIGN1cnJlbnQgc2NlbmUgdG8gYSBuZXcgZmlsZSAoc2hvd3Mgc2F2ZSBkaWFsb2cpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8g4pSA4pSAIOS7peS4i+OAgeaXouWtmE1DUOacquWvvuW/nOOBrkVkaXRvciBBUEkg4pSA4pSAXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfc2V0X3BhcmVudFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVwYXJlbnQgbm9kZShzKSB1c2luZyB0aGUgb2ZmaWNpYWwgRWRpdG9yIEFQSSAoYWx0ZXJuYXRpdmUgdG8gbm9kZV9tb3ZlKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWRzOiB7IHR5cGU6IFwiYXJyYXlcIiwgaXRlbXM6IHsgdHlwZTogXCJzdHJpbmdcIiB9LCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQocykgdG8gbW92ZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOZXcgcGFyZW50IG5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiS2VlcCB3b3JsZCBwb3NpdGlvbiAoZGVmYXVsdCBmYWxzZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRzXCIsIFwicGFyZW50XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9ub2RlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgYSBmdWxsIHByb3BlcnR5IGR1bXAgb2YgYSBub2RlIChhbGwgc2VyaWFsaXplZCBkYXRhKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9jb21wb25lbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBhIGZ1bGwgcHJvcGVydHkgZHVtcCBvZiBhIGNvbXBvbmVudCBieSBpdHMgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSURcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X3NjZW5lX2JvdW5kc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IHRoZSBib3VuZGluZyByZWN0IG9mIHRoZSBjdXJyZW50IHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9leGVjdXRlX3NjcmlwdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayhhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KGFyZ3MubWV0aG9kLCBhcmdzLmFyZ3MgfHwgW10pKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zbmFwc2hvdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayhhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzbmFwc2hvdFwiKSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfZGlydHlcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpcnR5ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktZGlydHlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZGlydHkgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY2xhc3Nlc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNsYXNzZXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY2xhc3NlcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9jb21wb25lbnRzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudHNcIiwgYXJncy51dWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBjb21wb25lbnRzOiBjb21wcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9ub2RlX3RyZWVcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlLXRyZWVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdHJlZSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9ub2Rlc19ieV9hc3NldFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2Rlcy1ieS1hc3NldC11dWlkXCIsIGFyZ3MuYXNzZXRVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zb2Z0X3JlbG9hZFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNvZnQtcmVsb2FkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcmVzZXRfbm9kZV90cmFuc2Zvcm1cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXNldFRyYW5zZm9ybShhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2NvcHlfbm9kZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImNvcHktbm9kZVwiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9wYXN0ZV9ub2RlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJwYXN0ZS1ub2RlXCIsIGFyZ3MucGFyZW50VXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2NyZWF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjZW5lKGFyZ3MucGF0aCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfY3V0X25vZGVcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjdXQtbm9kZVwiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9yZXNldF9wcm9wZXJ0eVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJlc2V0LXByb3BlcnR5XCIsIHsgdXVpZDogYXJncy51dWlkLCBwYXRoOiBhcmdzLnBhdGggfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9yZXNldF9jb21wb25lbnRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZXNldC1jb21wb25lbnRcIiwgeyB1dWlkOiBhcmdzLnV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9leGVjdXRlX2NvbXBvbmVudF9tZXRob2RcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImV4ZWN1dGUtY29tcG9uZW50LW1ldGhvZFwiLCB7IHV1aWQ6IGFyZ3MudXVpZCwgbmFtZTogYXJncy5tZXRob2QsIGFyZ3M6IGFyZ3MuYXJncyB8fCBbXSB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfbW92ZV9hcnJheV9lbGVtZW50XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwibW92ZS1hcnJheS1lbGVtZW50XCIsIHsgdXVpZDogYXJncy51dWlkLCBwYXRoOiBhcmdzLnBhdGgsIHRhcmdldDogYXJncy50YXJnZXQsIG9mZnNldDogYXJncy5vZmZzZXQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9yZW1vdmVfYXJyYXlfZWxlbWVudFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJlbW92ZS1hcnJheS1lbGVtZW50XCIsIHsgdXVpZDogYXJncy51dWlkLCBwYXRoOiBhcmdzLnBhdGgsIGluZGV4OiBhcmdzLmluZGV4IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfc25hcHNob3RfYWJvcnRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzbmFwc2hvdC1hYm9ydFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X3JlYWR5XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWFkeSA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWlzLXJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlYWR5IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBoYXNTY3JpcHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jb21wb25lbnQtaGFzLXNjcmlwdFwiLCBhcmdzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5hbWU6IGFyZ3MubmFtZSwgaGFzU2NyaXB0IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Jlc3RvcmVfcHJlZmFiXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVzdG9yZS1wcmVmYWJcIiwgeyB1dWlkOiBhcmdzLnV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2JlZ2luX3VuZG9cIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJiZWdpbi1yZWNvcmRpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9lbmRfdW5kb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImVuZC1yZWNvcmRpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9jYW5jZWxfdW5kb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImNhbmNlbC1yZWNvcmRpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zYXZlX2FzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzYXZlLWFzLXNjZW5lXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zZXRfcGFyZW50XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2V0LXBhcmVudFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogYXJncy5wYXJlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWRzOiBhcmdzLnV1aWRzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm06IGFyZ3Mua2VlcFdvcmxkVHJhbnNmb3JtIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfbm9kZVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGVcIiwgYXJncy51dWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlOiBkdW1wIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X2NvbXBvbmVudFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudFwiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNvbXBvbmVudDogZHVtcCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9zY2VuZV9ib3VuZHNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJvdW5kcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LXNjZW5lLWJvdW5kc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBib3VuZHMgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJlc2V0VHJhbnNmb3JtKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwicG9zaXRpb25cIiwgeyB4OiAwLCB5OiAwLCB6OiAwIH1dKTtcclxuICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInJvdGF0aW9uXCIsIHsgeDogMCwgeTogMCwgejogMCB9XSk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJzY2FsZVwiLCB7IHg6IDEsIHk6IDEsIHo6IDEgfV0pO1xyXG4gICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTY2VuZShwYXRoPzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgLy8g44G+44GaIHNjZW5lOm5ldy1zY2VuZSDjgpLoqabooYzvvIhwYXRoIOacquaMh+WumuaZguOBruOBv++8iVxyXG4gICAgICAgIGlmICghcGF0aCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwibmV3LXNjZW5lXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtc2cgPSBlPy5tZXNzYWdlIHx8IFN0cmluZyhlKTtcclxuICAgICAgICAgICAgICAgIGlmIChtc2cuaW5jbHVkZXMoXCJNZXNzYWdlIGRvZXMgbm90IGV4aXN0XCIpIHx8IG1zZy5pbmNsdWRlcyhcInNjZW5lIC0gbmV3LXNjZW5lXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ0MgMy44Lngg4oaSIGFzc2V0LWRiIGZhbGxiYWNrIOOBq+ODleOCqeODvOODq1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrUGF0aCA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVBdmFpbGFibGVTY2VuZVBhdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2VuZVZpYUFzc2V0RGIoZmFsbGJhY2tQYXRoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIobXNnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcGF0aCDmjIflrpog4oaSIGFzc2V0LWRiIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NlbmVWaWFBc3NldERiKHBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVBdmFpbGFibGVTY2VuZVBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICBjb25zdCBiYXNlUGF0aCA9IFwiZGI6Ly9hc3NldHMvTmV3U2NlbmUuc2NlbmVcIjtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJnZW5lcmF0ZS1hdmFpbGFibGUtdXJsXCIsIGJhc2VQYXRoKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCkgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9IGNhdGNoIHsgLyogZmFsbGJhY2sgKi8gfVxyXG4gICAgICAgIHJldHVybiBgZGI6Ly9hc3NldHMvTmV3U2NlbmVfJHtEYXRlLm5vdygpfS5zY2VuZWA7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTY2VuZVZpYUFzc2V0RGIocGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKCFwYXRoLmVuZHNXaXRoKFwiLnNjZW5lXCIpKSBwYXRoICs9IFwiLnNjZW5lXCI7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzY2VuZU5hbWUgPSBwYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSEucmVwbGFjZShcIi5zY2VuZVwiLCBcIlwiKTtcclxuICAgICAgICAgICAgY29uc3QgdWlkID0gKCkgPT4gY3J5cHRvLnJhbmRvbVVVSUQ/LigpID8/IGAke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgMTApfWA7XHJcbiAgICAgICAgICAgIGNvbnN0IHNpZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoYXJzID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OVwiO1xyXG4gICAgICAgICAgICAgICAgbGV0IHMgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyMTsgaSsrKSBzICs9IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzY2VuZUpzb24gPSB0aGlzLmJ1aWxkTWluaW1hbFNjZW5lSnNvbihzY2VuZU5hbWUsIHVpZCwgc2lkKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IEpTT04uc3RyaW5naWZ5KHNjZW5lSnNvbiwgbnVsbCwgMik7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJjcmVhdGUtYXNzZXRcIiwgcGF0aCwgY29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAvLyDjgrfjg7zjg7PjgpLplovjgY9cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5UmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktdXVpZFwiLCBwYXRoKTtcclxuICAgICAgICAgICAgICAgIGlmIChxdWVyeVJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcIm9wZW4tc2NlbmVcIiwgcXVlcnlSZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogb3BlbiBmYWlsdXJlIGlzIG5vdCBjcml0aWNhbCAqLyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwYXRoLCBtZXRob2Q6IFwiYXNzZXQtZGItZmFsbGJhY2tcIiB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBidWlsZE1pbmltYWxTY2VuZUpzb24obmFtZTogc3RyaW5nLCB1aWQ6ICgpID0+IHN0cmluZywgc2lkOiAoKSA9PiBzdHJpbmcpOiBhbnlbXSB7XHJcbiAgICAgICAgY29uc3Qgc2NlbmVJZCA9IHVpZCgpO1xyXG4gICAgICAgIGNvbnN0IGNhbnZhc05vZGVJZCA9IHNpZCgpO1xyXG4gICAgICAgIGNvbnN0IGNhbWVyYU5vZGVJZCA9IHNpZCgpO1xyXG5cclxuICAgICAgICBjb25zdCB2ZWMzID0gKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpID0+ICh7IF9fdHlwZV9fOiBcImNjLlZlYzNcIiwgeCwgeSwgeiB9KTtcclxuICAgICAgICBjb25zdCBxdWF0ID0gKCkgPT4gKHsgX190eXBlX186IFwiY2MuUXVhdFwiLCB4OiAwLCB5OiAwLCB6OiAwLCB3OiAxIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAvLyBbMF0gU2NlbmVBc3NldFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5TY2VuZUFzc2V0XCIsXHJcbiAgICAgICAgICAgICAgICBfbmFtZTogbmFtZSxcclxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcclxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxyXG4gICAgICAgICAgICAgICAgX25hdGl2ZTogXCJcIixcclxuICAgICAgICAgICAgICAgIHNjZW5lOiB7IF9faWRfXzogMSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBbMV0gU2NlbmVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuU2NlbmVcIixcclxuICAgICAgICAgICAgICAgIF9uYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgX29iakZsYWdzOiAwLFxyXG4gICAgICAgICAgICAgICAgX19lZGl0b3JFeHRyYXNfXzoge30sXHJcbiAgICAgICAgICAgICAgICBfcGFyZW50OiBudWxsLFxyXG4gICAgICAgICAgICAgICAgX2NoaWxkcmVuOiBbeyBfX2lkX186IDIgfV0sXHJcbiAgICAgICAgICAgICAgICBfYWN0aXZlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgX2NvbXBvbmVudHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgX3ByZWZhYjogbnVsbCxcclxuICAgICAgICAgICAgICAgIF9scG9zOiB2ZWMzKDAsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgX2xyb3Q6IHF1YXQoKSxcclxuICAgICAgICAgICAgICAgIF9sc2NhbGU6IHZlYzMoMSwgMSwgMSksXHJcbiAgICAgICAgICAgICAgICBfbW9iaWxpdHk6IDAsXHJcbiAgICAgICAgICAgICAgICBfbGF5ZXI6IDEwNzM3NDE4MjQsXHJcbiAgICAgICAgICAgICAgICBfZXVsZXI6IHZlYzMoMCwgMCwgMCksXHJcbiAgICAgICAgICAgICAgICBhdXRvUmVsZWFzZUFzc2V0czogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBfZ2xvYmFsczogeyBfX2lkX186IDEwIH0sXHJcbiAgICAgICAgICAgICAgICBfaWQ6IHNjZW5lSWQsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIFsyXSBDYW52YXMgbm9kZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5Ob2RlXCIsXHJcbiAgICAgICAgICAgICAgICBfbmFtZTogXCJDYW52YXNcIixcclxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcclxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxyXG4gICAgICAgICAgICAgICAgX3BhcmVudDogeyBfX2lkX186IDEgfSxcclxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW3sgX19pZF9fOiAzIH1dLFxyXG4gICAgICAgICAgICAgICAgX2FjdGl2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9jb21wb25lbnRzOiBbeyBfX2lkX186IDUgfSwgeyBfX2lkX186IDYgfSwgeyBfX2lkX186IDcgfV0sXHJcbiAgICAgICAgICAgICAgICBfcHJlZmFiOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgX2xwb3M6IHZlYzMoMCwgMCwgMCksXHJcbiAgICAgICAgICAgICAgICBfbHJvdDogcXVhdCgpLFxyXG4gICAgICAgICAgICAgICAgX2xzY2FsZTogdmVjMygxLCAxLCAxKSxcclxuICAgICAgICAgICAgICAgIF9tb2JpbGl0eTogMCxcclxuICAgICAgICAgICAgICAgIF9sYXllcjogMzM1NTQ0MzIsXHJcbiAgICAgICAgICAgICAgICBfZXVsZXI6IHZlYzMoMCwgMCwgMCksXHJcbiAgICAgICAgICAgICAgICBfaWQ6IGNhbnZhc05vZGVJZCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gWzNdIENhbWVyYSBub2RlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBcImNjLk5vZGVcIixcclxuICAgICAgICAgICAgICAgIF9uYW1lOiBcIkNhbWVyYVwiLFxyXG4gICAgICAgICAgICAgICAgX29iakZsYWdzOiAwLFxyXG4gICAgICAgICAgICAgICAgX19lZGl0b3JFeHRyYXNfXzoge30sXHJcbiAgICAgICAgICAgICAgICBfcGFyZW50OiB7IF9faWRfXzogMiB9LFxyXG4gICAgICAgICAgICAgICAgX2NoaWxkcmVuOiBbXSxcclxuICAgICAgICAgICAgICAgIF9hY3RpdmU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBfY29tcG9uZW50czogW3sgX19pZF9fOiA0IH1dLFxyXG4gICAgICAgICAgICAgICAgX3ByZWZhYjogbnVsbCxcclxuICAgICAgICAgICAgICAgIF9scG9zOiB2ZWMzKDAsIDAsIDEwMDApLFxyXG4gICAgICAgICAgICAgICAgX2xyb3Q6IHF1YXQoKSxcclxuICAgICAgICAgICAgICAgIF9sc2NhbGU6IHZlYzMoMSwgMSwgMSksXHJcbiAgICAgICAgICAgICAgICBfbW9iaWxpdHk6IDAsXHJcbiAgICAgICAgICAgICAgICBfbGF5ZXI6IDEwNzM3NDE4MjQsXHJcbiAgICAgICAgICAgICAgICBfZXVsZXI6IHZlYzMoMCwgMCwgMCksXHJcbiAgICAgICAgICAgICAgICBfaWQ6IGNhbWVyYU5vZGVJZCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gWzRdIENhbWVyYSBjb21wb25lbnRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuQ2FtZXJhXCIsXHJcbiAgICAgICAgICAgICAgICBfbmFtZTogXCJcIixcclxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcclxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxyXG4gICAgICAgICAgICAgICAgbm9kZTogeyBfX2lkX186IDMgfSxcclxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgX3Byb2plY3Rpb246IDEsXHJcbiAgICAgICAgICAgICAgICBfcHJpb3JpdHk6IDAsXHJcbiAgICAgICAgICAgICAgICBfZm92OiA0NSxcclxuICAgICAgICAgICAgICAgIF9mb3ZBeGlzOiAwLFxyXG4gICAgICAgICAgICAgICAgX29ydGhvSGVpZ2h0OiAxMCxcclxuICAgICAgICAgICAgICAgIF9uZWFyOiAxLFxyXG4gICAgICAgICAgICAgICAgX2ZhcjogMjAwMCxcclxuICAgICAgICAgICAgICAgIF9jb2xvcjogeyBfX3R5cGVfXzogXCJjYy5Db2xvclwiLCByOiAwLCBnOiAwLCBiOiAwLCBhOiAyNTUgfSxcclxuICAgICAgICAgICAgICAgIF9kZXB0aDogMSxcclxuICAgICAgICAgICAgICAgIF9zdGVuY2lsOiAwLFxyXG4gICAgICAgICAgICAgICAgX2NsZWFyRmxhZ3M6IDYsXHJcbiAgICAgICAgICAgICAgICBfcmVjdDogeyBfX3R5cGVfXzogXCJjYy5SZWN0XCIsIHg6IDAsIHk6IDAsIHdpZHRoOiAxLCBoZWlnaHQ6IDEgfSxcclxuICAgICAgICAgICAgICAgIF92aXNpYmlsaXR5OiAxMTA4MzQ0ODMyLFxyXG4gICAgICAgICAgICAgICAgX2lkOiBcIlwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBbNV0gVUlUcmFuc2Zvcm0gb24gQ2FudmFzXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBcImNjLlVJVHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICAgICAgICBfbmFtZTogXCJcIixcclxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcclxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxyXG4gICAgICAgICAgICAgICAgbm9kZTogeyBfX2lkX186IDIgfSxcclxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgX2NvbnRlbnRTaXplOiB7IF9fdHlwZV9fOiBcImNjLlNpemVcIiwgd2lkdGg6IDcyMCwgaGVpZ2h0OiAxMjgwIH0sXHJcbiAgICAgICAgICAgICAgICBfYW5jaG9yUG9pbnQ6IHsgX190eXBlX186IFwiY2MuVmVjMlwiLCB4OiAwLjUsIHk6IDAuNSB9LFxyXG4gICAgICAgICAgICAgICAgX2lkOiBcIlwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBbNl0gQ2FudmFzIGNvbXBvbmVudFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5DYW52YXNcIixcclxuICAgICAgICAgICAgICAgIF9uYW1lOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgX29iakZsYWdzOiAwLFxyXG4gICAgICAgICAgICAgICAgX19lZGl0b3JFeHRyYXNfXzoge30sXHJcbiAgICAgICAgICAgICAgICBub2RlOiB7IF9faWRfXzogMiB9LFxyXG4gICAgICAgICAgICAgICAgX2VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBfY2FtZXJhQ29tcG9uZW50OiB7IF9faWRfXzogNCB9LFxyXG4gICAgICAgICAgICAgICAgX2FsaWduQ2FudmFzV2l0aFNjcmVlbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9pZDogXCJcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gWzddIFdpZGdldCBvbiBDYW52YXMgKGZ1bGxzY3JlZW4pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBcImNjLldpZGdldFwiLFxyXG4gICAgICAgICAgICAgICAgX25hbWU6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXHJcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcclxuICAgICAgICAgICAgICAgIG5vZGU6IHsgX19pZF9fOiAyIH0sXHJcbiAgICAgICAgICAgICAgICBfZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9hbGlnbkZsYWdzOiA0NSxcclxuICAgICAgICAgICAgICAgIF90YXJnZXQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBfbGVmdDogMCxcclxuICAgICAgICAgICAgICAgIF9yaWdodDogMCxcclxuICAgICAgICAgICAgICAgIF90b3A6IDAsXHJcbiAgICAgICAgICAgICAgICBfYm90dG9tOiAwLFxyXG4gICAgICAgICAgICAgICAgX2lzQWJzTGVmdDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9pc0Fic1JpZ2h0OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgX2lzQWJzVG9wOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgX2lzQWJzQm90dG9tOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgX29yaWdpbmFsV2lkdGg6IDAsXHJcbiAgICAgICAgICAgICAgICBfb3JpZ2luYWxIZWlnaHQ6IDAsXHJcbiAgICAgICAgICAgICAgICBfaWQ6IFwiXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIFs4XSBjYy5QcmVmYWJJbmZvIGZvciBzY2VuZVxyXG4gICAgICAgICAgICAvLyBbOV0gKHJlc2VydmVkKVxyXG4gICAgICAgICAgICAvLyBbMTBdIFNjZW5lR2xvYmFsc1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5TY2VuZUdsb2JhbHNcIixcclxuICAgICAgICAgICAgICAgIGFtYmllbnQ6IHsgX19pZF9fOiAxMSB9LFxyXG4gICAgICAgICAgICAgICAgc2hhZG93czogeyBfX2lkX186IDEyIH0sXHJcbiAgICAgICAgICAgICAgICBfc2t5Ym94OiB7IF9faWRfXzogMTMgfSxcclxuICAgICAgICAgICAgICAgIGZvZzogeyBfX2lkX186IDE0IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIFsxMV0gQW1iaWVudEluZm9cclxuICAgICAgICAgICAgeyBfX3R5cGVfXzogXCJjYy5BbWJpZW50SW5mb1wiLCBfc2t5TGlnaHRpbmdDb2xvcjogeyBfX3R5cGVfXzogXCJjYy5WZWM0XCIsIHg6IDAuMiwgeTogMC4yLCB6OiAwLjIsIHc6IDEgfSB9LFxyXG4gICAgICAgICAgICAvLyBbMTJdIFNoYWRvd3NJbmZvXHJcbiAgICAgICAgICAgIHsgX190eXBlX186IFwiY2MuU2hhZG93c0luZm9cIiB9LFxyXG4gICAgICAgICAgICAvLyBbMTNdIFNreWJveEluZm9cclxuICAgICAgICAgICAgeyBfX3R5cGVfXzogXCJjYy5Ta3lib3hJbmZvXCIgfSxcclxuICAgICAgICAgICAgLy8gWzE0XSBGb2dJbmZvXHJcbiAgICAgICAgICAgIHsgX190eXBlX186IFwiY2MuRm9nSW5mb1wiIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=