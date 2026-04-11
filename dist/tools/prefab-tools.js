"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabTools = void 0;
const tool_base_1 = require("../tool-base");
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
                description: "Open a prefab in editing mode. Equivalent to double-clicking the prefab in CocosCreator. Save the current scene first if needed.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Prefab asset UUID" },
                        path: { type: "string", description: "Prefab db:// path (alternative to uuid)" },
                    },
                },
            },
            {
                name: "prefab_close",
                description: "Save and close the current prefab editing mode, then return to the main scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        save: { type: "boolean", description: "Save prefab before closing (default true)" },
                        sceneUuid: { type: "string", description: "Scene UUID to return to (default: project's start scene or first scene)" },
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
                return this.openPrefab(args.uuid, args.path);
            case "prefab_close":
                return this.closePrefab(args.save !== false, args.sceneUuid);
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
            await Editor.Message.send("scene", "save-scene");
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
    async openPrefab(uuid, path) {
        try {
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
    async closePrefab(save, sceneUuid) {
        try {
            // 1. Save prefab if requested
            if (save) {
                await Editor.Message.send("scene", "save-scene");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3ByZWZhYi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw0Q0FBdUM7QUFDdkMsNENBQW9CO0FBRXBCLG9EQUE0QjtBQUU1QixNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQztBQVNyQyxNQUFhLFdBQVc7SUFBeEI7UUFDYSxpQkFBWSxHQUFHLFFBQVEsQ0FBQztRQUN6QiwwQkFBcUIsR0FBd0IsRUFBRSxDQUFDO1FBQ3hELHdDQUF3QztRQUNoQyx1QkFBa0IsR0FBa0IsSUFBSSxDQUFDO0lBbWZyRCxDQUFDO0lBamZHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLFdBQVcsRUFBRSx1Q0FBdUM7Z0JBQ3BELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxlQUFlO2dCQUNyQixXQUFXLEVBQUUsb0ZBQW9GO2dCQUNqRyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGlDQUFpQyxFQUFFO3dCQUN4RSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx3RUFBd0UsRUFBRTtxQkFDbEg7b0JBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztpQkFDN0I7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxvQkFBb0I7Z0JBQzFCLFdBQVcsRUFBRSxzQ0FBc0M7Z0JBQ25ELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsVUFBVSxFQUFFLEVBQUUsSUFBSSxF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QUFPLENBQUMsT0FBZSxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUVELE9BQU8sSUFBQSxjQUFFLEVBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxJQUFBLGVBQUcsRUFBQyxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsSUFBVztRQUNqRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEVBQUUsbUJBQW1CO1lBQ3pCLE1BQU07WUFDTixJQUFJO1NBQ1AsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBdmZELGtDQXVmQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgY3J5cHRvIGZyb20gXCJjcnlwdG9cIjtcclxuXHJcbmNvbnN0IEVYVF9OQU1FID0gXCJjb2Nvcy1jcmVhdG9yLW1jcFwiO1xyXG5cclxuLyoqIHByZWZhYl9pbnN0YW50aWF0ZSDjgafphY3nva7jgZfjgZ/jg43jgrnjg4ggUHJlZmFiIOaDheWgseOCkuiomOaGtiAqL1xyXG5pbnRlcmZhY2UgTmVzdGVkUHJlZmFiRW50cnkge1xyXG4gICAgbm9kZVV1aWQ6IHN0cmluZztcclxuICAgIHByZWZhYkFzc2V0VXVpZDogc3RyaW5nO1xyXG4gICAgcGFyZW50VXVpZDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUHJlZmFiVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJwcmVmYWJcIjtcclxuICAgIHByaXZhdGUgX3BlbmRpbmdOZXN0ZWRQcmVmYWJzOiBOZXN0ZWRQcmVmYWJFbnRyeVtdID0gW107XHJcbiAgICAvKiogcHJlZmFiX29wZW4g44Gn6ZaL44GE44GfIFByZWZhYiDjgqLjgrvjg4Pjg4ggVVVJRCAqL1xyXG4gICAgcHJpdmF0ZSBfY3VycmVudFByZWZhYlV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2xpc3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkxpc3QgYWxsIHByZWZhYiBmaWxlcyBpbiB0aGUgcHJvamVjdC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2NyZWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3JlYXRlIGEgcHJlZmFiIGZyb20gYW4gZXhpc3Rpbmcgbm9kZSBpbiB0aGUgc2NlbmUuIFRoZSBub2RlIHJlbWFpbnMgaW4gdGhlIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgdG8gY3JlYXRlIHByZWZhYiBmcm9tXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJkYjovLyBwYXRoIGZvciB0aGUgcHJlZmFiIChlLmcuICdkYjovL2Fzc2V0cy9wcmVmYWJzL015UHJlZmFiLnByZWZhYicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2luc3RhbnRpYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJJbnN0YW50aWF0ZSBhIHByZWZhYiBpbnRvIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmFiIGFzc2V0IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUGFyZW50IG5vZGUgVVVJRCAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIHNjZW5lIHJvb3QpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwcmVmYWJVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfZ2V0X2luZm9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBpbmZvcm1hdGlvbiBhYm91dCBhIHByZWZhYiBhc3NldCAobmFtZSwgcGF0aCwgVVVJRCkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBhc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfdXBkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJVcGRhdGUgKHJlLXNhdmUpIGEgcHJlZmFiIGZyb20gaXRzIGluc3RhbmNlIG5vZGUgaW4gdGhlIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgb2YgdGhlIHByZWZhYiBpbnN0YW5jZSBpbiB0aGUgc2NlbmVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9kdXBsaWNhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkR1cGxpY2F0ZSBhIHByZWZhYiBhc3NldCB0byBhIG5ldyBwYXRoLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlNvdXJjZSBwcmVmYWIgZGI6Ly8gcGF0aFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkRlc3RpbmF0aW9uIGRiOi8vIHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInNvdXJjZVwiLCBcImRlc3RpbmF0aW9uXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfdmFsaWRhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlZhbGlkYXRlIGEgcHJlZmFiIGZvciBtaXNzaW5nIHJlZmVyZW5jZXMgb3IgYnJva2VuIGxpbmtzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgYXNzZXQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX3JldmVydFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmV2ZXJ0IGEgcHJlZmFiIGluc3RhbmNlIG5vZGUgdG8gaXRzIG9yaWdpbmFsIHByZWZhYiBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIG9mIHRoZSBwcmVmYWIgaW5zdGFuY2VcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9jcmVhdGVfYW5kX3JlcGxhY2VcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIHByZWZhYiBmcm9tIGEgbm9kZSBBTkQgcmVwbGFjZSB0aGUgb3JpZ2luYWwgbm9kZSB3aXRoIGEgcHJlZmFiIGluc3RhbmNlLiBUaGlzIGlzIHRoZSByZWNvbW1lbmRlZCB3YXkgdG8gZXh0cmFjdCBhIG5lc3RlZCBwcmVmYWIg4oCUIG9uZSBjb21tYW5kIGluc3RlYWQgb2YgY3JlYXRlIOKGkiBkZWxldGUg4oaSIGluc3RhbnRpYXRlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgdG8gY3JlYXRlIHByZWZhYiBmcm9tXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJkYjovLyBwYXRoIGZvciB0aGUgcHJlZmFiIChlLmcuICdkYjovL2Fzc2V0cy9wcmVmYWJzL015UHJlZmFiLnByZWZhYicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX29wZW5cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk9wZW4gYSBwcmVmYWIgaW4gZWRpdGluZyBtb2RlLiBFcXVpdmFsZW50IHRvIGRvdWJsZS1jbGlja2luZyB0aGUgcHJlZmFiIGluIENvY29zQ3JlYXRvci4gU2F2ZSB0aGUgY3VycmVudCBzY2VuZSBmaXJzdCBpZiBuZWVkZWQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBhc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgZGI6Ly8gcGF0aCAoYWx0ZXJuYXRpdmUgdG8gdXVpZClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9jbG9zZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgcHJlZmFiIGVkaXRpbmcgbW9kZSwgdGhlbiByZXR1cm4gdG8gdGhlIG1haW4gc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJTYXZlIHByZWZhYiBiZWZvcmUgY2xvc2luZyAoZGVmYXVsdCB0cnVlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lVXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTY2VuZSBVVUlEIHRvIHJldHVybiB0byAoZGVmYXVsdDogcHJvamVjdCdzIHN0YXJ0IHNjZW5lIG9yIGZpcnN0IHNjZW5lKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfbGlzdFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdFByZWZhYnMoKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9jcmVhdGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVByZWZhYihhcmdzLnV1aWQsIGFyZ3MucGF0aCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfaW5zdGFudGlhdGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbnRpYXRlUHJlZmFiKGFyZ3MucHJlZmFiVXVpZCwgYXJncy5wYXJlbnQpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2dldF9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRQcmVmYWJJbmZvKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfdXBkYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVQcmVmYWIoYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9kdXBsaWNhdGVcIjoge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJjb3B5LWFzc2V0XCIsIGFyZ3Muc291cmNlLCBhcmdzLmRlc3RpbmF0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzb3VyY2U6IGFyZ3Muc291cmNlLCBkZXN0aW5hdGlvbjogYXJncy5kZXN0aW5hdGlvbiB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl92YWxpZGF0ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldC1pbmZvXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVwcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWRlcGVuZHNcIiwgYXJncy51dWlkKS5jYXRjaCgoKSA9PiBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkLCBpbmZvLCBkZXBlbmRlbmNpZXM6IGRlcHMsIHZhbGlkOiAhIWluZm8gfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfcmV2ZXJ0XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnRQcmVmYWIoYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9jcmVhdGVfYW5kX3JlcGxhY2VcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUFuZFJlcGxhY2UoYXJncy51dWlkLCBhcmdzLnBhdGgpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX29wZW5cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wZW5QcmVmYWIoYXJncy51dWlkLCBhcmdzLnBhdGgpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2Nsb3NlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9zZVByZWZhYihhcmdzLnNhdmUgIT09IGZhbHNlLCBhcmdzLnNjZW5lVXVpZCk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgbGlzdFByZWZhYnMoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0c1wiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiBcImRiOi8vYXNzZXRzLyoqLyoucHJlZmFiXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJzID0gKHJlc3VsdHMgfHwgW10pLm1hcCgoYTogYW55KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgdXVpZDogYS51dWlkLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogYS5wYXRoIHx8IGEudXJsLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogYS5uYW1lLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHByZWZhYnMgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlUHJlZmFiKG5vZGVVdWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIOaXouWtmFByZWZhYuOBjOOBguOCi+WgtOWQiOOBr+itpuWRiuOCkui/lOOBme+8iOS4iuabuOOBjeODgOOCpOOCouODreOCsOOBp+OCv+OCpOODoOOCouOCpuODiOOBmeOCi+OBn+OCge+8iVxyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuYXNzZXRFeGlzdHMocGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcclxuICAgICAgICAgICAgICAgICAgICBgUHJlZmFiIGFscmVhZHkgZXhpc3RzIGF0IFwiJHtwYXRofVwiLiBVc2UgcHJlZmFiX3VwZGF0ZSBpbnN0ZWFkIHRvIHVwZGF0ZSBhbiBleGlzdGluZyBwcmVmYWIuIGAgK1xyXG4gICAgICAgICAgICAgICAgICAgIGBXb3JrZmxvdzogMSkgcHJlZmFiX2luc3RhbnRpYXRlIHRvIHBsYWNlIGluIHNjZW5lLCAyKSBtb2RpZnkgcHJvcGVydGllcywgMykgcHJlZmFiX3VwZGF0ZSB0byBzYXZlLmBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY3JlYXRlLXByZWZhYlwiLCBub2RlVXVpZCwgcGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGVVdWlkLCBwYXRoLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYXNzZXRFeGlzdHMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcGF0dGVybiA9IHBhdGgucmVwbGFjZSgvXFwucHJlZmFiJC8sIFwiXCIpICsgXCIuKlwiO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHsgcGF0dGVybiB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIChyZXN1bHRzIHx8IFtdKS5sZW5ndGggPiAwO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gISFpbmZvO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGluc3RhbnRpYXRlUHJlZmFiKHByZWZhYlV1aWQ6IHN0cmluZywgcGFyZW50Pzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJjcmVhdGUtbm9kZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHByZWZhYlV1aWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlZmFiIOe3qOmbhuODouODvOODieS4reOBruWgtOWQiOOAgeODjeOCueODiCBQcmVmYWIg5oOF5aCx44KS6KiY5oa2XHJcbiAgICAgICAgICAgIC8vIHByZWZhYl91cGRhdGUg5pmC44GrIEpTT04g5b6M5Yem55CG44GnIGFzc2V0L2luc3RhbmNlL25lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMg44KS6Kit5a6aXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdOZXN0ZWRQcmVmYWJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByZWZhYkFzc2V0VXVpZDogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiBwYXJlbnQsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm9kZVV1aWQsIHByZWZhYlV1aWQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHVwZGF0ZVByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiYXBwbHktcHJlZmFiXCIsIG5vZGVVdWlkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOODjeOCueODiCBQcmVmYWIg44GuIEpTT04g5b6M5Yem55CGXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9wZW5kaW5nTmVzdGVkUHJlZmFicy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9maXhOZXN0ZWRQcmVmYWJKc29uKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm9kZVV1aWQsIHJlc3VsdCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwcmVmYWJfdXBkYXRlIOW+jOOBqyBQcmVmYWIgSlNPTiDjgpLlvozlh6bnkIbjgZfjgabjgIHjg43jgrnjg4ggUHJlZmFiIOWPgueFp+OCkuato+OBl+OBj+ioreWumuOBmeOCiy5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBfZml4TmVzdGVkUHJlZmFiSnNvbihfcm9vdE5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAodGhpcy5fcGVuZGluZ05lc3RlZFByZWZhYnMubGVuZ3RoID09PSAwKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIOOCt+ODvOODs+OCkuS/neWtmOOBl+OBpiBQcmVmYWIgSlNPTiDjgpLmm7jjgY3lh7rjgZlcclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnNlbmQgYXMgYW55KShcInNjZW5lXCIsIFwic2F2ZS1zY2VuZVwiKTtcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDE1MDApKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHByZWZhYl9vcGVuIOOBp+iomOaGtuOBl+OBnyBVVUlEIOOBi+OCieODleOCoeOCpOODq+ODkeOCueOCkuWPluW+l1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2N1cnJlbnRQcmVmYWJVdWlkKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJQYXRoID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcclxuICAgICAgICAgICAgICAgIFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1wYXRoXCIsIHRoaXMuX2N1cnJlbnRQcmVmYWJVdWlkXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICghcHJlZmFiUGF0aCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocHJlZmFiUGF0aCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwcmVmYWJQYXRoLCBcInV0Zi04XCIpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWQhOODjeOCueODiCBQcmVmYWIg44Ko44Oz44OI44Oq44KS5Yem55CGXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5fcGVuZGluZ05lc3RlZFByZWZhYnMpIHtcclxuICAgICAgICAgICAgICAgIC8vIGZpbGVJZCDjgafjg47jg7zjg4njgpLmpJzntKLvvIhub2RlVXVpZCDjga/jgrfjg7zjg7PlhoUgVVVJROOAgVByZWZhYiBKU09OIOWGheOBp+OBryBmaWxlSWTvvIlcclxuICAgICAgICAgICAgICAgIGxldCBmbHBOb2RlSWR4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YVtpXS5fX3R5cGVfXyA9PT0gXCJjYy5QcmVmYWJJbmZvXCIgJiYgZGF0YVtpXS5maWxlSWQgPT09IGVudHJ5Lm5vZGVVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOOBk+OBriBQcmVmYWJJbmZvIOOCkuaMgeOBpOODjuODvOODieOCkuaOouOBmVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRhdGEubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhW2pdLl9wcmVmYWI/Ll9faWRfXyA9PT0gaSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZscE5vZGVJZHggPSBqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBmaWxlSWQg44Gn6KaL44Gk44GL44KJ44Gq44GE5aC05ZCI44CB44OO44O844OJ5ZCN44Gn5qSc57SiXHJcbiAgICAgICAgICAgICAgICBpZiAoZmxwTm9kZUlkeCA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQcmVmYWIg44Ki44K744OD44OI5ZCN44KS5Y+W5b6XXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCBlbnRyeS5wcmVmYWJBc3NldFV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0TmFtZSA9IGFzc2V0SW5mbz8ubmFtZT8ucmVwbGFjZShcIi5wcmVmYWJcIiwgXCJcIikgfHwgXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbaV0uX190eXBlX18gPT09IFwiY2MuTm9kZVwiICYmIChkYXRhW2ldLl9uYW1lID09PSBhc3NldE5hbWUgfHwgZGF0YVtpXS5fbmFtZSA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSWR4ID0gZGF0YVtpXS5fcHJlZmFiPy5fX2lkX187XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlZmFiSWR4ICE9IG51bGwgJiYgZGF0YVtwcmVmYWJJZHhdPy5hc3NldD8uX19pZF9fID09PSAwICYmICFkYXRhW3ByZWZhYklkeF0/Lmluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxwTm9kZUlkeCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZscE5vZGVJZHggPCAwKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJJbmZvSWR4ID0gZGF0YVtmbHBOb2RlSWR4XS5fcHJlZmFiPy5fX2lkX187XHJcbiAgICAgICAgICAgICAgICBpZiAocHJlZmFiSW5mb0lkeCA9PSBudWxsKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmVmYWJJbmZvIOOCkuS/ruato1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IGRhdGFbcHJlZmFiSW5mb0lkeF07XHJcbiAgICAgICAgICAgICAgICBwcmVmYWJJbmZvLnJvb3QgPSB7IF9faWRfXzogZmxwTm9kZUlkeCB9O1xyXG4gICAgICAgICAgICAgICAgcHJlZmFiSW5mby5hc3NldCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBfX3V1aWRfXzogZW50cnkucHJlZmFiQXNzZXRVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIF9fZXhwZWN0ZWRUeXBlX186IFwiY2MuUHJlZmFiXCIsXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFByZWZhYkluc3RhbmNlIOOCkui/veWKoFxyXG4gICAgICAgICAgICAgICAgaWYgKCFwcmVmYWJJbmZvLmluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5zdGFuY2VJZHggPSBkYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5QcmVmYWJJbnN0YW5jZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlSWQ6IGNyeXB0by5yYW5kb21CeXRlcygxNikudG9TdHJpbmcoXCJiYXNlNjRcIikucmVwbGFjZSgvWysvPV0vZywgXCJcIikuc3Vic3RyaW5nKDAsIDIyKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUm9vdE5vZGU6IHsgX19pZF9fOiAxIH0sIC8vIFByZWZhYiDnt6jpm4bjg6Ljg7zjg4njga7jg6vjg7zjg4hcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW91bnRlZENoaWxkcmVuOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW91bnRlZENvbXBvbmVudHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU92ZXJyaWRlczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWRDb21wb25lbnRzOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlID0geyBfX2lkX186IGluc3RhbmNlSWR4IH07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5a2Q44OO44O844OJ44O744Kz44Oz44Od44O844ON44Oz44OI44KS44Kv44Oq44Ki77yIUHJlZmFiIOOCouOCu+ODg+ODiOOBi+OCieW+qeWFg+OBleOCjOOCi++8iVxyXG4gICAgICAgICAgICAgICAgZGF0YVtmbHBOb2RlSWR4XS5fY2hpbGRyZW4gPSBbXTtcclxuICAgICAgICAgICAgICAgIGRhdGFbZmxwTm9kZUlkeF0uX2NvbXBvbmVudHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDjg6vjg7zjg4jjga4gbmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cyDjgavov73liqBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RQcmVmYWJJZHggPSBkYXRhWzFdLl9wcmVmYWI/Ll9faWRfXztcclxuICAgICAgICAgICAgICAgIGlmIChyb290UHJlZmFiSWR4ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290UHJlZmFiID0gZGF0YVtyb290UHJlZmFiSWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJvb3RQcmVmYWIubmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByb290UHJlZmFiLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxyZWFkeU5lc3RlZCA9IHJvb3RQcmVmYWIubmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cy5zb21lKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAocjogYW55KSA9PiByPy5fX2lkX18gPT09IGZscE5vZGVJZHhcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYWxyZWFkeU5lc3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByb290UHJlZmFiLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMucHVzaCh7IF9faWRfXzogZmxwTm9kZUlkeCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMocHJlZmFiUGF0aCwgSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMiksIFwidXRmLThcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdOZXN0ZWRQcmVmYWJzID0gW107XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIltQcmVmYWJUb29sc10gX2ZpeE5lc3RlZFByZWZhYkpzb24gZmFpbGVkOlwiLCBlLm1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJldmVydFByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmV2ZXJ0LXByZWZhYlwiLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGVVdWlkLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0UHJlZmFiSW5mbyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCB1dWlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaW5mbyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVBbmRSZXBsYWNlKG5vZGVVdWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIDEuIENoZWNrIGlmIHByZWZhYiBhbHJlYWR5IGV4aXN0c1xyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuYXNzZXRFeGlzdHMocGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcclxuICAgICAgICAgICAgICAgICAgICBgUHJlZmFiIGFscmVhZHkgZXhpc3RzIGF0IFwiJHtwYXRofVwiLiBEZWxldGUgaXQgZmlyc3Qgb3IgdXNlIGEgZGlmZmVyZW50IHBhdGguYFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMi4gR2V0IG5vZGUgaW5mbyAocGFyZW50LCBzaWJsaW5nIGluZGV4LCB0cmFuc2Zvcm0pIGJlZm9yZSBjcmVhdGluZyBwcmVmYWJcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW25vZGVVdWlkXSk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYE5vZGUgJHtub2RlVXVpZH0gbm90IGZvdW5kYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcGFyZW50VXVpZCA9IG5vZGVJbmZvLmRhdGE/LnBhcmVudDtcclxuXHJcbiAgICAgICAgICAgIC8vIDMuIENyZWF0ZSBwcmVmYWIgZnJvbSB0aGUgbm9kZVxyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJBc3NldFV1aWQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjcmVhdGUtcHJlZmFiXCIsIG5vZGVVdWlkLCBwYXRoKTtcclxuICAgICAgICAgICAgaWYgKCFwcmVmYWJBc3NldFV1aWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXCJjcmVhdGUtcHJlZmFiIHJldHVybmVkIG5vIGFzc2V0IFVVSURcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIDQuIERlbGV0ZSB0aGUgb3JpZ2luYWwgbm9kZVxyXG4gICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZW1vdmUtbm9kZVwiLCB7IHV1aWQ6IG5vZGVVdWlkIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gNS4gSW5zdGFudGlhdGUgdGhlIHByZWZhYiBhdCB0aGUgc2FtZSBwYXJlbnRcclxuICAgICAgICAgICAgY29uc3QgbmV3Tm9kZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJjcmVhdGUtbm9kZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudFV1aWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBwcmVmYWJBc3NldFV1aWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwcmVmYWJBc3NldFV1aWQsXHJcbiAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBwYXRoLFxyXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxOb2RlVXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZVV1aWQ6IG5ld05vZGVVdWlkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuUHJlZmFiKHV1aWQ/OiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBSZXNvbHZlIFVVSUQgZnJvbSBwYXRoIGlmIG5lZWRlZFxyXG4gICAgICAgICAgICBsZXQgYXNzZXRVdWlkID0gdXVpZDtcclxuICAgICAgICAgICAgaWYgKCFhc3NldFV1aWQgJiYgcGF0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQgPSBpbmZvPy51dWlkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghYXNzZXRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFwiRWl0aGVyIHV1aWQgb3IgcGF0aCBpcyByZXF1aXJlZFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gT3BlbiBwcmVmYWIgaW4gZWRpdGluZyBtb2RlIChlcXVpdmFsZW50IHRvIGRvdWJsZS1jbGljaylcclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwib3Blbi1hc3NldFwiLCBhc3NldFV1aWQpO1xyXG4gICAgICAgICAgICAvLyBXYWl0IGZvciBwcmVmYWIgZWRpdGluZyBtb2RlIHRvIGluaXRpYWxpemVcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRQcmVmYWJVdWlkID0gYXNzZXRVdWlkO1xyXG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nTmVzdGVkUHJlZmFicyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXNzZXRVdWlkLCBtb2RlOiBcInByZWZhYi1lZGl0XCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY2xvc2VQcmVmYWIoc2F2ZTogYm9vbGVhbiwgc2NlbmVVdWlkPzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gMS4gU2F2ZSBwcmVmYWIgaWYgcmVxdWVzdGVkXHJcbiAgICAgICAgICAgIGlmIChzYXZlKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2Uuc2VuZCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzYXZlLXNjZW5lXCIpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDUwMCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAyLiBEZXRlcm1pbmUgd2hpY2ggc2NlbmUgdG8gcmV0dXJuIHRvXHJcbiAgICAgICAgICAgIGxldCB0YXJnZXRTY2VuZSA9IHNjZW5lVXVpZDtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXRTY2VuZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJ5IHByb2plY3QncyBzdGFydCBzY2VuZVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRTY2VuZSA9IGF3YWl0IChFZGl0b3IgYXMgYW55KS5Qcm9maWxlLmdldENvbmZpZyhcInByZXZpZXdcIiwgXCJnZW5lcmFsLnN0YXJ0X3NjZW5lXCIsIFwibG9jYWxcIik7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGYWxsYmFjayB0byBmaXJzdCBzY2VuZVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRTY2VuZSB8fCB0YXJnZXRTY2VuZSA9PT0gXCJjdXJyZW50X3NjZW5lXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZXMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjY1R5cGU6IFwiY2MuU2NlbmVBc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBcImRiOi8vYXNzZXRzLyoqLypcIixcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2VuZXMpICYmIHNjZW5lcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFNjZW5lID0gc2NlbmVzWzBdLnV1aWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAzLiBPcGVuIHRoZSBzY2VuZVxyXG4gICAgICAgICAgICBpZiAodGFyZ2V0U2NlbmUpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcIm9wZW4tc2NlbmVcIiwgdGFyZ2V0U2NlbmUpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmV0dXJuZWRUb1NjZW5lOiB0YXJnZXRTY2VuZSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgbWV0aG9kLFxyXG4gICAgICAgICAgICBhcmdzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==