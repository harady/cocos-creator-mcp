"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAdvancedTools = void 0;
const tool_base_1 = require("../tool-base");
const scene_tools_1 = require("./scene-tools");
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
                description: "Create a new empty 2D scene. If path is omitted, uses the editor's built-in new-scene command (may not work on CC 3.8.x). If path is specified, creates a .scene file via asset-db as a fallback. Returns an error if the current scene is dirty and untitled (to avoid modal save dialog); pass force=true to bypass.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "Scene asset path (e.g. 'db://assets/scenes/NewScene.scene'). If omitted, uses editor's new-scene command." },
                        force: { type: "boolean", description: "Skip dirty-scene preflight check (may trigger modal save dialog)" },
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
                    return this.createScene(args.path, !!args.force);
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
    async createScene(path, force = false) {
        // ダイアログ割り込み防止: 現在シーンが dirty かつ untitled の場合は事前エラー
        try {
            await (0, scene_tools_1.ensureSceneSafeToSwitch)(force);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
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
                // ensureSceneSafeToSwitch は createScene 入口で既に通過済みなのでここでは再チェックしない
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
                _alignFlags: 15,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBQ3ZDLCtDQUF3RDtBQUV4RCxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQztBQUVyQyxNQUFhLGtCQUFrQjtJQUEvQjtRQUNhLGlCQUFZLEdBQUcsZUFBZSxDQUFDO0lBbW5CNUMsQ0FBQztJQWpuQkcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsc0JBQXNCO2dCQUM1QixXQUFXLEVBQUUsdURBQXVEO2dCQUNwRSxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLDBCQUEwQixFQUFFO3dCQUNuRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3FCQUN2RTtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ3ZCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixXQUFXLEVBQUUsd0RBQXdEO2dCQUNyRSxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7YUFDbEQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUsbUJBQW1CO2dCQUN6QixXQUFXLEVBQUUsaURBQWlEO2dCQUM5RCxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7YUFDbEQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixXQUFXLEVBQUUscURBQXFEO2dCQUNsRSxXQUFXLEVBQUUs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LEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYyxFQUFFLElBQVc7UUFDakQsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7WUFDM0QsSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNO1lBQ04sSUFBSTtTQUNQLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXBuQkQsZ0RBb25CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuaW1wb3J0IHsgZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2ggfSBmcm9tIFwiLi9zY2VuZS10b29sc1wiO1xyXG5cclxuY29uc3QgRVhUX05BTUUgPSBcImNvY29zLWNyZWF0b3ItbWNwXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgU2NlbmVBZHZhbmNlZFRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwic2NlbmVBZHZhbmNlZFwiO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfZXhlY3V0ZV9zY3JpcHRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkV4ZWN1dGUgYSBzY2VuZSBzY3JpcHQgbWV0aG9kIGJ5IG5hbWUgd2l0aCBhcmd1bWVudHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2NlbmUgc2NyaXB0IG1ldGhvZCBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogeyB0eXBlOiBcImFycmF5XCIsIGRlc2NyaXB0aW9uOiBcIkFyZ3VtZW50cyB0byBwYXNzXCIsIGl0ZW1zOiB7fSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcIm1ldGhvZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfc25hcHNob3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRha2UgYSBzbmFwc2hvdCBvZiB0aGUgY3VycmVudCBzY2VuZSBzdGF0ZSAoZm9yIHVuZG8pLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9kaXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2sgaWYgdGhlIGN1cnJlbnQgc2NlbmUgaGFzIHVuc2F2ZWQgY2hhbmdlcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfY2xhc3Nlc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUXVlcnkgYWxsIGF2YWlsYWJsZSBjb21wb25lbnQgY2xhc3NlcyBpbiB0aGUgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X2NvbXBvbmVudHNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlF1ZXJ5IGF2YWlsYWJsZSBjb21wb25lbnRzIGZvciBhIGdpdmVuIG5vZGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcXVlcnlfbm9kZV90cmVlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJRdWVyeSB0aGUgcmF3IG5vZGUgdHJlZSBmcm9tIHRoZSBlZGl0b3IgKGFsdGVybmF0aXZlIHRvIHNjZW5lX2dldF9oaWVyYXJjaHkpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9ub2Rlc19ieV9hc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRmluZCBhbGwgbm9kZXMgdGhhdCByZWZlcmVuY2UgYSBnaXZlbiBhc3NldCBVVUlELlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkFzc2V0IFVVSUQgdG8gc2VhcmNoIGZvclwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wiYXNzZXRVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zb2Z0X3JlbG9hZFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU29mdCByZWxvYWQgdGhlIGN1cnJlbnQgc2NlbmUgd2l0aG91dCBsb3Npbmcgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3Jlc2V0X25vZGVfdHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXNldCBhIG5vZGUncyB0cmFuc2Zvcm0gdG8gZGVmYXVsdCAocG9zaXRpb24gMCwwLDAgLyByb3RhdGlvbiAwLDAsMCAvIHNjYWxlIDEsMSwxKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9jb3B5X25vZGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNvcHkgYSBub2RlIHRvIGNsaXBib2FyZC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9wYXN0ZV9ub2RlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJQYXN0ZSBub2RlIGZyb20gY2xpcGJvYXJkIHVuZGVyIGEgcGFyZW50LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQYXJlbnQgbm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXJlbnRVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9jcmVhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIG5ldyBlbXB0eSAyRCBzY2VuZS4gSWYgcGF0aCBpcyBvbWl0dGVkLCB1c2VzIHRoZSBlZGl0b3IncyBidWlsdC1pbiBuZXctc2NlbmUgY29tbWFuZCAobWF5IG5vdCB3b3JrIG9uIENDIDMuOC54KS4gSWYgcGF0aCBpcyBzcGVjaWZpZWQsIGNyZWF0ZXMgYSAuc2NlbmUgZmlsZSB2aWEgYXNzZXQtZGIgYXMgYSBmYWxsYmFjay4gUmV0dXJucyBhbiBlcnJvciBpZiB0aGUgY3VycmVudCBzY2VuZSBpcyBkaXJ0eSBhbmQgdW50aXRsZWQgKHRvIGF2b2lkIG1vZGFsIHNhdmUgZGlhbG9nKTsgcGFzcyBmb3JjZT10cnVlIHRvIGJ5cGFzcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2NlbmUgYXNzZXQgcGF0aCAoZS5nLiAnZGI6Ly9hc3NldHMvc2NlbmVzL05ld1NjZW5lLnNjZW5lJykuIElmIG9taXR0ZWQsIHVzZXMgZWRpdG9yJ3MgbmV3LXNjZW5lIGNvbW1hbmQuXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2U6IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIlNraXAgZGlydHktc2NlbmUgcHJlZmxpZ2h0IGNoZWNrIChtYXkgdHJpZ2dlciBtb2RhbCBzYXZlIGRpYWxvZylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2N1dF9ub2RlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDdXQgYSBub2RlIHRvIGNsaXBib2FyZCAocmVtb3ZlcyBmcm9tIHNjZW5lKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9yZXNldF9wcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVzZXQgYSBzcGVjaWZpYyBwcm9wZXJ0eSBvbiBhIG5vZGUgb3IgY29tcG9uZW50IHRvIGl0cyBkZWZhdWx0IHZhbHVlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIG9yIGNvbXBvbmVudCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcm9wZXJ0eSBwYXRoIChlLmcuICdwb3NpdGlvbicsICdjb2xvcicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcmVzZXRfY29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXNldCBhIGNvbXBvbmVudCB0byBpdHMgZGVmYXVsdCBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSURcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2FsbCBhIG1ldGhvZCBvbiBhIGNvbXBvbmVudCBhdCBlZGl0LXRpbWUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk1ldGhvZCBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogeyB0eXBlOiBcImFycmF5XCIsIGRlc2NyaXB0aW9uOiBcIk1ldGhvZCBhcmd1bWVudHNcIiwgaXRlbXM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcIm1ldGhvZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfbW92ZV9hcnJheV9lbGVtZW50XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJNb3ZlIGFuIGFycmF5IGVsZW1lbnQgdG8gYSBuZXcgcG9zaXRpb24gaW4gYSBwcm9wZXJ0eS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBvciBjb21wb25lbnQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXJyYXkgcHJvcGVydHkgcGF0aFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJDdXJyZW50IGluZGV4XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1vdmUgb2Zmc2V0ICgrMSA9IGRvd24sIC0xID0gdXApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiLCBcInRhcmdldFwiLCBcIm9mZnNldFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfcmVtb3ZlX2FycmF5X2VsZW1lbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlbW92ZSBhbiBlbGVtZW50IGZyb20gYW4gYXJyYXkgcHJvcGVydHkgYnkgaW5kZXguXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgb3IgY29tcG9uZW50IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkFycmF5IHByb3BlcnR5IHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJJbmRleCB0byByZW1vdmVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJwYXRoXCIsIFwiaW5kZXhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NuYXBzaG90X2Fib3J0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBYm9ydCB0aGUgY3VycmVudCB1bmRvIHNuYXBzaG90LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9yZWFkeVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2sgaWYgdGhlIHNjZW5lIGlzIGZ1bGx5IGxvYWRlZCBhbmQgcmVhZHkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDaGVjayBpZiBhIGNvbXBvbmVudCBoYXMgYW4gYXNzb2NpYXRlZCBzY3JpcHQgZmlsZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IG5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IGNsYXNzIG5hbWVcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcIm5hbWVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3Jlc3RvcmVfcHJlZmFiXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZXN0b3JlIGEgcHJlZmFiIG5vZGUgdG8gaXRzIG9yaWdpbmFsIHByZWZhYiBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9iZWdpbl91bmRvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJCZWdpbiByZWNvcmRpbmcgdW5kbyBvcGVyYXRpb25zLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9lbmRfdW5kb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRW5kIHVuZG8gcmVjb3JkaW5nIGFuZCBzYXZlIHRoZSB1bmRvIHN0ZXAuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2NhbmNlbF91bmRvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDYW5jZWwgdGhlIGN1cnJlbnQgdW5kbyByZWNvcmRpbmcuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NhdmVfYXNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNhdmUgdGhlIGN1cnJlbnQgc2NlbmUgdG8gYSBuZXcgZmlsZSAoc2hvd3Mgc2F2ZSBkaWFsb2cpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8g4pSA4pSAIOS7peS4i+OAgeaXouWtmE1DUOacquWvvuW/nOOBrkVkaXRvciBBUEkg4pSA4pSAXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfc2V0X3BhcmVudFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVwYXJlbnQgbm9kZShzKSB1c2luZyB0aGUgb2ZmaWNpYWwgRWRpdG9yIEFQSSAoYWx0ZXJuYXRpdmUgdG8gbm9kZV9tb3ZlKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWRzOiB7IHR5cGU6IFwiYXJyYXlcIiwgaXRlbXM6IHsgdHlwZTogXCJzdHJpbmdcIiB9LCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQocykgdG8gbW92ZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOZXcgcGFyZW50IG5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiS2VlcCB3b3JsZCBwb3NpdGlvbiAoZGVmYXVsdCBmYWxzZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRzXCIsIFwicGFyZW50XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9ub2RlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgYSBmdWxsIHByb3BlcnR5IGR1bXAgb2YgYSBub2RlIChhbGwgc2VyaWFsaXplZCBkYXRhKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9xdWVyeV9jb21wb25lbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBhIGZ1bGwgcHJvcGVydHkgZHVtcCBvZiBhIGNvbXBvbmVudCBieSBpdHMgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSURcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5X3NjZW5lX2JvdW5kc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IHRoZSBib3VuZGluZyByZWN0IG9mIHRoZSBjdXJyZW50IHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9leGVjdXRlX3NjcmlwdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayhhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KGFyZ3MubWV0aG9kLCBhcmdzLmFyZ3MgfHwgW10pKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zbmFwc2hvdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayhhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzbmFwc2hvdFwiKSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfZGlydHlcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpcnR5ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktZGlydHlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZGlydHkgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY2xhc3Nlc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNsYXNzZXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY2xhc3NlcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9jb21wb25lbnRzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudHNcIiwgYXJncy51dWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBjb21wb25lbnRzOiBjb21wcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9ub2RlX3RyZWVcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlLXRyZWVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdHJlZSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9ub2Rlc19ieV9hc3NldFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2Rlcy1ieS1hc3NldC11dWlkXCIsIGFyZ3MuYXNzZXRVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zb2Z0X3JlbG9hZFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNvZnQtcmVsb2FkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcmVzZXRfbm9kZV90cmFuc2Zvcm1cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXNldFRyYW5zZm9ybShhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2NvcHlfbm9kZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImNvcHktbm9kZVwiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9wYXN0ZV9ub2RlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJwYXN0ZS1ub2RlXCIsIGFyZ3MucGFyZW50VXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2NyZWF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjZW5lKGFyZ3MucGF0aCwgISFhcmdzLmZvcmNlKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9jdXRfbm9kZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImN1dC1ub2RlXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Jlc2V0X3Byb3BlcnR5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVzZXQtcHJvcGVydHlcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3Jlc2V0X2NvbXBvbmVudFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJlc2V0LWNvbXBvbmVudFwiLCB7IHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZXhlY3V0ZS1jb21wb25lbnQtbWV0aG9kXCIsIHsgdXVpZDogYXJncy51dWlkLCBuYW1lOiBhcmdzLm1ldGhvZCwgYXJnczogYXJncy5hcmdzIHx8IFtdIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9tb3ZlX2FycmF5X2VsZW1lbnRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJtb3ZlLWFycmF5LWVsZW1lbnRcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCwgdGFyZ2V0OiBhcmdzLnRhcmdldCwgb2Zmc2V0OiBhcmdzLm9mZnNldCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3JlbW92ZV9hcnJheV9lbGVtZW50XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVtb3ZlLWFycmF5LWVsZW1lbnRcIiwgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCwgaW5kZXg6IGFyZ3MuaW5kZXggfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zbmFwc2hvdF9hYm9ydFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNuYXBzaG90LWFib3J0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfcmVhZHlcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlYWR5ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktaXMtcmVhZHlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVhZHkgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY29tcG9uZW50X2hhc19zY3JpcHRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc1NjcmlwdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudC1oYXMtc2NyaXB0XCIsIGFyZ3MubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbmFtZTogYXJncy5uYW1lLCBoYXNTY3JpcHQgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcmVzdG9yZV9wcmVmYWJcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZXN0b3JlLXByZWZhYlwiLCB7IHV1aWQ6IGFyZ3MudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkOiBhcmdzLnV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfYmVnaW5fdW5kb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImJlZ2luLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2VuZF91bmRvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZW5kLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2NhbmNlbF91bmRvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY2FuY2VsLXJlY29yZGluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NhdmVfYXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNhdmUtYXMtc2NlbmVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NldF9wYXJlbnRcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzZXQtcGFyZW50XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBhcmdzLnBhcmVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IGFyZ3MudXVpZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogYXJncy5rZWVwV29ybGRUcmFuc2Zvcm0gfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9xdWVyeV9ub2RlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktbm9kZVwiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGU6IGR1bXAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcXVlcnlfY29tcG9uZW50XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktY29tcG9uZW50XCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY29tcG9uZW50OiBkdW1wIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5X3NjZW5lX2JvdW5kc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYm91bmRzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktc2NlbmUtYm91bmRzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGJvdW5kcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVzZXRUcmFuc2Zvcm0odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJwb3NpdGlvblwiLCB7IHg6IDAsIHk6IDAsIHo6IDAgfV0pO1xyXG4gICAgICAgIGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwicm90YXRpb25cIiwgeyB4OiAwLCB5OiAwLCB6OiAwIH1dKTtcclxuICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInNjYWxlXCIsIHsgeDogMSwgeTogMSwgejogMSB9XSk7XHJcbiAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNjZW5lKHBhdGg/OiBzdHJpbmcsIGZvcmNlOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICAvLyDjg4DjgqTjgqLjg63jgrDlibLjgorovrzjgb/pmLLmraI6IOePvuWcqOOCt+ODvOODs+OBjCBkaXJ0eSDjgYvjgaQgdW50aXRsZWQg44Gu5aC05ZCI44Gv5LqL5YmN44Ko44Op44O8XHJcbiAgICAgICAgdHJ5IHsgYXdhaXQgZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2goZm9yY2UpOyB9XHJcbiAgICAgICAgY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcblxyXG4gICAgICAgIC8vIOOBvuOBmiBzY2VuZTpuZXctc2NlbmUg44KS6Kmm6KGM77yIcGF0aCDmnKrmjIflrprmmYLjga7jgb/vvIlcclxuICAgICAgICBpZiAoIXBhdGgpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcIm5ldy1zY2VuZVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbXNnID0gZT8ubWVzc2FnZSB8fCBTdHJpbmcoZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobXNnLmluY2x1ZGVzKFwiTWVzc2FnZSBkb2VzIG5vdCBleGlzdFwiKSB8fCBtc2cuaW5jbHVkZXMoXCJzY2VuZSAtIG5ldy1zY2VuZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENDIDMuOC54IOKGkiBhc3NldC1kYiBmYWxsYmFjayDjgavjg5Xjgqnjg7zjg6tcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmYWxsYmFja1BhdGggPSBhd2FpdCB0aGlzLmdlbmVyYXRlQXZhaWxhYmxlU2NlbmVQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NlbmVWaWFBc3NldERiKGZhbGxiYWNrUGF0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKG1zZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHBhdGgg5oyH5a6aIOKGkiBhc3NldC1kYiBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVNjZW5lVmlhQXNzZXREYihwYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQXZhaWxhYmxlU2NlbmVQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgY29uc3QgYmFzZVBhdGggPSBcImRiOi8vYXNzZXRzL05ld1NjZW5lLnNjZW5lXCI7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwiZ2VuZXJhdGUtYXZhaWxhYmxlLXVybFwiLCBiYXNlUGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfSBjYXRjaCB7IC8qIGZhbGxiYWNrICovIH1cclxuICAgICAgICByZXR1cm4gYGRiOi8vYXNzZXRzL05ld1NjZW5lXyR7RGF0ZS5ub3coKX0uc2NlbmVgO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlU2NlbmVWaWFBc3NldERiKHBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghcGF0aC5lbmRzV2l0aChcIi5zY2VuZVwiKSkgcGF0aCArPSBcIi5zY2VuZVwiO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc2NlbmVOYW1lID0gcGF0aC5zcGxpdChcIi9cIikucG9wKCkhLnJlcGxhY2UoXCIuc2NlbmVcIiwgXCJcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHVpZCA9ICgpID0+IGNyeXB0by5yYW5kb21VVUlEPy4oKSA/PyBgJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDEwKX1gO1xyXG4gICAgICAgICAgICBjb25zdCBzaWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGFycyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlcIjtcclxuICAgICAgICAgICAgICAgIGxldCBzID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjE7IGkrKykgcyArPSBjaGFyc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGgpXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc2NlbmVKc29uID0gdGhpcy5idWlsZE1pbmltYWxTY2VuZUpzb24oc2NlbmVOYW1lLCB1aWQsIHNpZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShzY2VuZUpzb24sIG51bGwsIDIpO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwiY3JlYXRlLWFzc2V0XCIsIHBhdGgsIGNvbnRlbnQpO1xyXG5cclxuICAgICAgICAgICAgLy8g44K344O844Oz44KS6ZaL44GPXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaCDjga8gY3JlYXRlU2NlbmUg5YWl5Y+j44Gn5pei44Gr6YCa6YGO5riI44G/44Gq44Gu44Gn44GT44GT44Gn44Gv5YaN44OB44Kn44OD44Kv44GX44Gq44GEXHJcbiAgICAgICAgICAgICAgICBjb25zdCBxdWVyeVJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LXV1aWRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocXVlcnlSZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJvcGVuLXNjZW5lXCIsIHF1ZXJ5UmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIG9wZW4gZmFpbHVyZSBpcyBub3QgY3JpdGljYWwgKi8gfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcGF0aCwgbWV0aG9kOiBcImFzc2V0LWRiLWZhbGxiYWNrXCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYnVpbGRNaW5pbWFsU2NlbmVKc29uKG5hbWU6IHN0cmluZywgdWlkOiAoKSA9PiBzdHJpbmcsIHNpZDogKCkgPT4gc3RyaW5nKTogYW55W10ge1xyXG4gICAgICAgIGNvbnN0IHNjZW5lSWQgPSB1aWQoKTtcclxuICAgICAgICBjb25zdCBjYW52YXNOb2RlSWQgPSBzaWQoKTtcclxuICAgICAgICBjb25zdCBjYW1lcmFOb2RlSWQgPSBzaWQoKTtcclxuXHJcbiAgICAgICAgY29uc3QgdmVjMyA9ICh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKSA9PiAoeyBfX3R5cGVfXzogXCJjYy5WZWMzXCIsIHgsIHksIHogfSk7XHJcbiAgICAgICAgY29uc3QgcXVhdCA9ICgpID0+ICh7IF9fdHlwZV9fOiBcImNjLlF1YXRcIiwgeDogMCwgeTogMCwgejogMCwgdzogMSB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgLy8gWzBdIFNjZW5lQXNzZXRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuU2NlbmVBc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgX25hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXHJcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcclxuICAgICAgICAgICAgICAgIF9uYXRpdmU6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICBzY2VuZTogeyBfX2lkX186IDEgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gWzFdIFNjZW5lXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBcImNjLlNjZW5lXCIsXHJcbiAgICAgICAgICAgICAgICBfbmFtZTogbmFtZSxcclxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcclxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxyXG4gICAgICAgICAgICAgICAgX3BhcmVudDogbnVsbCxcclxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW3sgX19pZF9fOiAyIH1dLFxyXG4gICAgICAgICAgICAgICAgX2FjdGl2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9jb21wb25lbnRzOiBbXSxcclxuICAgICAgICAgICAgICAgIF9wcmVmYWI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBfbHBvczogdmVjMygwLCAwLCAwKSxcclxuICAgICAgICAgICAgICAgIF9scm90OiBxdWF0KCksXHJcbiAgICAgICAgICAgICAgICBfbHNjYWxlOiB2ZWMzKDEsIDEsIDEpLFxyXG4gICAgICAgICAgICAgICAgX21vYmlsaXR5OiAwLFxyXG4gICAgICAgICAgICAgICAgX2xheWVyOiAxMDczNzQxODI0LFxyXG4gICAgICAgICAgICAgICAgX2V1bGVyOiB2ZWMzKDAsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgYXV0b1JlbGVhc2VBc3NldHM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgX2dsb2JhbHM6IHsgX19pZF9fOiAxMCB9LFxyXG4gICAgICAgICAgICAgICAgX2lkOiBzY2VuZUlkLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBbMl0gQ2FudmFzIG5vZGVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuTm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgX25hbWU6IFwiQ2FudmFzXCIsXHJcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXHJcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcclxuICAgICAgICAgICAgICAgIF9wYXJlbnQ6IHsgX19pZF9fOiAxIH0sXHJcbiAgICAgICAgICAgICAgICBfY2hpbGRyZW46IFt7IF9faWRfXzogMyB9XSxcclxuICAgICAgICAgICAgICAgIF9hY3RpdmU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBfY29tcG9uZW50czogW3sgX19pZF9fOiA1IH0sIHsgX19pZF9fOiA2IH0sIHsgX19pZF9fOiA3IH1dLFxyXG4gICAgICAgICAgICAgICAgX3ByZWZhYjogbnVsbCxcclxuICAgICAgICAgICAgICAgIF9scG9zOiB2ZWMzKDAsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgX2xyb3Q6IHF1YXQoKSxcclxuICAgICAgICAgICAgICAgIF9sc2NhbGU6IHZlYzMoMSwgMSwgMSksXHJcbiAgICAgICAgICAgICAgICBfbW9iaWxpdHk6IDAsXHJcbiAgICAgICAgICAgICAgICBfbGF5ZXI6IDMzNTU0NDMyLFxyXG4gICAgICAgICAgICAgICAgX2V1bGVyOiB2ZWMzKDAsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgX2lkOiBjYW52YXNOb2RlSWQsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIFszXSBDYW1lcmEgbm9kZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5Ob2RlXCIsXHJcbiAgICAgICAgICAgICAgICBfbmFtZTogXCJDYW1lcmFcIixcclxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcclxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxyXG4gICAgICAgICAgICAgICAgX3BhcmVudDogeyBfX2lkX186IDIgfSxcclxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgICAgICBfYWN0aXZlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgX2NvbXBvbmVudHM6IFt7IF9faWRfXzogNCB9XSxcclxuICAgICAgICAgICAgICAgIF9wcmVmYWI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBfbHBvczogdmVjMygwLCAwLCAxMDAwKSxcclxuICAgICAgICAgICAgICAgIF9scm90OiBxdWF0KCksXHJcbiAgICAgICAgICAgICAgICBfbHNjYWxlOiB2ZWMzKDEsIDEsIDEpLFxyXG4gICAgICAgICAgICAgICAgX21vYmlsaXR5OiAwLFxyXG4gICAgICAgICAgICAgICAgX2xheWVyOiAxMDczNzQxODI0LFxyXG4gICAgICAgICAgICAgICAgX2V1bGVyOiB2ZWMzKDAsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgX2lkOiBjYW1lcmFOb2RlSWQsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIFs0XSBDYW1lcmEgY29tcG9uZW50XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBcImNjLkNhbWVyYVwiLFxyXG4gICAgICAgICAgICAgICAgX25hbWU6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXHJcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcclxuICAgICAgICAgICAgICAgIG5vZGU6IHsgX19pZF9fOiAzIH0sXHJcbiAgICAgICAgICAgICAgICBfZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9wcm9qZWN0aW9uOiAxLFxyXG4gICAgICAgICAgICAgICAgX3ByaW9yaXR5OiAwLFxyXG4gICAgICAgICAgICAgICAgX2ZvdjogNDUsXHJcbiAgICAgICAgICAgICAgICBfZm92QXhpczogMCxcclxuICAgICAgICAgICAgICAgIF9vcnRob0hlaWdodDogMTAsXHJcbiAgICAgICAgICAgICAgICBfbmVhcjogMSxcclxuICAgICAgICAgICAgICAgIF9mYXI6IDIwMDAsXHJcbiAgICAgICAgICAgICAgICBfY29sb3I6IHsgX190eXBlX186IFwiY2MuQ29sb3JcIiwgcjogMCwgZzogMCwgYjogMCwgYTogMjU1IH0sXHJcbiAgICAgICAgICAgICAgICBfZGVwdGg6IDEsXHJcbiAgICAgICAgICAgICAgICBfc3RlbmNpbDogMCxcclxuICAgICAgICAgICAgICAgIF9jbGVhckZsYWdzOiA2LFxyXG4gICAgICAgICAgICAgICAgX3JlY3Q6IHsgX190eXBlX186IFwiY2MuUmVjdFwiLCB4OiAwLCB5OiAwLCB3aWR0aDogMSwgaGVpZ2h0OiAxIH0sXHJcbiAgICAgICAgICAgICAgICBfdmlzaWJpbGl0eTogMTEwODM0NDgzMixcclxuICAgICAgICAgICAgICAgIF9pZDogXCJcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gWzVdIFVJVHJhbnNmb3JtIG9uIENhbnZhc1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5VSVRyYW5zZm9ybVwiLFxyXG4gICAgICAgICAgICAgICAgX25hbWU6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXHJcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcclxuICAgICAgICAgICAgICAgIG5vZGU6IHsgX19pZF9fOiAyIH0sXHJcbiAgICAgICAgICAgICAgICBfZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9jb250ZW50U2l6ZTogeyBfX3R5cGVfXzogXCJjYy5TaXplXCIsIHdpZHRoOiA3MjAsIGhlaWdodDogMTI4MCB9LFxyXG4gICAgICAgICAgICAgICAgX2FuY2hvclBvaW50OiB7IF9fdHlwZV9fOiBcImNjLlZlYzJcIiwgeDogMC41LCB5OiAwLjUgfSxcclxuICAgICAgICAgICAgICAgIF9pZDogXCJcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gWzZdIENhbnZhcyBjb21wb25lbnRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuQ2FudmFzXCIsXHJcbiAgICAgICAgICAgICAgICBfbmFtZTogXCJcIixcclxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcclxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxyXG4gICAgICAgICAgICAgICAgbm9kZTogeyBfX2lkX186IDIgfSxcclxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgX2NhbWVyYUNvbXBvbmVudDogeyBfX2lkX186IDQgfSxcclxuICAgICAgICAgICAgICAgIF9hbGlnbkNhbnZhc1dpdGhTY3JlZW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICBfaWQ6IFwiXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIFs3XSBXaWRnZXQgb24gQ2FudmFzIChmdWxsc2NyZWVuKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5XaWRnZXRcIixcclxuICAgICAgICAgICAgICAgIF9uYW1lOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgX29iakZsYWdzOiAwLFxyXG4gICAgICAgICAgICAgICAgX19lZGl0b3JFeHRyYXNfXzoge30sXHJcbiAgICAgICAgICAgICAgICBub2RlOiB7IF9faWRfXzogMiB9LFxyXG4gICAgICAgICAgICAgICAgX2VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBfYWxpZ25GbGFnczogMTUsXHJcbiAgICAgICAgICAgICAgICBfdGFyZ2V0OiBudWxsLFxyXG4gICAgICAgICAgICAgICAgX2xlZnQ6IDAsXHJcbiAgICAgICAgICAgICAgICBfcmlnaHQ6IDAsXHJcbiAgICAgICAgICAgICAgICBfdG9wOiAwLFxyXG4gICAgICAgICAgICAgICAgX2JvdHRvbTogMCxcclxuICAgICAgICAgICAgICAgIF9pc0Fic0xlZnQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBfaXNBYnNSaWdodDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9pc0Fic1RvcDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9pc0Fic0JvdHRvbTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIF9vcmlnaW5hbFdpZHRoOiAwLFxyXG4gICAgICAgICAgICAgICAgX29yaWdpbmFsSGVpZ2h0OiAwLFxyXG4gICAgICAgICAgICAgICAgX2lkOiBcIlwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBbOF0gY2MuUHJlZmFiSW5mbyBmb3Igc2NlbmVcclxuICAgICAgICAgICAgLy8gWzldIChyZXNlcnZlZClcclxuICAgICAgICAgICAgLy8gWzEwXSBTY2VuZUdsb2JhbHNcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuU2NlbmVHbG9iYWxzXCIsXHJcbiAgICAgICAgICAgICAgICBhbWJpZW50OiB7IF9faWRfXzogMTEgfSxcclxuICAgICAgICAgICAgICAgIHNoYWRvd3M6IHsgX19pZF9fOiAxMiB9LFxyXG4gICAgICAgICAgICAgICAgX3NreWJveDogeyBfX2lkX186IDEzIH0sXHJcbiAgICAgICAgICAgICAgICBmb2c6IHsgX19pZF9fOiAxNCB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBbMTFdIEFtYmllbnRJbmZvXHJcbiAgICAgICAgICAgIHsgX190eXBlX186IFwiY2MuQW1iaWVudEluZm9cIiwgX3NreUxpZ2h0aW5nQ29sb3I6IHsgX190eXBlX186IFwiY2MuVmVjNFwiLCB4OiAwLjIsIHk6IDAuMiwgejogMC4yLCB3OiAxIH0gfSxcclxuICAgICAgICAgICAgLy8gWzEyXSBTaGFkb3dzSW5mb1xyXG4gICAgICAgICAgICB7IF9fdHlwZV9fOiBcImNjLlNoYWRvd3NJbmZvXCIgfSxcclxuICAgICAgICAgICAgLy8gWzEzXSBTa3lib3hJbmZvXHJcbiAgICAgICAgICAgIHsgX190eXBlX186IFwiY2MuU2t5Ym94SW5mb1wiIH0sXHJcbiAgICAgICAgICAgIC8vIFsxNF0gRm9nSW5mb1xyXG4gICAgICAgICAgICB7IF9fdHlwZV9fOiBcImNjLkZvZ0luZm9cIiB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IEVYVF9OQU1FLFxyXG4gICAgICAgICAgICBtZXRob2QsXHJcbiAgICAgICAgICAgIGFyZ3MsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19