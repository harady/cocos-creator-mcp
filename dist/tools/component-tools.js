"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentTools = void 0;
const tool_base_1 = require("../tool-base");
const utils_1 = require("../utils");
const node_resolve_1 = require("../node-resolve");
const screenshot_1 = require("../screenshot");
const EXT_NAME = "cocos-creator-mcp";
class ComponentTools {
    constructor() {
        this.categoryName = "component";
    }
    getTools() {
        return [
            {
                name: "component_add",
                description: "Add a component to a node. Use cc.XXX format (e.g. 'cc.Label', 'cc.Sprite', 'cc.Button').",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        componentType: { type: "string", description: "Component class name (e.g. 'cc.Label')" },
                    },
                    required: ["uuid", "componentType"],
                },
            },
            {
                name: "component_remove",
                description: "Remove a component from a node.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        componentType: { type: "string", description: "Component class name to remove" },
                    },
                    required: ["uuid", "componentType"],
                },
            },
            {
                name: "component_get_components",
                description: "Get all components on a node with their properties.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID (either uuid or nodeName required)" },
                        nodeName: { type: "string", description: "Node name to find (alternative to uuid)" },
                    },
                },
            },
            {
                name: "component_set_property",
                description: "Set one or more properties on a component. For single: use property+value. For batch: use properties array. Use nodeName instead of uuid to find node by name. Set screenshot=true to capture editor screenshot after changes. Examples: Label.string, Label.fontSize, Sprite.color, UITransform.contentSize.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID (either uuid or nodeName required)" },
                        nodeName: { type: "string", description: "Node name to find (alternative to uuid — avoids UUID lookup)" },
                        componentType: { type: "string", description: "Component class name (e.g. 'cc.Label')" },
                        property: { type: "string", description: "Property name (single mode)" },
                        value: { description: "Value to set (single mode)" },
                        properties: {
                            type: "array",
                            description: "Batch mode: array of {property, value} objects to set multiple properties at once",
                            items: {
                                type: "object",
                                properties: {
                                    property: { type: "string", description: "Property name" },
                                    value: { description: "Value to set" },
                                },
                                required: ["property", "value"],
                            },
                        },
                        screenshot: { type: "boolean", description: "If true, capture editor screenshot after setting properties and return the file path (default: false)" },
                    },
                    required: ["componentType"],
                },
            },
            {
                name: "component_get_info",
                description: "Get detailed dump of a specific component by its UUID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentUuid: { type: "string", description: "Component UUID (not node UUID)" },
                    },
                    required: ["componentUuid"],
                },
            },
            {
                name: "component_get_available",
                description: "List all available component classes that can be added to nodes.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "component_auto_bind",
                description: "Automatically bind @property references by matching property names to descendant node names. Searches only descendants of the target node. Validates component type existence. Supports array properties (Slot_0, Slot_1...). Mode: 'fuzzy' (default) tries exact match first, then case-insensitive; 'strict' requires exact match only.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID (either uuid or nodeName required)" },
                        nodeName: { type: "string", description: "Node name to find (alternative to uuid)" },
                        componentType: { type: "string", description: "Script component class name (e.g. 'QuestReadyPageView')" },
                        force: { type: "boolean", description: "If true, rebind even already-bound properties (default: false)" },
                        mode: { type: "string", enum: ["fuzzy", "strict"], description: "Matching mode: 'fuzzy' (default) or 'strict'" },
                    },
                    required: ["componentType"],
                },
            },
            {
                name: "component_query_enum",
                description: "Get enum values for a component property. Useful for knowing what values Layout.type, Layout.resizeMode, etc. accept.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        componentType: { type: "string", description: "Component class (e.g. 'cc.Layout')" },
                        property: { type: "string", description: "Property name (e.g. 'type', 'resizeMode')" },
                    },
                    required: ["uuid", "componentType", "property"],
                },
            },
        ];
    }
    async execute(toolName, args) {
        var _a, _b;
        // パラメータエイリアス: component → componentType
        const compType = args.componentType || args.component;
        // nodeName → uuid 解決（対応ツールのみ）
        const needsResolve = ["component_set_property", "component_get_components", "component_auto_bind"];
        if (needsResolve.includes(toolName) && !args.uuid && args.nodeName) {
            try {
                const resolved = await (0, node_resolve_1.resolveNodeUuid)({ nodeName: args.nodeName });
                args.uuid = resolved.uuid;
            }
            catch (e) {
                return (0, tool_base_1.err)(e.message || String(e));
            }
        }
        switch (toolName) {
            case "component_add":
                return this.addComponent(args.uuid, compType);
            case "component_remove":
                return this.removeComponent(args.uuid, compType);
            case "component_get_components":
                return this.getComponents(args.uuid);
            case "component_set_property": {
                const properties = (0, utils_1.parseMaybeJson)(args.properties);
                let result;
                if (properties && Array.isArray(properties)) {
                    const parsed = properties.map((p) => (Object.assign(Object.assign({}, p), { value: (0, utils_1.parseMaybeJson)(p.value) })));
                    result = await this.setProperties(args.uuid, compType, parsed);
                }
                else {
                    result = await this.setProperty(args.uuid, compType, args.property, (0, utils_1.parseMaybeJson)(args.value));
                }
                // screenshot オプション
                if (args.screenshot) {
                    try {
                        const ss = await (0, screenshot_1.takeEditorScreenshot)();
                        const data = JSON.parse(result.content[0].text);
                        data.screenshot = { path: ss.path, size: ss.savedSize };
                        return (0, tool_base_1.ok)(data);
                    }
                    catch (ssErr) {
                        // スクショ失敗してもプロパティ設定結果は返す
                        const data = JSON.parse(result.content[0].text);
                        data.screenshotError = ssErr.message || String(ssErr);
                        return (0, tool_base_1.ok)(data);
                    }
                }
                return result;
            }
            case "component_get_info": {
                try {
                    const dump = await Editor.Message.request("scene", "query-component", args.componentUuid);
                    return (0, tool_base_1.ok)({ success: true, component: dump });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "component_get_available": {
                try {
                    const classes = await Editor.Message.request("scene", "query-classes");
                    return (0, tool_base_1.ok)({ success: true, classes });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "component_auto_bind":
                return this.autoBind(args.uuid, compType, (_a = args.force) !== null && _a !== void 0 ? _a : false, (_b = args.mode) !== null && _b !== void 0 ? _b : "fuzzy");
            case "component_query_enum":
                return this.queryEnum(args.uuid, compType, args.property);
            default:
                return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
        }
    }
    async addComponent(uuid, componentType) {
        try {
            const result = await this.sceneScript("addComponentToNode", [uuid, componentType]);
            return (0, tool_base_1.ok)(result);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async queryEnum(nodeUuid, componentType, property) {
        var _a;
        try {
            const nodeDump = await Editor.Message.request("scene", "query-node", nodeUuid);
            if (!nodeDump)
                return (0, tool_base_1.err)("Node not found");
            const comps = nodeDump.__comps__ || [];
            for (const comp of comps) {
                const compType = comp.type;
                if (!compType)
                    continue;
                // Match by cc.XXX format
                const normalizedType = componentType.startsWith("cc.") ? componentType.substring(3) : componentType;
                if (compType !== `cc.${normalizedType}` && compType !== componentType)
                    continue;
                const propDump = (_a = comp.value) === null || _a === void 0 ? void 0 : _a[property];
                if (!propDump)
                    return (0, tool_base_1.err)(`Property '${property}' not found on ${componentType}`);
                if (propDump.type !== "Enum") {
                    return (0, tool_base_1.ok)({ success: true, property, type: propDump.type, note: "Not an enum property", currentValue: propDump.value });
                }
                return (0, tool_base_1.ok)({
                    success: true,
                    property,
                    currentValue: propDump.value,
                    enumList: propDump.enumList,
                });
            }
            return (0, tool_base_1.err)(`Component ${componentType} not found on node`);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async removeComponent(uuid, componentType) {
        try {
            const result = await this.sceneScript("removeComponentFromNode", [uuid, componentType]);
            return (0, tool_base_1.ok)(result);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getComponents(uuid) {
        var _a, _b;
        try {
            const result = await this.sceneScript("getNodeInfo", [uuid]);
            if (!result.success)
                return (0, tool_base_1.ok)(result);
            return (0, tool_base_1.ok)({
                success: true,
                uuid,
                name: (_a = result.data) === null || _a === void 0 ? void 0 : _a.name,
                components: ((_b = result.data) === null || _b === void 0 ? void 0 : _b.components) || [],
            });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    /**
     * @property 名とノード名を自動マッチングしてバインドする。
     *
     * - 検索スコープ: 対象ノードの子孫のみ
     * - 複数ヒット時: 階層の浅いノード（直接の子）を優先
     * - 型検証: Component 参照型の場合、該当コンポーネントの存在を確認
     * - 配列対応: @property([Node]) → 連番ノード名 (Slots_0, Slots_1...)
     * - mode:
     *   - "fuzzy" (default): 完全一致 → case-insensitive → not_found+候補
     *   - "strict": 完全一致のみ → not_found+候補
     */
    async autoBind(nodeUuid, componentType, force, mode) {
        try {
            const nodeDump = await Editor.Message.request("scene", "query-node", nodeUuid);
            if (!nodeDump)
                return (0, tool_base_1.err)("Node not found");
            const comps = nodeDump.__comps__ || [];
            const compName = componentType.replace("cc.", "");
            const compIndex = comps.findIndex((c) => {
                const t = c.type || "";
                return t === compName || t === `cc.${compName}`;
            });
            if (compIndex < 0)
                return (0, tool_base_1.err)(`Component ${componentType} not found on node`);
            // 子孫ノード一覧を一括取得（検索効率化）
            const allDescendants = await this.sceneScript("getAllDescendants", [nodeUuid]);
            const descendantList = (allDescendants === null || allDescendants === void 0 ? void 0 : allDescendants.success) ? allDescendants.data : [];
            const compDump = comps[compIndex];
            const properties = compDump.value || {};
            const skipKeys = new Set(["uuid", "name", "enabled", "node", "__scriptAsset", "__prefab", "_name", "_objFlags", "_enabled"]);
            const results = [];
            for (const [propName, propDumpRaw] of Object.entries(properties)) {
                if (skipKeys.has(propName) || propName.startsWith("_"))
                    continue;
                const propDump = propDumpRaw;
                const propType = propDump.type;
                if (!propType)
                    continue;
                const extendsArr = (propDump.extends || []);
                // 配列型の判定
                const isArray = propType === "Array" || Array.isArray(propDump.value);
                if (isArray) {
                    const arrayResult = await this.autoBindArray(nodeUuid, compIndex, propName, propDump, descendantList, mode);
                    results.push(arrayResult);
                    continue;
                }
                const isNodeRef = propType === "cc.Node";
                const isComponentRef = extendsArr.includes("cc.Component");
                if (!isNodeRef && !isComponentRef)
                    continue;
                // 既にバインド済みならスキップ
                const currentValue = propDump.value;
                if (!force && (currentValue === null || currentValue === void 0 ? void 0 : currentValue.uuid)) {
                    results.push({ property: propName, status: "already_bound" });
                    continue;
                }
                // 名前マッチ: 完全一致 → fuzzy時は case-insensitive
                const matchResult = this.findMatchingNode(propName, descendantList, mode);
                if (matchResult && isComponentRef) {
                    // 型検証: コンポーネントが存在するか
                    const hasComp = await this.nodeHasComponent(matchResult.uuid, propType);
                    if (!hasComp) {
                        results.push({ property: propName, type: propType, status: "type_mismatch",
                            nodeName: matchResult.name, message: `Node "${matchResult.name}" has no ${propType} component` });
                        continue;
                    }
                }
                if (!matchResult) {
                    // 候補サジェスト
                    const suggestions = this.getSuggestions(propName, descendantList);
                    results.push({ property: propName, type: propType, status: "not_found", suggestions });
                    continue;
                }
                const path = `__comps__.${compIndex}.${propName}`;
                const dump = await this.buildDumpWithTypeInfo(nodeUuid, path, matchResult.uuid);
                const setResult = await this.sceneScript("setPropertyViaEditor", [nodeUuid, path, dump]);
                const status = matchResult.exact ? "bound" : "fuzzy_bound";
                results.push({ property: propName, status, nodeName: matchResult.name, success: (setResult === null || setResult === void 0 ? void 0 : setResult.success) !== false });
            }
            const boundCount = results.filter(r => r.status === "bound" || r.status === "fuzzy_bound").length;
            const fuzzyCount = results.filter(r => r.status === "fuzzy_bound").length;
            const notFoundCount = results.filter(r => r.status === "not_found").length;
            return (0, tool_base_1.ok)({ success: true, boundCount, fuzzyCount, notFoundCount, results });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    /**
     * 子孫リストからプロパティ名にマッチするノードを検索。
     * 完全一致を優先、fuzzy モードでは case-insensitive もフォールバック。
     * 複数ヒット時は階層の浅い（depth が小さい）ものを優先。
     */
    findMatchingNode(propName, descendants, mode) {
        const candidates = this.propertyNameToNodeNames(propName);
        // 1. 完全一致
        for (const candidate of candidates) {
            const matches = descendants
                .filter(d => d.name === candidate)
                .sort((a, b) => a.depth - b.depth);
            if (matches.length > 0) {
                return { uuid: matches[0].uuid, name: matches[0].name, exact: true };
            }
        }
        // 2. fuzzy: case-insensitive
        if (mode === "fuzzy") {
            const lowerCandidates = candidates.map(c => c.toLowerCase());
            const matches = descendants
                .filter(d => lowerCandidates.includes(d.name.toLowerCase()))
                .sort((a, b) => a.depth - b.depth);
            if (matches.length > 0) {
                return { uuid: matches[0].uuid, name: matches[0].name, exact: false };
            }
        }
        return null;
    }
    /**
     * not_found 時に似た名前のノードをサジェストする。
     */
    getSuggestions(propName, descendants) {
        const lower = propName.toLowerCase();
        return descendants
            .filter(d => d.name.toLowerCase().includes(lower) || lower.includes(d.name.toLowerCase()))
            .map(d => d.name)
            .slice(0, 5);
    }
    /**
     * ノードに指定型のコンポーネントが存在するか確認。
     */
    async nodeHasComponent(nodeUuid, propType) {
        var _a;
        const typeName = propType.replace("cc.", "");
        const info = await this.sceneScript("getNodeInfo", [nodeUuid]);
        if (!(info === null || info === void 0 ? void 0 : info.success) || !((_a = info === null || info === void 0 ? void 0 : info.data) === null || _a === void 0 ? void 0 : _a.components))
            return false;
        return info.data.components.some((c) => c.type === typeName);
    }
    /**
     * 配列 @property の自動バインド。
     * プロパティ名 "slots" → "Slots_0", "Slots_1", ... の連番ノードを検索。
     */
    async autoBindArray(nodeUuid, compIndex, propName, propDump, descendants, mode) {
        var _a, _b;
        const elementType = (_b = (_a = propDump.value) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.type;
        if (!elementType) {
            return { property: propName, status: "skip", reason: "empty array or unknown element type" };
        }
        const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
        const foundElements = [];
        let index = 0;
        while (true) {
            const candidateName = `${pascal}_${index}`;
            // 完全一致 or case-insensitive
            let match = descendants.find(d => d.name === candidateName);
            if (!match && mode === "fuzzy") {
                const lower = candidateName.toLowerCase();
                match = descendants.find(d => d.name.toLowerCase() === lower);
            }
            if (!match)
                break;
            const elementPath = `__comps__.${compIndex}.${propName}.${index}`;
            const dump = await this.buildDumpWithTypeInfo(nodeUuid, elementPath, match.uuid);
            const setResult = await this.sceneScript("setPropertyViaEditor", [nodeUuid, elementPath, dump]);
            const exact = match.name === candidateName;
            foundElements.push({ index, nodeName: match.name, exact, success: (setResult === null || setResult === void 0 ? void 0 : setResult.success) !== false });
            index++;
        }
        if (foundElements.length === 0) {
            return { property: propName, status: "not_found", type: "Array", candidates: [`${pascal}_0`, `${pascal}_1`, "..."] };
        }
        const hasFuzzy = foundElements.some(e => !e.exact);
        return { property: propName, status: hasFuzzy ? "fuzzy_bound" : "bound", type: "Array", count: foundElements.length, elements: foundElements };
    }
    /**
     * camelCase プロパティ名からノード名の候補を生成。
     * closeButton → ["CloseButton", "closeButton"]
     */
    propertyNameToNodeNames(propName) {
        const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
        const names = [pascal];
        if (pascal !== propName)
            names.push(propName);
        return names;
    }
    async setProperty(uuid, componentType, property, value) {
        var _a;
        try {
            // コンポーネントのインデックスを取得
            const nodeInfo = await this.sceneScript("getNodeInfo", [uuid]);
            if (!(nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.success) || !((_a = nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.data) === null || _a === void 0 ? void 0 : _a.components)) {
                return (0, tool_base_1.err)(`Node ${uuid} not found or has no components`);
            }
            const compName = componentType.replace("cc.", "");
            const compIndex = nodeInfo.data.components.findIndex((c) => c.type === compName);
            if (compIndex < 0) {
                return (0, tool_base_1.err)(`Component ${componentType} not found on node ${uuid}`);
            }
            // scene:set-property でプロパティ変更（Prefab保存時にも反映される）
            // パス形式: __comps__.{index}.{property}
            const path = `__comps__.${compIndex}.${property}`;
            // プロパティの型情報をquery-nodeから取得して、適切なdump形式を構築
            const dump = await this.buildDumpWithTypeInfo(uuid, path, value);
            const result = await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
            // cc.Widget の isAlign* 設定後は _alignFlags を再計算する
            // (Editor が isAlign* 変更時に _alignFlags を自動更新しないバグの対処)
            if (componentType === "cc.Widget" && property.startsWith("isAlign")) {
                await this.recalcWidgetAlignFlags(uuid, compIndex);
            }
            return (0, tool_base_1.ok)({ success: true, path, dump, result });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async setProperties(uuid, componentType, properties) {
        var _a;
        try {
            if (!componentType)
                return (0, tool_base_1.err)("componentType is required");
            if (!properties.length)
                return (0, tool_base_1.err)("properties array is empty");
            // コンポーネントのインデックスを取得（1回だけ）
            const nodeInfo = await this.sceneScript("getNodeInfo", [uuid]);
            if (!(nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.success) || !((_a = nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.data) === null || _a === void 0 ? void 0 : _a.components)) {
                return (0, tool_base_1.err)(`Node ${uuid} not found or has no components`);
            }
            const compName = componentType.replace("cc.", "");
            const compIndex = nodeInfo.data.components.findIndex((c) => c.type === compName);
            if (compIndex < 0) {
                return (0, tool_base_1.err)(`Component ${componentType} not found on node ${uuid}`);
            }
            const results = [];
            for (const { property, value } of properties) {
                const path = `__comps__.${compIndex}.${property}`;
                const dump = await this.buildDumpWithTypeInfo(uuid, path, value);
                const result = await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
                results.push({ property, success: (result === null || result === void 0 ? void 0 : result.success) !== false, path });
            }
            const allOk = results.every(r => r.success);
            // cc.Widget の isAlign* 設定後は _alignFlags を再計算する
            // (Editor が isAlign* 変更時に _alignFlags を自動更新しないバグの対処)
            if (componentType === "cc.Widget" && properties.some(p => p.property.startsWith("isAlign"))) {
                await this.recalcWidgetAlignFlags(uuid, compIndex);
            }
            return (0, tool_base_1.ok)({ success: allOk, results });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    /**
     * cc.Widget の isAlign* プロパティ現在値から _alignFlags ビットマスクを再計算して設定する。
     *
     * CocosCreator Editor は isAlign* を setPropertyViaEditor で変更しても
     * _alignFlags を自動更新しないバグがある。このヘルパーで明示的に同期する。
     *
     * _alignFlags ビット定義:
     *   isAlignLeft=1, isAlignRight=2, isAlignTop=4, isAlignBottom=8,
     *   isAlignHorizontalCenter=16, isAlignVerticalCenter=32
     */
    async recalcWidgetAlignFlags(uuid, wIdx) {
        var _a, _b, _c;
        const ALIGN_BITS = {
            isAlignLeft: 1, isAlignRight: 2, isAlignTop: 4, isAlignBottom: 8,
            isAlignHorizontalCenter: 16, isAlignVerticalCenter: 32,
        };
        try {
            const nodeDump = await Editor.Message.request("scene", "query-node", uuid);
            if (!nodeDump)
                return;
            const wCompDump = (_a = nodeDump.__comps__) === null || _a === void 0 ? void 0 : _a[wIdx];
            if (!wCompDump)
                return;
            let alignFlags = 0;
            for (const [key, bit] of Object.entries(ALIGN_BITS)) {
                if (((_c = (_b = wCompDump.value) === null || _b === void 0 ? void 0 : _b[key]) === null || _c === void 0 ? void 0 : _c.value) === true)
                    alignFlags |= bit;
            }
            const path = `__comps__.${wIdx}._alignFlags`;
            await this.sceneScript("setPropertyViaEditor", [uuid, path, { value: alignFlags, type: "Number" }]);
        }
        catch (_e) {
            // _alignFlags 再計算の失敗は致命的でないため無視
        }
    }
    /**
     * プロパティの型情報をEditor APIから取得し、適切なdump形式を構築する。
     *
     * UUID文字列が渡された場合、プロパティの型に応じて:
     * - Node/Component参照型 → {type: propType, value: {uuid: nodeUuid}}
     * - Asset参照型（cc.Prefab等） → {type: propType, value: {uuid: assetUuid}}
     * - String型 → {value, type: "String"}
     */
    async buildDumpWithTypeInfo(nodeUuid, path, value) {
        var _a;
        // プリミティブ型はそのまま
        if (typeof value === "number")
            return { value, type: "Number" };
        if (typeof value === "boolean")
            return { value, type: "Boolean" };
        // オブジェクト形式 {uuid: "xxx", type: "cc.Node"} はそのまま
        // type 指定なしの {uuid: "xxx"} はプロパティの実際の型を解決するため文字列扱いに変換する
        if (value !== null && typeof value === "object" && typeof value.uuid === "string") {
            if (typeof value.type === "string") {
                return { type: value.type, value: { uuid: value.uuid } };
            }
            // type 未指定: 文字列として処理してプロパティ型から解決
            value = value.uuid;
        }
        // @path: プレフィックスの場合: パスからノードUUIDを解決
        if (typeof value === "string" && value.startsWith("@path:")) {
            const nodePath = value.slice(6);
            const result = await this.sceneScript("findNodeByPath", [nodePath]);
            if ((result === null || result === void 0 ? void 0 : result.success) && ((_a = result.data) === null || _a === void 0 ? void 0 : _a.uuid)) {
                value = result.data.uuid;
            }
            else {
                throw new Error(`Node not found at path: ${nodePath}`);
            }
        }
        // 文字列の場合: プロパティの型情報を取得して判定
        if (typeof value === "string") {
            try {
                const nodeDump = await Editor.Message.request("scene", "query-node", nodeUuid);
                if (nodeDump) {
                    const propDump = this.resolveDumpPath(nodeDump, path);
                    if (propDump === null || propDump === void 0 ? void 0 : propDump.type) {
                        const propType = propDump.type;
                        const extendsArr = (propDump.extends || []);
                        const isComponentRef = extendsArr.includes("cc.Component");
                        const isNodeRef = propType === "cc.Node";
                        const isAssetRef = extendsArr.includes("cc.Asset");
                        if (isComponentRef) {
                            // コンポーネント参照: ノードUUIDからコンポーネントUUIDを解決
                            const compUuid = await this.resolveComponentUuid(value, propType);
                            return { type: propType, value: { uuid: compUuid || value } };
                        }
                        if (isNodeRef) {
                            return { type: propType, value: { uuid: value } };
                        }
                        if (isAssetRef) {
                            return { type: propType, value: { uuid: value } };
                        }
                    }
                }
            }
            catch (_e) {
                // query-node失敗時はフォールバック
            }
            return { value, type: "String" };
        }
        // その他のオブジェクト（contentSize, color等の構造体）
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            const wrapped = {};
            for (const [k, v] of Object.entries(value)) {
                wrapped[k] = { value: v };
            }
            return { value: wrapped };
        }
        return { value };
    }
    /**
     * query-nodeのdumpからドットパスでプロパティを解決する。
     * 例: "__comps__.2.scrollView" → nodeDump.__comps__[2].value.scrollView
     */
    resolveDumpPath(nodeDump, path) {
        var _a;
        const parts = path.split(".");
        let current = nodeDump;
        for (const part of parts) {
            if (!current)
                return null;
            if (part === "__comps__") {
                current = current.__comps__;
            }
            else if (/^\d+$/.test(part)) {
                current = (_a = current[parseInt(part)]) === null || _a === void 0 ? void 0 : _a.value;
            }
            else {
                current = current === null || current === void 0 ? void 0 : current[part];
            }
        }
        return current;
    }
    /**
     * ノードUUIDからコンポーネントUUIDを解決する。
     * propType（例: "cc.ScrollView", "MissionListPanel"）に一致するコンポーネントを探す。
     */
    async resolveComponentUuid(nodeUuid, propType) {
        var _a;
        try {
            const nodeInfo = await this.sceneScript("getNodeInfo", [nodeUuid]);
            if (!(nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.success) || !((_a = nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.data) === null || _a === void 0 ? void 0 : _a.components))
                return null;
            const typeName = propType.replace("cc.", "");
            const comp = nodeInfo.data.components.find((c) => c.type === typeName);
            return (comp === null || comp === void 0 ? void 0 : comp.uuid) || null;
        }
        catch (_e) {
            return null;
        }
    }
    async sceneScript(method, args) {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
exports.ComponentTools = ComponentTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvbXBvbmVudC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0Q0FBdUM7QUFDdkMsb0NBQTBDO0FBQzFDLGtEQUFrRDtBQUNsRCw4Q0FBcUQ7QUFFckQsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFFckMsTUFBYSxjQUFjO0lBQTNCO1FBQ2EsaUJBQVksR0FBRyxXQUFXLENBQUM7SUFxcUJ4QyxDQUFDO0lBbnFCRyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxlQUFlO2dCQUNyQixXQUFXLEVBQUUsMkZBQTJGO2dCQUN4RyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRTt3QkFDbEQsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsd0NBQXdDLEVBQUU7cUJBQzNGO29CQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUM7aUJBQ3RDO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixXQUFXLEVBQUUsaUNBQWlDO2dCQUM5QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRTt3QkFDbEQsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsZ0NBQWdDLEVBQUU7cUJBQ25GO29CQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUM7aUJBQ3RDO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVB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LENBQUEsSUFBSSxDQUFDLENBQUEsTUFBQSxRQUFRLGFBQVIsUUFBUSx1QkFBUixRQUFRLENBQUUsSUFBSSwwQ0FBRSxVQUFVLENBQUE7Z0JBQUUsT0FBTyxJQUFJLENBQUM7WUFDbkUsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0MsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDO1lBQzVFLE9BQU8sQ0FBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsSUFBSSxLQUFJLElBQUksQ0FBQztRQUM5QixDQUFDO1FBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUNWLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsSUFBVztRQUNqRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEVBQUUsUUFBUTtZQUNkLE1BQU07WUFDTixJQUFJO1NBQ1AsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBdHFCRCx3Q0FzcUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5pbXBvcnQgeyBwYXJzZU1heWJlSnNvbiB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgeyByZXNvbHZlTm9kZVV1aWQgfSBmcm9tIFwiLi4vbm9kZS1yZXNvbHZlXCI7XHJcbmltcG9ydCB7IHRha2VFZGl0b3JTY3JlZW5zaG90IH0gZnJvbSBcIi4uL3NjcmVlbnNob3RcIjtcclxuXHJcbmNvbnN0IEVYVF9OQU1FID0gXCJjb2Nvcy1jcmVhdG9yLW1jcFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwiY29tcG9uZW50XCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfYWRkXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBZGQgYSBjb21wb25lbnQgdG8gYSBub2RlLiBVc2UgY2MuWFhYIGZvcm1hdCAoZS5nLiAnY2MuTGFiZWwnLCAnY2MuU3ByaXRlJywgJ2NjLkJ1dHRvbicpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lIChlLmcuICdjYy5MYWJlbCcpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwiY29tcG9uZW50VHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X3JlbW92ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVtb3ZlIGEgY29tcG9uZW50IGZyb20gYSBub2RlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lIHRvIHJlbW92ZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcImNvbXBvbmVudFR5cGVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImNvbXBvbmVudF9nZXRfY29tcG9uZW50c1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGFsbCBjb21wb25lbnRzIG9uIGEgbm9kZSB3aXRoIHRoZWlyIHByb3BlcnRpZXMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRCAoZWl0aGVyIHV1aWQgb3Igbm9kZU5hbWUgcmVxdWlyZWQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBuYW1lIHRvIGZpbmQgKGFsdGVybmF0aXZlIHRvIHV1aWQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfc2V0X3Byb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgb25lIG9yIG1vcmUgcHJvcGVydGllcyBvbiBhIGNvbXBvbmVudC4gRm9yIHNpbmdsZTogdXNlIHByb3BlcnR5K3ZhbHVlLiBGb3IgYmF0Y2g6IHVzZSBwcm9wZXJ0aWVzIGFycmF5LiBVc2Ugbm9kZU5hbWUgaW5zdGVhZCBvZiB1dWlkIHRvIGZpbmQgbm9kZSBieSBuYW1lLiBTZXQgc2NyZWVuc2hvdD10cnVlIHRvIGNhcHR1cmUgZWRpdG9yIHNjcmVlbnNob3QgYWZ0ZXIgY2hhbmdlcy4gRXhhbXBsZXM6IExhYmVsLnN0cmluZywgTGFiZWwuZm9udFNpemUsIFNwcml0ZS5jb2xvciwgVUlUcmFuc2Zvcm0uY29udGVudFNpemUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRCAoZWl0aGVyIHV1aWQgb3Igbm9kZU5hbWUgcmVxdWlyZWQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBuYW1lIHRvIGZpbmQgKGFsdGVybmF0aXZlIHRvIHV1aWQg4oCUIGF2b2lkcyBVVUlEIGxvb2t1cClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lIChlLmcuICdjYy5MYWJlbCcpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJvcGVydHkgbmFtZSAoc2luZ2xlIG1vZGUpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHsgZGVzY3JpcHRpb246IFwiVmFsdWUgdG8gc2V0IChzaW5nbGUgbW9kZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJCYXRjaCBtb2RlOiBhcnJheSBvZiB7cHJvcGVydHksIHZhbHVlfSBvYmplY3RzIHRvIHNldCBtdWx0aXBsZSBwcm9wZXJ0aWVzIGF0IG9uY2VcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IG5hbWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogeyBkZXNjcmlwdGlvbjogXCJWYWx1ZSB0byBzZXRcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInByb3BlcnR5XCIsIFwidmFsdWVcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JlZW5zaG90OiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJJZiB0cnVlLCBjYXB0dXJlIGVkaXRvciBzY3JlZW5zaG90IGFmdGVyIHNldHRpbmcgcHJvcGVydGllcyBhbmQgcmV0dXJuIHRoZSBmaWxlIHBhdGggKGRlZmF1bHQ6IGZhbHNlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wiY29tcG9uZW50VHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgZHVtcCBvZiBhIHNwZWNpZmljIGNvbXBvbmVudCBieSBpdHMgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSUQgKG5vdCBub2RlIFVVSUQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJjb21wb25lbnRVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfZ2V0X2F2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhbGwgYXZhaWxhYmxlIGNvbXBvbmVudCBjbGFzc2VzIHRoYXQgY2FuIGJlIGFkZGVkIHRvIG5vZGVzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfYXV0b19iaW5kXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBdXRvbWF0aWNhbGx5IGJpbmQgQHByb3BlcnR5IHJlZmVyZW5jZXMgYnkgbWF0Y2hpbmcgcHJvcGVydHkgbmFtZXMgdG8gZGVzY2VuZGFudCBub2RlIG5hbWVzLiBTZWFyY2hlcyBvbmx5IGRlc2NlbmRhbnRzIG9mIHRoZSB0YXJnZXQgbm9kZS4gVmFsaWRhdGVzIGNvbXBvbmVudCB0eXBlIGV4aXN0ZW5jZS4gU3VwcG9ydHMgYXJyYXkgcHJvcGVydGllcyAoU2xvdF8wLCBTbG90XzEuLi4pLiBNb2RlOiAnZnV6enknIChkZWZhdWx0KSB0cmllcyBleGFjdCBtYXRjaCBmaXJzdCwgdGhlbiBjYXNlLWluc2Vuc2l0aXZlOyAnc3RyaWN0JyByZXF1aXJlcyBleGFjdCBtYXRjaCBvbmx5LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgKGVpdGhlciB1dWlkIG9yIG5vZGVOYW1lIHJlcXVpcmVkKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVOYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgbmFtZSB0byBmaW5kIChhbHRlcm5hdGl2ZSB0byB1dWlkKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2NyaXB0IGNvbXBvbmVudCBjbGFzcyBuYW1lIChlLmcuICdRdWVzdFJlYWR5UGFnZVZpZXcnKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJJZiB0cnVlLCByZWJpbmQgZXZlbiBhbHJlYWR5LWJvdW5kIHByb3BlcnRpZXMgKGRlZmF1bHQ6IGZhbHNlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZW51bTogW1wiZnV6enlcIiwgXCJzdHJpY3RcIl0sIGRlc2NyaXB0aW9uOiBcIk1hdGNoaW5nIG1vZGU6ICdmdXp6eScgKGRlZmF1bHQpIG9yICdzdHJpY3QnXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJjb21wb25lbnRUeXBlXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfcXVlcnlfZW51bVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGVudW0gdmFsdWVzIGZvciBhIGNvbXBvbmVudCBwcm9wZXJ0eS4gVXNlZnVsIGZvciBrbm93aW5nIHdoYXQgdmFsdWVzIExheW91dC50eXBlLCBMYXlvdXQucmVzaXplTW9kZSwgZXRjLiBhY2NlcHQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IGNsYXNzIChlLmcuICdjYy5MYXlvdXQnKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IG5hbWUgKGUuZy4gJ3R5cGUnLCAncmVzaXplTW9kZScpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwiY29tcG9uZW50VHlwZVwiLCBcInByb3BlcnR5XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIOODkeODqeODoeODvOOCv+OCqOOCpOODquOCouOCuTogY29tcG9uZW50IOKGkiBjb21wb25lbnRUeXBlXHJcbiAgICAgICAgY29uc3QgY29tcFR5cGUgPSBhcmdzLmNvbXBvbmVudFR5cGUgfHwgYXJncy5jb21wb25lbnQ7XHJcblxyXG4gICAgICAgIC8vIG5vZGVOYW1lIOKGkiB1dWlkIOino+axuu+8iOWvvuW/nOODhOODvOODq+OBruOBv++8iVxyXG4gICAgICAgIGNvbnN0IG5lZWRzUmVzb2x2ZSA9IFtcImNvbXBvbmVudF9zZXRfcHJvcGVydHlcIiwgXCJjb21wb25lbnRfZ2V0X2NvbXBvbmVudHNcIiwgXCJjb21wb25lbnRfYXV0b19iaW5kXCJdO1xyXG4gICAgICAgIGlmIChuZWVkc1Jlc29sdmUuaW5jbHVkZXModG9vbE5hbWUpICYmICFhcmdzLnV1aWQgJiYgYXJncy5ub2RlTmFtZSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSBhd2FpdCByZXNvbHZlTm9kZVV1aWQoeyBub2RlTmFtZTogYXJncy5ub2RlTmFtZSB9KTtcclxuICAgICAgICAgICAgICAgIGFyZ3MudXVpZCA9IHJlc29sdmVkLnV1aWQ7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2FkZFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ29tcG9uZW50KGFyZ3MudXVpZCwgY29tcFR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X3JlbW92ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlQ29tcG9uZW50KGFyZ3MudXVpZCwgY29tcFR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2dldF9jb21wb25lbnRzXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRzKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJjb21wb25lbnRfc2V0X3Byb3BlcnR5XCI6IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBwYXJzZU1heWJlSnNvbihhcmdzLnByb3BlcnRpZXMpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdDogVG9vbFJlc3VsdDtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzICYmIEFycmF5LmlzQXJyYXkocHJvcGVydGllcykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBwcm9wZXJ0aWVzLm1hcCgocDogYW55KSA9PiAoeyAuLi5wLCB2YWx1ZTogcGFyc2VNYXliZUpzb24ocC52YWx1ZSkgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuc2V0UHJvcGVydGllcyhhcmdzLnV1aWQsIGNvbXBUeXBlLCBwYXJzZWQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgY29tcFR5cGUsIGFyZ3MucHJvcGVydHksIHBhcnNlTWF5YmVKc29uKGFyZ3MudmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHNjcmVlbnNob3Qg44Kq44OX44K344On44OzXHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5zY3JlZW5zaG90KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3MgPSBhd2FpdCB0YWtlRWRpdG9yU2NyZWVuc2hvdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyZXN1bHQuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5zY3JlZW5zaG90ID0geyBwYXRoOiBzcy5wYXRoLCBzaXplOiBzcy5zYXZlZFNpemUgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHNzRXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g44K544Kv44K344On5aSx5pWX44GX44Gm44KC44OX44Ot44OR44OG44Kj6Kit5a6a57WQ5p6c44Gv6L+U44GZXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJlc3VsdC5jb250ZW50WzBdLnRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnNjcmVlbnNob3RFcnJvciA9IHNzRXJyLm1lc3NhZ2UgfHwgU3RyaW5nKHNzRXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcImNvbXBvbmVudF9nZXRfaW5mb1wiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jb21wb25lbnRcIiwgYXJncy5jb21wb25lbnRVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBjb21wb25lbnQ6IGR1bXAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJjb21wb25lbnRfZ2V0X2F2YWlsYWJsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jbGFzc2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNsYXNzZXMgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJjb21wb25lbnRfYXV0b19iaW5kXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hdXRvQmluZChhcmdzLnV1aWQsIGNvbXBUeXBlLCBhcmdzLmZvcmNlID8/IGZhbHNlLCBhcmdzLm1vZGUgPz8gXCJmdXp6eVwiKTtcclxuICAgICAgICAgICAgY2FzZSBcImNvbXBvbmVudF9xdWVyeV9lbnVtXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeUVudW0oYXJncy51dWlkLCBjb21wVHlwZSwgYXJncy5wcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYWRkQ29tcG9uZW50KHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImFkZENvbXBvbmVudFRvTm9kZVwiLCBbdXVpZCwgY29tcG9uZW50VHlwZV0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeUVudW0obm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUR1bXAgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlXCIsIG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlRHVtcCkgcmV0dXJuIGVycihcIk5vZGUgbm90IGZvdW5kXCIpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29tcHMgPSBub2RlRHVtcC5fX2NvbXBzX18gfHwgW107XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcCBvZiBjb21wcykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcFR5cGUgPSBjb21wLnR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXBUeXBlKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIC8vIE1hdGNoIGJ5IGNjLlhYWCBmb3JtYXRcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRUeXBlID0gY29tcG9uZW50VHlwZS5zdGFydHNXaXRoKFwiY2MuXCIpID8gY29tcG9uZW50VHlwZS5zdWJzdHJpbmcoMykgOiBjb21wb25lbnRUeXBlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbXBUeXBlICE9PSBgY2MuJHtub3JtYWxpemVkVHlwZX1gICYmIGNvbXBUeXBlICE9PSBjb21wb25lbnRUeXBlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wRHVtcCA9IGNvbXAudmFsdWU/Lltwcm9wZXJ0eV07XHJcbiAgICAgICAgICAgICAgICBpZiAoIXByb3BEdW1wKSByZXR1cm4gZXJyKGBQcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIG5vdCBmb3VuZCBvbiAke2NvbXBvbmVudFR5cGV9YCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcER1bXAudHlwZSAhPT0gXCJFbnVtXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwcm9wZXJ0eSwgdHlwZTogcHJvcER1bXAudHlwZSwgbm90ZTogXCJOb3QgYW4gZW51bSBwcm9wZXJ0eVwiLCBjdXJyZW50VmFsdWU6IHByb3BEdW1wLnZhbHVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogcHJvcER1bXAudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZW51bUxpc3Q6IHByb3BEdW1wLmVudW1MaXN0LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGVycihgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGVgKTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZW1vdmVDb21wb25lbnQodXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwicmVtb3ZlQ29tcG9uZW50RnJvbU5vZGVcIiwgW3V1aWQsIGNvbXBvbmVudFR5cGVdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Q29tcG9uZW50cyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2VzcykgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgdXVpZCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IHJlc3VsdC5kYXRhPy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgY29tcG9uZW50czogcmVzdWx0LmRhdGE/LmNvbXBvbmVudHMgfHwgW10sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwcm9wZXJ0eSDlkI3jgajjg47jg7zjg4nlkI3jgpLoh6rli5Xjg57jg4Pjg4Hjg7PjgrDjgZfjgabjg5DjgqTjg7Pjg4njgZnjgovjgIJcclxuICAgICAqXHJcbiAgICAgKiAtIOaknOe0ouOCueOCs+ODvOODlzog5a++6LGh44OO44O844OJ44Gu5a2Q5a2r44Gu44G/XHJcbiAgICAgKiAtIOikh+aVsOODkuODg+ODiOaZgjog6ZqO5bGk44Gu5rWF44GE44OO44O844OJ77yI55u05o6l44Gu5a2Q77yJ44KS5YSq5YWIXHJcbiAgICAgKiAtIOWei+aknOiovDogQ29tcG9uZW50IOWPgueFp+Wei+OBruWgtOWQiOOAgeipsuW9k+OCs+ODs+ODneODvOODjeODs+ODiOOBruWtmOWcqOOCkueiuuiqjVxyXG4gICAgICogLSDphY3liJflr77lv5w6IEBwcm9wZXJ0eShbTm9kZV0pIOKGkiDpgKPnlarjg47jg7zjg4nlkI0gKFNsb3RzXzAsIFNsb3RzXzEuLi4pXHJcbiAgICAgKiAtIG1vZGU6XHJcbiAgICAgKiAgIC0gXCJmdXp6eVwiIChkZWZhdWx0KTog5a6M5YWo5LiA6Ie0IOKGkiBjYXNlLWluc2Vuc2l0aXZlIOKGkiBub3RfZm91bmQr5YCZ6KOcXHJcbiAgICAgKiAgIC0gXCJzdHJpY3RcIjog5a6M5YWo5LiA6Ie044Gu44G/IOKGkiBub3RfZm91bmQr5YCZ6KOcXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgYXV0b0JpbmQobm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBmb3JjZTogYm9vbGVhbiwgbW9kZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUR1bXAgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlXCIsIG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlRHVtcCkgcmV0dXJuIGVycihcIk5vZGUgbm90IGZvdW5kXCIpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29tcHMgPSBub2RlRHVtcC5fX2NvbXBzX18gfHwgW107XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBOYW1lID0gY29tcG9uZW50VHlwZS5yZXBsYWNlKFwiY2MuXCIsIFwiXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBjb21wSW5kZXggPSBjb21wcy5maW5kSW5kZXgoKGM6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdCA9IGMudHlwZSB8fCBcIlwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHQgPT09IGNvbXBOYW1lIHx8IHQgPT09IGBjYy4ke2NvbXBOYW1lfWA7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoY29tcEluZGV4IDwgMCkgcmV0dXJuIGVycihgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGVgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWtkOWtq+ODjuODvOODieS4gOimp+OCkuS4gOaLrOWPluW+l++8iOaknOe0ouWKueeOh+WMlu+8iVxyXG4gICAgICAgICAgICBjb25zdCBhbGxEZXNjZW5kYW50cyA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXRBbGxEZXNjZW5kYW50c1wiLCBbbm9kZVV1aWRdKTtcclxuICAgICAgICAgICAgY29uc3QgZGVzY2VuZGFudExpc3Q6IEFycmF5PHt1dWlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgZGVwdGg6IG51bWJlcn0+ID1cclxuICAgICAgICAgICAgICAgIGFsbERlc2NlbmRhbnRzPy5zdWNjZXNzID8gYWxsRGVzY2VuZGFudHMuZGF0YSA6IFtdO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29tcER1bXAgPSBjb21wc1tjb21wSW5kZXhdO1xyXG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0aWVzID0gY29tcER1bXAudmFsdWUgfHwge307XHJcbiAgICAgICAgICAgIGNvbnN0IHNraXBLZXlzID0gbmV3IFNldChbXCJ1dWlkXCIsIFwibmFtZVwiLCBcImVuYWJsZWRcIiwgXCJub2RlXCIsIFwiX19zY3JpcHRBc3NldFwiLCBcIl9fcHJlZmFiXCIsIFwiX25hbWVcIiwgXCJfb2JqRmxhZ3NcIiwgXCJfZW5hYmxlZFwiXSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCBbcHJvcE5hbWUsIHByb3BEdW1wUmF3XSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNraXBLZXlzLmhhcyhwcm9wTmFtZSkgfHwgcHJvcE5hbWUuc3RhcnRzV2l0aChcIl9cIikpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BEdW1wID0gcHJvcER1bXBSYXcgYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcFR5cGUgPSBwcm9wRHVtcC50eXBlIGFzIHN0cmluZztcclxuICAgICAgICAgICAgICAgIGlmICghcHJvcFR5cGUpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGV4dGVuZHNBcnIgPSAocHJvcER1bXAuZXh0ZW5kcyB8fCBbXSkgYXMgc3RyaW5nW107XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g6YWN5YiX5Z6L44Gu5Yik5a6aXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpc0FycmF5ID0gcHJvcFR5cGUgPT09IFwiQXJyYXlcIiB8fCBBcnJheS5pc0FycmF5KHByb3BEdW1wLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJyYXlSZXN1bHQgPSBhd2FpdCB0aGlzLmF1dG9CaW5kQXJyYXkobm9kZVV1aWQsIGNvbXBJbmRleCwgcHJvcE5hbWUsIHByb3BEdW1wLCBkZXNjZW5kYW50TGlzdCwgbW9kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5UmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpc05vZGVSZWYgPSBwcm9wVHlwZSA9PT0gXCJjYy5Ob2RlXCI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpc0NvbXBvbmVudFJlZiA9IGV4dGVuZHNBcnIuaW5jbHVkZXMoXCJjYy5Db21wb25lbnRcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzTm9kZVJlZiAmJiAhaXNDb21wb25lbnRSZWYpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOaXouOBq+ODkOOCpOODs+ODiea4iOOBv+OBquOCieOCueOCreODg+ODl1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gcHJvcER1bXAudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZvcmNlICYmIGN1cnJlbnRWYWx1ZT8udXVpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHByb3BlcnR5OiBwcm9wTmFtZSwgc3RhdHVzOiBcImFscmVhZHlfYm91bmRcIiB9KTtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyDlkI3liY3jg57jg4Pjg4E6IOWujOWFqOS4gOiHtCDihpIgZnV6ennmmYLjga8gY2FzZS1pbnNlbnNpdGl2ZVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSB0aGlzLmZpbmRNYXRjaGluZ05vZGUocHJvcE5hbWUsIGRlc2NlbmRhbnRMaXN0LCBtb2RlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hSZXN1bHQgJiYgaXNDb21wb25lbnRSZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDlnovmpJzoqLw6IOOCs+ODs+ODneODvOODjeODs+ODiOOBjOWtmOWcqOOBmeOCi+OBi1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc0NvbXAgPSBhd2FpdCB0aGlzLm5vZGVIYXNDb21wb25lbnQobWF0Y2hSZXN1bHQudXVpZCwgcHJvcFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaGFzQ29tcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogcHJvcE5hbWUsIHR5cGU6IHByb3BUeXBlLCBzdGF0dXM6IFwidHlwZV9taXNtYXRjaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IG1hdGNoUmVzdWx0Lm5hbWUsIG1lc3NhZ2U6IGBOb2RlIFwiJHttYXRjaFJlc3VsdC5uYW1lfVwiIGhhcyBubyAke3Byb3BUeXBlfSBjb21wb25lbnRgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaFJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOWAmeijnOOCteOCuOOCp+OCueODiFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gdGhpcy5nZXRTdWdnZXN0aW9ucyhwcm9wTmFtZSwgZGVzY2VuZGFudExpc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHByb3BlcnR5OiBwcm9wTmFtZSwgdHlwZTogcHJvcFR5cGUsIHN0YXR1czogXCJub3RfZm91bmRcIiwgc3VnZ2VzdGlvbnMgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHtjb21wSW5kZXh9LiR7cHJvcE5hbWV9YDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCB0aGlzLmJ1aWxkRHVtcFdpdGhUeXBlSW5mbyhub2RlVXVpZCwgcGF0aCwgbWF0Y2hSZXN1bHQudXVpZCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzZXRSZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0UHJvcGVydHlWaWFFZGl0b3JcIiwgW25vZGVVdWlkLCBwYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBtYXRjaFJlc3VsdC5leGFjdCA/IFwiYm91bmRcIiA6IFwiZnV6enlfYm91bmRcIjtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHByb3BlcnR5OiBwcm9wTmFtZSwgc3RhdHVzLCBub2RlTmFtZTogbWF0Y2hSZXN1bHQubmFtZSwgc3VjY2Vzczogc2V0UmVzdWx0Py5zdWNjZXNzICE9PSBmYWxzZSB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgYm91bmRDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdGF0dXMgPT09IFwiYm91bmRcIiB8fCByLnN0YXR1cyA9PT0gXCJmdXp6eV9ib3VuZFwiKS5sZW5ndGg7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1enp5Q291bnQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3RhdHVzID09PSBcImZ1enp5X2JvdW5kXCIpLmxlbmd0aDtcclxuICAgICAgICAgICAgY29uc3Qgbm90Rm91bmRDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdGF0dXMgPT09IFwibm90X2ZvdW5kXCIpLmxlbmd0aDtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYm91bmRDb3VudCwgZnV6enlDb3VudCwgbm90Rm91bmRDb3VudCwgcmVzdWx0cyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlrZDlravjg6rjgrnjg4jjgYvjgonjg5fjg63jg5Hjg4bjgqPlkI3jgavjg57jg4Pjg4HjgZnjgovjg47jg7zjg4njgpLmpJzntKLjgIJcclxuICAgICAqIOWujOWFqOS4gOiHtOOCkuWEquWFiOOAgWZ1enp5IOODouODvOODieOBp+OBryBjYXNlLWluc2Vuc2l0aXZlIOOCguODleOCqeODvOODq+ODkOODg+OCr+OAglxyXG4gICAgICog6KSH5pWw44OS44OD44OI5pmC44Gv6ZqO5bGk44Gu5rWF44GE77yIZGVwdGgg44GM5bCP44GV44GE77yJ44KC44Gu44KS5YSq5YWI44CCXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgZmluZE1hdGNoaW5nTm9kZShcclxuICAgICAgICBwcm9wTmFtZTogc3RyaW5nLCBkZXNjZW5kYW50czogQXJyYXk8e3V1aWQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBkZXB0aDogbnVtYmVyfT4sIG1vZGU6IHN0cmluZ1xyXG4gICAgKTogeyB1dWlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgZXhhY3Q6IGJvb2xlYW4gfSB8IG51bGwge1xyXG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSB0aGlzLnByb3BlcnR5TmFtZVRvTm9kZU5hbWVzKHByb3BOYW1lKTtcclxuXHJcbiAgICAgICAgLy8gMS4g5a6M5YWo5LiA6Ie0XHJcbiAgICAgICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gZGVzY2VuZGFudHNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZCA9PiBkLm5hbWUgPT09IGNhbmRpZGF0ZSlcclxuICAgICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLmRlcHRoIC0gYi5kZXB0aCk7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHV1aWQ6IG1hdGNoZXNbMF0udXVpZCwgbmFtZTogbWF0Y2hlc1swXS5uYW1lLCBleGFjdDogdHJ1ZSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAyLiBmdXp6eTogY2FzZS1pbnNlbnNpdGl2ZVxyXG4gICAgICAgIGlmIChtb2RlID09PSBcImZ1enp5XCIpIHtcclxuICAgICAgICAgICAgY29uc3QgbG93ZXJDYW5kaWRhdGVzID0gY2FuZGlkYXRlcy5tYXAoYyA9PiBjLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gZGVzY2VuZGFudHNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZCA9PiBsb3dlckNhbmRpZGF0ZXMuaW5jbHVkZXMoZC5uYW1lLnRvTG93ZXJDYXNlKCkpKVxyXG4gICAgICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuZGVwdGggLSBiLmRlcHRoKTtcclxuICAgICAgICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdXVpZDogbWF0Y2hlc1swXS51dWlkLCBuYW1lOiBtYXRjaGVzWzBdLm5hbWUsIGV4YWN0OiBmYWxzZSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG5vdF9mb3VuZCDmmYLjgavkvLzjgZ/lkI3liY3jga7jg47jg7zjg4njgpLjgrXjgrjjgqfjgrnjg4jjgZnjgovjgIJcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBnZXRTdWdnZXN0aW9ucyhwcm9wTmFtZTogc3RyaW5nLCBkZXNjZW5kYW50czogQXJyYXk8e3V1aWQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBkZXB0aDogbnVtYmVyfT4pOiBzdHJpbmdbXSB7XHJcbiAgICAgICAgY29uc3QgbG93ZXIgPSBwcm9wTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIHJldHVybiBkZXNjZW5kYW50c1xyXG4gICAgICAgICAgICAuZmlsdGVyKGQgPT4gZC5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobG93ZXIpIHx8IGxvd2VyLmluY2x1ZGVzKGQubmFtZS50b0xvd2VyQ2FzZSgpKSlcclxuICAgICAgICAgICAgLm1hcChkID0+IGQubmFtZSlcclxuICAgICAgICAgICAgLnNsaWNlKDAsIDUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44OO44O844OJ44Gr5oyH5a6a5Z6L44Gu44Kz44Oz44Od44O844ON44Oz44OI44GM5a2Y5Zyo44GZ44KL44GL56K66KqN44CCXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgbm9kZUhhc0NvbXBvbmVudChub2RlVXVpZDogc3RyaW5nLCBwcm9wVHlwZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgY29uc3QgdHlwZU5hbWUgPSBwcm9wVHlwZS5yZXBsYWNlKFwiY2MuXCIsIFwiXCIpO1xyXG4gICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW25vZGVVdWlkXSk7XHJcbiAgICAgICAgaWYgKCFpbmZvPy5zdWNjZXNzIHx8ICFpbmZvPy5kYXRhPy5jb21wb25lbnRzKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIGluZm8uZGF0YS5jb21wb25lbnRzLnNvbWUoKGM6IGFueSkgPT4gYy50eXBlID09PSB0eXBlTmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDphY3liJcgQHByb3BlcnR5IOOBruiHquWLleODkOOCpOODs+ODieOAglxyXG4gICAgICog44OX44Ot44OR44OG44Kj5ZCNIFwic2xvdHNcIiDihpIgXCJTbG90c18wXCIsIFwiU2xvdHNfMVwiLCAuLi4g44Gu6YCj55Wq44OO44O844OJ44KS5qSc57Si44CCXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgYXV0b0JpbmRBcnJheShcclxuICAgICAgICBub2RlVXVpZDogc3RyaW5nLCBjb21wSW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgcHJvcER1bXA6IGFueSxcclxuICAgICAgICBkZXNjZW5kYW50czogQXJyYXk8e3V1aWQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBkZXB0aDogbnVtYmVyfT4sIG1vZGU6IHN0cmluZ1xyXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBjb25zdCBlbGVtZW50VHlwZSA9IHByb3BEdW1wLnZhbHVlPy5bMF0/LnR5cGUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgICAgIGlmICghZWxlbWVudFR5cGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgcHJvcGVydHk6IHByb3BOYW1lLCBzdGF0dXM6IFwic2tpcFwiLCByZWFzb246IFwiZW1wdHkgYXJyYXkgb3IgdW5rbm93biBlbGVtZW50IHR5cGVcIiB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcGFzY2FsID0gcHJvcE5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wTmFtZS5zbGljZSgxKTtcclxuICAgICAgICBjb25zdCBmb3VuZEVsZW1lbnRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgIGxldCBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbmRpZGF0ZU5hbWUgPSBgJHtwYXNjYWx9XyR7aW5kZXh9YDtcclxuICAgICAgICAgICAgLy8g5a6M5YWo5LiA6Ie0IG9yIGNhc2UtaW5zZW5zaXRpdmVcclxuICAgICAgICAgICAgbGV0IG1hdGNoID0gZGVzY2VuZGFudHMuZmluZChkID0+IGQubmFtZSA9PT0gY2FuZGlkYXRlTmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghbWF0Y2ggJiYgbW9kZSA9PT0gXCJmdXp6eVwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb3dlciA9IGNhbmRpZGF0ZU5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIG1hdGNoID0gZGVzY2VuZGFudHMuZmluZChkID0+IGQubmFtZS50b0xvd2VyQ2FzZSgpID09PSBsb3dlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFtYXRjaCkgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBlbGVtZW50UGF0aCA9IGBfX2NvbXBzX18uJHtjb21wSW5kZXh9LiR7cHJvcE5hbWV9LiR7aW5kZXh9YDtcclxuICAgICAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IHRoaXMuYnVpbGREdW1wV2l0aFR5cGVJbmZvKG5vZGVVdWlkLCBlbGVtZW50UGF0aCwgbWF0Y2gudXVpZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNldFJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXRQcm9wZXJ0eVZpYUVkaXRvclwiLCBbbm9kZVV1aWQsIGVsZW1lbnRQYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGV4YWN0ID0gbWF0Y2gubmFtZSA9PT0gY2FuZGlkYXRlTmFtZTtcclxuICAgICAgICAgICAgZm91bmRFbGVtZW50cy5wdXNoKHsgaW5kZXgsIG5vZGVOYW1lOiBtYXRjaC5uYW1lLCBleGFjdCwgc3VjY2Vzczogc2V0UmVzdWx0Py5zdWNjZXNzICE9PSBmYWxzZSB9KTtcclxuICAgICAgICAgICAgaW5kZXgrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmb3VuZEVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBwcm9wZXJ0eTogcHJvcE5hbWUsIHN0YXR1czogXCJub3RfZm91bmRcIiwgdHlwZTogXCJBcnJheVwiLCBjYW5kaWRhdGVzOiBbYCR7cGFzY2FsfV8wYCwgYCR7cGFzY2FsfV8xYCwgXCIuLi5cIl0gfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaGFzRnV6enkgPSBmb3VuZEVsZW1lbnRzLnNvbWUoZSA9PiAhZS5leGFjdCk7XHJcbiAgICAgICAgcmV0dXJuIHsgcHJvcGVydHk6IHByb3BOYW1lLCBzdGF0dXM6IGhhc0Z1enp5ID8gXCJmdXp6eV9ib3VuZFwiIDogXCJib3VuZFwiLCB0eXBlOiBcIkFycmF5XCIsIGNvdW50OiBmb3VuZEVsZW1lbnRzLmxlbmd0aCwgZWxlbWVudHM6IGZvdW5kRWxlbWVudHMgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNhbWVsQ2FzZSDjg5fjg63jg5Hjg4bjgqPlkI3jgYvjgonjg47jg7zjg4nlkI3jga7lgJnoo5zjgpLnlJ/miJDjgIJcclxuICAgICAqIGNsb3NlQnV0dG9uIOKGkiBbXCJDbG9zZUJ1dHRvblwiLCBcImNsb3NlQnV0dG9uXCJdXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgcHJvcGVydHlOYW1lVG9Ob2RlTmFtZXMocHJvcE5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgICAgICBjb25zdCBwYXNjYWwgPSBwcm9wTmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3BOYW1lLnNsaWNlKDEpO1xyXG4gICAgICAgIGNvbnN0IG5hbWVzID0gW3Bhc2NhbF07XHJcbiAgICAgICAgaWYgKHBhc2NhbCAhPT0gcHJvcE5hbWUpIG5hbWVzLnB1c2gocHJvcE5hbWUpO1xyXG4gICAgICAgIHJldHVybiBuYW1lcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldFByb3BlcnR5KHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8g44Kz44Oz44Od44O844ON44Oz44OI44Gu44Kk44Oz44OH44OD44Kv44K544KS5Y+W5b6XXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MgfHwgIW5vZGVJbmZvPy5kYXRhPy5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBOb2RlICR7dXVpZH0gbm90IGZvdW5kIG9yIGhhcyBubyBjb21wb25lbnRzYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY29tcE5hbWUgPSBjb21wb25lbnRUeXBlLnJlcGxhY2UoXCJjYy5cIiwgXCJcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBJbmRleCA9IG5vZGVJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kSW5kZXgoKGM6IGFueSkgPT4gYy50eXBlID09PSBjb21wTmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChjb21wSW5kZXggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZSAke3V1aWR9YCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNjZW5lOnNldC1wcm9wZXJ0eSDjgafjg5fjg63jg5Hjg4bjgqPlpInmm7TvvIhQcmVmYWLkv53lrZjmmYLjgavjgoLlj43mmKDjgZXjgozjgovvvIlcclxuICAgICAgICAgICAgLy8g44OR44K55b2i5byPOiBfX2NvbXBzX18ue2luZGV4fS57cHJvcGVydHl9XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgX19jb21wc19fLiR7Y29tcEluZGV4fS4ke3Byb3BlcnR5fWA7XHJcblxyXG4gICAgICAgICAgICAvLyDjg5fjg63jg5Hjg4bjgqPjga7lnovmg4XloLHjgpJxdWVyeS1ub2Rl44GL44KJ5Y+W5b6X44GX44Gm44CB6YGp5YiH44GqZHVtcOW9ouW8j+OCkuani+eviVxyXG4gICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgdGhpcy5idWlsZER1bXBXaXRoVHlwZUluZm8odXVpZCwgcGF0aCwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCBkdW1wXSk7XHJcblxyXG4gICAgICAgICAgICAvLyBjYy5XaWRnZXQg44GuIGlzQWxpZ24qIOioreWumuW+jOOBryBfYWxpZ25GbGFncyDjgpLlho3oqIjnrpfjgZnjgotcclxuICAgICAgICAgICAgLy8gKEVkaXRvciDjgYwgaXNBbGlnbiog5aSJ5pu05pmC44GrIF9hbGlnbkZsYWdzIOOCkuiHquWLleabtOaWsOOBl+OBquOBhOODkOOCsOOBruWvvuWHpilcclxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUgPT09IFwiY2MuV2lkZ2V0XCIgJiYgcHJvcGVydHkuc3RhcnRzV2l0aChcImlzQWxpZ25cIikpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVjYWxjV2lkZ2V0QWxpZ25GbGFncyh1dWlkLCBjb21wSW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwYXRoLCBkdW1wLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2V0UHJvcGVydGllcyh1dWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZywgcHJvcGVydGllczogQXJyYXk8e3Byb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnl9Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50VHlwZSkgcmV0dXJuIGVycihcImNvbXBvbmVudFR5cGUgaXMgcmVxdWlyZWRcIik7XHJcbiAgICAgICAgICAgIGlmICghcHJvcGVydGllcy5sZW5ndGgpIHJldHVybiBlcnIoXCJwcm9wZXJ0aWVzIGFycmF5IGlzIGVtcHR5XCIpO1xyXG5cclxuICAgICAgICAgICAgLy8g44Kz44Oz44Od44O844ON44Oz44OI44Gu44Kk44Oz44OH44OD44Kv44K544KS5Y+W5b6X77yIMeWbnuOBoOOBke+8iVxyXG4gICAgICAgICAgICBjb25zdCBub2RlSW5mbyA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbdXVpZF0pO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVJbmZvPy5zdWNjZXNzIHx8ICFub2RlSW5mbz8uZGF0YT8uY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgTm9kZSAke3V1aWR9IG5vdCBmb3VuZCBvciBoYXMgbm8gY29tcG9uZW50c2ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBOYW1lID0gY29tcG9uZW50VHlwZS5yZXBsYWNlKFwiY2MuXCIsIFwiXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBjb21wSW5kZXggPSBub2RlSW5mby5kYXRhLmNvbXBvbmVudHMuZmluZEluZGV4KChjOiBhbnkpID0+IGMudHlwZSA9PT0gY29tcE5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoY29tcEluZGV4IDwgMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGUgJHt1dWlkfWApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHsgcHJvcGVydHksIHZhbHVlIH0gb2YgcHJvcGVydGllcykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHtjb21wSW5kZXh9LiR7cHJvcGVydHl9YDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCB0aGlzLmJ1aWxkRHVtcFdpdGhUeXBlSW5mbyh1dWlkLCBwYXRoLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0UHJvcGVydHlWaWFFZGl0b3JcIiwgW3V1aWQsIHBhdGgsIGR1bXBdKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHByb3BlcnR5LCBzdWNjZXNzOiByZXN1bHQ/LnN1Y2Nlc3MgIT09IGZhbHNlLCBwYXRoIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBhbGxPayA9IHJlc3VsdHMuZXZlcnkociA9PiByLnN1Y2Nlc3MpO1xyXG5cclxuICAgICAgICAgICAgLy8gY2MuV2lkZ2V0IOOBriBpc0FsaWduKiDoqK3lrprlvozjga8gX2FsaWduRmxhZ3Mg44KS5YaN6KiI566X44GZ44KLXHJcbiAgICAgICAgICAgIC8vIChFZGl0b3Ig44GMIGlzQWxpZ24qIOWkieabtOaZguOBqyBfYWxpZ25GbGFncyDjgpLoh6rli5Xmm7TmlrDjgZfjgarjgYTjg5DjgrDjga7lr77lh6YpXHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRUeXBlID09PSBcImNjLldpZGdldFwiICYmIHByb3BlcnRpZXMuc29tZShwID0+IHAucHJvcGVydHkuc3RhcnRzV2l0aChcImlzQWxpZ25cIikpKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlY2FsY1dpZGdldEFsaWduRmxhZ3ModXVpZCwgY29tcEluZGV4KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogYWxsT2ssIHJlc3VsdHMgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2MuV2lkZ2V0IOOBriBpc0FsaWduKiDjg5fjg63jg5Hjg4bjgqPnj77lnKjlgKTjgYvjgokgX2FsaWduRmxhZ3Mg44OT44OD44OI44Oe44K544Kv44KS5YaN6KiI566X44GX44Gm6Kit5a6a44GZ44KL44CCXHJcbiAgICAgKlxyXG4gICAgICogQ29jb3NDcmVhdG9yIEVkaXRvciDjga8gaXNBbGlnbiog44KSIHNldFByb3BlcnR5VmlhRWRpdG9yIOOBp+WkieabtOOBl+OBpuOCglxyXG4gICAgICogX2FsaWduRmxhZ3Mg44KS6Ieq5YuV5pu05paw44GX44Gq44GE44OQ44Kw44GM44GC44KL44CC44GT44Gu44OY44Or44OR44O844Gn5piO56S655qE44Gr5ZCM5pyf44GZ44KL44CCXHJcbiAgICAgKlxyXG4gICAgICogX2FsaWduRmxhZ3Mg44OT44OD44OI5a6a576pOlxyXG4gICAgICogICBpc0FsaWduTGVmdD0xLCBpc0FsaWduUmlnaHQ9MiwgaXNBbGlnblRvcD00LCBpc0FsaWduQm90dG9tPTgsXHJcbiAgICAgKiAgIGlzQWxpZ25Ib3Jpem9udGFsQ2VudGVyPTE2LCBpc0FsaWduVmVydGljYWxDZW50ZXI9MzJcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyByZWNhbGNXaWRnZXRBbGlnbkZsYWdzKHV1aWQ6IHN0cmluZywgd0lkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgQUxJR05fQklUUzogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHtcclxuICAgICAgICAgICAgaXNBbGlnbkxlZnQ6IDEsIGlzQWxpZ25SaWdodDogMiwgaXNBbGlnblRvcDogNCwgaXNBbGlnbkJvdHRvbTogOCxcclxuICAgICAgICAgICAgaXNBbGlnbkhvcml6b250YWxDZW50ZXI6IDE2LCBpc0FsaWduVmVydGljYWxDZW50ZXI6IDMyLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUR1bXAgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlXCIsIHV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVEdW1wKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnN0IHdDb21wRHVtcCA9IG5vZGVEdW1wLl9fY29tcHNfXz8uW3dJZHhdO1xyXG4gICAgICAgICAgICBpZiAoIXdDb21wRHVtcCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBsZXQgYWxpZ25GbGFncyA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgYml0XSBvZiBPYmplY3QuZW50cmllcyhBTElHTl9CSVRTKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHdDb21wRHVtcC52YWx1ZT8uW2tleV0/LnZhbHVlID09PSB0cnVlKSBhbGlnbkZsYWdzIHw9IGJpdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYF9fY29tcHNfXy4ke3dJZHh9Ll9hbGlnbkZsYWdzYDtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCB7IHZhbHVlOiBhbGlnbkZsYWdzLCB0eXBlOiBcIk51bWJlclwiIH1dKTtcclxuICAgICAgICB9IGNhdGNoIChfZSkge1xyXG4gICAgICAgICAgICAvLyBfYWxpZ25GbGFncyDlho3oqIjnrpfjga7lpLHmlZfjga/oh7Tlkb3nmoTjgafjgarjgYTjgZ/jgoHnhKHoppZcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5fjg63jg5Hjg4bjgqPjga7lnovmg4XloLHjgpJFZGl0b3IgQVBJ44GL44KJ5Y+W5b6X44GX44CB6YGp5YiH44GqZHVtcOW9ouW8j+OCkuani+evieOBmeOCi+OAglxyXG4gICAgICpcclxuICAgICAqIFVVSUTmloflrZfliJfjgYzmuKHjgZXjgozjgZ/loLTlkIjjgIHjg5fjg63jg5Hjg4bjgqPjga7lnovjgavlv5zjgZjjgaY6XHJcbiAgICAgKiAtIE5vZGUvQ29tcG9uZW505Y+C54Wn5Z6LIOKGkiB7dHlwZTogcHJvcFR5cGUsIHZhbHVlOiB7dXVpZDogbm9kZVV1aWR9fVxyXG4gICAgICogLSBBc3NldOWPgueFp+Wei++8iGNjLlByZWZhYuetie+8iSDihpIge3R5cGU6IHByb3BUeXBlLCB2YWx1ZToge3V1aWQ6IGFzc2V0VXVpZH19XHJcbiAgICAgKiAtIFN0cmluZ+WeiyDihpIge3ZhbHVlLCB0eXBlOiBcIlN0cmluZ1wifVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIGJ1aWxkRHVtcFdpdGhUeXBlSW5mbyhub2RlVXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIC8vIOODl+ODquODn+ODhuOCo+ODluWei+OBr+OBneOBruOBvuOBvlxyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpIHJldHVybiB7IHZhbHVlLCB0eXBlOiBcIk51bWJlclwiIH07XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIpIHJldHVybiB7IHZhbHVlLCB0eXBlOiBcIkJvb2xlYW5cIiB9O1xyXG5cclxuICAgICAgICAvLyDjgqrjg5bjgrjjgqfjgq/jg4jlvaLlvI8ge3V1aWQ6IFwieHh4XCIsIHR5cGU6IFwiY2MuTm9kZVwifSDjga/jgZ3jga7jgb7jgb5cclxuICAgICAgICAvLyB0eXBlIOaMh+WumuOBquOBl+OBriB7dXVpZDogXCJ4eHhcIn0g44Gv44OX44Ot44OR44OG44Kj44Gu5a6f6Zqb44Gu5Z6L44KS6Kej5rG644GZ44KL44Gf44KB5paH5a2X5YiX5omx44GE44Gr5aSJ5o+b44GZ44KLXHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUudXVpZCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlLnR5cGUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHZhbHVlLnR5cGUsIHZhbHVlOiB7IHV1aWQ6IHZhbHVlLnV1aWQgfSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHR5cGUg5pyq5oyH5a6aOiDmloflrZfliJfjgajjgZfjgablh6bnkIbjgZfjgabjg5fjg63jg5Hjg4bjgqPlnovjgYvjgonop6PmsbpcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS51dWlkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQHBhdGg6IOODl+ODrOODleOCo+ODg+OCr+OCueOBruWgtOWQiDog44OR44K544GL44KJ44OO44O844OJVVVJROOCkuino+axulxyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUuc3RhcnRzV2l0aChcIkBwYXRoOlwiKSkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlUGF0aCA9IHZhbHVlLnNsaWNlKDYpO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZmluZE5vZGVCeVBhdGhcIiwgW25vZGVQYXRoXSk7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQ/LnN1Y2Nlc3MgJiYgcmVzdWx0LmRhdGE/LnV1aWQpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVzdWx0LmRhdGEudXVpZDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm9kZSBub3QgZm91bmQgYXQgcGF0aDogJHtub2RlUGF0aH1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5paH5a2X5YiX44Gu5aC05ZCIOiDjg5fjg63jg5Hjg4bjgqPjga7lnovmg4XloLHjgpLlj5blvpfjgZfjgabliKTlrppcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlRHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGVcIiwgbm9kZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVEdW1wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcER1bXAgPSB0aGlzLnJlc29sdmVEdW1wUGF0aChub2RlRHVtcCwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BEdW1wPy50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BUeXBlID0gcHJvcER1bXAudHlwZSBhcyBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dGVuZHNBcnIgPSAocHJvcER1bXAuZXh0ZW5kcyB8fCBbXSkgYXMgc3RyaW5nW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQ29tcG9uZW50UmVmID0gZXh0ZW5kc0Fyci5pbmNsdWRlcyhcImNjLkNvbXBvbmVudFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNOb2RlUmVmID0gcHJvcFR5cGUgPT09IFwiY2MuTm9kZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0Fzc2V0UmVmID0gZXh0ZW5kc0Fyci5pbmNsdWRlcyhcImNjLkFzc2V0XCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQ29tcG9uZW50UmVmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDjgrPjg7Pjg53jg7zjg43jg7Pjg4jlj4Lnhac6IOODjuODvOODiVVVSUTjgYvjgonjgrPjg7Pjg53jg7zjg43jg7Pjg4hVVUlE44KS6Kej5rG6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wVXVpZCA9IGF3YWl0IHRoaXMucmVzb2x2ZUNvbXBvbmVudFV1aWQodmFsdWUsIHByb3BUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHByb3BUeXBlLCB2YWx1ZTogeyB1dWlkOiBjb21wVXVpZCB8fCB2YWx1ZSB9IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTm9kZVJlZikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogcHJvcFR5cGUsIHZhbHVlOiB7IHV1aWQ6IHZhbHVlIH0gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNBc3NldFJlZikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogcHJvcFR5cGUsIHZhbHVlOiB7IHV1aWQ6IHZhbHVlIH0gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoX2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIHF1ZXJ5LW5vZGXlpLHmlZfmmYLjga/jg5Xjgqnjg7zjg6vjg5Djg4Pjgq9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZSwgdHlwZTogXCJTdHJpbmdcIiB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g44Gd44Gu5LuW44Gu44Kq44OW44K444Kn44Kv44OI77yIY29udGVudFNpemUsIGNvbG9y562J44Gu5qeL6YCg5L2T77yJXHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgY29uc3Qgd3JhcHBlZDogYW55ID0ge307XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgd3JhcHBlZFtrXSA9IHsgdmFsdWU6IHYgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogd3JhcHBlZCB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdmFsdWUgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHF1ZXJ5LW5vZGXjga5kdW1w44GL44KJ44OJ44OD44OI44OR44K544Gn44OX44Ot44OR44OG44Kj44KS6Kej5rG644GZ44KL44CCXHJcbiAgICAgKiDkvos6IFwiX19jb21wc19fLjIuc2Nyb2xsVmlld1wiIOKGkiBub2RlRHVtcC5fX2NvbXBzX19bMl0udmFsdWUuc2Nyb2xsVmlld1xyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlc29sdmVEdW1wUGF0aChub2RlRHVtcDogYW55LCBwYXRoOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIGNvbnN0IHBhcnRzID0gcGF0aC5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBub2RlRHVtcDtcclxuICAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcclxuICAgICAgICAgICAgaWYgKCFjdXJyZW50KSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgaWYgKHBhcnQgPT09IFwiX19jb21wc19fXCIpIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50Ll9fY29tcHNfXztcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgvXlxcZCskLy50ZXN0KHBhcnQpKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudFtwYXJzZUludChwYXJ0KV0/LnZhbHVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQ/LltwYXJ0XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3VycmVudDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODjuODvOODiVVVSUTjgYvjgonjgrPjg7Pjg53jg7zjg43jg7Pjg4hVVUlE44KS6Kej5rG644GZ44KL44CCXHJcbiAgICAgKiBwcm9wVHlwZe+8iOS+izogXCJjYy5TY3JvbGxWaWV3XCIsIFwiTWlzc2lvbkxpc3RQYW5lbFwi77yJ44Gr5LiA6Ie044GZ44KL44Kz44Oz44Od44O844ON44Oz44OI44KS5o6i44GZ44CCXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgcmVzb2x2ZUNvbXBvbmVudFV1aWQobm9kZVV1aWQ6IHN0cmluZywgcHJvcFR5cGU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFtub2RlVXVpZF0pO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVJbmZvPy5zdWNjZXNzIHx8ICFub2RlSW5mbz8uZGF0YT8uY29tcG9uZW50cykgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGNvbnN0IHR5cGVOYW1lID0gcHJvcFR5cGUucmVwbGFjZShcImNjLlwiLCBcIlwiKTtcclxuICAgICAgICAgICAgY29uc3QgY29tcCA9IG5vZGVJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kKChjOiBhbnkpID0+IGMudHlwZSA9PT0gdHlwZU5hbWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcD8udXVpZCB8fCBudWxsO1xyXG4gICAgICAgIH0gY2F0Y2ggKF9lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=