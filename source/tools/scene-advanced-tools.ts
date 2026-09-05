import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";
import { ensureSceneSafeToSwitch } from "./scene-tools";
import { randomBytes } from "crypto";

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

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "scene_execute_script":
                    return ok(await this.sceneScript(args.method, args.args || []));
                case "scene_snapshot":
                    return ok(await (Editor.Message.request as any)("scene", "snapshot"));
                case "scene_query":
                    return this.handleQuery(args);
                case "scene_soft_reload":
                    await (Editor.Message.request as any)("scene", "soft-reload");
                    return ok({ success: true });
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
                    const result = await (Editor.Message.request as any)("scene", "execute-component-method", { uuid: args.uuid, name: args.method, args: args.args || [] });
                    return ok({ success: true, result });
                }
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
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    /** scene_query (v2.0.0) — 旧 scene_query_dirty/ready/classes/components/component_has_script/nodes_by_asset/scene_bounds を統合 */
    private async handleQuery(args: Record<string, any>): Promise<ToolResult> {
        switch (args.action) {
            case "dirty": {
                const dirty = await (Editor.Message.request as any)("scene", "query-dirty");
                return ok({ success: true, action: args.action, dirty });
            }
            case "ready": {
                const ready = await (Editor.Message.request as any)("scene", "query-is-ready");
                return ok({ success: true, action: args.action, ready });
            }
            case "classes": {
                const classes = await (Editor.Message.request as any)("scene", "query-classes");
                return ok({ success: true, action: args.action, classes });
            }
            case "components": {
                if (!args.uuid) return err("scene_query(components): 'uuid' is required");
                const comps = await (Editor.Message.request as any)("scene", "query-components", args.uuid);
                return ok({ success: true, action: args.action, components: comps });
            }
            case "component_has_script": {
                if (!args.name) return err("scene_query(component_has_script): 'name' is required");
                const hasScript = await (Editor.Message.request as any)("scene", "query-component-has-script", args.name);
                return ok({ success: true, action: args.action, name: args.name, hasScript });
            }
            case "nodes_by_asset": {
                if (!args.assetUuid) return err("scene_query(nodes_by_asset): 'assetUuid' is required");
                const nodes = await (Editor.Message.request as any)("scene", "query-nodes-by-asset-uuid", args.assetUuid);
                return ok({ success: true, action: args.action, nodes });
            }
            case "scene_bounds": {
                const bounds = await (Editor.Message.request as any)("scene", "query-scene-bounds");
                return ok({ success: true, action: args.action, bounds });
            }
            default:
                return err(`Unknown scene_query action: ${args.action}. Expected dirty / ready / classes / components / component_has_script / nodes_by_asset / scene_bounds.`);
        }
    }

    /** scene_clipboard (v2.0.0) */
    private async handleClipboard(args: Record<string, any>): Promise<ToolResult> {
        switch (args.action) {
            case "copy":
                if (!args.uuid) return err("scene_clipboard(copy): 'uuid' is required");
                await (Editor.Message.request as any)("scene", "copy-node", args.uuid);
                return ok({ success: true, action: args.action, uuid: args.uuid });
            case "cut":
                if (!args.uuid) return err("scene_clipboard(cut): 'uuid' is required");
                await (Editor.Message.request as any)("scene", "cut-node", args.uuid);
                return ok({ success: true, action: args.action, uuid: args.uuid });
            case "paste":
                if (!args.parentUuid) return err("scene_clipboard(paste): 'parentUuid' is required");
                const r = await (Editor.Message.request as any)("scene", "paste-node", args.parentUuid);
                return ok({ success: true, action: args.action, result: r });
            default:
                return err(`Unknown scene_clipboard action: ${args.action}`);
        }
    }

    /** scene_undo (v2.0.0) */
    private async handleUndo(args: Record<string, any>): Promise<ToolResult> {
        switch (args.action) {
            case "snapshot":
                await (Editor.Message.request as any)("scene", "snapshot");
                return ok({ success: true, action: args.action });
            case "snapshot_abort":
                await (Editor.Message.request as any)("scene", "snapshot-abort");
                return ok({ success: true, action: args.action });
            case "begin":
                await (Editor.Message.request as any)("scene", "begin-recording");
                return ok({ success: true, action: args.action });
            case "end":
                await (Editor.Message.request as any)("scene", "end-recording");
                return ok({ success: true, action: args.action });
            case "cancel":
                await (Editor.Message.request as any)("scene", "cancel-recording");
                return ok({ success: true, action: args.action });
            default:
                return err(`Unknown scene_undo action: ${args.action}`);
        }
    }

    /** scene_array (v2.0.0) */
    private async handleArray(args: Record<string, any>): Promise<ToolResult> {
        switch (args.action) {
            case "move":
                await (Editor.Message.request as any)("scene", "move-array-element",
                    { uuid: args.uuid, path: args.path, target: args.target, offset: args.offset });
                return ok({ success: true, action: args.action });
            case "remove":
                await (Editor.Message.request as any)("scene", "remove-array-element",
                    { uuid: args.uuid, path: args.path, index: args.index });
                return ok({ success: true, action: args.action });
            default:
                return err(`Unknown scene_array action: ${args.action}`);
        }
    }

    /** scene_reset (v2.0.0) */
    private async handleReset(args: Record<string, any>): Promise<ToolResult> {
        switch (args.action) {
            case "transform":
                return this.resetTransform(args.uuid);
            case "property":
                if (!args.path) return err("scene_reset(property): 'path' is required");
                await (Editor.Message.request as any)("scene", "reset-property", { uuid: args.uuid, path: args.path });
                return ok({ success: true, action: args.action });
            case "component":
                await (Editor.Message.request as any)("scene", "reset-component", { uuid: args.uuid });
                return ok({ success: true, action: args.action });
            case "restore_prefab":
                await (Editor.Message.request as any)("scene", "restore-prefab", { uuid: args.uuid });
                return ok({ success: true, action: args.action, uuid: args.uuid });
            default:
                return err(`Unknown scene_reset action: ${args.action}`);
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
            // Creator 3.8.3 embeds Node 14.16: neither global crypto nor
            // crypto.randomUUID is available. Generate an RFC 4122 v4 UUID.
            const uid = () => {
                const bytes = randomBytes(16);
                bytes[6] = (bytes[6] & 0x0f) | 0x40;
                bytes[8] = (bytes[8] & 0x3f) | 0x80;
                const hex = bytes.toString("hex");
                return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
            };
            const sid = () => {
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                let s = "";
                for (let i = 0; i < 21; i++) s += chars[Math.floor(Math.random() * chars.length)];
                return s;
            };

            const sceneJson = this.buildMinimalSceneJson(sceneName, uid, sid);
            const content = JSON.stringify(sceneJson, null, 2);

            await (Editor.Message.request as any)("asset-db", "create-asset", path, content);

            // Verify that the created asset actually opened: some editor versions
            // log a load error and switch to an empty scene without rejecting.
            const queryResult = await (Editor.Message.request as any)("asset-db", "query-uuid", path);
            if (!queryResult) throw new Error(`Created scene has no asset UUID: ${path}`);
            await (Editor.Message.request as any)("scene", "open-scene", queryResult);
            const current = await (Editor.Message.request as any)("scene", "query-node-tree");
            if (current?.uuid !== queryResult) {
                throw new Error(`Scene asset was created but could not be opened: ${path}`);
            }

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

    private async sceneScript(method: string, args: any[]): Promise<any> {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
