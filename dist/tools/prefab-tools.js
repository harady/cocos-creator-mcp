"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabTools = void 0;
const tool_base_1 = require("../tool-base");
const scene_tools_1 = require("./scene-tools");
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const EXT_NAME = "cocos-creator-mcp";
class PrefabTools {
    constructor() {
        this.categoryName = "prefab";
        this._pendingNestedPrefabs = [];
        /** prefab_open で開いた Prefab アセット UUID */
        this._currentPrefabUuid = null;
    }
    getTools() {
        return [
            {
                name: "prefab_list",
                description: "List all prefab files in the project.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "prefab_create",
                description: "Create a prefab from an existing node in the scene. The node remains in the scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID to create prefab from" },
                        path: { type: "string", description: "db:// path for the prefab (e.g. 'db://assets/prefabs/MyPrefab.prefab')" },
                    },
                    required: ["uuid", "path"],
                },
            },
            {
                name: "prefab_instantiate",
                description: "Instantiate a prefab into the scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        prefabUuid: { type: "string", description: "Prefab asset UUID" },
                        parent: { type: "string", description: "Parent node UUID (optional, defaults to scene root)" },
                    },
                    required: ["prefabUuid"],
                },
            },
            {
                name: "prefab_get_info",
                description: "Get information about a prefab asset (name, path, UUID).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Prefab asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "prefab_update",
                description: "Update (re-save) a prefab from its instance node in the scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID of the prefab instance in the scene" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "prefab_duplicate",
                description: "Duplicate a prefab asset to a new path.",
                inputSchema: {
                    type: "object",
                    properties: {
                        source: { type: "string", description: "Source prefab db:// path" },
                        destination: { type: "string", description: "Destination db:// path" },
                    },
                    required: ["source", "destination"],
                },
            },
            {
                name: "prefab_validate",
                description: "Validate a prefab for missing references or broken links.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Prefab asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "prefab_revert",
                description: "Revert a prefab instance node to its original prefab state.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID of the prefab instance" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "prefab_create_and_replace",
                description: "Create a prefab from a node AND replace the original node with a prefab instance. This is the recommended way to extract a nested prefab — one command instead of create → delete → instantiate.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID to create prefab from" },
                        path: { type: "string", description: "db:// path for the prefab (e.g. 'db://assets/prefabs/MyPrefab.prefab')" },
                    },
                    required: ["uuid", "path"],
                },
            },
            {
                name: "prefab_open",
                description: "Open a prefab in editing mode. Equivalent to double-clicking the prefab in CocosCreator. Returns an error if the current scene is dirty and untitled (to avoid modal save dialog); pass force=true to bypass.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Prefab asset UUID" },
                        path: { type: "string", description: "Prefab db:// path (alternative to uuid)" },
                        force: { type: "boolean", description: "Skip dirty-scene preflight check (may trigger modal save dialog)" },
                    },
                },
            },
            {
                name: "prefab_close",
                description: "Save and close the current prefab editing mode, then return to the main scene. Returns an error if the current prefab is dirty and untitled (to avoid modal save dialog); pass force=true to bypass.",
                inputSchema: {
                    type: "object",
                    properties: {
                        save: { type: "boolean", description: "Save prefab before closing (default true)" },
                        sceneUuid: { type: "string", description: "Scene UUID to return to (default: project's start scene or first scene)" },
                        force: { type: "boolean", description: "Skip dirty-scene preflight check (may trigger modal save dialog)" },
                    },
                },
            },
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case "prefab_list":
                return this.listPrefabs();
            case "prefab_create":
                return this.createPrefab(args.uuid, args.path);
            case "prefab_instantiate":
                return this.instantiatePrefab(args.prefabUuid, args.parent);
            case "prefab_get_info":
                return this.getPrefabInfo(args.uuid);
            case "prefab_update":
                return this.updatePrefab(args.uuid);
            case "prefab_duplicate": {
                try {
                    await Editor.Message.request("asset-db", "copy-asset", args.source, args.destination);
                    return (0, tool_base_1.ok)({ success: true, source: args.source, destination: args.destination });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "prefab_validate": {
                try {
                    const info = await Editor.Message.request("asset-db", "query-asset-info", args.uuid);
                    const deps = await Editor.Message.request("asset-db", "query-depends", args.uuid).catch(() => []);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid, info, dependencies: deps, valid: !!info });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "prefab_revert":
                return this.revertPrefab(args.uuid);
            case "prefab_create_and_replace":
                return this.createAndReplace(args.uuid, args.path);
            case "prefab_open":
                return this.openPrefab(args.uuid, args.path, !!args.force);
            case "prefab_close":
                return this.closePrefab(args.save !== false, args.sceneUuid, !!args.force);
            default:
                return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
        }
    }
    async listPrefabs() {
        try {
            const results = await Editor.Message.request("asset-db", "query-assets", {
                pattern: "db://assets/**/*.prefab",
            });
            const prefabs = (results || []).map((a) => ({
                uuid: a.uuid,
                path: a.path || a.url,
                name: a.name,
            }));
            return (0, tool_base_1.ok)({ success: true, prefabs });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async createPrefab(nodeUuid, path) {
        try {
            // 既存Prefabがある場合は警告を返す（上書きダイアログでタイムアウトするため）
            const existing = await this.assetExists(path);
            if (existing) {
                return (0, tool_base_1.err)(`Prefab already exists at "${path}". Use prefab_update instead to update an existing prefab. ` +
                    `Workflow: 1) prefab_instantiate to place in scene, 2) modify properties, 3) prefab_update to save.`);
            }
            const result = await Editor.Message.request("scene", "create-prefab", nodeUuid, path);
            return (0, tool_base_1.ok)({ success: true, nodeUuid, path, result });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async assetExists(path) {
        try {
            const pattern = path.replace(/\.prefab$/, "") + ".*";
            const results = await Editor.Message.request("asset-db", "query-assets", { pattern });
            return (results || []).length > 0;
        }
        catch (_a) {
            try {
                const info = await Editor.Message.request("asset-db", "query-asset-info", path);
                return !!info;
            }
            catch (_b) {
                return false;
            }
        }
    }
    async instantiatePrefab(prefabUuid, parent) {
        try {
            const nodeUuid = await Editor.Message.request("scene", "create-node", {
                parent: parent || undefined,
                assetUuid: prefabUuid,
            });
            // Prefab 編集モード中の場合、ネスト Prefab 情報を記憶
            // prefab_update 時に JSON 後処理で asset/instance/nestedPrefabInstanceRoots を設定
            if (parent) {
                this._pendingNestedPrefabs.push({
                    nodeUuid,
                    prefabAssetUuid: prefabUuid,
                    parentUuid: parent,
                });
            }
            return (0, tool_base_1.ok)({ success: true, nodeUuid, prefabUuid });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async updatePrefab(nodeUuid) {
        try {
            const result = await Editor.Message.request("scene", "apply-prefab", nodeUuid);
            // ネスト Prefab の JSON 後処理
            if (this._pendingNestedPrefabs.length > 0) {
                await this._fixNestedPrefabJson(nodeUuid);
            }
            return (0, tool_base_1.ok)({ success: true, nodeUuid, result });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    /**
     * prefab_update 後に Prefab JSON を後処理して、ネスト Prefab 参照を正しく設定する.
     */
    async _fixNestedPrefabJson(_rootNodeUuid) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (this._pendingNestedPrefabs.length === 0)
            return;
        try {
            // シーンを保存して Prefab JSON を書き出す
            // 現在シーンが untitled (scene-2d) の場合、save-scene はダイアログを出すので
            // safeSaveScene でスキップする。untitled でシーンにインスタンスが居るケースは
            // 本来 prefab_open モードでのみ発生するので save が効く想定だが、
            // テスト等で直接呼ばれた場合の保護として skip する。
            const saved = await (0, scene_tools_1.safeSaveScene)();
            if (!saved) {
                console.warn("[PrefabTools] _fixNestedPrefabJson: save-scene skipped (untitled scene). " +
                    "Nested prefab JSON post-processing may be incomplete.");
                return;
            }
            await new Promise(r => setTimeout(r, 1500));
            // prefab_open で記憶した UUID からファイルパスを取得
            if (!this._currentPrefabUuid)
                return;
            const prefabPath = await Editor.Message.request("asset-db", "query-path", this._currentPrefabUuid);
            if (!prefabPath)
                return;
            if (!fs_1.default.existsSync(prefabPath))
                return;
            const data = JSON.parse(fs_1.default.readFileSync(prefabPath, "utf-8"));
            // 各ネスト Prefab エントリを処理
            for (const entry of this._pendingNestedPrefabs) {
                // fileId でノードを検索（nodeUuid はシーン内 UUID、Prefab JSON 内では fileId）
                let flpNodeIdx = -1;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].__type__ === "cc.PrefabInfo" && data[i].fileId === entry.nodeUuid) {
                        // この PrefabInfo を持つノードを探す
                        for (let j = 0; j < data.length; j++) {
                            if (((_a = data[j]._prefab) === null || _a === void 0 ? void 0 : _a.__id__) === i) {
                                flpNodeIdx = j;
                                break;
                            }
                        }
                        break;
                    }
                }
                // fileId で見つからない場合、ノード名で検索
                if (flpNodeIdx < 0) {
                    // Prefab アセット名を取得
                    const assetInfo = await Editor.Message.request("asset-db", "query-asset-info", entry.prefabAssetUuid);
                    const assetName = ((_b = assetInfo === null || assetInfo === void 0 ? void 0 : assetInfo.name) === null || _b === void 0 ? void 0 : _b.replace(".prefab", "")) || "";
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].__type__ === "cc.Node" && (data[i]._name === assetName || data[i]._name === undefined)) {
                            const prefabIdx = (_c = data[i]._prefab) === null || _c === void 0 ? void 0 : _c.__id__;
                            if (prefabIdx != null && ((_e = (_d = data[prefabIdx]) === null || _d === void 0 ? void 0 : _d.asset) === null || _e === void 0 ? void 0 : _e.__id__) === 0 && !((_f = data[prefabIdx]) === null || _f === void 0 ? void 0 : _f.instance)) {
                                flpNodeIdx = i;
                                break;
                            }
                        }
                    }
                }
                if (flpNodeIdx < 0)
                    continue;
                const prefabInfoIdx = (_g = data[flpNodeIdx]._prefab) === null || _g === void 0 ? void 0 : _g.__id__;
                if (prefabInfoIdx == null)
                    continue;
                // PrefabInfo を修正
                const prefabInfo = data[prefabInfoIdx];
                prefabInfo.root = { __id__: flpNodeIdx };
                prefabInfo.asset = {
                    __uuid__: entry.prefabAssetUuid,
                    __expectedType__: "cc.Prefab",
                };
                // PrefabInstance を追加
                if (!prefabInfo.instance) {
                    const instanceIdx = data.length;
                    data.push({
                        __type__: "cc.PrefabInstance",
                        fileId: crypto_1.default.randomBytes(16).toString("base64").replace(/[+/=]/g, "").substring(0, 22),
                        prefabRootNode: { __id__: 1 }, // Prefab 編集モードのルート
                        mountedChildren: [],
                        mountedComponents: [],
                        propertyOverrides: [],
                        removedComponents: [],
                    });
                    prefabInfo.instance = { __id__: instanceIdx };
                }
                // 子ノード・コンポーネントをクリア（Prefab アセットから復元される）
                data[flpNodeIdx]._children = [];
                data[flpNodeIdx]._components = [];
                // ルートの nestedPrefabInstanceRoots に追加
                const rootPrefabIdx = (_h = data[1]._prefab) === null || _h === void 0 ? void 0 : _h.__id__;
                if (rootPrefabIdx != null) {
                    const rootPrefab = data[rootPrefabIdx];
                    if (!rootPrefab.nestedPrefabInstanceRoots) {
                        rootPrefab.nestedPrefabInstanceRoots = [];
                    }
                    const alreadyNested = rootPrefab.nestedPrefabInstanceRoots.some((r) => (r === null || r === void 0 ? void 0 : r.__id__) === flpNodeIdx);
                    if (!alreadyNested) {
                        rootPrefab.nestedPrefabInstanceRoots.push({ __id__: flpNodeIdx });
                    }
                }
            }
            fs_1.default.writeFileSync(prefabPath, JSON.stringify(data, null, 2), "utf-8");
            this._pendingNestedPrefabs = [];
        }
        catch (e) {
            console.warn("[PrefabTools] _fixNestedPrefabJson failed:", e.message);
        }
    }
    async revertPrefab(nodeUuid) {
        try {
            const result = await Editor.Message.request("scene", "revert-prefab", nodeUuid);
            return (0, tool_base_1.ok)({ success: true, nodeUuid, result });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getPrefabInfo(uuid) {
        try {
            const info = await Editor.Message.request("asset-db", "query-asset-info", uuid);
            return (0, tool_base_1.ok)({ success: true, info });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async createAndReplace(nodeUuid, path) {
        var _a;
        try {
            // 1. Check if prefab already exists
            const existing = await this.assetExists(path);
            if (existing) {
                return (0, tool_base_1.err)(`Prefab already exists at "${path}". Delete it first or use a different path.`);
            }
            // 2. Get node info (parent, sibling index, transform) before creating prefab
            const nodeInfo = await this.sceneScript("getNodeInfo", [nodeUuid]);
            if (!(nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.success)) {
                return (0, tool_base_1.err)(`Node ${nodeUuid} not found`);
            }
            const parentUuid = (_a = nodeInfo.data) === null || _a === void 0 ? void 0 : _a.parent;
            // 3. Create prefab from the node
            const prefabAssetUuid = await Editor.Message.request("scene", "create-prefab", nodeUuid, path);
            if (!prefabAssetUuid) {
                return (0, tool_base_1.err)("create-prefab returned no asset UUID");
            }
            // 4. Delete the original node
            await Editor.Message.request("scene", "remove-node", { uuid: nodeUuid });
            // 5. Instantiate the prefab at the same parent
            const newNodeUuid = await Editor.Message.request("scene", "create-node", {
                parent: parentUuid || undefined,
                assetUuid: prefabAssetUuid,
            });
            return (0, tool_base_1.ok)({
                success: true,
                prefabAssetUuid,
                prefabPath: path,
                originalNodeUuid: nodeUuid,
                newInstanceUuid: newNodeUuid,
            });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async openPrefab(uuid, path, force = false) {
        try {
            // Prefab を開くときも内部的にシーン切替が発生するので dirty untitled チェック
            await (0, scene_tools_1.ensureSceneSafeToSwitch)(force);
            // Resolve UUID from path if needed
            let assetUuid = uuid;
            if (!assetUuid && path) {
                const info = await Editor.Message.request("asset-db", "query-asset-info", path);
                assetUuid = info === null || info === void 0 ? void 0 : info.uuid;
            }
            if (!assetUuid) {
                return (0, tool_base_1.err)("Either uuid or path is required");
            }
            // Open prefab in editing mode (equivalent to double-click)
            await Editor.Message.request("asset-db", "open-asset", assetUuid);
            // Wait for prefab editing mode to initialize
            await new Promise(r => setTimeout(r, 1000));
            this._currentPrefabUuid = assetUuid;
            this._pendingNestedPrefabs = [];
            return (0, tool_base_1.ok)({ success: true, uuid: assetUuid, mode: "prefab-edit" });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async closePrefab(save, sceneUuid, force = false) {
        try {
            // 1. Save prefab if requested
            // prefab edit モード中は "current scene" = 編集中 Prefab なので save-scene は Prefab を保存する。
            // ただし untitled フォールバックに当たった場合はダイアログ回避のためスキップする。
            if (save) {
                await (0, scene_tools_1.safeSaveScene)();
                await new Promise(r => setTimeout(r, 500));
            }
            // 2. Determine which scene to return to
            let targetScene = sceneUuid;
            if (!targetScene) {
                // Try project's start scene
                try {
                    targetScene = await Editor.Profile.getConfig("preview", "general.start_scene", "local");
                }
                catch ( /* ignore */_a) { /* ignore */ }
                // Fallback to first scene
                if (!targetScene || targetScene === "current_scene") {
                    const scenes = await Editor.Message.request("asset-db", "query-assets", {
                        ccType: "cc.SceneAsset",
                        pattern: "db://assets/**/*",
                    });
                    if (Array.isArray(scenes) && scenes.length > 0) {
                        targetScene = scenes[0].uuid;
                    }
                }
            }
            // 3. Open the scene
            if (targetScene) {
                // prefab edit モードから戻る遷移もダイアログが出うる
                await (0, scene_tools_1.ensureSceneSafeToSwitch)(force);
                await Editor.Message.request("scene", "open-scene", targetScene);
                await new Promise(r => setTimeout(r, 1000));
            }
            return (0, tool_base_1.ok)({ success: true, returnedToScene: targetScene });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async sceneScript(method, args) {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: "cocos-creator-mcp",
            method,
            args,
        });
    }
}
exports.PrefabTools = PrefabTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3ByZWZhYi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw0Q0FBdUM7QUFDdkMsK0NBQXVFO0FBQ3ZFLDRDQUFvQjtBQUVwQixvREFBNEI7QUFFNUIsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFTckMsTUFBYSxXQUFXO0lBQXhCO1FBQ2EsaUJBQVksR0FBRyxRQUFRLENBQUM7UUFDekIsMEJBQXFCLEdBQXdCLEVBQUUsQ0FBQztRQUN4RCx3Q0FBd0M7UUFDaEMsdUJBQWtCLEdBQWtCLElBQUksQ0FBQztJQXVnQnJELENBQUM7SUFyZ0JHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLFdBQVcsRUFBRSx1Q0FBdUM7Z0JBQ3BELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxlQUFlO2dCQUNyQixXQUFXLEVBQUUsb0ZBQW9GO2dCQUNqRyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGlDQUFpQyxFQUFFO3dCQUN4RSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx3RUFBd0UsRUFBRTtxQkFDbEg7b0JBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztpQkFDN0I7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxvQkFBb0I7Z0JBQzFCLFdBQVcsRUFBRSxzQ0FBc0M7Z0JBQ25ELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsVUFBVSxF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QU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEVBQUUsbUJBQW1CO1lBQ3pCLE1BQU07WUFDTixJQUFJO1NBQ1AsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBM2dCRCxrQ0EyZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5pbXBvcnQgeyBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaCwgc2FmZVNhdmVTY2VuZSB9IGZyb20gXCIuL3NjZW5lLXRvb2xzXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XHJcblxyXG5jb25zdCBFWFRfTkFNRSA9IFwiY29jb3MtY3JlYXRvci1tY3BcIjtcclxuXHJcbi8qKiBwcmVmYWJfaW5zdGFudGlhdGUg44Gn6YWN572u44GX44Gf44ON44K544OIIFByZWZhYiDmg4XloLHjgpLoqJjmhrYgKi9cclxuaW50ZXJmYWNlIE5lc3RlZFByZWZhYkVudHJ5IHtcclxuICAgIG5vZGVVdWlkOiBzdHJpbmc7XHJcbiAgICBwcmVmYWJBc3NldFV1aWQ6IHN0cmluZztcclxuICAgIHBhcmVudFV1aWQ6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFByZWZhYlRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwicHJlZmFiXCI7XHJcbiAgICBwcml2YXRlIF9wZW5kaW5nTmVzdGVkUHJlZmFiczogTmVzdGVkUHJlZmFiRW50cnlbXSA9IFtdO1xyXG4gICAgLyoqIHByZWZhYl9vcGVuIOOBp+mWi+OBhOOBnyBQcmVmYWIg44Ki44K744OD44OIIFVVSUQgKi9cclxuICAgIHByaXZhdGUgX2N1cnJlbnRQcmVmYWJVdWlkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9saXN0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGFsbCBwcmVmYWIgZmlsZXMgaW4gdGhlIHByb2plY3QuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9jcmVhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIHByZWZhYiBmcm9tIGFuIGV4aXN0aW5nIG5vZGUgaW4gdGhlIHNjZW5lLiBUaGUgbm9kZSByZW1haW5zIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIHRvIGNyZWF0ZSBwcmVmYWIgZnJvbVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBmb3IgdGhlIHByZWZhYiAoZS5nLiAnZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWInKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9pbnN0YW50aWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSW5zdGFudGlhdGUgYSBwcmVmYWIgaW50byB0aGUgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBhc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlBhcmVudCBub2RlIFVVSUQgKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBzY2VuZSByb290KVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicHJlZmFiVXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBwcmVmYWIgYXNzZXQgKG5hbWUsIHBhdGgsIFVVSUQpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgYXNzZXQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX3VwZGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVXBkYXRlIChyZS1zYXZlKSBhIHByZWZhYiBmcm9tIGl0cyBpbnN0YW5jZSBub2RlIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIG9mIHRoZSBwcmVmYWIgaW5zdGFuY2UgaW4gdGhlIHNjZW5lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfZHVwbGljYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJEdXBsaWNhdGUgYSBwcmVmYWIgYXNzZXQgdG8gYSBuZXcgcGF0aC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTb3VyY2UgcHJlZmFiIGRiOi8vIHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJEZXN0aW5hdGlvbiBkYjovLyBwYXRoXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJzb3VyY2VcIiwgXCJkZXN0aW5hdGlvblwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX3ZhbGlkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJWYWxpZGF0ZSBhIHByZWZhYiBmb3IgbWlzc2luZyByZWZlcmVuY2VzIG9yIGJyb2tlbiBsaW5rcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmFiIGFzc2V0IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9yZXZlcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJldmVydCBhIHByZWZhYiBpbnN0YW5jZSBub2RlIHRvIGl0cyBvcmlnaW5hbCBwcmVmYWIgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRCBvZiB0aGUgcHJlZmFiIGluc3RhbmNlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfY3JlYXRlX2FuZF9yZXBsYWNlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDcmVhdGUgYSBwcmVmYWIgZnJvbSBhIG5vZGUgQU5EIHJlcGxhY2UgdGhlIG9yaWdpbmFsIG5vZGUgd2l0aCBhIHByZWZhYiBpbnN0YW5jZS4gVGhpcyBpcyB0aGUgcmVjb21tZW5kZWQgd2F5IHRvIGV4dHJhY3QgYSBuZXN0ZWQgcHJlZmFiIOKAlCBvbmUgY29tbWFuZCBpbnN0ZWFkIG9mIGNyZWF0ZSDihpIgZGVsZXRlIOKGkiBpbnN0YW50aWF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIHRvIGNyZWF0ZSBwcmVmYWIgZnJvbVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBmb3IgdGhlIHByZWZhYiAoZS5nLiAnZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWInKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9vcGVuXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPcGVuIGEgcHJlZmFiIGluIGVkaXRpbmcgbW9kZS4gRXF1aXZhbGVudCB0byBkb3VibGUtY2xpY2tpbmcgdGhlIHByZWZhYiBpbiBDb2Nvc0NyZWF0b3IuIFJldHVybnMgYW4gZXJyb3IgaWYgdGhlIGN1cnJlbnQgc2NlbmUgaXMgZGlydHkgYW5kIHVudGl0bGVkICh0byBhdm9pZCBtb2RhbCBzYXZlIGRpYWxvZyk7IHBhc3MgZm9yY2U9dHJ1ZSB0byBieXBhc3MuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBhc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgZGI6Ly8gcGF0aCAoYWx0ZXJuYXRpdmUgdG8gdXVpZClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JjZTogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiU2tpcCBkaXJ0eS1zY2VuZSBwcmVmbGlnaHQgY2hlY2sgKG1heSB0cmlnZ2VyIG1vZGFsIHNhdmUgZGlhbG9nKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2Nsb3NlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTYXZlIGFuZCBjbG9zZSB0aGUgY3VycmVudCBwcmVmYWIgZWRpdGluZyBtb2RlLCB0aGVuIHJldHVybiB0byB0aGUgbWFpbiBzY2VuZS4gUmV0dXJucyBhbiBlcnJvciBpZiB0aGUgY3VycmVudCBwcmVmYWIgaXMgZGlydHkgYW5kIHVudGl0bGVkICh0byBhdm9pZCBtb2RhbCBzYXZlIGRpYWxvZyk7IHBhc3MgZm9yY2U9dHJ1ZSB0byBieXBhc3MuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJTYXZlIHByZWZhYiBiZWZvcmUgY2xvc2luZyAoZGVmYXVsdCB0cnVlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lVXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTY2VuZSBVVUlEIHRvIHJldHVybiB0byAoZGVmYXVsdDogcHJvamVjdCdzIHN0YXJ0IHNjZW5lIG9yIGZpcnN0IHNjZW5lKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJTa2lwIGRpcnR5LXNjZW5lIHByZWZsaWdodCBjaGVjayAobWF5IHRyaWdnZXIgbW9kYWwgc2F2ZSBkaWFsb2cpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9saXN0XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5saXN0UHJlZmFicygpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2NyZWF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlUHJlZmFiKGFyZ3MudXVpZCwgYXJncy5wYXRoKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9pbnN0YW50aWF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFudGlhdGVQcmVmYWIoYXJncy5wcmVmYWJVdWlkLCBhcmdzLnBhcmVudCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfZ2V0X2luZm9cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFByZWZhYkluZm8oYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl91cGRhdGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZVByZWZhYihhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2R1cGxpY2F0ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcImNvcHktYXNzZXRcIiwgYXJncy5zb3VyY2UsIGFyZ3MuZGVzdGluYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNvdXJjZTogYXJncy5zb3VyY2UsIGRlc3RpbmF0aW9uOiBhcmdzLmRlc3RpbmF0aW9uIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX3ZhbGlkYXRlXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgYXJncy51dWlkKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXBzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktZGVwZW5kc1wiLCBhcmdzLnV1aWQpLmNhdGNoKCgpID0+IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkOiBhcmdzLnV1aWQsIGluZm8sIGRlcGVuZGVuY2llczogZGVwcywgdmFsaWQ6ICEhaW5mbyB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9yZXZlcnRcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJldmVydFByZWZhYihhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2NyZWF0ZV9hbmRfcmVwbGFjZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlQW5kUmVwbGFjZShhcmdzLnV1aWQsIGFyZ3MucGF0aCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfb3BlblwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3BlblByZWZhYihhcmdzLnV1aWQsIGFyZ3MucGF0aCwgISFhcmdzLmZvcmNlKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9jbG9zZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xvc2VQcmVmYWIoYXJncy5zYXZlICE9PSBmYWxzZSwgYXJncy5zY2VuZVV1aWQsICEhYXJncy5mb3JjZSk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgbGlzdFByZWZhYnMoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0c1wiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiBcImRiOi8vYXNzZXRzLyoqLyoucHJlZmFiXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJzID0gKHJlc3VsdHMgfHwgW10pLm1hcCgoYTogYW55KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgdXVpZDogYS51dWlkLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogYS5wYXRoIHx8IGEudXJsLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogYS5uYW1lLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHByZWZhYnMgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlUHJlZmFiKG5vZGVVdWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIOaXouWtmFByZWZhYuOBjOOBguOCi+WgtOWQiOOBr+itpuWRiuOCkui/lOOBme+8iOS4iuabuOOBjeODgOOCpOOCouODreOCsOOBp+OCv+OCpOODoOOCouOCpuODiOOBmeOCi+OBn+OCge+8iVxyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuYXNzZXRFeGlzdHMocGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcclxuICAgICAgICAgICAgICAgICAgICBgUHJlZmFiIGFscmVhZHkgZXhpc3RzIGF0IFwiJHtwYXRofVwiLiBVc2UgcHJlZmFiX3VwZGF0ZSBpbnN0ZWFkIHRvIHVwZGF0ZSBhbiBleGlzdGluZyBwcmVmYWIuIGAgK1xyXG4gICAgICAgICAgICAgICAgICAgIGBXb3JrZmxvdzogMSkgcHJlZmFiX2luc3RhbnRpYXRlIHRvIHBsYWNlIGluIHNjZW5lLCAyKSBtb2RpZnkgcHJvcGVydGllcywgMykgcHJlZmFiX3VwZGF0ZSB0byBzYXZlLmBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY3JlYXRlLXByZWZhYlwiLCBub2RlVXVpZCwgcGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGVVdWlkLCBwYXRoLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYXNzZXRFeGlzdHMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcGF0dGVybiA9IHBhdGgucmVwbGFjZSgvXFwucHJlZmFiJC8sIFwiXCIpICsgXCIuKlwiO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHsgcGF0dGVybiB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIChyZXN1bHRzIHx8IFtdKS5sZW5ndGggPiAwO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gISFpbmZvO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGluc3RhbnRpYXRlUHJlZmFiKHByZWZhYlV1aWQ6IHN0cmluZywgcGFyZW50Pzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJjcmVhdGUtbm9kZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHByZWZhYlV1aWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlZmFiIOe3qOmbhuODouODvOODieS4reOBruWgtOWQiOOAgeODjeOCueODiCBQcmVmYWIg5oOF5aCx44KS6KiY5oa2XHJcbiAgICAgICAgICAgIC8vIHByZWZhYl91cGRhdGUg5pmC44GrIEpTT04g5b6M5Yem55CG44GnIGFzc2V0L2luc3RhbmNlL25lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMg44KS6Kit5a6aXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdOZXN0ZWRQcmVmYWJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByZWZhYkFzc2V0VXVpZDogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiBwYXJlbnQsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm9kZVV1aWQsIHByZWZhYlV1aWQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHVwZGF0ZVByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiYXBwbHktcHJlZmFiXCIsIG5vZGVVdWlkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOODjeOCueODiCBQcmVmYWIg44GuIEpTT04g5b6M5Yem55CGXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9wZW5kaW5nTmVzdGVkUHJlZmFicy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9maXhOZXN0ZWRQcmVmYWJKc29uKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm9kZVV1aWQsIHJlc3VsdCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwcmVmYWJfdXBkYXRlIOW+jOOBqyBQcmVmYWIgSlNPTiDjgpLlvozlh6bnkIbjgZfjgabjgIHjg43jgrnjg4ggUHJlZmFiIOWPgueFp+OCkuato+OBl+OBj+ioreWumuOBmeOCiy5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBfZml4TmVzdGVkUHJlZmFiSnNvbihfcm9vdE5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAodGhpcy5fcGVuZGluZ05lc3RlZFByZWZhYnMubGVuZ3RoID09PSAwKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIOOCt+ODvOODs+OCkuS/neWtmOOBl+OBpiBQcmVmYWIgSlNPTiDjgpLmm7jjgY3lh7rjgZlcclxuICAgICAgICAgICAgLy8g54++5Zyo44K344O844Oz44GMIHVudGl0bGVkIChzY2VuZS0yZCkg44Gu5aC05ZCI44CBc2F2ZS1zY2VuZSDjga/jg4DjgqTjgqLjg63jgrDjgpLlh7rjgZnjga7jgadcclxuICAgICAgICAgICAgLy8gc2FmZVNhdmVTY2VuZSDjgafjgrnjgq3jg4Pjg5fjgZnjgovjgIJ1bnRpdGxlZCDjgafjgrfjg7zjg7PjgavjgqTjg7Pjgrnjgr/jg7PjgrnjgYzlsYXjgovjgrHjg7zjgrnjga9cclxuICAgICAgICAgICAgLy8g5pys5p2lIHByZWZhYl9vcGVuIOODouODvOODieOBp+OBruOBv+eZuueUn+OBmeOCi+OBruOBpyBzYXZlIOOBjOWKueOBj+aDs+WumuOBoOOBjOOAgVxyXG4gICAgICAgICAgICAvLyDjg4bjgrnjg4jnrYnjgafnm7TmjqXlkbzjgbDjgozjgZ/loLTlkIjjga7kv53orbfjgajjgZfjgaYgc2tpcCDjgZnjgovjgIJcclxuICAgICAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBzYWZlU2F2ZVNjZW5lKCk7XHJcbiAgICAgICAgICAgIGlmICghc2F2ZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcclxuICAgICAgICAgICAgICAgICAgICBcIltQcmVmYWJUb29sc10gX2ZpeE5lc3RlZFByZWZhYkpzb246IHNhdmUtc2NlbmUgc2tpcHBlZCAodW50aXRsZWQgc2NlbmUpLiBcIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJOZXN0ZWQgcHJlZmFiIEpTT04gcG9zdC1wcm9jZXNzaW5nIG1heSBiZSBpbmNvbXBsZXRlLlwiXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxNTAwKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBwcmVmYWJfb3BlbiDjgafoqJjmhrbjgZfjgZ8gVVVJRCDjgYvjgonjg5XjgqHjgqTjg6vjg5HjgrnjgpLlj5blvpdcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9jdXJyZW50UHJlZmFiVXVpZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcHJlZmFiUGF0aCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXHJcbiAgICAgICAgICAgICAgICBcImFzc2V0LWRiXCIsIFwicXVlcnktcGF0aFwiLCB0aGlzLl9jdXJyZW50UHJlZmFiVXVpZFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAoIXByZWZhYlBhdGgpIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHByZWZhYlBhdGgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocHJlZmFiUGF0aCwgXCJ1dGYtOFwiKSk7XHJcblxyXG4gICAgICAgICAgICAvLyDlkITjg43jgrnjg4ggUHJlZmFiIOOCqOODs+ODiOODquOCkuWHpueQhlxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMuX3BlbmRpbmdOZXN0ZWRQcmVmYWJzKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBmaWxlSWQg44Gn44OO44O844OJ44KS5qSc57Si77yIbm9kZVV1aWQg44Gv44K344O844Oz5YaFIFVVSUTjgIFQcmVmYWIgSlNPTiDlhoXjgafjga8gZmlsZUlk77yJXHJcbiAgICAgICAgICAgICAgICBsZXQgZmxwTm9kZUlkeCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbaV0uX190eXBlX18gPT09IFwiY2MuUHJlZmFiSW5mb1wiICYmIGRhdGFbaV0uZmlsZUlkID09PSBlbnRyeS5ub2RlVXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDjgZPjga4gUHJlZmFiSW5mbyDjgpLmjIHjgaTjg47jg7zjg4njgpLmjqLjgZlcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkYXRhLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YVtqXS5fcHJlZmFiPy5fX2lkX18gPT09IGkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbHBOb2RlSWR4ID0gajtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gZmlsZUlkIOOBp+imi+OBpOOBi+OCieOBquOBhOWgtOWQiOOAgeODjuODvOODieWQjeOBp+aknOe0olxyXG4gICAgICAgICAgICAgICAgaWYgKGZscE5vZGVJZHggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmFiIOOCouOCu+ODg+ODiOWQjeOCkuWPluW+l1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgZW50cnkucHJlZmFiQXNzZXRVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldE5hbWUgPSBhc3NldEluZm8/Lm5hbWU/LnJlcGxhY2UoXCIucHJlZmFiXCIsIFwiXCIpIHx8IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhW2ldLl9fdHlwZV9fID09PSBcImNjLk5vZGVcIiAmJiAoZGF0YVtpXS5fbmFtZSA9PT0gYXNzZXROYW1lIHx8IGRhdGFbaV0uX25hbWUgPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYklkeCA9IGRhdGFbaV0uX3ByZWZhYj8uX19pZF9fO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZWZhYklkeCAhPSBudWxsICYmIGRhdGFbcHJlZmFiSWR4XT8uYXNzZXQ/Ll9faWRfXyA9PT0gMCAmJiAhZGF0YVtwcmVmYWJJZHhdPy5pbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZscE5vZGVJZHggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmbHBOb2RlSWR4IDwgMCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5mb0lkeCA9IGRhdGFbZmxwTm9kZUlkeF0uX3ByZWZhYj8uX19pZF9fO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZWZhYkluZm9JZHggPT0gbnVsbCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHJlZmFiSW5mbyDjgpLkv67mraNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBkYXRhW3ByZWZhYkluZm9JZHhdO1xyXG4gICAgICAgICAgICAgICAgcHJlZmFiSW5mby5yb290ID0geyBfX2lkX186IGZscE5vZGVJZHggfTtcclxuICAgICAgICAgICAgICAgIHByZWZhYkluZm8uYXNzZXQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX191dWlkX186IGVudHJ5LnByZWZhYkFzc2V0VXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBfX2V4cGVjdGVkVHlwZV9fOiBcImNjLlByZWZhYlwiLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmVmYWJJbnN0YW5jZSDjgpLov73liqBcclxuICAgICAgICAgICAgICAgIGlmICghcHJlZmFiSW5mby5pbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlSWR4ID0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuUHJlZmFiSW5zdGFuY2VcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUlkOiBjcnlwdG8ucmFuZG9tQnl0ZXMoMTYpLnRvU3RyaW5nKFwiYmFzZTY0XCIpLnJlcGxhY2UoL1srLz1dL2csIFwiXCIpLnN1YnN0cmluZygwLCAyMiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlJvb3ROb2RlOiB7IF9faWRfXzogMSB9LCAvLyBQcmVmYWIg57eo6ZuG44Oi44O844OJ44Gu44Or44O844OIXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdW50ZWRDaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdW50ZWRDb21wb25lbnRzOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlPdmVycmlkZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkQ29tcG9uZW50czogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IHsgX19pZF9fOiBpbnN0YW5jZUlkeCB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIOWtkOODjuODvOODieODu+OCs+ODs+ODneODvOODjeODs+ODiOOCkuOCr+ODquOCou+8iFByZWZhYiDjgqLjgrvjg4Pjg4jjgYvjgonlvqnlhYPjgZXjgozjgovvvIlcclxuICAgICAgICAgICAgICAgIGRhdGFbZmxwTm9kZUlkeF0uX2NoaWxkcmVuID0gW107XHJcbiAgICAgICAgICAgICAgICBkYXRhW2ZscE5vZGVJZHhdLl9jb21wb25lbnRzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g44Or44O844OI44GuIG5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMg44Gr6L+95YqgXHJcbiAgICAgICAgICAgICAgICBjb25zdCByb290UHJlZmFiSWR4ID0gZGF0YVsxXS5fcHJlZmFiPy5fX2lkX187XHJcbiAgICAgICAgICAgICAgICBpZiAocm9vdFByZWZhYklkeCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdFByZWZhYiA9IGRhdGFbcm9vdFByZWZhYklkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyb290UHJlZmFiLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByZWZhYi5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFscmVhZHlOZXN0ZWQgPSByb290UHJlZmFiLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMuc29tZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHI6IGFueSkgPT4gcj8uX19pZF9fID09PSBmbHBOb2RlSWR4XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWFscmVhZHlOZXN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByZWZhYi5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzLnB1c2goeyBfX2lkX186IGZscE5vZGVJZHggfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHByZWZhYlBhdGgsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nTmVzdGVkUHJlZmFicyA9IFtdO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJbUHJlZmFiVG9vbHNdIF9maXhOZXN0ZWRQcmVmYWJKc29uIGZhaWxlZDpcIiwgZS5tZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZXZlcnRQcmVmYWIobm9kZVV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJldmVydC1wcmVmYWJcIiwgbm9kZVV1aWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlVXVpZCwgcmVzdWx0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFByZWZhYkluZm8odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgdXVpZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGluZm8gfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlQW5kUmVwbGFjZShub2RlVXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyAxLiBDaGVjayBpZiBwcmVmYWIgYWxyZWFkeSBleGlzdHNcclxuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLmFzc2V0RXhpc3RzKHBhdGgpO1xyXG4gICAgICAgICAgICBpZiAoZXhpc3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXHJcbiAgICAgICAgICAgICAgICAgICAgYFByZWZhYiBhbHJlYWR5IGV4aXN0cyBhdCBcIiR7cGF0aH1cIi4gRGVsZXRlIGl0IGZpcnN0IG9yIHVzZSBhIGRpZmZlcmVudCBwYXRoLmBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIDIuIEdldCBub2RlIGluZm8gKHBhcmVudCwgc2libGluZyBpbmRleCwgdHJhbnNmb3JtKSBiZWZvcmUgY3JlYXRpbmcgcHJlZmFiXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFtub2RlVXVpZF0pO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVJbmZvPy5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBOb2RlICR7bm9kZVV1aWR9IG5vdCBmb3VuZGApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSBub2RlSW5mby5kYXRhPy5wYXJlbnQ7XHJcblxyXG4gICAgICAgICAgICAvLyAzLiBDcmVhdGUgcHJlZmFiIGZyb20gdGhlIG5vZGVcclxuICAgICAgICAgICAgY29uc3QgcHJlZmFiQXNzZXRVdWlkID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY3JlYXRlLXByZWZhYlwiLCBub2RlVXVpZCwgcGF0aCk7XHJcbiAgICAgICAgICAgIGlmICghcHJlZmFiQXNzZXRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFwiY3JlYXRlLXByZWZhYiByZXR1cm5lZCBubyBhc3NldCBVVUlEXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyA0LiBEZWxldGUgdGhlIG9yaWdpbmFsIG5vZGVcclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVtb3ZlLW5vZGVcIiwgeyB1dWlkOiBub2RlVXVpZCB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIDUuIEluc3RhbnRpYXRlIHRoZSBwcmVmYWIgYXQgdGhlIHNhbWUgcGFyZW50XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGVVdWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiY3JlYXRlLW5vZGVcIiwge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50OiBwYXJlbnRVdWlkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogcHJlZmFiQXNzZXRVdWlkLFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcHJlZmFiQXNzZXRVdWlkLFxyXG4gICAgICAgICAgICAgICAgcHJlZmFiUGF0aDogcGF0aCxcclxuICAgICAgICAgICAgICAgIG9yaWdpbmFsTm9kZVV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgbmV3SW5zdGFuY2VVdWlkOiBuZXdOb2RlVXVpZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgb3BlblByZWZhYih1dWlkPzogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBmb3JjZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gUHJlZmFiIOOCkumWi+OBj+OBqOOBjeOCguWGhemDqOeahOOBq+OCt+ODvOODs+WIh+abv+OBjOeZuueUn+OBmeOCi+OBruOBpyBkaXJ0eSB1bnRpdGxlZCDjg4Hjgqfjg4Pjgq9cclxuICAgICAgICAgICAgYXdhaXQgZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2goZm9yY2UpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVzb2x2ZSBVVUlEIGZyb20gcGF0aCBpZiBuZWVkZWRcclxuICAgICAgICAgICAgbGV0IGFzc2V0VXVpZCA9IHV1aWQ7XHJcbiAgICAgICAgICAgIGlmICghYXNzZXRVdWlkICYmIHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldC1pbmZvXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkID0gaW5mbz8udXVpZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWFzc2V0VXVpZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcIkVpdGhlciB1dWlkIG9yIHBhdGggaXMgcmVxdWlyZWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE9wZW4gcHJlZmFiIGluIGVkaXRpbmcgbW9kZSAoZXF1aXZhbGVudCB0byBkb3VibGUtY2xpY2spXHJcbiAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcIm9wZW4tYXNzZXRcIiwgYXNzZXRVdWlkKTtcclxuICAgICAgICAgICAgLy8gV2FpdCBmb3IgcHJlZmFiIGVkaXRpbmcgbW9kZSB0byBpbml0aWFsaXplXHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50UHJlZmFiVXVpZCA9IGFzc2V0VXVpZDtcclxuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ05lc3RlZFByZWZhYnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFzc2V0VXVpZCwgbW9kZTogXCJwcmVmYWItZWRpdFwiIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNsb3NlUHJlZmFiKHNhdmU6IGJvb2xlYW4sIHNjZW5lVXVpZD86IHN0cmluZywgZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIDEuIFNhdmUgcHJlZmFiIGlmIHJlcXVlc3RlZFxyXG4gICAgICAgICAgICAvLyBwcmVmYWIgZWRpdCDjg6Ljg7zjg4nkuK3jga8gXCJjdXJyZW50IHNjZW5lXCIgPSDnt6jpm4bkuK0gUHJlZmFiIOOBquOBruOBpyBzYXZlLXNjZW5lIOOBryBQcmVmYWIg44KS5L+d5a2Y44GZ44KL44CCXHJcbiAgICAgICAgICAgIC8vIOOBn+OBoOOBlyB1bnRpdGxlZCDjg5Xjgqnjg7zjg6vjg5Djg4Pjgq/jgavlvZPjgZ/jgaPjgZ/loLTlkIjjga/jg4DjgqTjgqLjg63jgrDlm57pgb/jga7jgZ/jgoHjgrnjgq3jg4Pjg5fjgZnjgovjgIJcclxuICAgICAgICAgICAgaWYgKHNhdmUpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHNhZmVTYXZlU2NlbmUoKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCA1MDApKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMi4gRGV0ZXJtaW5lIHdoaWNoIHNjZW5lIHRvIHJldHVybiB0b1xyXG4gICAgICAgICAgICBsZXQgdGFyZ2V0U2NlbmUgPSBzY2VuZVV1aWQ7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0U2NlbmUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRyeSBwcm9qZWN0J3Mgc3RhcnQgc2NlbmVcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0U2NlbmUgPSBhd2FpdCAoRWRpdG9yIGFzIGFueSkuUHJvZmlsZS5nZXRDb25maWcoXCJwcmV2aWV3XCIsIFwiZ2VuZXJhbC5zdGFydF9zY2VuZVwiLCBcImxvY2FsXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gZmlyc3Qgc2NlbmVcclxuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0U2NlbmUgfHwgdGFyZ2V0U2NlbmUgPT09IFwiY3VycmVudF9zY2VuZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2NUeXBlOiBcImNjLlNjZW5lQXNzZXRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogXCJkYjovL2Fzc2V0cy8qKi8qXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NlbmVzKSAmJiBzY2VuZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRTY2VuZSA9IHNjZW5lc1swXS51dWlkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMy4gT3BlbiB0aGUgc2NlbmVcclxuICAgICAgICAgICAgaWYgKHRhcmdldFNjZW5lKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwcmVmYWIgZWRpdCDjg6Ljg7zjg4njgYvjgonmiLvjgovpgbfnp7vjgoLjg4DjgqTjgqLjg63jgrDjgYzlh7rjgYbjgotcclxuICAgICAgICAgICAgICAgIGF3YWl0IGVuc3VyZVNjZW5lU2FmZVRvU3dpdGNoKGZvcmNlKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcIm9wZW4tc2NlbmVcIiwgdGFyZ2V0U2NlbmUpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmV0dXJuZWRUb1NjZW5lOiB0YXJnZXRTY2VuZSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgbWV0aG9kLFxyXG4gICAgICAgICAgICBhcmdzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==