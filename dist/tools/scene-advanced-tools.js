"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAdvancedTools = void 0;
const tool_base_1 = require("../tool-base");
const scene_tools_1 = require("./scene-tools");
const crypto_1 = require("crypto");
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
                name: "scene_clipboard",
                description: "Clipboard ops on scene nodes. Actions: 'copy' (uuid), 'cut' (uuid), 'paste' (parentUuid).",
                inputSchema: {
                    type: "object",
                    properties: {
                        action: { type: "string", description: "'copy' | 'cut' | 'paste'" },
                        uuid: { type: "string", description: "Source node UUID (action=copy|cut)" },
                        parentUuid: { type: "string", description: "Destination parent UUID (action=paste)" },
                    },
                    required: ["action"],
                },
            },
            {
                name: "scene_undo",
                description: "Undo / snapshot recording. Actions: 'snapshot' (one-shot undo snapshot), 'snapshot_abort' (cancel current snapshot), 'begin' (begin-recording for a multi-step undo group), 'end' (end-recording = commit), 'cancel' (cancel-recording = discard).",
                inputSchema: {
                    type: "object",
                    properties: {
                        action: { type: "string", description: "'snapshot' | 'snapshot_abort' | 'begin' | 'end' | 'cancel'" },
                    },
                    required: ["action"],
                },
            },
            {
                name: "scene_array",
                description: "Array property element ops. Actions: 'move' (uuid, path, target, offset — reorder by index delta) and 'remove' (uuid, path, index).",
                inputSchema: {
                    type: "object",
                    properties: {
                        action: { type: "string", description: "'move' | 'remove'" },
                        uuid: { type: "string", description: "Node or component UUID" },
                        path: { type: "string", description: "Array property path" },
                        target: { type: "number", description: "Current index (action=move)" },
                        offset: { type: "number", description: "Move offset (action=move): +1 = down, -1 = up" },
                        index: { type: "number", description: "Index to remove (action=remove)" },
                    },
                    required: ["action", "uuid", "path"],
                },
            },
            {
                name: "scene_reset",
                description: "Reset a node, component, or property to defaults. Actions: 'transform' (uuid — node position/rotation/scale to identity), 'property' (uuid, path — single property), 'component' (uuid — component to defaults), 'restore_prefab' (uuid — revert prefab instance to original).",
                inputSchema: {
                    type: "object",
                    properties: {
                        action: { type: "string", description: "'transform' | 'property' | 'component' | 'restore_prefab'" },
                        uuid: { type: "string", description: "Target UUID (node for transform/restore_prefab, component for component, either for property)" },
                        path: { type: "string", description: "Property path (action=property)" },
                    },
                    required: ["action", "uuid"],
                },
            },
            {
                name: "scene_query",
                description: "Query scene state. Actions: 'dirty' (has unsaved changes?), 'ready' (scene fully loaded?), 'classes' (all component classes), 'components' (available components for a node — uuid required), 'component_has_script' (does a component class have a script file — name required), 'nodes_by_asset' (nodes referencing an asset — assetUuid required), 'scene_bounds' (current scene bounding rect). For full node/component dumps use cocos://node/{uuid} / cocos://component/{uuid} resources.",
                inputSchema: {
                    type: "object",
                    properties: {
                        action: { type: "string", description: "'dirty' | 'ready' | 'classes' | 'components' | 'component_has_script' | 'nodes_by_asset' | 'scene_bounds'" },
                        uuid: { type: "string", description: "Node UUID (action=components)" },
                        name: { type: "string", description: "Component class name (action=component_has_script)" },
                        assetUuid: { type: "string", description: "Asset UUID (action=nodes_by_asset)" },
                    },
                    required: ["action"],
                },
            },
            {
                name: "scene_soft_reload",
                description: "Soft reload the current scene without losing state.",
                inputSchema: { type: "object", properties: {} },
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
        ];
    }
    async execute(toolName, args) {
        try {
            switch (toolName) {
                case "scene_execute_script":
                    return (0, tool_base_1.ok)(await this.sceneScript(args.method, args.args || []));
                case "scene_snapshot":
                    return (0, tool_base_1.ok)(await Editor.Message.request("scene", "snapshot"));
                case "scene_query":
                    return this.handleQuery(args);
                case "scene_soft_reload":
                    await Editor.Message.request("scene", "soft-reload");
                    return (0, tool_base_1.ok)({ success: true });
                case "scene_clipboard":
                    return this.handleClipboard(args);
                case "scene_undo":
                    return this.handleUndo(args);
                case "scene_array":
                    return this.handleArray(args);
                case "scene_reset":
                    return this.handleReset(args);
                case "scene_create":
                    return this.createScene(args.path, !!args.force);
                case "scene_execute_component_method": {
                    const result = await Editor.Message.request("scene", "execute-component-method", { uuid: args.uuid, name: args.method, args: args.args || [] });
                    return (0, tool_base_1.ok)({ success: true, result });
                }
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
                default:
                    return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
            }
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    /** scene_query (v2.0.0) — 旧 scene_query_dirty/ready/classes/components/component_has_script/nodes_by_asset/scene_bounds を統合 */
    async handleQuery(args) {
        switch (args.action) {
            case "dirty": {
                const dirty = await Editor.Message.request("scene", "query-dirty");
                return (0, tool_base_1.ok)({ success: true, action: args.action, dirty });
            }
            case "ready": {
                const ready = await Editor.Message.request("scene", "query-is-ready");
                return (0, tool_base_1.ok)({ success: true, action: args.action, ready });
            }
            case "classes": {
                const classes = await Editor.Message.request("scene", "query-classes");
                return (0, tool_base_1.ok)({ success: true, action: args.action, classes });
            }
            case "components": {
                if (!args.uuid)
                    return (0, tool_base_1.err)("scene_query(components): 'uuid' is required");
                const comps = await Editor.Message.request("scene", "query-components", args.uuid);
                return (0, tool_base_1.ok)({ success: true, action: args.action, components: comps });
            }
            case "component_has_script": {
                if (!args.name)
                    return (0, tool_base_1.err)("scene_query(component_has_script): 'name' is required");
                const hasScript = await Editor.Message.request("scene", "query-component-has-script", args.name);
                return (0, tool_base_1.ok)({ success: true, action: args.action, name: args.name, hasScript });
            }
            case "nodes_by_asset": {
                if (!args.assetUuid)
                    return (0, tool_base_1.err)("scene_query(nodes_by_asset): 'assetUuid' is required");
                const nodes = await Editor.Message.request("scene", "query-nodes-by-asset-uuid", args.assetUuid);
                return (0, tool_base_1.ok)({ success: true, action: args.action, nodes });
            }
            case "scene_bounds": {
                const bounds = await Editor.Message.request("scene", "query-scene-bounds");
                return (0, tool_base_1.ok)({ success: true, action: args.action, bounds });
            }
            default:
                return (0, tool_base_1.err)(`Unknown scene_query action: ${args.action}. Expected dirty / ready / classes / components / component_has_script / nodes_by_asset / scene_bounds.`);
        }
    }
    /** scene_clipboard (v2.0.0) */
    async handleClipboard(args) {
        switch (args.action) {
            case "copy":
                if (!args.uuid)
                    return (0, tool_base_1.err)("scene_clipboard(copy): 'uuid' is required");
                await Editor.Message.request("scene", "copy-node", args.uuid);
                return (0, tool_base_1.ok)({ success: true, action: args.action, uuid: args.uuid });
            case "cut":
                if (!args.uuid)
                    return (0, tool_base_1.err)("scene_clipboard(cut): 'uuid' is required");
                await Editor.Message.request("scene", "cut-node", args.uuid);
                return (0, tool_base_1.ok)({ success: true, action: args.action, uuid: args.uuid });
            case "paste":
                if (!args.parentUuid)
                    return (0, tool_base_1.err)("scene_clipboard(paste): 'parentUuid' is required");
                const r = await Editor.Message.request("scene", "paste-node", args.parentUuid);
                return (0, tool_base_1.ok)({ success: true, action: args.action, result: r });
            default:
                return (0, tool_base_1.err)(`Unknown scene_clipboard action: ${args.action}`);
        }
    }
    /** scene_undo (v2.0.0) */
    async handleUndo(args) {
        switch (args.action) {
            case "snapshot":
                await Editor.Message.request("scene", "snapshot");
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            case "snapshot_abort":
                await Editor.Message.request("scene", "snapshot-abort");
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            case "begin":
                await Editor.Message.request("scene", "begin-recording");
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            case "end":
                await Editor.Message.request("scene", "end-recording");
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            case "cancel":
                await Editor.Message.request("scene", "cancel-recording");
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            default:
                return (0, tool_base_1.err)(`Unknown scene_undo action: ${args.action}`);
        }
    }
    /** scene_array (v2.0.0) */
    async handleArray(args) {
        switch (args.action) {
            case "move":
                await Editor.Message.request("scene", "move-array-element", { uuid: args.uuid, path: args.path, target: args.target, offset: args.offset });
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            case "remove":
                await Editor.Message.request("scene", "remove-array-element", { uuid: args.uuid, path: args.path, index: args.index });
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            default:
                return (0, tool_base_1.err)(`Unknown scene_array action: ${args.action}`);
        }
    }
    /** scene_reset (v2.0.0) */
    async handleReset(args) {
        switch (args.action) {
            case "transform":
                return this.resetTransform(args.uuid);
            case "property":
                if (!args.path)
                    return (0, tool_base_1.err)("scene_reset(property): 'path' is required");
                await Editor.Message.request("scene", "reset-property", { uuid: args.uuid, path: args.path });
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            case "component":
                await Editor.Message.request("scene", "reset-component", { uuid: args.uuid });
                return (0, tool_base_1.ok)({ success: true, action: args.action });
            case "restore_prefab":
                await Editor.Message.request("scene", "restore-prefab", { uuid: args.uuid });
                return (0, tool_base_1.ok)({ success: true, action: args.action, uuid: args.uuid });
            default:
                return (0, tool_base_1.err)(`Unknown scene_reset action: ${args.action}`);
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
        var _a;
        try {
            if (!path.endsWith(".scene"))
                path += ".scene";
            const sceneName = path.split("/").pop().replace(".scene", "");
            // Creator 3.8.3 embeds Node 14.16: neither global crypto nor
            // crypto.randomUUID is available. Generate an RFC 4122 v4 UUID.
            const uid = () => {
                const bytes = (0, crypto_1.randomBytes)(16);
                bytes[6] = (bytes[6] & 0x0f) | 0x40;
                bytes[8] = (bytes[8] & 0x3f) | 0x80;
                const hex = bytes.toString("hex");
                return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
            };
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
            // Verify that the created asset actually opened: some editor versions
            // log a load error and switch to an empty scene without rejecting.
            const queryResult = await Editor.Message.request("asset-db", "query-uuid", path);
            if (!queryResult)
                throw new Error(`Created scene has no asset UUID: ${path}`);
            await Editor.Message.request("scene", "open-scene", queryResult);
            const current = await Editor.Message.request("scene", "query-node-tree");
            if ((current === null || current === void 0 ? void 0 : current.uuid) !== queryResult) {
                // Include both UUIDs: on Creator versions where the editor does not
                // overwrite the scene node UUID with the asset UUID, this check can
                // fail even though the scene opened fine. The values make that obvious.
                throw new Error(`Scene asset was created but could not be opened: ${path} ` +
                    `(expected active scene ${queryResult}, got ${(_a = current === null || current === void 0 ? void 0 : current.uuid) !== null && _a !== void 0 ? _a : "none"})`);
            }
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
                _globals: { __id__: 8 },
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
            // [8] SceneGlobals
            {
                __type__: "cc.SceneGlobals",
                ambient: { __id__: 9 },
                shadows: { __id__: 10 },
                _skybox: { __id__: 11 },
                fog: { __id__: 12 },
            },
            // [9] AmbientInfo
            { __type__: "cc.AmbientInfo", _skyLightingColor: { __type__: "cc.Vec4", x: 0.2, y: 0.2, z: 0.2, w: 1 } },
            // [10] ShadowsInfo
            { __type__: "cc.ShadowsInfo" },
            // [11] SkyboxInfo
            { __type__: "cc.SkyboxInfo" },
            // [12] FogInfo
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBQ3ZDLCtDQUF3RDtBQUN4RCxtQ0FBcUM7QUFFckMsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFFckMsTUFBYSxrQkFBa0I7SUFBL0I7UUFDYSxpQkFBWSxHQUFHLGVBQWUsQ0FBQztJQThpQjVDLENBQUM7SUE1aUJHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsV0FBVyxFQUFFLHVEQUF1RDtnQkFDcEUsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSwwQkFBMEIsRUFBRTt3QkFDbkUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtxQkFDdkU7b0JBQ0QsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUN2QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGlCQUFpQjtnQkFDdkIsV0FBVyxFQUFFLDJGQUEyRjtnQkFDeEcsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSwwQkFBMEIsRUFBRTt3QkFDbkUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsb0NBQW9DLEVBQUU7d0JBQzNFLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHdDQUF3QyxFQUFF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QyxFQUFFO2dCQUN0QixPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO2dCQUN2QixPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO2dCQUN2QixHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO2FBQ3RCO1lBQ0Qsa0JBQWtCO1lBQ2xCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDeEcsbUJBQW1CO1lBQ25CLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFO1lBQzlCLGtCQUFrQjtZQUNsQixFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUU7WUFDN0IsZUFBZTtZQUNmLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRTtTQUM3QixDQUFDO0lBQ04sQ0FBQztJQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYyxFQUFFLElBQVc7UUFDakQsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7WUFDM0QsSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNO1lBQ04sSUFBSTtTQUNQLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQS9pQkQsZ0RBK2lCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IG9rLCBlcnIgfSBmcm9tIFwiLi4vdG9vbC1iYXNlXCI7XG5pbXBvcnQgeyBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaCB9IGZyb20gXCIuL3NjZW5lLXRvb2xzXCI7XG5pbXBvcnQgeyByYW5kb21CeXRlcyB9IGZyb20gXCJjcnlwdG9cIjtcblxuY29uc3QgRVhUX05BTUUgPSBcImNvY29zLWNyZWF0b3ItbWNwXCI7XG5cbmV4cG9ydCBjbGFzcyBTY2VuZUFkdmFuY2VkVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwic2NlbmVBZHZhbmNlZFwiO1xuXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9leGVjdXRlX3NjcmlwdFwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkV4ZWN1dGUgYSBzY2VuZSBzY3JpcHQgbWV0aG9kIGJ5IG5hbWUgd2l0aCBhcmd1bWVudHMuXCIsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlNjZW5lIHNjcmlwdCBtZXRob2QgbmFtZVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7IHR5cGU6IFwiYXJyYXlcIiwgZGVzY3JpcHRpb246IFwiQXJndW1lbnRzIHRvIHBhc3NcIiwgaXRlbXM6IHt9IH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJtZXRob2RcIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9jbGlwYm9hcmRcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDbGlwYm9hcmQgb3BzIG9uIHNjZW5lIG5vZGVzLiBBY3Rpb25zOiAnY29weScgKHV1aWQpLCAnY3V0JyAodXVpZCksICdwYXN0ZScgKHBhcmVudFV1aWQpLlwiLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCInY29weScgfCAnY3V0JyB8ICdwYXN0ZSdcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTb3VyY2Ugbm9kZSBVVUlEIChhY3Rpb249Y29weXxjdXQpXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiRGVzdGluYXRpb24gcGFyZW50IFVVSUQgKGFjdGlvbj1wYXN0ZSlcIiB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wiYWN0aW9uXCJdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfdW5kb1wiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlVuZG8gLyBzbmFwc2hvdCByZWNvcmRpbmcuIEFjdGlvbnM6ICdzbmFwc2hvdCcgKG9uZS1zaG90IHVuZG8gc25hcHNob3QpLCAnc25hcHNob3RfYWJvcnQnIChjYW5jZWwgY3VycmVudCBzbmFwc2hvdCksICdiZWdpbicgKGJlZ2luLXJlY29yZGluZyBmb3IgYSBtdWx0aS1zdGVwIHVuZG8gZ3JvdXApLCAnZW5kJyAoZW5kLXJlY29yZGluZyA9IGNvbW1pdCksICdjYW5jZWwnIChjYW5jZWwtcmVjb3JkaW5nID0gZGlzY2FyZCkuXCIsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIidzbmFwc2hvdCcgfCAnc25hcHNob3RfYWJvcnQnIHwgJ2JlZ2luJyB8ICdlbmQnIHwgJ2NhbmNlbCdcIiB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wiYWN0aW9uXCJdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfYXJyYXlcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBcnJheSBwcm9wZXJ0eSBlbGVtZW50IG9wcy4gQWN0aW9uczogJ21vdmUnICh1dWlkLCBwYXRoLCB0YXJnZXQsIG9mZnNldCDigJQgcmVvcmRlciBieSBpbmRleCBkZWx0YSkgYW5kICdyZW1vdmUnICh1dWlkLCBwYXRoLCBpbmRleCkuXCIsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIidtb3ZlJyB8ICdyZW1vdmUnXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBvciBjb21wb25lbnQgVVVJRFwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkFycmF5IHByb3BlcnR5IHBhdGhcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkN1cnJlbnQgaW5kZXggKGFjdGlvbj1tb3ZlKVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTW92ZSBvZmZzZXQgKGFjdGlvbj1tb3ZlKTogKzEgPSBkb3duLCAtMSA9IHVwXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkluZGV4IHRvIHJlbW92ZSAoYWN0aW9uPXJlbW92ZSlcIiB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wiYWN0aW9uXCIsIFwidXVpZFwiLCBcInBhdGhcIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9yZXNldFwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlc2V0IGEgbm9kZSwgY29tcG9uZW50LCBvciBwcm9wZXJ0eSB0byBkZWZhdWx0cy4gQWN0aW9uczogJ3RyYW5zZm9ybScgKHV1aWQg4oCUIG5vZGUgcG9zaXRpb24vcm90YXRpb24vc2NhbGUgdG8gaWRlbnRpdHkpLCAncHJvcGVydHknICh1dWlkLCBwYXRoIOKAlCBzaW5nbGUgcHJvcGVydHkpLCAnY29tcG9uZW50JyAodXVpZCDigJQgY29tcG9uZW50IHRvIGRlZmF1bHRzKSwgJ3Jlc3RvcmVfcHJlZmFiJyAodXVpZCDigJQgcmV2ZXJ0IHByZWZhYiBpbnN0YW5jZSB0byBvcmlnaW5hbCkuXCIsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIid0cmFuc2Zvcm0nIHwgJ3Byb3BlcnR5JyB8ICdjb21wb25lbnQnIHwgJ3Jlc3RvcmVfcHJlZmFiJ1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlRhcmdldCBVVUlEIChub2RlIGZvciB0cmFuc2Zvcm0vcmVzdG9yZV9wcmVmYWIsIGNvbXBvbmVudCBmb3IgY29tcG9uZW50LCBlaXRoZXIgZm9yIHByb3BlcnR5KVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IHBhdGggKGFjdGlvbj1wcm9wZXJ0eSlcIiB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wiYWN0aW9uXCIsIFwidXVpZFwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3F1ZXJ5XCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUXVlcnkgc2NlbmUgc3RhdGUuIEFjdGlvbnM6ICdkaXJ0eScgKGhhcyB1bnNhdmVkIGNoYW5nZXM/KSwgJ3JlYWR5JyAoc2NlbmUgZnVsbHkgbG9hZGVkPyksICdjbGFzc2VzJyAoYWxsIGNvbXBvbmVudCBjbGFzc2VzKSwgJ2NvbXBvbmVudHMnIChhdmFpbGFibGUgY29tcG9uZW50cyBmb3IgYSBub2RlIOKAlCB1dWlkIHJlcXVpcmVkKSwgJ2NvbXBvbmVudF9oYXNfc2NyaXB0JyAoZG9lcyBhIGNvbXBvbmVudCBjbGFzcyBoYXZlIGEgc2NyaXB0IGZpbGUg4oCUIG5hbWUgcmVxdWlyZWQpLCAnbm9kZXNfYnlfYXNzZXQnIChub2RlcyByZWZlcmVuY2luZyBhbiBhc3NldCDigJQgYXNzZXRVdWlkIHJlcXVpcmVkKSwgJ3NjZW5lX2JvdW5kcycgKGN1cnJlbnQgc2NlbmUgYm91bmRpbmcgcmVjdCkuIEZvciBmdWxsIG5vZGUvY29tcG9uZW50IGR1bXBzIHVzZSBjb2NvczovL25vZGUve3V1aWR9IC8gY29jb3M6Ly9jb21wb25lbnQve3V1aWR9IHJlc291cmNlcy5cIixcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiJ2RpcnR5JyB8ICdyZWFkeScgfCAnY2xhc3NlcycgfCAnY29tcG9uZW50cycgfCAnY29tcG9uZW50X2hhc19zY3JpcHQnIHwgJ25vZGVzX2J5X2Fzc2V0JyB8ICdzY2VuZV9ib3VuZHMnXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIChhY3Rpb249Y29tcG9uZW50cylcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgY2xhc3MgbmFtZSAoYWN0aW9uPWNvbXBvbmVudF9oYXNfc2NyaXB0KVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQXNzZXQgVVVJRCAoYWN0aW9uPW5vZGVzX2J5X2Fzc2V0KVwiIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJhY3Rpb25cIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zb2Z0X3JlbG9hZFwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNvZnQgcmVsb2FkIHRoZSBjdXJyZW50IHNjZW5lIHdpdGhvdXQgbG9zaW5nIHN0YXRlLlwiLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfY3JlYXRlXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3JlYXRlIGEgbmV3IGVtcHR5IDJEIHNjZW5lLiBJZiBwYXRoIGlzIG9taXR0ZWQsIHVzZXMgdGhlIGVkaXRvcidzIGJ1aWx0LWluIG5ldy1zY2VuZSBjb21tYW5kIChtYXkgbm90IHdvcmsgb24gQ0MgMy44LngpLiBJZiBwYXRoIGlzIHNwZWNpZmllZCwgY3JlYXRlcyBhIC5zY2VuZSBmaWxlIHZpYSBhc3NldC1kYiBhcyBhIGZhbGxiYWNrLiBSZXR1cm5zIGFuIGVycm9yIGlmIHRoZSBjdXJyZW50IHNjZW5lIGlzIGRpcnR5IGFuZCB1bnRpdGxlZCAodG8gYXZvaWQgbW9kYWwgc2F2ZSBkaWFsb2cpOyBwYXNzIGZvcmNlPXRydWUgdG8gYnlwYXNzLlwiLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2NlbmUgYXNzZXQgcGF0aCAoZS5nLiAnZGI6Ly9hc3NldHMvc2NlbmVzL05ld1NjZW5lLnNjZW5lJykuIElmIG9taXR0ZWQsIHVzZXMgZWRpdG9yJ3MgbmV3LXNjZW5lIGNvbW1hbmQuXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJTa2lwIGRpcnR5LXNjZW5lIHByZWZsaWdodCBjaGVjayAobWF5IHRyaWdnZXIgbW9kYWwgc2F2ZSBkaWFsb2cpXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZFwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNhbGwgYSBtZXRob2Qgb24gYSBjb21wb25lbnQgYXQgZWRpdC10aW1lLlwiLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSURcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk1ldGhvZCBuYW1lXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IHsgdHlwZTogXCJhcnJheVwiLCBkZXNjcmlwdGlvbjogXCJNZXRob2QgYXJndW1lbnRzXCIsIGl0ZW1zOiB7fSB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcIm1ldGhvZFwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NhdmVfYXNcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTYXZlIHRoZSBjdXJyZW50IHNjZW5lIHRvIGEgbmV3IGZpbGUgKHNob3dzIHNhdmUgZGlhbG9nKS5cIixcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIOKUgOKUgCDku6XkuIvjgIHml6LlrZhNQ1DmnKrlr77lv5zjga5FZGl0b3IgQVBJIOKUgOKUgFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfc2V0X3BhcmVudFwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlcGFyZW50IG5vZGUocykgdXNpbmcgdGhlIG9mZmljaWFsIEVkaXRvciBBUEkgKGFsdGVybmF0aXZlIHRvIG5vZGVfbW92ZSkuXCIsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IHsgdHlwZTogXCJhcnJheVwiLCBpdGVtczogeyB0eXBlOiBcInN0cmluZ1wiIH0sIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRChzKSB0byBtb3ZlXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOZXcgcGFyZW50IG5vZGUgVVVJRFwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm06IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIktlZXAgd29ybGQgcG9zaXRpb24gKGRlZmF1bHQgZmFsc2UpXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRzXCIsIFwicGFyZW50XCJdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9leGVjdXRlX3NjcmlwdFwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChhcmdzLm1ldGhvZCwgYXJncy5hcmdzIHx8IFtdKSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NuYXBzaG90XCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayhhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzbmFwc2hvdFwiKSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3F1ZXJ5XCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVF1ZXJ5KGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zb2Z0X3JlbG9hZFwiOlxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzb2Z0LXJlbG9hZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfY2xpcGJvYXJkXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUNsaXBib2FyZChhcmdzKTtcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfdW5kb1wiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVVbmRvKGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9hcnJheVwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVBcnJheShhcmdzKTtcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfcmVzZXRcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUmVzZXQoYXJncyk7XG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2NyZWF0ZVwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2VuZShhcmdzLnBhdGgsICEhYXJncy5mb3JjZSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImV4ZWN1dGUtY29tcG9uZW50LW1ldGhvZFwiLCB7IHV1aWQ6IGFyZ3MudXVpZCwgbmFtZTogYXJncy5tZXRob2QsIGFyZ3M6IGFyZ3MuYXJncyB8fCBbXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIFwic2NlbmVfc2F2ZV9hc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNhdmUtYXMtc2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NldF9wYXJlbnRcIjpcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2V0LXBhcmVudFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IGFyZ3MucGFyZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IGFyZ3MudXVpZHMsXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm06IGFyZ3Mua2VlcFdvcmxkVHJhbnNmb3JtIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBzY2VuZV9xdWVyeSAodjIuMC4wKSDigJQg5penIHNjZW5lX3F1ZXJ5X2RpcnR5L3JlYWR5L2NsYXNzZXMvY29tcG9uZW50cy9jb21wb25lbnRfaGFzX3NjcmlwdC9ub2Rlc19ieV9hc3NldC9zY2VuZV9ib3VuZHMg44KS57Wx5ZCIICovXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVRdWVyeShhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XG4gICAgICAgIHN3aXRjaCAoYXJncy5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgXCJkaXJ0eVwiOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlydHkgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1kaXJ0eVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uLCBkaXJ0eSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJyZWFkeVwiOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZHkgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1pcy1yZWFkeVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uLCByZWFkeSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJjbGFzc2VzXCI6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktY2xhc3Nlc1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uLCBjbGFzc2VzIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcImNvbXBvbmVudHNcIjoge1xuICAgICAgICAgICAgICAgIGlmICghYXJncy51dWlkKSByZXR1cm4gZXJyKFwic2NlbmVfcXVlcnkoY29tcG9uZW50cyk6ICd1dWlkJyBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudHNcIiwgYXJncy51dWlkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uLCBjb21wb25lbnRzOiBjb21wcyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJjb21wb25lbnRfaGFzX3NjcmlwdFwiOiB7XG4gICAgICAgICAgICAgICAgaWYgKCFhcmdzLm5hbWUpIHJldHVybiBlcnIoXCJzY2VuZV9xdWVyeShjb21wb25lbnRfaGFzX3NjcmlwdCk6ICduYW1lJyBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNTY3JpcHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jb21wb25lbnQtaGFzLXNjcmlwdFwiLCBhcmdzLm5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24sIG5hbWU6IGFyZ3MubmFtZSwgaGFzU2NyaXB0IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIm5vZGVzX2J5X2Fzc2V0XCI6IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MuYXNzZXRVdWlkKSByZXR1cm4gZXJyKFwic2NlbmVfcXVlcnkobm9kZXNfYnlfYXNzZXQpOiAnYXNzZXRVdWlkJyBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGVzLWJ5LWFzc2V0LXV1aWRcIiwgYXJncy5hc3NldFV1aWQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24sIG5vZGVzIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcInNjZW5lX2JvdW5kc1wiOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm91bmRzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktc2NlbmUtYm91bmRzXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24sIGJvdW5kcyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biBzY2VuZV9xdWVyeSBhY3Rpb246ICR7YXJncy5hY3Rpb259LiBFeHBlY3RlZCBkaXJ0eSAvIHJlYWR5IC8gY2xhc3NlcyAvIGNvbXBvbmVudHMgLyBjb21wb25lbnRfaGFzX3NjcmlwdCAvIG5vZGVzX2J5X2Fzc2V0IC8gc2NlbmVfYm91bmRzLmApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIHNjZW5lX2NsaXBib2FyZCAodjIuMC4wKSAqL1xuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlQ2xpcGJvYXJkKGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcbiAgICAgICAgc3dpdGNoIChhcmdzLmFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSBcImNvcHlcIjpcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MudXVpZCkgcmV0dXJuIGVycihcInNjZW5lX2NsaXBib2FyZChjb3B5KTogJ3V1aWQnIGlzIHJlcXVpcmVkXCIpO1xuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImNvcHktbm9kZVwiLCBhcmdzLnV1aWQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24sIHV1aWQ6IGFyZ3MudXVpZCB9KTtcbiAgICAgICAgICAgIGNhc2UgXCJjdXRcIjpcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MudXVpZCkgcmV0dXJuIGVycihcInNjZW5lX2NsaXBib2FyZChjdXQpOiAndXVpZCcgaXMgcmVxdWlyZWRcIik7XG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY3V0LW5vZGVcIiwgYXJncy51dWlkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uLCB1dWlkOiBhcmdzLnV1aWQgfSk7XG4gICAgICAgICAgICBjYXNlIFwicGFzdGVcIjpcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MucGFyZW50VXVpZCkgcmV0dXJuIGVycihcInNjZW5lX2NsaXBib2FyZChwYXN0ZSk6ICdwYXJlbnRVdWlkJyBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCByID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicGFzdGUtbm9kZVwiLCBhcmdzLnBhcmVudFV1aWQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24sIHJlc3VsdDogciB9KTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biBzY2VuZV9jbGlwYm9hcmQgYWN0aW9uOiAke2FyZ3MuYWN0aW9ufWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIHNjZW5lX3VuZG8gKHYyLjAuMCkgKi9cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVVuZG8oYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xuICAgICAgICBzd2l0Y2ggKGFyZ3MuYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIFwic25hcHNob3RcIjpcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzbmFwc2hvdFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uIH0pO1xuICAgICAgICAgICAgY2FzZSBcInNuYXBzaG90X2Fib3J0XCI6XG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic25hcHNob3QtYWJvcnRcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYWN0aW9uOiBhcmdzLmFjdGlvbiB9KTtcbiAgICAgICAgICAgIGNhc2UgXCJiZWdpblwiOlxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImJlZ2luLXJlY29yZGluZ1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uIH0pO1xuICAgICAgICAgICAgY2FzZSBcImVuZFwiOlxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImVuZC1yZWNvcmRpbmdcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYWN0aW9uOiBhcmdzLmFjdGlvbiB9KTtcbiAgICAgICAgICAgIGNhc2UgXCJjYW5jZWxcIjpcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjYW5jZWwtcmVjb3JkaW5nXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24gfSk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gc2NlbmVfdW5kbyBhY3Rpb246ICR7YXJncy5hY3Rpb259YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogc2NlbmVfYXJyYXkgKHYyLjAuMCkgKi9cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZUFycmF5KGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcbiAgICAgICAgc3dpdGNoIChhcmdzLmFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSBcIm1vdmVcIjpcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJtb3ZlLWFycmF5LWVsZW1lbnRcIixcbiAgICAgICAgICAgICAgICAgICAgeyB1dWlkOiBhcmdzLnV1aWQsIHBhdGg6IGFyZ3MucGF0aCwgdGFyZ2V0OiBhcmdzLnRhcmdldCwgb2Zmc2V0OiBhcmdzLm9mZnNldCB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uIH0pO1xuICAgICAgICAgICAgY2FzZSBcInJlbW92ZVwiOlxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJlbW92ZS1hcnJheS1lbGVtZW50XCIsXG4gICAgICAgICAgICAgICAgICAgIHsgdXVpZDogYXJncy51dWlkLCBwYXRoOiBhcmdzLnBhdGgsIGluZGV4OiBhcmdzLmluZGV4IH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24gfSk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gc2NlbmVfYXJyYXkgYWN0aW9uOiAke2FyZ3MuYWN0aW9ufWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIHNjZW5lX3Jlc2V0ICh2Mi4wLjApICovXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVSZXNldChhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XG4gICAgICAgIHN3aXRjaCAoYXJncy5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgXCJ0cmFuc2Zvcm1cIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldFRyYW5zZm9ybShhcmdzLnV1aWQpO1xuICAgICAgICAgICAgY2FzZSBcInByb3BlcnR5XCI6XG4gICAgICAgICAgICAgICAgaWYgKCFhcmdzLnBhdGgpIHJldHVybiBlcnIoXCJzY2VuZV9yZXNldChwcm9wZXJ0eSk6ICdwYXRoJyBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZXNldC1wcm9wZXJ0eVwiLCB7IHV1aWQ6IGFyZ3MudXVpZCwgcGF0aDogYXJncy5wYXRoIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24gfSk7XG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50XCI6XG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVzZXQtY29tcG9uZW50XCIsIHsgdXVpZDogYXJncy51dWlkIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogYXJncy5hY3Rpb24gfSk7XG4gICAgICAgICAgICBjYXNlIFwicmVzdG9yZV9wcmVmYWJcIjpcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZXN0b3JlLXByZWZhYlwiLCB7IHV1aWQ6IGFyZ3MudXVpZCB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IGFyZ3MuYWN0aW9uLCB1dWlkOiBhcmdzLnV1aWQgfSk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gc2NlbmVfcmVzZXQgYWN0aW9uOiAke2FyZ3MuYWN0aW9ufWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXNldFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJwb3NpdGlvblwiLCB7IHg6IDAsIHk6IDAsIHo6IDAgfV0pO1xuICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInJvdGF0aW9uXCIsIHsgeDogMCwgeTogMCwgejogMCB9XSk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwic2NhbGVcIiwgeyB4OiAxLCB5OiAxLCB6OiAxIH1dKTtcbiAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNjZW5lKHBhdGg/OiBzdHJpbmcsIGZvcmNlOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcbiAgICAgICAgLy8g44OA44Kk44Ki44Ot44Kw5Ymy44KK6L6844G/6Ziy5q2iOiDnj77lnKjjgrfjg7zjg7PjgYwgZGlydHkg44GL44GkIHVudGl0bGVkIOOBruWgtOWQiOOBr+S6i+WJjeOCqOODqeODvFxuICAgICAgICB0cnkgeyBhd2FpdCBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaChmb3JjZSk7IH1cbiAgICAgICAgY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XG5cbiAgICAgICAgLy8g44G+44GaIHNjZW5lOm5ldy1zY2VuZSDjgpLoqabooYzvvIhwYXRoIOacquaMh+WumuaZguOBruOBv++8iVxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwibmV3LXNjZW5lXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtc2cgPSBlPy5tZXNzYWdlIHx8IFN0cmluZyhlKTtcbiAgICAgICAgICAgICAgICBpZiAobXNnLmluY2x1ZGVzKFwiTWVzc2FnZSBkb2VzIG5vdCBleGlzdFwiKSB8fCBtc2cuaW5jbHVkZXMoXCJzY2VuZSAtIG5ldy1zY2VuZVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDQyAzLjgueCDihpIgYXNzZXQtZGIgZmFsbGJhY2sg44Gr44OV44Kp44O844OrXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrUGF0aCA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVBdmFpbGFibGVTY2VuZVBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU2NlbmVWaWFBc3NldERiKGZhbGxiYWNrUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIobXNnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBhdGgg5oyH5a6aIOKGkiBhc3NldC1kYiBmYWxsYmFja1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTY2VuZVZpYUFzc2V0RGIocGF0aCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUF2YWlsYWJsZVNjZW5lUGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBjb25zdCBiYXNlUGF0aCA9IFwiZGI6Ly9hc3NldHMvTmV3U2NlbmUuc2NlbmVcIjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcImdlbmVyYXRlLWF2YWlsYWJsZS11cmxcIiwgYmFzZVBhdGgpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCB7IC8qIGZhbGxiYWNrICovIH1cbiAgICAgICAgcmV0dXJuIGBkYjovL2Fzc2V0cy9OZXdTY2VuZV8ke0RhdGUubm93KCl9LnNjZW5lYDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNjZW5lVmlhQXNzZXREYihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghcGF0aC5lbmRzV2l0aChcIi5zY2VuZVwiKSkgcGF0aCArPSBcIi5zY2VuZVwiO1xuXG4gICAgICAgICAgICBjb25zdCBzY2VuZU5hbWUgPSBwYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSEucmVwbGFjZShcIi5zY2VuZVwiLCBcIlwiKTtcbiAgICAgICAgICAgIC8vIENyZWF0b3IgMy44LjMgZW1iZWRzIE5vZGUgMTQuMTY6IG5laXRoZXIgZ2xvYmFsIGNyeXB0byBub3JcbiAgICAgICAgICAgIC8vIGNyeXB0by5yYW5kb21VVUlEIGlzIGF2YWlsYWJsZS4gR2VuZXJhdGUgYW4gUkZDIDQxMjIgdjQgVVVJRC5cbiAgICAgICAgICAgIGNvbnN0IHVpZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBieXRlcyA9IHJhbmRvbUJ5dGVzKDE2KTtcbiAgICAgICAgICAgICAgICBieXRlc1s2XSA9IChieXRlc1s2XSAmIDB4MGYpIHwgMHg0MDtcbiAgICAgICAgICAgICAgICBieXRlc1s4XSA9IChieXRlc1s4XSAmIDB4M2YpIHwgMHg4MDtcbiAgICAgICAgICAgICAgICBjb25zdCBoZXggPSBieXRlcy50b1N0cmluZyhcImhleFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7aGV4LnNsaWNlKDAsIDgpfS0ke2hleC5zbGljZSg4LCAxMil9LSR7aGV4LnNsaWNlKDEyLCAxNil9LSR7aGV4LnNsaWNlKDE2LCAyMCl9LSR7aGV4LnNsaWNlKDIwKX1gO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHNpZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGFycyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlcIjtcbiAgICAgICAgICAgICAgICBsZXQgcyA9IFwiXCI7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyMTsgaSsrKSBzICs9IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3Qgc2NlbmVKc29uID0gdGhpcy5idWlsZE1pbmltYWxTY2VuZUpzb24oc2NlbmVOYW1lLCB1aWQsIHNpZCk7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gSlNPTi5zdHJpbmdpZnkoc2NlbmVKc29uLCBudWxsLCAyKTtcblxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwiY3JlYXRlLWFzc2V0XCIsIHBhdGgsIGNvbnRlbnQpO1xuXG4gICAgICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgY3JlYXRlZCBhc3NldCBhY3R1YWxseSBvcGVuZWQ6IHNvbWUgZWRpdG9yIHZlcnNpb25zXG4gICAgICAgICAgICAvLyBsb2cgYSBsb2FkIGVycm9yIGFuZCBzd2l0Y2ggdG8gYW4gZW1wdHkgc2NlbmUgd2l0aG91dCByZWplY3RpbmcuXG4gICAgICAgICAgICBjb25zdCBxdWVyeVJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LXV1aWRcIiwgcGF0aCk7XG4gICAgICAgICAgICBpZiAoIXF1ZXJ5UmVzdWx0KSB0aHJvdyBuZXcgRXJyb3IoYENyZWF0ZWQgc2NlbmUgaGFzIG5vIGFzc2V0IFVVSUQ6ICR7cGF0aH1gKTtcbiAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcIm9wZW4tc2NlbmVcIiwgcXVlcnlSZXN1bHQpO1xuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGUtdHJlZVwiKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Py51dWlkICE9PSBxdWVyeVJlc3VsdCkge1xuICAgICAgICAgICAgICAgIC8vIEluY2x1ZGUgYm90aCBVVUlEczogb24gQ3JlYXRvciB2ZXJzaW9ucyB3aGVyZSB0aGUgZWRpdG9yIGRvZXMgbm90XG4gICAgICAgICAgICAgICAgLy8gb3ZlcndyaXRlIHRoZSBzY2VuZSBub2RlIFVVSUQgd2l0aCB0aGUgYXNzZXQgVVVJRCwgdGhpcyBjaGVjayBjYW5cbiAgICAgICAgICAgICAgICAvLyBmYWlsIGV2ZW4gdGhvdWdoIHRoZSBzY2VuZSBvcGVuZWQgZmluZS4gVGhlIHZhbHVlcyBtYWtlIHRoYXQgb2J2aW91cy5cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGBTY2VuZSBhc3NldCB3YXMgY3JlYXRlZCBidXQgY291bGQgbm90IGJlIG9wZW5lZDogJHtwYXRofSBgICtcbiAgICAgICAgICAgICAgICAgICAgYChleHBlY3RlZCBhY3RpdmUgc2NlbmUgJHtxdWVyeVJlc3VsdH0sIGdvdCAke2N1cnJlbnQ/LnV1aWQgPz8gXCJub25lXCJ9KWBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwYXRoLCBtZXRob2Q6IFwiYXNzZXQtZGItZmFsbGJhY2tcIiB9KTtcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBidWlsZE1pbmltYWxTY2VuZUpzb24obmFtZTogc3RyaW5nLCB1aWQ6ICgpID0+IHN0cmluZywgc2lkOiAoKSA9PiBzdHJpbmcpOiBhbnlbXSB7XG4gICAgICAgIGNvbnN0IHNjZW5lSWQgPSB1aWQoKTtcbiAgICAgICAgY29uc3QgY2FudmFzTm9kZUlkID0gc2lkKCk7XG4gICAgICAgIGNvbnN0IGNhbWVyYU5vZGVJZCA9IHNpZCgpO1xuXG4gICAgICAgIGNvbnN0IHZlYzMgPSAoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcikgPT4gKHsgX190eXBlX186IFwiY2MuVmVjM1wiLCB4LCB5LCB6IH0pO1xuICAgICAgICBjb25zdCBxdWF0ID0gKCkgPT4gKHsgX190eXBlX186IFwiY2MuUXVhdFwiLCB4OiAwLCB5OiAwLCB6OiAwLCB3OiAxIH0pO1xuXG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAvLyBbMF0gU2NlbmVBc3NldFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBcImNjLlNjZW5lQXNzZXRcIixcbiAgICAgICAgICAgICAgICBfbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX19lZGl0b3JFeHRyYXNfXzoge30sXG4gICAgICAgICAgICAgICAgX25hdGl2ZTogXCJcIixcbiAgICAgICAgICAgICAgICBzY2VuZTogeyBfX2lkX186IDEgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBbMV0gU2NlbmVcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5TY2VuZVwiLFxuICAgICAgICAgICAgICAgIF9uYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcbiAgICAgICAgICAgICAgICBfcGFyZW50OiBudWxsLFxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW3sgX19pZF9fOiAyIH1dLFxuICAgICAgICAgICAgICAgIF9hY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgX2NvbXBvbmVudHM6IFtdLFxuICAgICAgICAgICAgICAgIF9wcmVmYWI6IG51bGwsXG4gICAgICAgICAgICAgICAgX2xwb3M6IHZlYzMoMCwgMCwgMCksXG4gICAgICAgICAgICAgICAgX2xyb3Q6IHF1YXQoKSxcbiAgICAgICAgICAgICAgICBfbHNjYWxlOiB2ZWMzKDEsIDEsIDEpLFxuICAgICAgICAgICAgICAgIF9tb2JpbGl0eTogMCxcbiAgICAgICAgICAgICAgICBfbGF5ZXI6IDEwNzM3NDE4MjQsXG4gICAgICAgICAgICAgICAgX2V1bGVyOiB2ZWMzKDAsIDAsIDApLFxuICAgICAgICAgICAgICAgIGF1dG9SZWxlYXNlQXNzZXRzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBfZ2xvYmFsczogeyBfX2lkX186IDggfSxcbiAgICAgICAgICAgICAgICBfaWQ6IHNjZW5lSWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gWzJdIENhbnZhcyBub2RlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuTm9kZVwiLFxuICAgICAgICAgICAgICAgIF9uYW1lOiBcIkNhbnZhc1wiLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcbiAgICAgICAgICAgICAgICBfcGFyZW50OiB7IF9faWRfXzogMSB9LFxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW3sgX19pZF9fOiAzIH1dLFxuICAgICAgICAgICAgICAgIF9hY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgX2NvbXBvbmVudHM6IFt7IF9faWRfXzogNSB9LCB7IF9faWRfXzogNiB9LCB7IF9faWRfXzogNyB9XSxcbiAgICAgICAgICAgICAgICBfcHJlZmFiOiBudWxsLFxuICAgICAgICAgICAgICAgIF9scG9zOiB2ZWMzKDAsIDAsIDApLFxuICAgICAgICAgICAgICAgIF9scm90OiBxdWF0KCksXG4gICAgICAgICAgICAgICAgX2xzY2FsZTogdmVjMygxLCAxLCAxKSxcbiAgICAgICAgICAgICAgICBfbW9iaWxpdHk6IDAsXG4gICAgICAgICAgICAgICAgX2xheWVyOiAzMzU1NDQzMixcbiAgICAgICAgICAgICAgICBfZXVsZXI6IHZlYzMoMCwgMCwgMCksXG4gICAgICAgICAgICAgICAgX2lkOiBjYW52YXNOb2RlSWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gWzNdIENhbWVyYSBub2RlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuTm9kZVwiLFxuICAgICAgICAgICAgICAgIF9uYW1lOiBcIkNhbWVyYVwiLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcbiAgICAgICAgICAgICAgICBfcGFyZW50OiB7IF9faWRfXzogMiB9LFxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW10sXG4gICAgICAgICAgICAgICAgX2FjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY29tcG9uZW50czogW3sgX19pZF9fOiA0IH1dLFxuICAgICAgICAgICAgICAgIF9wcmVmYWI6IG51bGwsXG4gICAgICAgICAgICAgICAgX2xwb3M6IHZlYzMoMCwgMCwgMTAwMCksXG4gICAgICAgICAgICAgICAgX2xyb3Q6IHF1YXQoKSxcbiAgICAgICAgICAgICAgICBfbHNjYWxlOiB2ZWMzKDEsIDEsIDEpLFxuICAgICAgICAgICAgICAgIF9tb2JpbGl0eTogMCxcbiAgICAgICAgICAgICAgICBfbGF5ZXI6IDEwNzM3NDE4MjQsXG4gICAgICAgICAgICAgICAgX2V1bGVyOiB2ZWMzKDAsIDAsIDApLFxuICAgICAgICAgICAgICAgIF9pZDogY2FtZXJhTm9kZUlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFs0XSBDYW1lcmEgY29tcG9uZW50XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuQ2FtZXJhXCIsXG4gICAgICAgICAgICAgICAgX25hbWU6IFwiXCIsXG4gICAgICAgICAgICAgICAgX29iakZsYWdzOiAwLFxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxuICAgICAgICAgICAgICAgIG5vZGU6IHsgX19pZF9fOiAzIH0sXG4gICAgICAgICAgICAgICAgX2VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgX3Byb2plY3Rpb246IDEsXG4gICAgICAgICAgICAgICAgX3ByaW9yaXR5OiAwLFxuICAgICAgICAgICAgICAgIF9mb3Y6IDQ1LFxuICAgICAgICAgICAgICAgIF9mb3ZBeGlzOiAwLFxuICAgICAgICAgICAgICAgIF9vcnRob0hlaWdodDogMTAsXG4gICAgICAgICAgICAgICAgX25lYXI6IDEsXG4gICAgICAgICAgICAgICAgX2ZhcjogMjAwMCxcbiAgICAgICAgICAgICAgICBfY29sb3I6IHsgX190eXBlX186IFwiY2MuQ29sb3JcIiwgcjogMCwgZzogMCwgYjogMCwgYTogMjU1IH0sXG4gICAgICAgICAgICAgICAgX2RlcHRoOiAxLFxuICAgICAgICAgICAgICAgIF9zdGVuY2lsOiAwLFxuICAgICAgICAgICAgICAgIF9jbGVhckZsYWdzOiA2LFxuICAgICAgICAgICAgICAgIF9yZWN0OiB7IF9fdHlwZV9fOiBcImNjLlJlY3RcIiwgeDogMCwgeTogMCwgd2lkdGg6IDEsIGhlaWdodDogMSB9LFxuICAgICAgICAgICAgICAgIF92aXNpYmlsaXR5OiAxMTA4MzQ0ODMyLFxuICAgICAgICAgICAgICAgIF9pZDogXCJcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBbNV0gVUlUcmFuc2Zvcm0gb24gQ2FudmFzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuVUlUcmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBfbmFtZTogXCJcIixcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX19lZGl0b3JFeHRyYXNfXzoge30sXG4gICAgICAgICAgICAgICAgbm9kZTogeyBfX2lkX186IDIgfSxcbiAgICAgICAgICAgICAgICBfZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY29udGVudFNpemU6IHsgX190eXBlX186IFwiY2MuU2l6ZVwiLCB3aWR0aDogNzIwLCBoZWlnaHQ6IDEyODAgfSxcbiAgICAgICAgICAgICAgICBfYW5jaG9yUG9pbnQ6IHsgX190eXBlX186IFwiY2MuVmVjMlwiLCB4OiAwLjUsIHk6IDAuNSB9LFxuICAgICAgICAgICAgICAgIF9pZDogXCJcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBbNl0gQ2FudmFzIGNvbXBvbmVudFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBcImNjLkNhbnZhc1wiLFxuICAgICAgICAgICAgICAgIF9uYW1lOiBcIlwiLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBfX2VkaXRvckV4dHJhc19fOiB7fSxcbiAgICAgICAgICAgICAgICBub2RlOiB7IF9faWRfXzogMiB9LFxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9jYW1lcmFDb21wb25lbnQ6IHsgX19pZF9fOiA0IH0sXG4gICAgICAgICAgICAgICAgX2FsaWduQ2FudmFzV2l0aFNjcmVlbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaWQ6IFwiXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gWzddIFdpZGdldCBvbiBDYW52YXMgKGZ1bGxzY3JlZW4pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuV2lkZ2V0XCIsXG4gICAgICAgICAgICAgICAgX25hbWU6IFwiXCIsXG4gICAgICAgICAgICAgICAgX29iakZsYWdzOiAwLFxuICAgICAgICAgICAgICAgIF9fZWRpdG9yRXh0cmFzX186IHt9LFxuICAgICAgICAgICAgICAgIG5vZGU6IHsgX19pZF9fOiAyIH0sXG4gICAgICAgICAgICAgICAgX2VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgX2FsaWduRmxhZ3M6IDE1LFxuICAgICAgICAgICAgICAgIF90YXJnZXQ6IG51bGwsXG4gICAgICAgICAgICAgICAgX2xlZnQ6IDAsXG4gICAgICAgICAgICAgICAgX3JpZ2h0OiAwLFxuICAgICAgICAgICAgICAgIF90b3A6IDAsXG4gICAgICAgICAgICAgICAgX2JvdHRvbTogMCxcbiAgICAgICAgICAgICAgICBfaXNBYnNMZWZ0OiB0cnVlLFxuICAgICAgICAgICAgICAgIF9pc0Fic1JpZ2h0OiB0cnVlLFxuICAgICAgICAgICAgICAgIF9pc0Fic1RvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaXNBYnNCb3R0b206IHRydWUsXG4gICAgICAgICAgICAgICAgX29yaWdpbmFsV2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgX29yaWdpbmFsSGVpZ2h0OiAwLFxuICAgICAgICAgICAgICAgIF9pZDogXCJcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBbOF0gU2NlbmVHbG9iYWxzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuU2NlbmVHbG9iYWxzXCIsXG4gICAgICAgICAgICAgICAgYW1iaWVudDogeyBfX2lkX186IDkgfSxcbiAgICAgICAgICAgICAgICBzaGFkb3dzOiB7IF9faWRfXzogMTAgfSxcbiAgICAgICAgICAgICAgICBfc2t5Ym94OiB7IF9faWRfXzogMTEgfSxcbiAgICAgICAgICAgICAgICBmb2c6IHsgX19pZF9fOiAxMiB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFs5XSBBbWJpZW50SW5mb1xuICAgICAgICAgICAgeyBfX3R5cGVfXzogXCJjYy5BbWJpZW50SW5mb1wiLCBfc2t5TGlnaHRpbmdDb2xvcjogeyBfX3R5cGVfXzogXCJjYy5WZWM0XCIsIHg6IDAuMiwgeTogMC4yLCB6OiAwLjIsIHc6IDEgfSB9LFxuICAgICAgICAgICAgLy8gWzEwXSBTaGFkb3dzSW5mb1xuICAgICAgICAgICAgeyBfX3R5cGVfXzogXCJjYy5TaGFkb3dzSW5mb1wiIH0sXG4gICAgICAgICAgICAvLyBbMTFdIFNreWJveEluZm9cbiAgICAgICAgICAgIHsgX190eXBlX186IFwiY2MuU2t5Ym94SW5mb1wiIH0sXG4gICAgICAgICAgICAvLyBbMTJdIEZvZ0luZm9cbiAgICAgICAgICAgIHsgX190eXBlX186IFwiY2MuRm9nSW5mb1wiIH0sXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXG4gICAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgICBhcmdzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=