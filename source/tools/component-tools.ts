import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";
import { parseMaybeJson } from "../utils";
import { resolveNodeUuid } from "../node-resolve";
import { takeEditorScreenshot } from "../screenshot";

const EXT_NAME = "cocos-creator-mcp";

export class ComponentTools implements ToolCategory {
    readonly categoryName = "component";

    getTools(): ToolDefinition[] {
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

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        // パラメータエイリアス: component → componentType
        const compType = args.componentType || args.component;

        // nodeName → uuid 解決（対応ツールのみ）
        const needsResolve = ["component_set_property", "component_get_components", "component_auto_bind"];
        if (needsResolve.includes(toolName) && !args.uuid && args.nodeName) {
            try {
                const resolved = await resolveNodeUuid({ nodeName: args.nodeName });
                args.uuid = resolved.uuid;
            } catch (e: any) {
                return err(e.message || String(e));
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
                const properties = parseMaybeJson(args.properties);
                let result: ToolResult;
                if (properties && Array.isArray(properties)) {
                    const parsed = properties.map((p: any) => ({ ...p, value: parseMaybeJson(p.value) }));
                    result = await this.setProperties(args.uuid, compType, parsed);
                } else {
                    result = await this.setProperty(args.uuid, compType, args.property, parseMaybeJson(args.value));
                }
                // screenshot オプション
                if (args.screenshot) {
                    try {
                        const ss = await takeEditorScreenshot();
                        const data = JSON.parse(result.content[0].text);
                        data.screenshot = { path: ss.path, size: ss.savedSize };
                        return ok(data);
                    } catch (ssErr: any) {
                        // スクショ失敗してもプロパティ設定結果は返す
                        const data = JSON.parse(result.content[0].text);
                        data.screenshotError = ssErr.message || String(ssErr);
                        return ok(data);
                    }
                }
                return result;
            }
            case "component_get_info": {
                try {
                    const dump = await (Editor.Message.request as any)("scene", "query-component", args.componentUuid);
                    return ok({ success: true, component: dump });
                } catch (e: any) { return err(e.message || String(e)); }
            }
            case "component_get_available": {
                try {
                    const classes = await (Editor.Message.request as any)("scene", "query-classes");
                    return ok({ success: true, classes });
                } catch (e: any) { return err(e.message || String(e)); }
            }
            case "component_auto_bind":
                return this.autoBind(args.uuid, compType, args.force ?? false, args.mode ?? "fuzzy");
            case "component_query_enum":
                return this.queryEnum(args.uuid, compType, args.property);
            default:
                return err(`Unknown tool: ${toolName}`);
        }
    }

