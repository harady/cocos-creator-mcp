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
        var _a, _b;
        try {
            // 1. 既存 Prefab チェック
            const existing = await this.assetExists(prefabPath);
            if (existing) {
                return (0, tool_base_1.err)(`Prefab already exists at "${prefabPath}". Delete it first or use a different path.`);
            }
            // 2. シーンルート UUID を取得
            const tree = await Editor.Message.request("scene", "query-node-tree");
            const rootUuid = Array.isArray(tree) ? (_a = tree[0]) === null || _a === void 0 ? void 0 : _a.uuid : tree === null || tree === void 0 ? void 0 : tree.uuid;
            if (!rootUuid)
                return (0, tool_base_1.err)("Could not determine scene root UUID");
            // 3. ノードツリーを構築
            const autoBind = spec.autoBind;
            const cleanSpec = Object.assign({}, spec);
            delete cleanSpec.autoBind;
            const treeResult = await this.sceneScript("buildNodeTree", [rootUuid, cleanSpec]);
            if (!(treeResult === null || treeResult === void 0 ? void 0 : treeResult.success))
                return (0, tool_base_1.err)((treeResult === null || treeResult === void 0 ? void 0 : treeResult.error) || "buildNodeTree failed");
            const nodeUuid = (_b = treeResult.data) === null || _b === void 0 ? void 0 : _b.uuid;
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
                catch (_c) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3ByZWZhYi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw0Q0FBdUM7QUFDdkMsK0NBQXVFO0FBQ3ZFLG9DQUEwQztBQUUxQyw0Q0FBb0I7QUFFcEIsb0RBQTRCO0FBRTVCLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBU3JDLE1BQWEsV0FBVztJQU9wQixZQUFZLGNBQStCO1FBTmxDLGlCQUFZLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLDBCQUFxQixHQUF3QixFQUFFLENBQUM7UUFDeEQsd0NBQXdDO1FBQ2hDLHVCQUFrQixHQUFrQixJQUFJLENBQUM7UUFJN0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLGFBQWQsY0FBYyxjQUFkLGNBQWMsR0FBSSxJQUFJLENBQUM7SUFDbEQsQ0FBQztJQUVELFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLFdBQVcsRUFBRSx1Q0FBdUM7Z0JBQ3BELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxlQUFlO2dCQUNyQixXQUFXLEVBQUUsb0ZBQW9GO2dCQUNqRyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGlDQUFpQyxFQUFFO3dCQUN4RSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx3RUFBd0UsRUFBRTtxQkFDbEg7b0JBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztpQkFDN0I7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxvQkFBb0I7Z0JB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LE9BQU8sSUFBQSxlQUFHLEVBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztJQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYyxFQUFFLElBQVc7UUFDakQsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7WUFDM0QsSUFBSSxFQUFFLG1CQUFtQjtZQUN6QixNQUFNO1lBQ04sSUFBSTtTQUNQLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQWptQkQsa0NBaW1CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuaW1wb3J0IHsgZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2gsIHNhZmVTYXZlU2NlbmUgfSBmcm9tIFwiLi9zY2VuZS10b29sc1wiO1xyXG5pbXBvcnQgeyBwYXJzZU1heWJlSnNvbiB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRvb2xzIH0gZnJvbSBcIi4vY29tcG9uZW50LXRvb2xzXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XHJcblxyXG5jb25zdCBFWFRfTkFNRSA9IFwiY29jb3MtY3JlYXRvci1tY3BcIjtcclxuXHJcbi8qKiBwcmVmYWJfaW5zdGFudGlhdGUg44Gn6YWN572u44GX44Gf44ON44K544OIIFByZWZhYiDmg4XloLHjgpLoqJjmhrYgKi9cclxuaW50ZXJmYWNlIE5lc3RlZFByZWZhYkVudHJ5IHtcclxuICAgIG5vZGVVdWlkOiBzdHJpbmc7XHJcbiAgICBwcmVmYWJBc3NldFV1aWQ6IHN0cmluZztcclxuICAgIHBhcmVudFV1aWQ6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFByZWZhYlRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwicHJlZmFiXCI7XHJcbiAgICBwcml2YXRlIF9wZW5kaW5nTmVzdGVkUHJlZmFiczogTmVzdGVkUHJlZmFiRW50cnlbXSA9IFtdO1xyXG4gICAgLyoqIHByZWZhYl9vcGVuIOOBp+mWi+OBhOOBnyBQcmVmYWIg44Ki44K744OD44OIIFVVSUQgKi9cclxuICAgIHByaXZhdGUgX2N1cnJlbnRQcmVmYWJVdWlkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgIHByaXZhdGUgX2NvbXBvbmVudFRvb2xzOiBDb21wb25lbnRUb29scyB8IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY29tcG9uZW50VG9vbHM/OiBDb21wb25lbnRUb29scykge1xyXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudFRvb2xzID0gY29tcG9uZW50VG9vbHMgPz8gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9saXN0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGFsbCBwcmVmYWIgZmlsZXMgaW4gdGhlIHByb2plY3QuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9jcmVhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIHByZWZhYiBmcm9tIGFuIGV4aXN0aW5nIG5vZGUgaW4gdGhlIHNjZW5lLiBUaGUgbm9kZSByZW1haW5zIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIHRvIGNyZWF0ZSBwcmVmYWIgZnJvbVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBmb3IgdGhlIHByZWZhYiAoZS5nLiAnZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWInKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9pbnN0YW50aWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSW5zdGFudGlhdGUgYSBwcmVmYWIgaW50byB0aGUgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBhc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlBhcmVudCBub2RlIFVVSUQgKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBzY2VuZSByb290KVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicHJlZmFiVXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBwcmVmYWIgYXNzZXQgKG5hbWUsIHBhdGgsIFVVSUQpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgYXNzZXQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX3VwZGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVXBkYXRlIChyZS1zYXZlKSBhIHByZWZhYiBmcm9tIGl0cyBpbnN0YW5jZSBub2RlIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIG9mIHRoZSBwcmVmYWIgaW5zdGFuY2UgaW4gdGhlIHNjZW5lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfZHVwbGljYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJEdXBsaWNhdGUgYSBwcmVmYWIgYXNzZXQgdG8gYSBuZXcgcGF0aC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTb3VyY2UgcHJlZmFiIGRiOi8vIHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJEZXN0aW5hdGlvbiBkYjovLyBwYXRoXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJzb3VyY2VcIiwgXCJkZXN0aW5hdGlvblwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX3ZhbGlkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJWYWxpZGF0ZSBhIHByZWZhYiBmb3IgbWlzc2luZyByZWZlcmVuY2VzIG9yIGJyb2tlbiBsaW5rcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmFiIGFzc2V0IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9yZXZlcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJldmVydCBhIHByZWZhYiBpbnN0YW5jZSBub2RlIHRvIGl0cyBvcmlnaW5hbCBwcmVmYWIgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRCBvZiB0aGUgcHJlZmFiIGluc3RhbmNlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfY3JlYXRlX2FuZF9yZXBsYWNlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDcmVhdGUgYSBwcmVmYWIgZnJvbSBhIG5vZGUgQU5EIHJlcGxhY2UgdGhlIG9yaWdpbmFsIG5vZGUgd2l0aCBhIHByZWZhYiBpbnN0YW5jZS4gVGhpcyBpcyB0aGUgcmVjb21tZW5kZWQgd2F5IHRvIGV4dHJhY3QgYSBuZXN0ZWQgcHJlZmFiIOKAlCBvbmUgY29tbWFuZCBpbnN0ZWFkIG9mIGNyZWF0ZSDihpIgZGVsZXRlIOKGkiBpbnN0YW50aWF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIHRvIGNyZWF0ZSBwcmVmYWIgZnJvbVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBmb3IgdGhlIHByZWZhYiAoZS5nLiAnZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWInKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9vcGVuXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPcGVuIGEgcHJlZmFiIGluIGVkaXRpbmcgbW9kZS4gRXF1aXZhbGVudCB0byBkb3VibGUtY2xpY2tpbmcgdGhlIHByZWZhYiBpbiBDb2Nvc0NyZWF0b3IuIFJldHVybnMgYW4gZXJyb3IgaWYgdGhlIGN1cnJlbnQgc2NlbmUgaXMgZGlydHkgYW5kIHVudGl0bGVkICh0byBhdm9pZCBtb2RhbCBzYXZlIGRpYWxvZyk7IHBhc3MgZm9yY2U9dHJ1ZSB0byBieXBhc3MuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBhc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgZGI6Ly8gcGF0aCAoYWx0ZXJuYXRpdmUgdG8gdXVpZClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JjZTogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiU2tpcCBkaXJ0eS1zY2VuZSBwcmVmbGlnaHQgY2hlY2sgKG1heSB0cmlnZ2VyIG1vZGFsIHNhdmUgZGlhbG9nKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2Nsb3NlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTYXZlIGFuZCBjbG9zZSB0aGUgY3VycmVudCBwcmVmYWIgZWRpdGluZyBtb2RlLCB0aGVuIHJldHVybiB0byB0aGUgbWFpbiBzY2VuZS4gUmV0dXJucyBhbiBlcnJvciBpZiB0aGUgY3VycmVudCBwcmVmYWIgaXMgZGlydHkgYW5kIHVudGl0bGVkICh0byBhdm9pZCBtb2RhbCBzYXZlIGRpYWxvZyk7IHBhc3MgZm9yY2U9dHJ1ZSB0byBieXBhc3MuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJTYXZlIHByZWZhYiBiZWZvcmUgY2xvc2luZyAoZGVmYXVsdCB0cnVlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lVXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTY2VuZSBVVUlEIHRvIHJldHVybiB0byAoZGVmYXVsdDogcHJvamVjdCdzIHN0YXJ0IHNjZW5lIG9yIGZpcnN0IHNjZW5lKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJTa2lwIGRpcnR5LXNjZW5lIHByZWZsaWdodCBjaGVjayAobWF5IHRyaWdnZXIgbW9kYWwgc2F2ZSBkaWFsb2cpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfY3JlYXRlX2Zyb21fc3BlY1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3JlYXRlIGEgcHJlZmFiIGZyb20gYSBKU09OIHNwZWMgaW4gb25lIGNhbGwuIENvbWJpbmVzIG5vZGVfY3JlYXRlX3RyZWUgKyBjb21wb25lbnRfYXV0b19iaW5kICsgcHJlZmFiX2NyZWF0ZSBpbnRvIGEgc2luZ2xlIG9wZXJhdGlvbi4gU3BlYyBleHRlbmRzIG5vZGVfY3JlYXRlX3RyZWUgZm9ybWF0IHdpdGggb3B0aW9uYWwgYXV0b0JpbmQgZmllbGQuIEV4YW1wbGU6IHsgbmFtZTogJ015UG9wdXAnLCBjb21wb25lbnRzOiBbJ2NjLlVJVHJhbnNmb3JtJywgJ015UG9wdXBWaWV3J10sIGF1dG9CaW5kOiAnTXlQb3B1cFZpZXcnLCBjaGlsZHJlbjogW3sgbmFtZTogJ0Nsb3NlQnV0dG9uJywgY29tcG9uZW50czogWydjYy5CdXR0b24nXSB9XSB9XCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcImRiOi8vIHBhdGggZm9yIHRoZSBwcmVmYWIgKGUuZy4gJ2RiOi8vYXNzZXRzL3ByZWZhYnMvTXlQcmVmYWIucHJlZmFiJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVjOiB7IGRlc2NyaXB0aW9uOiBcIk5vZGUgdHJlZSBzcGVjaWZpY2F0aW9uIHdpdGggb3B0aW9uYWwgYXV0b0JpbmQgZmllbGQgKHN0cmluZyBmb3IgY29tcG9uZW50IHR5cGUgdG8gYXV0by1iaW5kKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9CaW5kTW9kZTogeyB0eXBlOiBcInN0cmluZ1wiLCBlbnVtOiBbXCJmdXp6eVwiLCBcInN0cmljdFwiXSwgZGVzY3JpcHRpb246IFwiQXV0by1iaW5kIG1hdGNoaW5nIG1vZGUgKGRlZmF1bHQ6IGZ1enp5KVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicGF0aFwiLCBcInNwZWNcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2xpc3RcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpc3RQcmVmYWJzKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVQcmVmYWIoYXJncy51dWlkLCBhcmdzLnBhdGgpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2luc3RhbnRpYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW50aWF0ZVByZWZhYihhcmdzLnByZWZhYlV1aWQsIGFyZ3MucGFyZW50KTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9nZXRfaW5mb1wiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJlZmFiSW5mbyhhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX3VwZGF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlUHJlZmFiKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfZHVwbGljYXRlXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwiY29weS1hc3NldFwiLCBhcmdzLnNvdXJjZSwgYXJncy5kZXN0aW5hdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgc291cmNlOiBhcmdzLnNvdXJjZSwgZGVzdGluYXRpb246IGFyZ3MuZGVzdGluYXRpb24gfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfdmFsaWRhdGVcIjoge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlcHMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1kZXBlbmRzXCIsIGFyZ3MudXVpZCkuY2F0Y2goKCkgPT4gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCwgaW5mbywgZGVwZW5kZW5jaWVzOiBkZXBzLCB2YWxpZDogISFpbmZvIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX3JldmVydFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJ0UHJlZmFiKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfY3JlYXRlX2FuZF9yZXBsYWNlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVBbmRSZXBsYWNlKGFyZ3MudXVpZCwgYXJncy5wYXRoKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9vcGVuXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcGVuUHJlZmFiKGFyZ3MudXVpZCwgYXJncy5wYXRoLCAhIWFyZ3MuZm9yY2UpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2Nsb3NlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9zZVByZWZhYihhcmdzLnNhdmUgIT09IGZhbHNlLCBhcmdzLnNjZW5lVXVpZCwgISFhcmdzLmZvcmNlKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9jcmVhdGVfZnJvbV9zcGVjXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVGcm9tU3BlYyhhcmdzLnBhdGgsIHBhcnNlTWF5YmVKc29uKGFyZ3Muc3BlYyksIGFyZ3MuYXV0b0JpbmRNb2RlID8/IFwiZnV6enlcIik7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgbGlzdFByZWZhYnMoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0c1wiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiBcImRiOi8vYXNzZXRzLyoqLyoucHJlZmFiXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJzID0gKHJlc3VsdHMgfHwgW10pLm1hcCgoYTogYW55KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgdXVpZDogYS51dWlkLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogYS5wYXRoIHx8IGEudXJsLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogYS5uYW1lLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHByZWZhYnMgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlUHJlZmFiKG5vZGVVdWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIOaXouWtmFByZWZhYuOBjOOBguOCi+WgtOWQiOOBr+itpuWRiuOCkui/lOOBme+8iOS4iuabuOOBjeODgOOCpOOCouODreOCsOOBp+OCv+OCpOODoOOCouOCpuODiOOBmeOCi+OBn+OCge+8iVxyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuYXNzZXRFeGlzdHMocGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcclxuICAgICAgICAgICAgICAgICAgICBgUHJlZmFiIGFscmVhZHkgZXhpc3RzIGF0IFwiJHtwYXRofVwiLiBVc2UgcHJlZmFiX3VwZGF0ZSBpbnN0ZWFkIHRvIHVwZGF0ZSBhbiBleGlzdGluZyBwcmVmYWIuIGAgK1xyXG4gICAgICAgICAgICAgICAgICAgIGBXb3JrZmxvdzogMSkgcHJlZmFiX2luc3RhbnRpYXRlIHRvIHBsYWNlIGluIHNjZW5lLCAyKSBtb2RpZnkgcHJvcGVydGllcywgMykgcHJlZmFiX3VwZGF0ZSB0byBzYXZlLmBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY3JlYXRlLXByZWZhYlwiLCBub2RlVXVpZCwgcGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGVVdWlkLCBwYXRoLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYXNzZXRFeGlzdHMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcGF0dGVybiA9IHBhdGgucmVwbGFjZSgvXFwucHJlZmFiJC8sIFwiXCIpICsgXCIuKlwiO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHsgcGF0dGVybiB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIChyZXN1bHRzIHx8IFtdKS5sZW5ndGggPiAwO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gISFpbmZvO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGluc3RhbnRpYXRlUHJlZmFiKHByZWZhYlV1aWQ6IHN0cmluZywgcGFyZW50Pzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJjcmVhdGUtbm9kZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHByZWZhYlV1aWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlZmFiIOe3qOmbhuODouODvOODieS4reOBruWgtOWQiOOAgeODjeOCueODiCBQcmVmYWIg5oOF5aCx44KS6KiY5oa2XHJcbiAgICAgICAgICAgIC8vIHByZWZhYl91cGRhdGUg5pmC44GrIEpTT04g5b6M5Yem55CG44GnIGFzc2V0L2luc3RhbmNlL25lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMg44KS6Kit5a6aXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdOZXN0ZWRQcmVmYWJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByZWZhYkFzc2V0VXVpZDogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiBwYXJlbnQsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm9kZVV1aWQsIHByZWZhYlV1aWQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHVwZGF0ZVByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiYXBwbHktcHJlZmFiXCIsIG5vZGVVdWlkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOODjeOCueODiCBQcmVmYWIg44GuIEpTT04g5b6M5Yem55CGXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9wZW5kaW5nTmVzdGVkUHJlZmFicy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9maXhOZXN0ZWRQcmVmYWJKc29uKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm9kZVV1aWQsIHJlc3VsdCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwcmVmYWJfdXBkYXRlIOW+jOOBqyBQcmVmYWIgSlNPTiDjgpLlvozlh6bnkIbjgZfjgabjgIHjg43jgrnjg4ggUHJlZmFiIOWPgueFp+OCkuato+OBl+OBj+ioreWumuOBmeOCiy5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBfZml4TmVzdGVkUHJlZmFiSnNvbihfcm9vdE5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAodGhpcy5fcGVuZGluZ05lc3RlZFByZWZhYnMubGVuZ3RoID09PSAwKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIOOCt+ODvOODs+OCkuS/neWtmOOBl+OBpiBQcmVmYWIgSlNPTiDjgpLmm7jjgY3lh7rjgZlcclxuICAgICAgICAgICAgLy8g54++5Zyo44K344O844Oz44GMIHVudGl0bGVkIChzY2VuZS0yZCkg44Gu5aC05ZCI44CBc2F2ZS1zY2VuZSDjga/jg4DjgqTjgqLjg63jgrDjgpLlh7rjgZnjga7jgadcclxuICAgICAgICAgICAgLy8gc2FmZVNhdmVTY2VuZSDjgafjgrnjgq3jg4Pjg5fjgZnjgovjgIJ1bnRpdGxlZCDjgafjgrfjg7zjg7PjgavjgqTjg7Pjgrnjgr/jg7PjgrnjgYzlsYXjgovjgrHjg7zjgrnjga9cclxuICAgICAgICAgICAgLy8g5pys5p2lIHByZWZhYl9vcGVuIOODouODvOODieOBp+OBruOBv+eZuueUn+OBmeOCi+OBruOBpyBzYXZlIOOBjOWKueOBj+aDs+WumuOBoOOBjOOAgVxyXG4gICAgICAgICAgICAvLyDjg4bjgrnjg4jnrYnjgafnm7TmjqXlkbzjgbDjgozjgZ/loLTlkIjjga7kv53orbfjgajjgZfjgaYgc2tpcCDjgZnjgovjgIJcclxuICAgICAgICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBzYWZlU2F2ZVNjZW5lKCk7XHJcbiAgICAgICAgICAgIGlmICghc2F2ZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcclxuICAgICAgICAgICAgICAgICAgICBcIltQcmVmYWJUb29sc10gX2ZpeE5lc3RlZFByZWZhYkpzb246IHNhdmUtc2NlbmUgc2tpcHBlZCAodW50aXRsZWQgc2NlbmUpLiBcIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJOZXN0ZWQgcHJlZmFiIEpTT04gcG9zdC1wcm9jZXNzaW5nIG1heSBiZSBpbmNvbXBsZXRlLlwiXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxNTAwKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBwcmVmYWJfb3BlbiDjgafoqJjmhrbjgZfjgZ8gVVVJRCDjgYvjgonjg5XjgqHjgqTjg6vjg5HjgrnjgpLlj5blvpdcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9jdXJyZW50UHJlZmFiVXVpZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcHJlZmFiUGF0aCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXHJcbiAgICAgICAgICAgICAgICBcImFzc2V0LWRiXCIsIFwicXVlcnktcGF0aFwiLCB0aGlzLl9jdXJyZW50UHJlZmFiVXVpZFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAoIXByZWZhYlBhdGgpIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHByZWZhYlBhdGgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocHJlZmFiUGF0aCwgXCJ1dGYtOFwiKSk7XHJcblxyXG4gICAgICAgICAgICAvLyDlkITjg43jgrnjg4ggUHJlZmFiIOOCqOODs+ODiOODquOCkuWHpueQhlxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMuX3BlbmRpbmdOZXN0ZWRQcmVmYWJzKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBmaWxlSWQg44Gn44OO44O844OJ44KS5qSc57Si77yIbm9kZVV1aWQg44Gv44K344O844Oz5YaFIFVVSUTjgIFQcmVmYWIgSlNPTiDlhoXjgafjga8gZmlsZUlk77yJXHJcbiAgICAgICAgICAgICAgICBsZXQgZmxwTm9kZUlkeCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbaV0uX190eXBlX18gPT09IFwiY2MuUHJlZmFiSW5mb1wiICYmIGRhdGFbaV0uZmlsZUlkID09PSBlbnRyeS5ub2RlVXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDjgZPjga4gUHJlZmFiSW5mbyDjgpLmjIHjgaTjg47jg7zjg4njgpLmjqLjgZlcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkYXRhLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YVtqXS5fcHJlZmFiPy5fX2lkX18gPT09IGkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbHBOb2RlSWR4ID0gajtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gZmlsZUlkIOOBp+imi+OBpOOBi+OCieOBquOBhOWgtOWQiOOAgeODjuODvOODieWQjeOBp+aknOe0olxyXG4gICAgICAgICAgICAgICAgaWYgKGZscE5vZGVJZHggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJlZmFiIOOCouOCu+ODg+ODiOWQjeOCkuWPluW+l1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgZW50cnkucHJlZmFiQXNzZXRVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldE5hbWUgPSBhc3NldEluZm8/Lm5hbWU/LnJlcGxhY2UoXCIucHJlZmFiXCIsIFwiXCIpIHx8IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhW2ldLl9fdHlwZV9fID09PSBcImNjLk5vZGVcIiAmJiAoZGF0YVtpXS5fbmFtZSA9PT0gYXNzZXROYW1lIHx8IGRhdGFbaV0uX25hbWUgPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYklkeCA9IGRhdGFbaV0uX3ByZWZhYj8uX19pZF9fO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZWZhYklkeCAhPSBudWxsICYmIGRhdGFbcHJlZmFiSWR4XT8uYXNzZXQ/Ll9faWRfXyA9PT0gMCAmJiAhZGF0YVtwcmVmYWJJZHhdPy5pbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZscE5vZGVJZHggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmbHBOb2RlSWR4IDwgMCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiSW5mb0lkeCA9IGRhdGFbZmxwTm9kZUlkeF0uX3ByZWZhYj8uX19pZF9fO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZWZhYkluZm9JZHggPT0gbnVsbCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHJlZmFiSW5mbyDjgpLkv67mraNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkluZm8gPSBkYXRhW3ByZWZhYkluZm9JZHhdO1xyXG4gICAgICAgICAgICAgICAgcHJlZmFiSW5mby5yb290ID0geyBfX2lkX186IGZscE5vZGVJZHggfTtcclxuICAgICAgICAgICAgICAgIHByZWZhYkluZm8uYXNzZXQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX191dWlkX186IGVudHJ5LnByZWZhYkFzc2V0VXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBfX2V4cGVjdGVkVHlwZV9fOiBcImNjLlByZWZhYlwiLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmVmYWJJbnN0YW5jZSDjgpLov73liqBcclxuICAgICAgICAgICAgICAgIGlmICghcHJlZmFiSW5mby5pbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlSWR4ID0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX190eXBlX186IFwiY2MuUHJlZmFiSW5zdGFuY2VcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUlkOiBjcnlwdG8ucmFuZG9tQnl0ZXMoMTYpLnRvU3RyaW5nKFwiYmFzZTY0XCIpLnJlcGxhY2UoL1srLz1dL2csIFwiXCIpLnN1YnN0cmluZygwLCAyMiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlJvb3ROb2RlOiB7IF9faWRfXzogMSB9LCAvLyBQcmVmYWIg57eo6ZuG44Oi44O844OJ44Gu44Or44O844OIXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdW50ZWRDaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdW50ZWRDb21wb25lbnRzOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlPdmVycmlkZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkQ29tcG9uZW50czogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IHsgX19pZF9fOiBpbnN0YW5jZUlkeCB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIOWtkOODjuODvOODieODu+OCs+ODs+ODneODvOODjeODs+ODiOOCkuOCr+ODquOCou+8iFByZWZhYiDjgqLjgrvjg4Pjg4jjgYvjgonlvqnlhYPjgZXjgozjgovvvIlcclxuICAgICAgICAgICAgICAgIGRhdGFbZmxwTm9kZUlkeF0uX2NoaWxkcmVuID0gW107XHJcbiAgICAgICAgICAgICAgICBkYXRhW2ZscE5vZGVJZHhdLl9jb21wb25lbnRzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g44Or44O844OI44GuIG5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMg44Gr6L+95YqgXHJcbiAgICAgICAgICAgICAgICBjb25zdCByb290UHJlZmFiSWR4ID0gZGF0YVsxXS5fcHJlZmFiPy5fX2lkX187XHJcbiAgICAgICAgICAgICAgICBpZiAocm9vdFByZWZhYklkeCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdFByZWZhYiA9IGRhdGFbcm9vdFByZWZhYklkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyb290UHJlZmFiLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByZWZhYi5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFscmVhZHlOZXN0ZWQgPSByb290UHJlZmFiLm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHMuc29tZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHI6IGFueSkgPT4gcj8uX19pZF9fID09PSBmbHBOb2RlSWR4XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWFscmVhZHlOZXN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByZWZhYi5uZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzLnB1c2goeyBfX2lkX186IGZscE5vZGVJZHggfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHByZWZhYlBhdGgsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nTmVzdGVkUHJlZmFicyA9IFtdO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJbUHJlZmFiVG9vbHNdIF9maXhOZXN0ZWRQcmVmYWJKc29uIGZhaWxlZDpcIiwgZS5tZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZXZlcnRQcmVmYWIobm9kZVV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJldmVydC1wcmVmYWJcIiwgbm9kZVV1aWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlVXVpZCwgcmVzdWx0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFByZWZhYkluZm8odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgdXVpZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGluZm8gfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlQW5kUmVwbGFjZShub2RlVXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyAxLiBDaGVjayBpZiBwcmVmYWIgYWxyZWFkeSBleGlzdHNcclxuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLmFzc2V0RXhpc3RzKHBhdGgpO1xyXG4gICAgICAgICAgICBpZiAoZXhpc3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXHJcbiAgICAgICAgICAgICAgICAgICAgYFByZWZhYiBhbHJlYWR5IGV4aXN0cyBhdCBcIiR7cGF0aH1cIi4gRGVsZXRlIGl0IGZpcnN0IG9yIHVzZSBhIGRpZmZlcmVudCBwYXRoLmBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIDIuIEdldCBub2RlIGluZm8gKHBhcmVudCwgc2libGluZyBpbmRleCwgdHJhbnNmb3JtKSBiZWZvcmUgY3JlYXRpbmcgcHJlZmFiXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFtub2RlVXVpZF0pO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVJbmZvPy5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBOb2RlICR7bm9kZVV1aWR9IG5vdCBmb3VuZGApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSBub2RlSW5mby5kYXRhPy5wYXJlbnQ7XHJcblxyXG4gICAgICAgICAgICAvLyAzLiBDcmVhdGUgcHJlZmFiIGZyb20gdGhlIG5vZGVcclxuICAgICAgICAgICAgY29uc3QgcHJlZmFiQXNzZXRVdWlkID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY3JlYXRlLXByZWZhYlwiLCBub2RlVXVpZCwgcGF0aCk7XHJcbiAgICAgICAgICAgIGlmICghcHJlZmFiQXNzZXRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFwiY3JlYXRlLXByZWZhYiByZXR1cm5lZCBubyBhc3NldCBVVUlEXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyA0LiBEZWxldGUgdGhlIG9yaWdpbmFsIG5vZGVcclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmVtb3ZlLW5vZGVcIiwgeyB1dWlkOiBub2RlVXVpZCB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIDUuIEluc3RhbnRpYXRlIHRoZSBwcmVmYWIgYXQgdGhlIHNhbWUgcGFyZW50XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGVVdWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiY3JlYXRlLW5vZGVcIiwge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50OiBwYXJlbnRVdWlkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogcHJlZmFiQXNzZXRVdWlkLFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcHJlZmFiQXNzZXRVdWlkLFxyXG4gICAgICAgICAgICAgICAgcHJlZmFiUGF0aDogcGF0aCxcclxuICAgICAgICAgICAgICAgIG9yaWdpbmFsTm9kZVV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgbmV3SW5zdGFuY2VVdWlkOiBuZXdOb2RlVXVpZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgb3BlblByZWZhYih1dWlkPzogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBmb3JjZTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gUHJlZmFiIOOCkumWi+OBj+OBqOOBjeOCguWGhemDqOeahOOBq+OCt+ODvOODs+WIh+abv+OBjOeZuueUn+OBmeOCi+OBruOBpyBkaXJ0eSB1bnRpdGxlZCDjg4Hjgqfjg4Pjgq9cclxuICAgICAgICAgICAgYXdhaXQgZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2goZm9yY2UpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVzb2x2ZSBVVUlEIGZyb20gcGF0aCBpZiBuZWVkZWRcclxuICAgICAgICAgICAgbGV0IGFzc2V0VXVpZCA9IHV1aWQ7XHJcbiAgICAgICAgICAgIGlmICghYXNzZXRVdWlkICYmIHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldC1pbmZvXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkID0gaW5mbz8udXVpZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWFzc2V0VXVpZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcIkVpdGhlciB1dWlkIG9yIHBhdGggaXMgcmVxdWlyZWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE9wZW4gcHJlZmFiIGluIGVkaXRpbmcgbW9kZSAoZXF1aXZhbGVudCB0byBkb3VibGUtY2xpY2spXHJcbiAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcIm9wZW4tYXNzZXRcIiwgYXNzZXRVdWlkKTtcclxuICAgICAgICAgICAgLy8gV2FpdCBmb3IgcHJlZmFiIGVkaXRpbmcgbW9kZSB0byBpbml0aWFsaXplXHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50UHJlZmFiVXVpZCA9IGFzc2V0VXVpZDtcclxuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ05lc3RlZFByZWZhYnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFzc2V0VXVpZCwgbW9kZTogXCJwcmVmYWItZWRpdFwiIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNsb3NlUHJlZmFiKHNhdmU6IGJvb2xlYW4sIHNjZW5lVXVpZD86IHN0cmluZywgZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIDEuIFNhdmUgcHJlZmFiIGlmIHJlcXVlc3RlZFxyXG4gICAgICAgICAgICAvLyBwcmVmYWIgZWRpdCDjg6Ljg7zjg4nkuK3jga8gXCJjdXJyZW50IHNjZW5lXCIgPSDnt6jpm4bkuK0gUHJlZmFiIOOBquOBruOBpyBzYXZlLXNjZW5lIOOBryBQcmVmYWIg44KS5L+d5a2Y44GZ44KL44CCXHJcbiAgICAgICAgICAgIC8vIOOBn+OBoOOBlyB1bnRpdGxlZCDjg5Xjgqnjg7zjg6vjg5Djg4Pjgq/jgavlvZPjgZ/jgaPjgZ/loLTlkIjjga/jg4DjgqTjgqLjg63jgrDlm57pgb/jga7jgZ/jgoHjgrnjgq3jg4Pjg5fjgZnjgovjgIJcclxuICAgICAgICAgICAgaWYgKHNhdmUpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHNhZmVTYXZlU2NlbmUoKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCA1MDApKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMi4gRGV0ZXJtaW5lIHdoaWNoIHNjZW5lIHRvIHJldHVybiB0b1xyXG4gICAgICAgICAgICBsZXQgdGFyZ2V0U2NlbmUgPSBzY2VuZVV1aWQ7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0U2NlbmUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRyeSBwcm9qZWN0J3Mgc3RhcnQgc2NlbmVcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0U2NlbmUgPSBhd2FpdCAoRWRpdG9yIGFzIGFueSkuUHJvZmlsZS5nZXRDb25maWcoXCJwcmV2aWV3XCIsIFwiZ2VuZXJhbC5zdGFydF9zY2VuZVwiLCBcImxvY2FsXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gZmlyc3Qgc2NlbmVcclxuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0U2NlbmUgfHwgdGFyZ2V0U2NlbmUgPT09IFwiY3VycmVudF9zY2VuZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2NUeXBlOiBcImNjLlNjZW5lQXNzZXRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogXCJkYjovL2Fzc2V0cy8qKi8qXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NlbmVzKSAmJiBzY2VuZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRTY2VuZSA9IHNjZW5lc1swXS51dWlkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMy4gT3BlbiB0aGUgc2NlbmVcclxuICAgICAgICAgICAgaWYgKHRhcmdldFNjZW5lKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwcmVmYWIgZWRpdCDjg6Ljg7zjg4njgYvjgonmiLvjgovpgbfnp7vjgoLjg4DjgqTjgqLjg63jgrDjgYzlh7rjgYbjgotcclxuICAgICAgICAgICAgICAgIGF3YWl0IGVuc3VyZVNjZW5lU2FmZVRvU3dpdGNoKGZvcmNlKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcIm9wZW4tc2NlbmVcIiwgdGFyZ2V0U2NlbmUpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmV0dXJuZWRUb1NjZW5lOiB0YXJnZXRTY2VuZSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVGcm9tU3BlYyhwcmVmYWJQYXRoOiBzdHJpbmcsIHNwZWM6IGFueSwgYXV0b0JpbmRNb2RlOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyAxLiDml6LlrZggUHJlZmFiIOODgeOCp+ODg+OCr1xyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuYXNzZXRFeGlzdHMocHJlZmFiUGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcclxuICAgICAgICAgICAgICAgICAgICBgUHJlZmFiIGFscmVhZHkgZXhpc3RzIGF0IFwiJHtwcmVmYWJQYXRofVwiLiBEZWxldGUgaXQgZmlyc3Qgb3IgdXNlIGEgZGlmZmVyZW50IHBhdGguYFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMi4g44K344O844Oz44Or44O844OIIFVVSUQg44KS5Y+W5b6XXHJcbiAgICAgICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlLXRyZWVcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvb3RVdWlkID0gQXJyYXkuaXNBcnJheSh0cmVlKSA/ICh0cmVlWzBdIGFzIGFueSk/LnV1aWQgOiAodHJlZSBhcyBhbnkpPy51dWlkO1xyXG4gICAgICAgICAgICBpZiAoIXJvb3RVdWlkKSByZXR1cm4gZXJyKFwiQ291bGQgbm90IGRldGVybWluZSBzY2VuZSByb290IFVVSURcIik7XHJcblxyXG4gICAgICAgICAgICAvLyAzLiDjg47jg7zjg4njg4Tjg6rjg7zjgpLmp4vnr4lcclxuICAgICAgICAgICAgY29uc3QgYXV0b0JpbmQgPSBzcGVjLmF1dG9CaW5kO1xyXG4gICAgICAgICAgICBjb25zdCBjbGVhblNwZWMgPSB7IC4uLnNwZWMgfTtcclxuICAgICAgICAgICAgZGVsZXRlIGNsZWFuU3BlYy5hdXRvQmluZDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHRyZWVSZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiYnVpbGROb2RlVHJlZVwiLCBbcm9vdFV1aWQsIGNsZWFuU3BlY10pO1xyXG4gICAgICAgICAgICBpZiAoIXRyZWVSZXN1bHQ/LnN1Y2Nlc3MpIHJldHVybiBlcnIodHJlZVJlc3VsdD8uZXJyb3IgfHwgXCJidWlsZE5vZGVUcmVlIGZhaWxlZFwiKTtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSB0cmVlUmVzdWx0LmRhdGE/LnV1aWQ7XHJcbiAgICAgICAgICAgIGlmICghbm9kZVV1aWQpIHJldHVybiBlcnIoXCJidWlsZE5vZGVUcmVlIHJldHVybmVkIG5vIHJvb3Qgbm9kZSBVVUlEXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8gNC4gYXV0b0JpbmQg5a6f6KGMXHJcbiAgICAgICAgICAgIGxldCBhdXRvQmluZFJlc3VsdDogYW55ID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKGF1dG9CaW5kKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2NvbXBvbmVudFRvb2xzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycihcImF1dG9CaW5kIHJlcXVpcmVzIENvbXBvbmVudFRvb2xzIGRlcGVuZGVuY3kgKGludGVybmFsIGNvbmZpZ3VyYXRpb24gZXJyb3IpXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QgYmluZFRvb2xSZXN1bHQgPSBhd2FpdCB0aGlzLl9jb21wb25lbnRUb29scy5leGVjdXRlKFwiY29tcG9uZW50X2F1dG9fYmluZFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZTogYXV0b0JpbmQsXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yY2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IGF1dG9CaW5kTW9kZSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBhdXRvQmluZFJlc3VsdCA9IEpTT04ucGFyc2UoYmluZFRvb2xSZXN1bHQuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggeyBhdXRvQmluZFJlc3VsdCA9IGJpbmRUb29sUmVzdWx0OyB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIDUuIFByZWZhYiDkvZzmiJBcclxuICAgICAgICAgICAgY29uc3QgcHJlZmFiQXNzZXRVdWlkID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcclxuICAgICAgICAgICAgICAgIFwic2NlbmVcIiwgXCJjcmVhdGUtcHJlZmFiXCIsIG5vZGVVdWlkLCBwcmVmYWJQYXRoXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICghcHJlZmFiQXNzZXRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZW1vdmUtbm9kZVwiLCB7IHV1aWQ6IG5vZGVVdWlkIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcImNyZWF0ZS1wcmVmYWIgcmV0dXJuZWQgbm8gYXNzZXQgVVVJRFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gNi4g5LiA5pmC44OO44O844OJ44KS5YmK6ZmkXHJcbiAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInJlbW92ZS1ub2RlXCIsIHsgdXVpZDogbm9kZVV1aWQgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHByZWZhYkFzc2V0VXVpZCxcclxuICAgICAgICAgICAgICAgIHBhdGg6IHByZWZhYlBhdGgsXHJcbiAgICAgICAgICAgICAgICBub2RlVHJlZTogdHJlZVJlc3VsdC5kYXRhLFxyXG4gICAgICAgICAgICAgICAgYXV0b0JpbmQ6IGF1dG9CaW5kUmVzdWx0LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgbWV0aG9kLFxyXG4gICAgICAgICAgICBhcmdzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==