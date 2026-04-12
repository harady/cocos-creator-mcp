"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabTools = void 0;
const tool_base_1 = require("../tool-base");
const scene_tools_1 = require("./scene-tools");
const utils_1 = require("../utils");
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const EXT_NAME = "cocos-creator-mcp";
class PrefabTools {
    constructor(componentTools) {
        this.categoryName = "prefab";
        this._pendingNestedPrefabs = [];
        /** prefab_open で開いた Prefab アセット UUID */
        this._currentPrefabUuid = null;
        this._componentTools = componentTools !== null && componentTools !== void 0 ? componentTools : null;
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
            {
                name: "prefab_create_from_spec",
                description: "Create a prefab from a JSON spec in one call. Combines node_create_tree + component_auto_bind + prefab_create into a single operation. Spec extends node_create_tree format with optional autoBind field. Example: { name: 'MyPopup', components: ['cc.UITransform', 'MyPopupView'], autoBind: 'MyPopupView', children: [{ name: 'CloseButton', components: ['cc.Button'] }] }",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "db:// path for the prefab (e.g. 'db://assets/prefabs/MyPrefab.prefab')" },
                        spec: { description: "Node tree specification with optional autoBind field (string for component type to auto-bind)" },
                        autoBindMode: { type: "string", enum: ["fuzzy", "strict"], description: "Auto-bind matching mode (default: fuzzy)" },
                    },
                    required: ["path", "spec"],
                },
            },
        ];
    }
    async execute(toolName, args) {
        var _a;
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
            case "prefab_create_from_spec":
                return this.createFromSpec(args.path, (0, utils_1.parseMaybeJson)(args.spec), (_a = args.autoBindMode) !== null && _a !== void 0 ? _a : "fuzzy");
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
    async createFromSpec(prefabPath, spec, autoBindMode) {
        var _a;
        try {
            // 1. 既存 Prefab チェック
            const existing = await this.assetExists(prefabPath);
            if (existing) {
                return (0, tool_base_1.err)(`Prefab already exists at "${prefabPath}". Delete it first or use a different path.`);
            }
            // 2. シーンの最初の cc.Node UUID を取得（Scene UUID ではなく Canvas 等）
            const hier = await this.sceneScript("getSceneHierarchy", [false]);
            const hierarchy = (hier === null || hier === void 0 ? void 0 : hier.hierarchy) || [];
            const firstNode = hierarchy[0];
            if (!(firstNode === null || firstNode === void 0 ? void 0 : firstNode.uuid))
                return (0, tool_base_1.err)("Could not find a node in the current scene to use as parent");
            const parentUuid = firstNode.uuid;
            // 3. ノードツリーを構築
            const autoBind = spec.autoBind;
            const cleanSpec = Object.assign({}, spec);
            delete cleanSpec.autoBind;
            const treeResult = await this.sceneScript("buildNodeTree", [parentUuid, cleanSpec]);
            if (!(treeResult === null || treeResult === void 0 ? void 0 : treeResult.success))
                return (0, tool_base_1.err)((treeResult === null || treeResult === void 0 ? void 0 : treeResult.error) || "buildNodeTree failed");
            const nodeUuid = (_a = treeResult.data) === null || _a === void 0 ? void 0 : _a.uuid;
            if (!nodeUuid)
                return (0, tool_base_1.err)("buildNodeTree returned no root node UUID");
            // 4. autoBind 実行
            let autoBindResult = null;
            if (autoBind) {
                if (!this._componentTools) {
                    return (0, tool_base_1.err)("autoBind requires ComponentTools dependency (internal configuration error)");
                }
                const bindToolResult = await this._componentTools.execute("component_auto_bind", {
                    uuid: nodeUuid,
                    componentType: autoBind,
                    force: false,
                    mode: autoBindMode,
                });
                try {
                    autoBindResult = JSON.parse(bindToolResult.content[0].text);
                }
                catch (_b) {
                    autoBindResult = bindToolResult;
                }
            }
            // 5. Prefab 作成
            const prefabAssetUuid = await Editor.Message.request("scene", "create-prefab", nodeUuid, prefabPath);
            if (!prefabAssetUuid) {
                await Editor.Message.request("scene", "remove-node", { uuid: nodeUuid });
                return (0, tool_base_1.err)("create-prefab returned no asset UUID");
            }
            // 6. 一時ノードを削除
            await Editor.Message.request("scene", "remove-node", { uuid: nodeUuid });
            return (0, tool_base_1.ok)({
                success: true,
                prefabAssetUuid,
                path: prefabPath,
                nodeTree: treeResult.data,
                autoBind: autoBindResult,
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3ByZWZhYi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw0Q0FBdUM7QUFDdkMsK0NBQXVFO0FBQ3ZFLG9DQUEwQztBQUUxQyw0Q0FBb0I7QUFFcEIsb0RBQTRCO0FBRTVCLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBU3JDLE1BQWEsV0FBVztJQU9wQixZQUFZLGNBQStCO1FBTmxDLGlCQUFZLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLDBCQUFxQixHQUF3QixFQUFFLENBQUM7UUFDeEQsd0NBQXdDO1FBQ2hDLHVCQUFrQixHQUFrQixJQUFJLENBQUM7UUFJN0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLGFBQWQsY0FBYyxjQUFkLGNBQWMsR0FBSSxJQUFJLENBQUM7SUFDbEQsQ0FBQztJQUVELFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLFdBQVcsRUFBRSx1Q0FBdUM7Z0JBQ3BELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxlQUFlO2dCQUNyQixXQUFXLEVBQUUsb0ZBQW9GO2dCQUNqRyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGlDQUFpQyxFQUFFO3dCQUN4RSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx3RUFBd0UsRUFBRTtxQkFDbEg7b0JBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztpQkFDN0I7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxvQkFBb0I7Z0JB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QUMsQ0FBQztRQUNQLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxJQUFBLGVBQUcsRUFBQyxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsSUFBVztRQUNqRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEVBQUUsbUJBQW1CO1lBQ3pCLE1BQU07WUFDTixJQUFJO1NBQ1AsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBbm1CRCxrQ0FtbUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5pbXBvcnQgeyBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaCwgc2FmZVNhdmVTY2VuZSB9IGZyb20gXCIuL3NjZW5lLXRvb2xzXCI7XHJcbmltcG9ydCB7IHBhcnNlTWF5YmVKc29uIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tIFwiLi9jb21wb25lbnQtdG9vbHNcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgY3J5cHRvIGZyb20gXCJjcnlwdG9cIjtcclxuXHJcbmNvbnN0IEVYVF9OQU1FID0gXCJjb2Nvcy1jcmVhdG9yLW1jcFwiO1xyXG5cclxuLyoqIHByZWZhYl9pbnN0YW50aWF0ZSDjgafphY3nva7jgZfjgZ/jg43jgrnjg4ggUHJlZmFiIOaDheWgseOCkuiomOaGtiAqL1xyXG5pbnRlcmZhY2UgTmVzdGVkUHJlZmFiRW50cnkge1xyXG4gICAgbm9kZVV1aWQ6IHN0cmluZztcclxuICAgIHByZWZhYkFzc2V0VXVpZDogc3RyaW5nO1xyXG4gICAgcGFyZW50VXVpZDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUHJlZmFiVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJwcmVmYWJcIjtcclxuICAgIHByaXZhdGUgX3BlbmRpbmdOZXN0ZWRQcmVmYWJzOiBOZXN0ZWRQcmVmYWJFbnRyeVtdID0gW107XHJcbiAgICAvKiogcHJlZmFiX29wZW4g44Gn6ZaL44GE44GfIFByZWZhYiDjgqLjgrvjg4Pjg4ggVVVJRCAqL1xyXG4gICAgcHJpdmF0ZSBfY3VycmVudFByZWZhYlV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBfY29tcG9uZW50VG9vbHM6IENvbXBvbmVudFRvb2xzIHwgbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihjb21wb25lbnRUb29scz86IENvbXBvbmVudFRvb2xzKSB7XHJcbiAgICAgICAgdGhpcy5fY29tcG9uZW50VG9vbHMgPSBjb21wb25lbnRUb29scyA/PyBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2xpc3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkxpc3QgYWxsIHByZWZhYiBmaWxlcyBpbiB0aGUgcHJvamVjdC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2NyZWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3JlYXRlIGEgcHJlZmFiIGZyb20gYW4gZXhpc3Rpbmcgbm9kZSBpbiB0aGUgc2NlbmUuIFRoZSBub2RlIHJlbWFpbnMgaW4gdGhlIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgdG8gY3JlYXRlIHByZWZhYiBmcm9tXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJkYjovLyBwYXRoIGZvciB0aGUgcHJlZmFiIChlLmcuICdkYjovL2Fzc2V0cy9wcmVmYWJzL015UHJlZmFiLnByZWZhYicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2luc3RhbnRpYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJJbnN0YW50aWF0ZSBhIHByZWZhYiBpbnRvIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmFiIGFzc2V0IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUGFyZW50IG5vZGUgVVVJRCAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIHNjZW5lIHJvb3QpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwcmVmYWJVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfZ2V0X2luZm9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBpbmZvcm1hdGlvbiBhYm91dCBhIHByZWZhYiBhc3NldCAobmFtZSwgcGF0aCwgVVVJRCkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBhc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfdXBkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJVcGRhdGUgKHJlLXNhdmUpIGEgcHJlZmFiIGZyb20gaXRzIGluc3RhbmNlIG5vZGUgaW4gdGhlIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgb2YgdGhlIHByZWZhYiBpbnN0YW5jZSBpbiB0aGUgc2NlbmVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9kdXBsaWNhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkR1cGxpY2F0ZSBhIHByZWZhYiBhc3NldCB0byBhIG5ldyBwYXRoLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlNvdXJjZSBwcmVmYWIgZGI6Ly8gcGF0aFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkRlc3RpbmF0aW9uIGRiOi8vIHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInNvdXJjZVwiLCBcImRlc3RpbmF0aW9uXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfdmFsaWRhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlZhbGlkYXRlIGEgcHJlZmFiIGZvciBtaXNzaW5nIHJlZmVyZW5jZXMgb3IgYnJva2VuIGxpbmtzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgYXNzZXQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX3JldmVydFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmV2ZXJ0IGEgcHJlZmFiIGluc3RhbmNlIG5vZGUgdG8gaXRzIG9yaWdpbmFsIHByZWZhYiBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIG9mIHRoZSBwcmVmYWIgaW5zdGFuY2VcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9jcmVhdGVfYW5kX3JlcGxhY2VcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIHByZWZhYiBmcm9tIGEgbm9kZSBBTkQgcmVwbGFjZSB0aGUgb3JpZ2luYWwgbm9kZSB3aXRoIGEgcHJlZmFiIGluc3RhbmNlLiBUaGlzIGlzIHRoZSByZWNvbW1lbmRlZCB3YXkgdG8gZXh0cmFjdCBhIG5lc3RlZCBwcmVmYWIg4oCUIG9uZSBjb21tYW5kIGluc3RlYWQgb2YgY3JlYXRlIOKGkiBkZWxldGUg4oaSIGluc3RhbnRpYXRlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgdG8gY3JlYXRlIHByZWZhYiBmcm9tXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJkYjovLyBwYXRoIGZvciB0aGUgcHJlZmFiIChlLmcuICdkYjovL2Fzc2V0cy9wcmVmYWJzL015UHJlZmFiLnByZWZhYicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGF0aFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX29wZW5cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk9wZW4gYSBwcmVmYWIgaW4gZWRpdGluZyBtb2RlLiBFcXVpdmFsZW50IHRvIGRvdWJsZS1jbGlja2luZyB0aGUgcHJlZmFiIGluIENvY29zQ3JlYXRvci4gUmV0dXJucyBhbiBlcnJvciBpZiB0aGUgY3VycmVudCBzY2VuZSBpcyBkaXJ0eSBhbmQgdW50aXRsZWQgKHRvIGF2b2lkIG1vZGFsIHNhdmUgZGlhbG9nKTsgcGFzcyBmb3JjZT10cnVlIHRvIGJ5cGFzcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmFiIGFzc2V0IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBkYjovLyBwYXRoIChhbHRlcm5hdGl2ZSB0byB1dWlkKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJTa2lwIGRpcnR5LXNjZW5lIHByZWZsaWdodCBjaGVjayAobWF5IHRyaWdnZXIgbW9kYWwgc2F2ZSBkaWFsb2cpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfY2xvc2VcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNhdmUgYW5kIGNsb3NlIHRoZSBjdXJyZW50IHByZWZhYiBlZGl0aW5nIG1vZGUsIHRoZW4gcmV0dXJuIHRvIHRoZSBtYWluIHNjZW5lLiBSZXR1cm5zIGFuIGVycm9yIGlmIHRoZSBjdXJyZW50IHByZWZhYiBpcyBkaXJ0eSBhbmQgdW50aXRsZWQgKHRvIGF2b2lkIG1vZGFsIHNhdmUgZGlhbG9nKTsgcGFzcyBmb3JjZT10cnVlIHRvIGJ5cGFzcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmU6IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIlNhdmUgcHJlZmFiIGJlZm9yZSBjbG9zaW5nIChkZWZhdWx0IHRydWUpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmVVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlNjZW5lIFVVSUQgdG8gcmV0dXJuIHRvIChkZWZhdWx0OiBwcm9qZWN0J3Mgc3RhcnQgc2NlbmUgb3IgZmlyc3Qgc2NlbmUpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2U6IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIlNraXAgZGlydHktc2NlbmUgcHJlZmxpZ2h0IGNoZWNrIChtYXkgdHJpZ2dlciBtb2RhbCBzYXZlIGRpYWxvZylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9jcmVhdGVfZnJvbV9zcGVjXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDcmVhdGUgYSBwcmVmYWIgZnJvbSBhIEpTT04gc3BlYyBpbiBvbmUgY2FsbC4gQ29tYmluZXMgbm9kZV9jcmVhdGVfdHJlZSArIGNvbXBvbmVudF9hdXRvX2JpbmQgKyBwcmVmYWJfY3JlYXRlIGludG8gYSBzaW5nbGUgb3BlcmF0aW9uLiBTcGVjIGV4dGVuZHMgbm9kZV9jcmVhdGVfdHJlZSBmb3JtYXQgd2l0aCBvcHRpb25hbCBhdXRvQmluZCBmaWVsZC4gRXhhbXBsZTogeyBuYW1lOiAnTXlQb3B1cCcsIGNvbXBvbmVudHM6IFsnY2MuVUlUcmFuc2Zvcm0nLCAnTXlQb3B1cFZpZXcnXSwgYXV0b0JpbmQ6ICdNeVBvcHVwVmlldycsIGNoaWxkcmVuOiBbeyBuYW1lOiAnQ2xvc2VCdXR0b24nLCBjb21wb25lbnRzOiBbJ2NjLkJ1dHRvbiddIH1dIH1cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBmb3IgdGhlIHByZWZhYiAoZS5nLiAnZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWInKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWM6IHsgZGVzY3JpcHRpb246IFwiTm9kZSB0cmVlIHNwZWNpZmljYXRpb24gd2l0aCBvcHRpb25hbCBhdXRvQmluZCBmaWVsZCAoc3RyaW5nIGZvciBjb21wb25lbnQgdHlwZSB0byBhdXRvLWJpbmQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0JpbmRNb2RlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGVudW06IFtcImZ1enp5XCIsIFwic3RyaWN0XCJdLCBkZXNjcmlwdGlvbjogXCJBdXRvLWJpbmQgbWF0Y2hpbmcgbW9kZSAoZGVmYXVsdDogZnV6enkpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXRoXCIsIFwic3BlY1wiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfbGlzdFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdFByZWZhYnMoKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9jcmVhdGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVByZWZhYihhcmdzLnV1aWQsIGFyZ3MucGF0aCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfaW5zdGFudGlhdGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbnRpYXRlUHJlZmFiKGFyZ3MucHJlZmFiVXVpZCwgYXJncy5wYXJlbnQpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2dldF9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRQcmVmYWJJbmZvKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfdXBkYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVQcmVmYWIoYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9kdXBsaWNhdGVcIjoge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJjb3B5LWFzc2V0XCIsIGFyZ3Muc291cmNlLCBhcmdzLmRlc3RpbmF0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzb3VyY2U6IGFyZ3Muc291cmNlLCBkZXN0aW5hdGlvbjogYXJncy5kZXN0aW5hdGlvbiB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl92YWxpZGF0ZVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldC1pbmZvXCIsIGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVwcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWRlcGVuZHNcIiwgYXJncy51dWlkKS5jYXRjaCgoKSA9PiBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkLCBpbmZvLCBkZXBlbmRlbmNpZXM6IGRlcHMsIHZhbGlkOiAhIWluZm8gfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfcmV2ZXJ0XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnRQcmVmYWIoYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9jcmVhdGVfYW5kX3JlcGxhY2VcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUFuZFJlcGxhY2UoYXJncy51dWlkLCBhcmdzLnBhdGgpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX29wZW5cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9wZW5QcmVmYWIoYXJncy51dWlkLCBhcmdzLnBhdGgsICEhYXJncy5mb3JjZSk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfY2xvc2VcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb3NlUHJlZmFiKGFyZ3Muc2F2ZSAhPT0gZmFsc2UsIGFyZ3Muc2NlbmVVdWlkLCAhIWFyZ3MuZm9yY2UpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2NyZWF0ZV9mcm9tX3NwZWNcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUZyb21TcGVjKGFyZ3MucGF0aCwgcGFyc2VNYXliZUpzb24oYXJncy5zcGVjKSwgYXJncy5hdXRvQmluZE1vZGUgPz8gXCJmdXp6eVwiKTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBsaXN0UHJlZmFicygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IFwiZGI6Ly9hc3NldHMvKiovKi5wcmVmYWJcIixcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYnMgPSAocmVzdWx0cyB8fCBbXSkubWFwKChhOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICB1dWlkOiBhLnV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBhLnBhdGggfHwgYS51cmwsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBhLm5hbWUsXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcHJlZmFicyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWIobm9kZVV1aWQ6IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8g5pei5a2YUHJlZmFi44GM44GC44KL5aC05ZCI44Gv6K2m5ZGK44KS6L+U44GZ77yI5LiK5pu444GN44OA44Kk44Ki44Ot44Kw44Gn44K/44Kk44Og44Ki44Km44OI44GZ44KL44Gf44KB77yJXHJcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5hc3NldEV4aXN0cyhwYXRoKTtcclxuICAgICAgICAgICAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFxyXG4gICAgICAgICAgICAgICAgICAgIGBQcmVmYWIgYWxyZWFkeSBleGlzdHMgYXQgXCIke3BhdGh9XCIuIFVzZSBwcmVmYWJfdXBkYXRlIGluc3RlYWQgdG8gdXBkYXRlIGFuIGV4aXN0aW5nIHByZWZhYi4gYCArXHJcbiAgICAgICAgICAgICAgICAgICAgYFdvcmtmbG93OiAxKSBwcmVmYWJfaW5zdGFudGlhdGUgdG8gcGxhY2UgaW4gc2NlbmUsIDIpIG1vZGlmeSBwcm9wZXJ0aWVzLCAzKSBwcmVmYWJfdXBkYXRlIHRvIHNhdmUuYFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjcmVhdGUtcHJlZmFiXCIsIG5vZGVVdWlkLCBwYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm9kZVV1aWQsIHBhdGgsIHJlc3VsdCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBhc3NldEV4aXN0cyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBwYXR0ZXJuID0gcGF0aC5yZXBsYWNlKC9cXC5wcmVmYWIkLywgXCJcIikgKyBcIi4qXCI7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwgeyBwYXR0ZXJuIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gKHJlc3VsdHMgfHwgW10pLmxlbmd0aCA+IDA7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCBwYXRoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAhIWluZm87XHJcbiAgICAgICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaW5zdGFudGlhdGVQcmVmYWIocHJlZmFiVXVpZDogc3RyaW5nLCBwYXJlbnQ/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImNyZWF0ZS1ub2RlXCIsIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudDogcGFyZW50IHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBQcmVmYWIg57eo6ZuG44Oi44O844OJ5Lit44Gu5aC05ZCI44CB44ON44K544OIIFByZWZhYiDmg4XloLHjgpLoqJjmhrZcclxuICAgICAgICAgICAgLy8gcHJlZmFiX3VwZGF0ZSDmmYLjgasgSlNPTiDlvozlh6bnkIbjgacgYXNzZXQvaW5zdGFuY2UvbmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cyDjgpLoqK3lrppcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ05lc3RlZFByZWZhYnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiQXNzZXRVdWlkOiBwcmVmYWJVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IHBhcmVudCxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlVXVpZCwgcHJlZmFiVXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdXBkYXRlUHJlZmFiKG5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJhcHBseS1wcmVmYWJcIiwgbm9kZVV1aWQpO1xyXG5cclxuICAgICAgICAgICAgLy8g44ON44K544OIIFByZWZhYiDjga4gSlNPTiDlvozlh6bnkIZcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3BlbmRpbmdOZXN0ZWRQcmVmYWJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2ZpeE5lc3RlZFByZWZhYkpzb24obm9kZVV1aWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlVXVpZCwgcmVzdWx0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHByZWZhYl91cGRhdGUg5b6M44GrIFByZWZhYiBKU09OIOOCkuW+jOWHpueQhuOBl+OBpuOAgeODjeOCueODiCBQcmVmYWIg5Y+C54Wn44KS5q2j44GX44GP6Kit5a6a44GZ44KLLlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIF9maXhOZXN0ZWRQcmVmYWJKc29uKF9yb290Tm9kZVV1aWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGlmICh0aGlzLl9wZW5kaW5nTmVzdGVkUHJlZmFicy5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8g44K344O844Oz44KS5L+d5a2Y44GX44GmIFByZWZhYiBKU09OIOOCkuabuOOBjeWHuuOBmVxyXG4gICAgICAgICAgICAvLyDnj77lnKjjgrfjg7zjg7PjgYwgdW50aXRsZWQgKHNjZW5lLTJkKSDjga7loLTlkIjjgIFzYXZlLXNjZW5lIOOBr+ODgOOCpOOCouODreOCsOOCkuWHuuOBmeOBruOBp1xyXG4gICAgICAgICAgICAvLyBzYWZlU2F2ZVNjZW5lIOOBp+OCueOCreODg+ODl+OBmeOCi+OAgnVudGl0bGVkIOOBp+OCt+ODvOODs+OBq+OCpOODs+OCueOCv+ODs+OCueOBjOWxheOCi+OCseODvOOCueOBr1xyXG4gICAgICAgICAgICAvLyDmnKzmnaUgcHJlZmFiX29wZW4g44Oi44O844OJ44Gn44Gu44G/55m655Sf44GZ44KL44Gu44GnIHNhdmUg44GM5Yq544GP5oOz5a6a44Gg44GM44CBXHJcbiAgICAgICAgICAgIC8vIOODhuOCueODiOetieOBp+ebtOaOpeWRvOOBsOOCjOOBn+WgtOWQiOOBruS/neitt+OBqOOBl+OBpiBza2lwIOOBmeOCi+OAglxyXG4gICAgICAgICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHNhZmVTYXZlU2NlbmUoKTtcclxuICAgICAgICAgICAgaWYgKCFzYXZlZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiW1ByZWZhYlRvb2xzXSBfZml4TmVzdGVkUHJlZmFiSnNvbjogc2F2ZS1zY2VuZSBza2lwcGVkICh1bnRpdGxlZCBzY2VuZSkuIFwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIk5lc3RlZCBwcmVmYWIgSlNPTiBwb3N0LXByb2Nlc3NpbmcgbWF5IGJlIGluY29tcGxldGUuXCJcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDE1MDApKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHByZWZhYl9vcGVuIOOBp+iomOaGtuOBl+OBnyBVVUlEIOOBi+OCieODleOCoeOCpOODq+ODkeOCueOCkuWPluW+l1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2N1cnJlbnRQcmVmYWJVdWlkKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJQYXRoID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcclxuICAgICAgICAgICAgICAgIFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1wYXRoXCIsIHRoaXMuX2N1cnJlbnRQcmVmYWJVdWlkXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICghcHJlZmFiUGF0aCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocHJlZmFiUGF0aCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwcmVmYWJQYXRoLCBcInV0Zi04XCIpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWQhOODjeOCueODiCBQcmVmYWIg44Ko44Oz44OI44Oq44KS5Yem55CGXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5fcGVuZGluZ05lc3RlZFByZWZhYnMpIHtcclxuICAgICAgICAgICAgICAgIC8vIGZpbGVJZCDjgafjg47jg7zjg4njgpLmpJzntKLvvIhub2RlVXVpZCDjga/jgrfjg7zjg7PlhoUgVVVJROOAgVByZWZhYiBKU09OIOWGheOBp+OBryBmaWxlSWTvvIlcclxuICAgICAgICAgICAgICAgIGxldCBmbHBOb2RlSWR4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YVtpXS5fX3R5cGVfXyA9PT0gXCJjYy5QcmVmYWJJbmZvXCIgJiYgZGF0YVtpXS5maWxlSWQgPT09IGVudHJ5Lm5vZGVVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOOBk+OBriBQcmVmYWJJbmZvIOOCkuaMgeOBpOODjuODvOODieOCkuaOouOBmVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRhdGEubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhW2pdLl9wcmVmYWI/Ll9faWRfXyA9PT0gaSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZscE5vZGVJZHggPSBqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBmaWxlSWQg44Gn6KaL44Gk44GL44KJ44Gq44GE5aC05ZCI44CB44OO44O844OJ5ZCN44Gn5qSc57SiXHJcbiAgICAgICAgICAgICAgICBpZiAoZmxwTm9kZUlkeCA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQcmVmYWIg44Ki44K744OD44OI5ZCN44KS5Y+W5b6XXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCBlbnRyeS5wcmVmYWJBc3NldFV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0TmFtZSA9IGFzc2V0SW5mbz8ubmFtZT8ucmVwbGFjZShcIi5wcmVmYWJcIiwgXCJcIikgfHwgXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbaV0uX190eXBlX18gPT09IFwiY2MuTm9kZVwiICYmIChkYXRhW2ldLl9uYW1lID09PSBhc3NldE5hbWUgfHwgZGF0YVtpXS5fbmFtZSA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSWR4ID0gZGF0YVtpXS5fcHJlZmFiPy5fX2lkX187XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlZmFiSWR4ICE9IG51bGwgJiYgZGF0YVtwcmVmYWJJZHhdPy5hc3NldD8uX19pZF9fID09PSAwICYmICFkYXRhW3ByZWZhYklkeF0/Lmluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxwTm9kZUlkeCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZscE5vZGVJZHggPCAwKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJJbmZvSWR4ID0gZGF0YVtmbHBOb2RlSWR4XS5fcHJlZmFiPy5fX2lkX187XHJcbiAgICAgICAgICAgICAgICBpZiAocHJlZmFiSW5mb0lkeCA9PSBudWxsKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmVmYWJJbmZvIOOCkuS/ruato1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5mbyA9IGRhdGFbcHJlZmFiSW5mb0lkeF07XHJcbiAgICAgICAgICAgICAgICBwcmVmYWJJbmZvLnJvb3QgPSB7IF9faWRfXzogZmxwTm9kZUlkeCB9O1xyXG4gICAgICAgICAgICAgICAgcHJlZmFiSW5mby5hc3NldCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBfX3V1aWRfXzogZW50cnkucHJlZmFiQXNzZXRVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIF9fZXhwZWN0ZWRUeXBlX186IFwiY2MuUHJlZmFiXCIsXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFByZWZhYkluc3RhbmNlIOOCkui/veWKoFxyXG4gICAgICAgICAgICAgICAgaWYgKCFwcmVmYWJJbmZvLmluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5zdGFuY2VJZHggPSBkYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogXCJjYy5QcmVmYWJJbnN0YW5jZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlSWQ6IGNyeXB0by5yYW5kb21CeXRlcygxNikudG9TdHJpbmcoXCJiYXNlNjRcIikucmVwbGFjZSgvWysvPV0vZywgXCJcIikuc3Vic3RyaW5nKDAsIDIyKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUm9vdE5vZGU6IHsgX19pZF9fOiAxIH0sIC8vIFByZWZhYiDnt6jpm4bjg6Ljg7zjg4njga7jg6vjg7zjg4hcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW91bnRlZENoaWxkcmVuOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW91bnRlZENvbXBvbmVudHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU92ZXJyaWRlczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWRDb21wb25lbnRzOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlID0geyBfX2lkX186IGluc3RhbmNlSWR4IH07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5a2Q44OO44O844OJ44O744Kz44Oz44Od44O844ON44Oz44OI44KS44Kv44Oq44Ki77yIUHJlZmFiIOOCouOCu+ODg+ODiOOBi+OCieW+qeWFg+OBleOCjOOCi++8iVxyXG4gICAgICAgICAgICAgICAgZGF0YVtmbHBOb2RlSWR4XS5fY2hpbGRyZW4gPSBbXTtcclxuICAgICAgICAgICAgICAgIGRhdGFbZmxwTm9kZUlkeF0uX2NvbXBvbmVudHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDjg6vjg7zjg4jjga4gbmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cyDjgavov73liqBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RQcmVmYWJJZHggPSBkYXRhWzFdLl9wcmVmYWI/Ll9faWRfXztcclxuICAgICAgICAgICAgICAgIGlmIChyb290UHJlZmFiSWR4ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByb290UHJlZmFiID0gZGF0YVtyb290UHJlZmFiSWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJvb3RQcmVmYWIubmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByb290UHJlZmFiLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxyZWFkeU5lc3RlZCA9IHJvb3RQcmVmYWIubmVzdGVkUHJlZmFiSW5zdGFuY2VSb290cy5zb21lKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAocjogYW55KSA9PiByPy5fX2lkX18gPT09IGZscE5vZGVJZHhcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYWxyZWFkeU5lc3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByb290UHJlZmFiLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMucHVzaCh7IF9faWRfXzogZmxwTm9kZUlkeCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMocHJlZmFiUGF0aCwgSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMiksIFwidXRmLThcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdOZXN0ZWRQcmVmYWJzID0gW107XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIltQcmVmYWJUb29sc10gX2ZpeE5lc3RlZFByZWZhYkpzb24gZmFpbGVkOlwiLCBlLm1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJldmVydFByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmV2ZXJ0LXByZWZhYlwiLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGVVdWlkLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0UHJlZmFiSW5mbyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCB1dWlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaW5mbyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVBbmRSZXBsYWNlKG5vZGVVdWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIDEuIENoZWNrIGlmIHByZWZhYiBhbHJlYWR5IGV4aXN0c1xyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuYXNzZXRFeGlzdHMocGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcclxuICAgICAgICAgICAgICAgICAgICBgUHJlZmFiIGFscmVhZHkgZXhpc3RzIGF0IFwiJHtwYXRofVwiLiBEZWxldGUgaXQgZmlyc3Qgb3IgdXNlIGEgZGlmZmVyZW50IHBhdGguYFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMi4gR2V0IG5vZGUgaW5mbyAocGFyZW50LCBzaWJsaW5nIGluZGV4LCB0cmFuc2Zvcm0pIGJlZm9yZSBjcmVhdGluZyBwcmVmYWJcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW25vZGVVdWlkXSk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYE5vZGUgJHtub2RlVXVpZH0gbm90IGZvdW5kYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcGFyZW50VXVpZCA9IG5vZGVJbmZvLmRhdGE/LnBhcmVudDtcclxuXHJcbiAgICAgICAgICAgIC8vIDMuIENyZWF0ZSBwcmVmYWIgZnJvbSB0aGUgbm9kZVxyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJBc3NldFV1aWQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjcmVhdGUtcHJlZmFiXCIsIG5vZGVVdWlkLCBwYXRoKTtcclxuICAgICAgICAgICAgaWYgKCFwcmVmYWJBc3NldFV1aWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXCJjcmVhdGUtcHJlZmFiIHJldHVybmVkIG5vIGFzc2V0IFVVSURcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIDQuIERlbGV0ZSB0aGUgb3JpZ2luYWwgbm9kZVxyXG4gICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZW1vdmUtbm9kZVwiLCB7IHV1aWQ6IG5vZGVVdWlkIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gNS4gSW5zdGFudGlhdGUgdGhlIHByZWZhYiBhdCB0aGUgc2FtZSBwYXJlbnRcclxuICAgICAgICAgICAgY29uc3QgbmV3Tm9kZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJjcmVhdGUtbm9kZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudFV1aWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBwcmVmYWJBc3NldFV1aWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwcmVmYWJBc3NldFV1aWQsXHJcbiAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBwYXRoLFxyXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxOb2RlVXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZVV1aWQ6IG5ld05vZGVVdWlkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuUHJlZmFiKHV1aWQ/OiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcsIGZvcmNlOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBQcmVmYWIg44KS6ZaL44GP44Go44GN44KC5YaF6YOo55qE44Gr44K344O844Oz5YiH5pu/44GM55m655Sf44GZ44KL44Gu44GnIGRpcnR5IHVudGl0bGVkIOODgeOCp+ODg+OCr1xyXG4gICAgICAgICAgICBhd2FpdCBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaChmb3JjZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXNvbHZlIFVVSUQgZnJvbSBwYXRoIGlmIG5lZWRlZFxyXG4gICAgICAgICAgICBsZXQgYXNzZXRVdWlkID0gdXVpZDtcclxuICAgICAgICAgICAgaWYgKCFhc3NldFV1aWQgJiYgcGF0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQgPSBpbmZvPy51dWlkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghYXNzZXRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFwiRWl0aGVyIHV1aWQgb3IgcGF0aCBpcyByZXF1aXJlZFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gT3BlbiBwcmVmYWIgaW4gZWRpdGluZyBtb2RlIChlcXVpdmFsZW50IHRvIGRvdWJsZS1jbGljaylcclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwib3Blbi1hc3NldFwiLCBhc3NldFV1aWQpO1xyXG4gICAgICAgICAgICAvLyBXYWl0IGZvciBwcmVmYWIgZWRpdGluZyBtb2RlIHRvIGluaXRpYWxpemVcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRQcmVmYWJVdWlkID0gYXNzZXRVdWlkO1xyXG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nTmVzdGVkUHJlZmFicyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXNzZXRVdWlkLCBtb2RlOiBcInByZWZhYi1lZGl0XCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY2xvc2VQcmVmYWIoc2F2ZTogYm9vbGVhbiwgc2NlbmVVdWlkPzogc3RyaW5nLCBmb3JjZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gMS4gU2F2ZSBwcmVmYWIgaWYgcmVxdWVzdGVkXHJcbiAgICAgICAgICAgIC8vIHByZWZhYiBlZGl0IOODouODvOODieS4reOBryBcImN1cnJlbnQgc2NlbmVcIiA9IOe3qOmbhuS4rSBQcmVmYWIg44Gq44Gu44GnIHNhdmUtc2NlbmUg44GvIFByZWZhYiDjgpLkv53lrZjjgZnjgovjgIJcclxuICAgICAgICAgICAgLy8g44Gf44Gg44GXIHVudGl0bGVkIOODleOCqeODvOODq+ODkOODg+OCr+OBq+W9k+OBn+OBo+OBn+WgtOWQiOOBr+ODgOOCpOOCouODreOCsOWbnumBv+OBruOBn+OCgeOCueOCreODg+ODl+OBmeOCi+OAglxyXG4gICAgICAgICAgICBpZiAoc2F2ZSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgc2FmZVNhdmVTY2VuZSgpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDUwMCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAyLiBEZXRlcm1pbmUgd2hpY2ggc2NlbmUgdG8gcmV0dXJuIHRvXHJcbiAgICAgICAgICAgIGxldCB0YXJnZXRTY2VuZSA9IHNjZW5lVXVpZDtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXRTY2VuZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJ5IHByb2plY3QncyBzdGFydCBzY2VuZVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRTY2VuZSA9IGF3YWl0IChFZGl0b3IgYXMgYW55KS5Qcm9maWxlLmdldENvbmZpZyhcInByZXZpZXdcIiwgXCJnZW5lcmFsLnN0YXJ0X3NjZW5lXCIsIFwibG9jYWxcIik7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGYWxsYmFjayB0byBmaXJzdCBzY2VuZVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRTY2VuZSB8fCB0YXJnZXRTY2VuZSA9PT0gXCJjdXJyZW50X3NjZW5lXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZXMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjY1R5cGU6IFwiY2MuU2NlbmVBc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBcImRiOi8vYXNzZXRzLyoqLypcIixcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2VuZXMpICYmIHNjZW5lcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFNjZW5lID0gc2NlbmVzWzBdLnV1aWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAzLiBPcGVuIHRoZSBzY2VuZVxyXG4gICAgICAgICAgICBpZiAodGFyZ2V0U2NlbmUpIHtcclxuICAgICAgICAgICAgICAgIC8vIHByZWZhYiBlZGl0IOODouODvOODieOBi+OCieaIu+OCi+mBt+enu+OCguODgOOCpOOCouODreOCsOOBjOWHuuOBhuOCi1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2goZm9yY2UpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwib3Blbi1zY2VuZVwiLCB0YXJnZXRTY2VuZSk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCByZXR1cm5lZFRvU2NlbmU6IHRhcmdldFNjZW5lIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZUZyb21TcGVjKHByZWZhYlBhdGg6IHN0cmluZywgc3BlYzogYW55LCBhdXRvQmluZE1vZGU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIDEuIOaXouWtmCBQcmVmYWIg44OB44Kn44OD44KvXHJcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5hc3NldEV4aXN0cyhwcmVmYWJQYXRoKTtcclxuICAgICAgICAgICAgaWYgKGV4aXN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFxyXG4gICAgICAgICAgICAgICAgICAgIGBQcmVmYWIgYWxyZWFkeSBleGlzdHMgYXQgXCIke3ByZWZhYlBhdGh9XCIuIERlbGV0ZSBpdCBmaXJzdCBvciB1c2UgYSBkaWZmZXJlbnQgcGF0aC5gXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAyLiDjgrfjg7zjg7Pjga7mnIDliJ3jga4gY2MuTm9kZSBVVUlEIOOCkuWPluW+l++8iFNjZW5lIFVVSUQg44Gn44Gv44Gq44GPIENhbnZhcyDnrYnvvIlcclxuICAgICAgICAgICAgY29uc3QgaGllciA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXRTY2VuZUhpZXJhcmNoeVwiLCBbZmFsc2VdKTtcclxuICAgICAgICAgICAgY29uc3QgaGllcmFyY2h5ID0gaGllcj8uaGllcmFyY2h5IHx8IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBmaXJzdE5vZGUgPSBoaWVyYXJjaHlbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3ROb2RlPy51dWlkKSByZXR1cm4gZXJyKFwiQ291bGQgbm90IGZpbmQgYSBub2RlIGluIHRoZSBjdXJyZW50IHNjZW5lIHRvIHVzZSBhcyBwYXJlbnRcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSBmaXJzdE5vZGUudXVpZDtcclxuXHJcbiAgICAgICAgICAgIC8vIDMuIOODjuODvOODieODhOODquODvOOCkuani+eviVxyXG4gICAgICAgICAgICBjb25zdCBhdXRvQmluZCA9IHNwZWMuYXV0b0JpbmQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuU3BlYyA9IHsgLi4uc3BlYyB9O1xyXG4gICAgICAgICAgICBkZWxldGUgY2xlYW5TcGVjLmF1dG9CaW5kO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdHJlZVJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJidWlsZE5vZGVUcmVlXCIsIFtwYXJlbnRVdWlkLCBjbGVhblNwZWNdKTtcclxuICAgICAgICAgICAgaWYgKCF0cmVlUmVzdWx0Py5zdWNjZXNzKSByZXR1cm4gZXJyKHRyZWVSZXN1bHQ/LmVycm9yIHx8IFwiYnVpbGROb2RlVHJlZSBmYWlsZWRcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVVdWlkID0gdHJlZVJlc3VsdC5kYXRhPy51dWlkO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVVdWlkKSByZXR1cm4gZXJyKFwiYnVpbGROb2RlVHJlZSByZXR1cm5lZCBubyByb290IG5vZGUgVVVJRFwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIDQuIGF1dG9CaW5kIOWun+ihjFxyXG4gICAgICAgICAgICBsZXQgYXV0b0JpbmRSZXN1bHQ6IGFueSA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmIChhdXRvQmluZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9jb21wb25lbnRUb29scykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXCJhdXRvQmluZCByZXF1aXJlcyBDb21wb25lbnRUb29scyBkZXBlbmRlbmN5IChpbnRlcm5hbCBjb25maWd1cmF0aW9uIGVycm9yKVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGJpbmRUb29sUmVzdWx0ID0gYXdhaXQgdGhpcy5fY29tcG9uZW50VG9vbHMuZXhlY3V0ZShcImNvbXBvbmVudF9hdXRvX2JpbmRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IGF1dG9CaW5kLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvcmNlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2RlOiBhdXRvQmluZE1vZGUsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXV0b0JpbmRSZXN1bHQgPSBKU09OLnBhcnNlKGJpbmRUb29sUmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHsgYXV0b0JpbmRSZXN1bHQgPSBiaW5kVG9vbFJlc3VsdDsgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyA1LiBQcmVmYWIg5L2c5oiQXHJcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkFzc2V0VXVpZCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXHJcbiAgICAgICAgICAgICAgICBcInNjZW5lXCIsIFwiY3JlYXRlLXByZWZhYlwiLCBub2RlVXVpZCwgcHJlZmFiUGF0aFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAoIXByZWZhYkFzc2V0VXVpZCkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVtb3ZlLW5vZGVcIiwgeyB1dWlkOiBub2RlVXVpZCB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXCJjcmVhdGUtcHJlZmFiIHJldHVybmVkIG5vIGFzc2V0IFVVSURcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIDYuIOS4gOaZguODjuODvOODieOCkuWJiumZpFxyXG4gICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZW1vdmUtbm9kZVwiLCB7IHV1aWQ6IG5vZGVVdWlkIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwcmVmYWJBc3NldFV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBwcmVmYWJQYXRoLFxyXG4gICAgICAgICAgICAgICAgbm9kZVRyZWU6IHRyZWVSZXN1bHQuZGF0YSxcclxuICAgICAgICAgICAgICAgIGF1dG9CaW5kOiBhdXRvQmluZFJlc3VsdCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2NlbmVTY3JpcHQobWV0aG9kOiBzdHJpbmcsIGFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xyXG4gICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=