    private async addComponent(uuid: string, componentType: string): Promise<ToolResult> {
        try {
            const result = await this.sceneScript("addComponentToNode", [uuid, componentType]);
            return ok(result);
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async queryEnum(nodeUuid: string, componentType: string, property: string): Promise<ToolResult> {
        try {
            const nodeDump = await (Editor.Message.request as any)("scene", "query-node", nodeUuid);
            if (!nodeDump) return err("Node not found");

            const comps = nodeDump.__comps__ || [];
            for (const comp of comps) {
                const compType = comp.type;
                if (!compType) continue;
                // Match by cc.XXX format
                const normalizedType = componentType.startsWith("cc.") ? componentType.substring(3) : componentType;
                if (compType !== `cc.${normalizedType}` && compType !== componentType) continue;

                const propDump = comp.value?.[property];
                if (!propDump) return err(`Property '${property}' not found on ${componentType}`);
                if (propDump.type !== "Enum") {
                    return ok({ success: true, property, type: propDump.type, note: "Not an enum property", currentValue: propDump.value });
                }
                return ok({
                    success: true,
                    property,
                    currentValue: propDump.value,
                    enumList: propDump.enumList,
                });
            }
            return err(`Component ${componentType} not found on node`);
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async removeComponent(uuid: string, componentType: string): Promise<ToolResult> {
        try {
            const result = await this.sceneScript("removeComponentFromNode", [uuid, componentType]);
            return ok(result);
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getComponents(uuid: string): Promise<ToolResult> {
        try {
            const result = await this.sceneScript("getNodeInfo", [uuid]);
            if (!result.success) return ok(result);
            return ok({
                success: true,
                uuid,
                name: result.data?.name,
                components: result.data?.components || [],
            });
        } catch (e: any) {
            return err(e.message || String(e));
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
    private async autoBind(nodeUuid: string, componentType: string, force: boolean, mode: string): Promise<ToolResult> {
        try {
            const nodeDump = await (Editor.Message.request as any)("scene", "query-node", nodeUuid);
            if (!nodeDump) return err("Node not found");

            const comps = nodeDump.__comps__ || [];
            const compName = componentType.replace("cc.", "");
            const compIndex = comps.findIndex((c: any) => {
                const t = c.type || "";
                return t === compName || t === `cc.${compName}`;
            });
            if (compIndex < 0) return err(`Component ${componentType} not found on node`);

            // 子孫ノード一覧を一括取得（検索効率化）
            const allDescendants = await this.sceneScript("getAllDescendants", [nodeUuid]);
            const descendantList: Array<{uuid: string, name: string, depth: number}> =
                allDescendants?.success ? allDescendants.data : [];

            const compDump = comps[compIndex];
            const properties = compDump.value || {};
            const skipKeys = new Set(["uuid", "name", "enabled", "node", "__scriptAsset", "__prefab", "_name", "_objFlags", "_enabled"]);

            const results: any[] = [];

            for (const [propName, propDumpRaw] of Object.entries(properties)) {
                if (skipKeys.has(propName) || propName.startsWith("_")) continue;

                const propDump = propDumpRaw as any;
                const propType = propDump.type as string;
                if (!propType) continue;

                const extendsArr = (propDump.extends || []) as string[];

                // 配列型の判定
                const isArray = propType === "Array" || Array.isArray(propDump.value);
                if (isArray) {
                    const arrayResult = await this.autoBindArray(nodeUuid, compIndex, propName, propDump, descendantList, mode);
                    results.push(arrayResult);
                    continue;
                }

                const isNodeRef = propType === "cc.Node";
                const isComponentRef = extendsArr.includes("cc.Component");
                if (!isNodeRef && !isComponentRef) continue;

                // 既にバインド済みならスキップ
                const currentValue = propDump.value;
                if (!force && currentValue?.uuid) {
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
                results.push({ property: propName, status, nodeName: matchResult.name, success: setResult?.success !== false });
            }

            const boundCount = results.filter(r => r.status === "bound" || r.status === "fuzzy_bound").length;
            const fuzzyCount = results.filter(r => r.status === "fuzzy_bound").length;
            const notFoundCount = results.filter(r => r.status === "not_found").length;
            return ok({ success: true, boundCount, fuzzyCount, notFoundCount, results });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    /**
     * 子孫リストからプロパティ名にマッチするノードを検索。
     * 完全一致を優先、fuzzy モードでは case-insensitive もフォールバック。
     * 複数ヒット時は階層の浅い（depth が小さい）ものを優先。
     */
    private findMatchingNode(
        propName: string, descendants: Array<{uuid: string, name: string, depth: number}>, mode: string
    ): { uuid: string; name: string; exact: boolean } | null {
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
    private getSuggestions(propName: string, descendants: Array<{uuid: string, name: string, depth: number}>): string[] {
        const lower = propName.toLowerCase();
        return descendants
            .filter(d => d.name.toLowerCase().includes(lower) || lower.includes(d.name.toLowerCase()))
            .map(d => d.name)
            .slice(0, 5);
    }

    /**
     * ノードに指定型のコンポーネントが存在するか確認。
     */
    private async nodeHasComponent(nodeUuid: string, propType: string): Promise<boolean> {
        const typeName = propType.replace("cc.", "");
        const info = await this.sceneScript("getNodeInfo", [nodeUuid]);
        if (!info?.success || !info?.data?.components) return false;
        return info.data.components.some((c: any) => c.type === typeName);
    }

    /**
     * 配列 @property の自動バインド。
     * プロパティ名 "slots" → "Slots_0", "Slots_1", ... の連番ノードを検索。
     */
    private async autoBindArray(
        nodeUuid: string, compIndex: number, propName: string, propDump: any,
        descendants: Array<{uuid: string, name: string, depth: number}>, mode: string
    ): Promise<any> {
        const elementType = propDump.value?.[0]?.type as string | undefined;
        if (!elementType) {
            return { property: propName, status: "skip", reason: "empty array or unknown element type" };
        }

        const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
        const foundElements: any[] = [];
        let index = 0;

        while (true) {
            const candidateName = `${pascal}_${index}`;
            // 完全一致 or case-insensitive
            let match = descendants.find(d => d.name === candidateName);
            if (!match && mode === "fuzzy") {
                const lower = candidateName.toLowerCase();
                match = descendants.find(d => d.name.toLowerCase() === lower);
            }
            if (!match) break;

            const elementPath = `__comps__.${compIndex}.${propName}.${index}`;
            const dump = await this.buildDumpWithTypeInfo(nodeUuid, elementPath, match.uuid);
            const setResult = await this.sceneScript("setPropertyViaEditor", [nodeUuid, elementPath, dump]);
            const exact = match.name === candidateName;
            foundElements.push({ index, nodeName: match.name, exact, success: setResult?.success !== false });
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
    private propertyNameToNodeNames(propName: string): string[] {
        const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
        const names = [pascal];
        if (pascal !== propName) names.push(propName);
        return names;
    }

    private async setProperty(uuid: string, componentType: string, property: string, value: any): Promise<ToolResult> {
        try {
            // コンポーネントのインデックスを取得
            const nodeInfo = await this.sceneScript("getNodeInfo", [uuid]);
            if (!nodeInfo?.success || !nodeInfo?.data?.components) {
                return err(`Node ${uuid} not found or has no components`);
            }
            const compName = componentType.replace("cc.", "");
            const compIndex = nodeInfo.data.components.findIndex((c: any) => c.type === compName);
            if (compIndex < 0) {
                return err(`Component ${componentType} not found on node ${uuid}`);
            }

            // scene:set-property でプロパティ変更（Prefab保存時にも反映される）
            // パス形式: __comps__.{index}.{property}
            const path = `__comps__.${compIndex}.${property}`;

            // プロパティの型情報をquery-nodeから取得して、適切なdump形式を構築
            const dump = await this.buildDumpWithTypeInfo(uuid, path, value);

            const result = await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
            return ok({ success: true, path, dump, result });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async setProperties(uuid: string, componentType: string, properties: Array<{property: string, value: any}>): Promise<ToolResult> {
        try {
            if (!componentType) return err("componentType is required");
            if (!properties.length) return err("properties array is empty");

            // コンポーネントのインデックスを取得（1回だけ）
            const nodeInfo = await this.sceneScript("getNodeInfo", [uuid]);
            if (!nodeInfo?.success || !nodeInfo?.data?.components) {
                return err(`Node ${uuid} not found or has no components`);
            }
            const compName = componentType.replace("cc.", "");
            const compIndex = nodeInfo.data.components.findIndex((c: any) => c.type === compName);
            if (compIndex < 0) {
                return err(`Component ${componentType} not found on node ${uuid}`);
            }

            const results: any[] = [];
            for (const { property, value } of properties) {
                const path = `__comps__.${compIndex}.${property}`;
                const dump = await this.buildDumpWithTypeInfo(uuid, path, value);
                const result = await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
                results.push({ property, success: result?.success !== false, path });
            }

            const allOk = results.every(r => r.success);
            return ok({ success: allOk, results });
        } catch (e: any) {
            return err(e.message || String(e));
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
    private async buildDumpWithTypeInfo(nodeUuid: string, path: string, value: any): Promise<any> {
        // プリミティブ型はそのまま
        if (typeof value === "number") return { value, type: "Number" };
        if (typeof value === "boolean") return { value, type: "Boolean" };

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
            if (result?.success && result.data?.uuid) {
                value = result.data.uuid;
            } else {
                throw new Error(`Node not found at path: ${nodePath}`);
            }
        }

        // 文字列の場合: プロパティの型情報を取得して判定
        if (typeof value === "string") {
            try {
                const nodeDump = await (Editor.Message.request as any)("scene", "query-node", nodeUuid);
                if (nodeDump) {
                    const propDump = this.resolveDumpPath(nodeDump, path);
                    if (propDump?.type) {
                        const propType = propDump.type as string;
                        const extendsArr = (propDump.extends || []) as string[];
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
            } catch (_e) {
                // query-node失敗時はフォールバック
            }
            return { value, type: "String" };
        }

        // その他のオブジェクト（contentSize, color等の構造体）
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            const wrapped: any = {};
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
    private resolveDumpPath(nodeDump: any, path: string): any {
        const parts = path.split(".");
        let current = nodeDump;
        for (const part of parts) {
            if (!current) return null;
            if (part === "__comps__") {
                current = current.__comps__;
            } else if (/^\d+$/.test(part)) {
                current = current[parseInt(part)]?.value;
            } else {
                current = current?.[part];
            }
        }
        return current;
    }

    /**
     * ノードUUIDからコンポーネントUUIDを解決する。
     * propType（例: "cc.ScrollView", "MissionListPanel"）に一致するコンポーネントを探す。
     */
    private async resolveComponentUuid(nodeUuid: string, propType: string): Promise<string | null> {
        try {
            const nodeInfo = await this.sceneScript("getNodeInfo", [nodeUuid]);
            if (!nodeInfo?.success || !nodeInfo?.data?.components) return null;
            const typeName = propType.replace("cc.", "");
            const comp = nodeInfo.data.components.find((c: any) => c.type === typeName);
            return comp?.uuid || null;
        } catch (_e) {
            return null;
        }
    }

    private async sceneScript(method: string, args: any[]): Promise<any> {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
