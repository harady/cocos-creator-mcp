import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";
import { ensureSceneSafeToSwitch } from "./scene-tools";

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
                    return this.createScene(args.path, !!args.force);
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
                case "scene_set_parent":
                    await (Editor.Message.request as any)("scene", "set-parent", {
                        parent: args.parent,
                        uuids: args.uuids,
                        keepWorldTransform: args.keepWorldTransform || false,
                    });
                    return ok({ success: true });
                case "scene_query_node": {
                    const dump = await (Editor.Message.request as any)("scene", "query-node", args.uuid);
                    return ok({ success: true, node: dump });
                }
                case "scene_query_component": {
                    const dump = await (Editor.Message.request as any)("scene", "query-component", args.uuid);
                    return ok({ success: true, component: dump });
                }
                case "scene_query_scene_bounds": {
                    const bounds = await (Editor.Message.request as any)("scene", "query-scene-bounds");
                    return ok({ success: true, bounds });
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

    private async createScene(path?: string, force: boolean = false): Promise<ToolResult> {
        // ダイアログ割り込み防止: 現在シーンが dirty かつ untitled の場合は事前エラー
        try { await ensureSceneSafeToSwitch(force); }
        catch (e: any) { return err(e.message || String(e)); }

        // まず scene:new-scene を試行（path 未指定時のみ）
        if (!path) {
            try {
                await (Editor.Message.request as any)("scene", "new-scene");
                return ok({ success: true });
            } catch (e: any) {
                const msg = e?.message || String(e);
                if (msg.includes("Message does not exist") || msg.includes("scene - new-scene")) {
                    // CC 3.8.x → asset-db fallback にフォール
                    const fallbackPath = await this.generateAvailableScenePath();
                    return this.createSceneViaAssetDb(fallbackPath);
                }
                return err(msg);
            }
        }

        // path 指定 → asset-db fallback
        return this.createSceneViaAssetDb(path);
    }

    private async generateAvailableScenePath(): Promise<string> {
        const basePath = "db://assets/NewScene.scene";
        try {
            const result = await (Editor.Message.request as any)("asset-db", "generate-available-url", basePath);
            if (result) return result;
        } catch { /* fallback */ }
        return `db://assets/NewScene_${Date.now()}.scene`;
    }

    private async createSceneViaAssetDb(path: string): Promise<ToolResult> {
        try {
            if (!path.endsWith(".scene")) path += ".scene";

            const sceneName = path.split("/").pop()!.replace(".scene", "");
            const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            const sid = () => {
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                let s = "";
                for (let i = 0; i < 21; i++) s += chars[Math.floor(Math.random() * chars.length)];
                return s;
            };

            const sceneJson = this.buildMinimalSceneJson(sceneName, uid, sid);
            const content = JSON.stringify(sceneJson, null, 2);

            await (Editor.Message.request as any)("asset-db", "create-asset", path, content);

            // シーンを開く
            try {
                // ensureSceneSafeToSwitch は createScene 入口で既に通過済みなのでここでは再チェックしない
                const queryResult = await (Editor.Message.request as any)("asset-db", "query-uuid", path);
                if (queryResult) {
                    await (Editor.Message.request as any)("scene", "open-scene", queryResult);
                }
            } catch { /* open failure is not critical */ }

            return ok({ success: true, path, method: "asset-db-fallback" });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private buildMinimalSceneJson(name: string, uid: () => string, sid: () => string): any[] {
        const sceneId = uid();
        const canvasNodeId = sid();
        const cameraNodeId = sid();

        const vec3 = (x: number, y: number, z: number) => ({ __type__: "cc.Vec3", x, y, z });
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

    private async sceneScript(method: string, args: any[]): Promise<any> {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
