"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentTools = void 0;
const tool_base_1 = require("../tool-base");
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
                        uuid: { type: "string", description: "Node UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "component_set_property",
                description: "Set one or more properties on a component. For single: use property+value. For batch: use properties array. Examples: Label.string, Label.fontSize, Sprite.color, UITransform.contentSize.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
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
                    },
                    required: ["uuid", "componentType"],
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
        // パラメータエイリアス: component → componentType
        const compType = args.componentType || args.component;
        switch (toolName) {
            case "component_add":
                return this.addComponent(args.uuid, compType);
            case "component_remove":
                return this.removeComponent(args.uuid, compType);
            case "component_get_components":
                return this.getComponents(args.uuid);
            case "component_set_property":
                if (args.properties && Array.isArray(args.properties)) {
                    return this.setProperties(args.uuid, compType, args.properties);
                }
                return this.setProperty(args.uuid, compType, args.property, args.value);
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
            return (0, tool_base_1.ok)({ success: allOk, results });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
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
        if (value !== null && typeof value === "object" && typeof value.uuid === "string") {
            const refType = typeof value.type === "string" ? value.type : "cc.Node";
            return { type: refType, value: { uuid: value.uuid } };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvbXBvbmVudC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0Q0FBdUM7QUFFdkMsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFFckMsTUFBYSxjQUFjO0lBQTNCO1FBQ2EsaUJBQVksR0FBRyxXQUFXLENBQUM7SUFrWHhDLENBQUM7SUFoWEcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsZUFBZTtnQkFDckIsV0FBVyxFQUFFLDJGQUEyRjtnQkFDeEcsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7d0JBQ2xELGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHdDQUF3QyxFQUFFO3FCQUMzRjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO2lCQUN0QzthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGtCQUFrQjtnQkFDeEIsV0FBVyxFQUFFLGlDQUFpQztnQkFDOUMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7d0JBQ2xELGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFO3FCQUNuRjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO2lCQUN0QzthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLDBCQUEwQjtnQkFDaEMsV0FBVyxFQUFFLHFEQUFxRDtnQkFDbEUs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LENBQUMsQ0FBQSxNQUFBLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRSxJQUFJLDBDQUFFLFVBQVUsQ0FBQTtnQkFBRSxPQUFPLElBQUksQ0FBQztZQUNuRSxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3QyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7WUFDNUUsT0FBTyxDQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFJLEtBQUksSUFBSSxDQUFDO1FBQzlCLENBQUM7UUFBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQ1YsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztJQUNMLENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQWMsRUFBRSxJQUFXO1FBQ2pELE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFO1lBQzNELElBQUksRUFBRSxRQUFRO1lBQ2QsTUFBTTtZQUNOLElBQUk7U0FDUCxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFuWEQsd0NBbVhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5cclxuY29uc3QgRVhUX05BTUUgPSBcImNvY29zLWNyZWF0b3ItbWNwXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50VG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJjb21wb25lbnRcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImNvbXBvbmVudF9hZGRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkZCBhIGNvbXBvbmVudCB0byBhIG5vZGUuIFVzZSBjYy5YWFggZm9ybWF0IChlLmcuICdjYy5MYWJlbCcsICdjYy5TcHJpdGUnLCAnY2MuQnV0dG9uJykuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IGNsYXNzIG5hbWUgKGUuZy4gJ2NjLkxhYmVsJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJjb21wb25lbnRUeXBlXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfcmVtb3ZlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZW1vdmUgYSBjb21wb25lbnQgZnJvbSBhIG5vZGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IGNsYXNzIG5hbWUgdG8gcmVtb3ZlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwiY29tcG9uZW50VHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X2dldF9jb21wb25lbnRzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgYWxsIGNvbXBvbmVudHMgb24gYSBub2RlIHdpdGggdGhlaXIgcHJvcGVydGllcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfc2V0X3Byb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgb25lIG9yIG1vcmUgcHJvcGVydGllcyBvbiBhIGNvbXBvbmVudC4gRm9yIHNpbmdsZTogdXNlIHByb3BlcnR5K3ZhbHVlLiBGb3IgYmF0Y2g6IHVzZSBwcm9wZXJ0aWVzIGFycmF5LiBFeGFtcGxlczogTGFiZWwuc3RyaW5nLCBMYWJlbC5mb250U2l6ZSwgU3ByaXRlLmNvbG9yLCBVSVRyYW5zZm9ybS5jb250ZW50U2l6ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgY2xhc3MgbmFtZSAoZS5nLiAnY2MuTGFiZWwnKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IG5hbWUgKHNpbmdsZSBtb2RlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7IGRlc2NyaXB0aW9uOiBcIlZhbHVlIHRvIHNldCAoc2luZ2xlIG1vZGUpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQmF0Y2ggbW9kZTogYXJyYXkgb2Yge3Byb3BlcnR5LCB2YWx1ZX0gb2JqZWN0cyB0byBzZXQgbXVsdGlwbGUgcHJvcGVydGllcyBhdCBvbmNlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcm9wZXJ0eSBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHsgZGVzY3JpcHRpb246IFwiVmFsdWUgdG8gc2V0XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwcm9wZXJ0eVwiLCBcInZhbHVlXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwiY29tcG9uZW50VHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgZHVtcCBvZiBhIHNwZWNpZmljIGNvbXBvbmVudCBieSBpdHMgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSUQgKG5vdCBub2RlIFVVSUQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJjb21wb25lbnRVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfZ2V0X2F2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhbGwgYXZhaWxhYmxlIGNvbXBvbmVudCBjbGFzc2VzIHRoYXQgY2FuIGJlIGFkZGVkIHRvIG5vZGVzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfcXVlcnlfZW51bVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGVudW0gdmFsdWVzIGZvciBhIGNvbXBvbmVudCBwcm9wZXJ0eS4gVXNlZnVsIGZvciBrbm93aW5nIHdoYXQgdmFsdWVzIExheW91dC50eXBlLCBMYXlvdXQucmVzaXplTW9kZSwgZXRjLiBhY2NlcHQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IGNsYXNzIChlLmcuICdjYy5MYXlvdXQnKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IG5hbWUgKGUuZy4gJ3R5cGUnLCAncmVzaXplTW9kZScpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwiY29tcG9uZW50VHlwZVwiLCBcInByb3BlcnR5XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIOODkeODqeODoeODvOOCv+OCqOOCpOODquOCouOCuTogY29tcG9uZW50IOKGkiBjb21wb25lbnRUeXBlXHJcbiAgICAgICAgY29uc3QgY29tcFR5cGUgPSBhcmdzLmNvbXBvbmVudFR5cGUgfHwgYXJncy5jb21wb25lbnQ7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2FkZFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ29tcG9uZW50KGFyZ3MudXVpZCwgY29tcFR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X3JlbW92ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlQ29tcG9uZW50KGFyZ3MudXVpZCwgY29tcFR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2dldF9jb21wb25lbnRzXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRzKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJjb21wb25lbnRfc2V0X3Byb3BlcnR5XCI6XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5wcm9wZXJ0aWVzICYmIEFycmF5LmlzQXJyYXkoYXJncy5wcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnRpZXMoYXJncy51dWlkLCBjb21wVHlwZSwgYXJncy5wcm9wZXJ0aWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgY29tcFR5cGUsIGFyZ3MucHJvcGVydHksIGFyZ3MudmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2dldF9pbmZvXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudFwiLCBhcmdzLmNvbXBvbmVudFV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNvbXBvbmVudDogZHVtcCB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcImNvbXBvbmVudF9nZXRfYXZhaWxhYmxlXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNsYXNzZXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY2xhc3NlcyB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcImNvbXBvbmVudF9xdWVyeV9lbnVtXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeUVudW0oYXJncy51dWlkLCBjb21wVHlwZSwgYXJncy5wcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYWRkQ29tcG9uZW50KHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImFkZENvbXBvbmVudFRvTm9kZVwiLCBbdXVpZCwgY29tcG9uZW50VHlwZV0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeUVudW0obm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUR1bXAgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlXCIsIG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlRHVtcCkgcmV0dXJuIGVycihcIk5vZGUgbm90IGZvdW5kXCIpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29tcHMgPSBub2RlRHVtcC5fX2NvbXBzX18gfHwgW107XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcCBvZiBjb21wcykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcFR5cGUgPSBjb21wLnR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXBUeXBlKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIC8vIE1hdGNoIGJ5IGNjLlhYWCBmb3JtYXRcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRUeXBlID0gY29tcG9uZW50VHlwZS5zdGFydHNXaXRoKFwiY2MuXCIpID8gY29tcG9uZW50VHlwZS5zdWJzdHJpbmcoMykgOiBjb21wb25lbnRUeXBlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbXBUeXBlICE9PSBgY2MuJHtub3JtYWxpemVkVHlwZX1gICYmIGNvbXBUeXBlICE9PSBjb21wb25lbnRUeXBlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wRHVtcCA9IGNvbXAudmFsdWU/Lltwcm9wZXJ0eV07XHJcbiAgICAgICAgICAgICAgICBpZiAoIXByb3BEdW1wKSByZXR1cm4gZXJyKGBQcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIG5vdCBmb3VuZCBvbiAke2NvbXBvbmVudFR5cGV9YCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcER1bXAudHlwZSAhPT0gXCJFbnVtXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwcm9wZXJ0eSwgdHlwZTogcHJvcER1bXAudHlwZSwgbm90ZTogXCJOb3QgYW4gZW51bSBwcm9wZXJ0eVwiLCBjdXJyZW50VmFsdWU6IHByb3BEdW1wLnZhbHVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogcHJvcER1bXAudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZW51bUxpc3Q6IHByb3BEdW1wLmVudW1MaXN0LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGVycihgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGVgKTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZW1vdmVDb21wb25lbnQodXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwicmVtb3ZlQ29tcG9uZW50RnJvbU5vZGVcIiwgW3V1aWQsIGNvbXBvbmVudFR5cGVdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Q29tcG9uZW50cyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2VzcykgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgdXVpZCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IHJlc3VsdC5kYXRhPy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgY29tcG9uZW50czogcmVzdWx0LmRhdGE/LmNvbXBvbmVudHMgfHwgW10sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldFByb3BlcnR5KHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8g44Kz44Oz44Od44O844ON44Oz44OI44Gu44Kk44Oz44OH44OD44Kv44K544KS5Y+W5b6XXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MgfHwgIW5vZGVJbmZvPy5kYXRhPy5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBOb2RlICR7dXVpZH0gbm90IGZvdW5kIG9yIGhhcyBubyBjb21wb25lbnRzYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY29tcE5hbWUgPSBjb21wb25lbnRUeXBlLnJlcGxhY2UoXCJjYy5cIiwgXCJcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBJbmRleCA9IG5vZGVJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kSW5kZXgoKGM6IGFueSkgPT4gYy50eXBlID09PSBjb21wTmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChjb21wSW5kZXggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZSAke3V1aWR9YCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNjZW5lOnNldC1wcm9wZXJ0eSDjgafjg5fjg63jg5Hjg4bjgqPlpInmm7TvvIhQcmVmYWLkv53lrZjmmYLjgavjgoLlj43mmKDjgZXjgozjgovvvIlcclxuICAgICAgICAgICAgLy8g44OR44K55b2i5byPOiBfX2NvbXBzX18ue2luZGV4fS57cHJvcGVydHl9XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgX19jb21wc19fLiR7Y29tcEluZGV4fS4ke3Byb3BlcnR5fWA7XHJcblxyXG4gICAgICAgICAgICAvLyDjg5fjg63jg5Hjg4bjgqPjga7lnovmg4XloLHjgpJxdWVyeS1ub2Rl44GL44KJ5Y+W5b6X44GX44Gm44CB6YGp5YiH44GqZHVtcOW9ouW8j+OCkuani+eviVxyXG4gICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgdGhpcy5idWlsZER1bXBXaXRoVHlwZUluZm8odXVpZCwgcGF0aCwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHBhdGgsIGR1bXAsIHJlc3VsdCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzZXRQcm9wZXJ0aWVzKHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0aWVzOiBBcnJheTx7cHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueX0+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKCFjb21wb25lbnRUeXBlKSByZXR1cm4gZXJyKFwiY29tcG9uZW50VHlwZSBpcyByZXF1aXJlZFwiKTtcclxuICAgICAgICAgICAgaWYgKCFwcm9wZXJ0aWVzLmxlbmd0aCkgcmV0dXJuIGVycihcInByb3BlcnRpZXMgYXJyYXkgaXMgZW1wdHlcIik7XHJcblxyXG4gICAgICAgICAgICAvLyDjgrPjg7Pjg53jg7zjg43jg7Pjg4jjga7jgqTjg7Pjg4fjg4Pjgq/jgrnjgpLlj5blvpfvvIgx5Zue44Gg44GR77yJXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MgfHwgIW5vZGVJbmZvPy5kYXRhPy5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBOb2RlICR7dXVpZH0gbm90IGZvdW5kIG9yIGhhcyBubyBjb21wb25lbnRzYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY29tcE5hbWUgPSBjb21wb25lbnRUeXBlLnJlcGxhY2UoXCJjYy5cIiwgXCJcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBJbmRleCA9IG5vZGVJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kSW5kZXgoKGM6IGFueSkgPT4gYy50eXBlID09PSBjb21wTmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChjb21wSW5kZXggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZSAke3V1aWR9YCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgeyBwcm9wZXJ0eSwgdmFsdWUgfSBvZiBwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gYF9fY29tcHNfXy4ke2NvbXBJbmRleH0uJHtwcm9wZXJ0eX1gO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IHRoaXMuYnVpbGREdW1wV2l0aFR5cGVJbmZvKHV1aWQsIHBhdGgsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXRQcm9wZXJ0eVZpYUVkaXRvclwiLCBbdXVpZCwgcGF0aCwgZHVtcF0pO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgcHJvcGVydHksIHN1Y2Nlc3M6IHJlc3VsdD8uc3VjY2VzcyAhPT0gZmFsc2UsIHBhdGggfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGFsbE9rID0gcmVzdWx0cy5ldmVyeShyID0+IHIuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IGFsbE9rLCByZXN1bHRzIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODl+ODreODkeODhuOCo+OBruWei+aDheWgseOCkkVkaXRvciBBUEnjgYvjgonlj5blvpfjgZfjgIHpganliIfjgapkdW1w5b2i5byP44KS5qeL56+J44GZ44KL44CCXHJcbiAgICAgKlxyXG4gICAgICogVVVJROaWh+Wtl+WIl+OBjOa4oeOBleOCjOOBn+WgtOWQiOOAgeODl+ODreODkeODhuOCo+OBruWei+OBq+W/nOOBmOOBpjpcclxuICAgICAqIC0gTm9kZS9Db21wb25lbnTlj4Lnhaflnosg4oaSIHt0eXBlOiBwcm9wVHlwZSwgdmFsdWU6IHt1dWlkOiBub2RlVXVpZH19XHJcbiAgICAgKiAtIEFzc2V05Y+C54Wn5Z6L77yIY2MuUHJlZmFi562J77yJIOKGkiB7dHlwZTogcHJvcFR5cGUsIHZhbHVlOiB7dXVpZDogYXNzZXRVdWlkfX1cclxuICAgICAqIC0gU3RyaW5n5Z6LIOKGkiB7dmFsdWUsIHR5cGU6IFwiU3RyaW5nXCJ9XHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgYnVpbGREdW1wV2l0aFR5cGVJbmZvKG5vZGVVdWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgdmFsdWU6IGFueSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgLy8g44OX44Oq44Of44OG44Kj44OW5Z6L44Gv44Gd44Gu44G+44G+XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHsgdmFsdWUsIHR5cGU6IFwiTnVtYmVyXCIgfTtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIikgcmV0dXJuIHsgdmFsdWUsIHR5cGU6IFwiQm9vbGVhblwiIH07XHJcblxyXG4gICAgICAgIC8vIOOCquODluOCuOOCp+OCr+ODiOW9ouW8jyB7dXVpZDogXCJ4eHhcIiwgdHlwZTogXCJjYy5Ob2RlXCJ9IOOBr+OBneOBruOBvuOBvlxyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZhbHVlLnV1aWQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHR5cGVvZiB2YWx1ZS50eXBlID09PSBcInN0cmluZ1wiID8gdmFsdWUudHlwZSA6IFwiY2MuTm9kZVwiO1xyXG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiByZWZUeXBlLCB2YWx1ZTogeyB1dWlkOiB2YWx1ZS51dWlkIH0gfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEBwYXRoOiDjg5fjg6zjg5XjgqPjg4Pjgq/jgrnjga7loLTlkIg6IOODkeOCueOBi+OCieODjuODvOODiVVVSUTjgpLop6PmsbpcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLnN0YXJ0c1dpdGgoXCJAcGF0aDpcIikpIHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZVBhdGggPSB2YWx1ZS5zbGljZSg2KTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImZpbmROb2RlQnlQYXRoXCIsIFtub2RlUGF0aF0pO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0Py5zdWNjZXNzICYmIHJlc3VsdC5kYXRhPy51dWlkKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJlc3VsdC5kYXRhLnV1aWQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGUgbm90IGZvdW5kIGF0IHBhdGg6ICR7bm9kZVBhdGh9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIOaWh+Wtl+WIl+OBruWgtOWQiDog44OX44Ot44OR44OG44Kj44Gu5Z6L5oOF5aCx44KS5Y+W5b6X44GX44Gm5Yik5a6aXHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUR1bXAgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlXCIsIG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlRHVtcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BEdW1wID0gdGhpcy5yZXNvbHZlRHVtcFBhdGgobm9kZUR1bXAsIHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wRHVtcD8udHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wVHlwZSA9IHByb3BEdW1wLnR5cGUgYXMgc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleHRlbmRzQXJyID0gKHByb3BEdW1wLmV4dGVuZHMgfHwgW10pIGFzIHN0cmluZ1tdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0NvbXBvbmVudFJlZiA9IGV4dGVuZHNBcnIuaW5jbHVkZXMoXCJjYy5Db21wb25lbnRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzTm9kZVJlZiA9IHByb3BUeXBlID09PSBcImNjLk5vZGVcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNBc3NldFJlZiA9IGV4dGVuZHNBcnIuaW5jbHVkZXMoXCJjYy5Bc3NldFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0NvbXBvbmVudFJlZikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g44Kz44Oz44Od44O844ON44Oz44OI5Y+C54WnOiDjg47jg7zjg4lVVUlE44GL44KJ44Kz44Oz44Od44O844ON44Oz44OIVVVJROOCkuino+axulxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcFV1aWQgPSBhd2FpdCB0aGlzLnJlc29sdmVDb21wb25lbnRVdWlkKHZhbHVlLCBwcm9wVHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiBwcm9wVHlwZSwgdmFsdWU6IHsgdXVpZDogY29tcFV1aWQgfHwgdmFsdWUgfSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc05vZGVSZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHByb3BUeXBlLCB2YWx1ZTogeyB1dWlkOiB2YWx1ZSB9IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQXNzZXRSZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHByb3BUeXBlLCB2YWx1ZTogeyB1dWlkOiB2YWx1ZSB9IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKF9lKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBxdWVyeS1ub2Rl5aSx5pWX5pmC44Gv44OV44Kp44O844Or44OQ44OD44KvXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWUsIHR5cGU6IFwiU3RyaW5nXCIgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIOOBneOBruS7luOBruOCquODluOCuOOCp+OCr+ODiO+8iGNvbnRlbnRTaXplLCBjb2xvcuetieOBruani+mAoOS9k++8iVxyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHdyYXBwZWQ6IGFueSA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHdyYXBwZWRba10gPSB7IHZhbHVlOiB2IH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHdyYXBwZWQgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7IHZhbHVlIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBxdWVyeS1ub2Rl44GuZHVtcOOBi+OCieODieODg+ODiOODkeOCueOBp+ODl+ODreODkeODhuOCo+OCkuino+axuuOBmeOCi+OAglxyXG4gICAgICog5L6LOiBcIl9fY29tcHNfXy4yLnNjcm9sbFZpZXdcIiDihpIgbm9kZUR1bXAuX19jb21wc19fWzJdLnZhbHVlLnNjcm9sbFZpZXdcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZXNvbHZlRHVtcFBhdGgobm9kZUR1bXA6IGFueSwgcGF0aDogc3RyaW5nKTogYW55IHtcclxuICAgICAgICBjb25zdCBwYXJ0cyA9IHBhdGguc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIGxldCBjdXJyZW50ID0gbm9kZUR1bXA7XHJcbiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGlmIChwYXJ0ID09PSBcIl9fY29tcHNfX1wiKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5fX2NvbXBzX187XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL15cXGQrJC8udGVzdChwYXJ0KSkge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGFyc2VJbnQocGFydCldPy52YWx1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50Py5bcGFydF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg47jg7zjg4lVVUlE44GL44KJ44Kz44Oz44Od44O844ON44Oz44OIVVVJROOCkuino+axuuOBmeOCi+OAglxyXG4gICAgICogcHJvcFR5cGXvvIjkvos6IFwiY2MuU2Nyb2xsVmlld1wiLCBcIk1pc3Npb25MaXN0UGFuZWxcIu+8ieOBq+S4gOiHtOOBmeOCi+OCs+ODs+ODneODvOODjeODs+ODiOOCkuaOouOBmeOAglxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIHJlc29sdmVDb21wb25lbnRVdWlkKG5vZGVVdWlkOiBzdHJpbmcsIHByb3BUeXBlOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlSW5mbyA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbbm9kZVV1aWRdKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlSW5mbz8uc3VjY2VzcyB8fCAhbm9kZUluZm8/LmRhdGE/LmNvbXBvbmVudHMpIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlTmFtZSA9IHByb3BUeXBlLnJlcGxhY2UoXCJjYy5cIiwgXCJcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBub2RlSW5mby5kYXRhLmNvbXBvbmVudHMuZmluZCgoYzogYW55KSA9PiBjLnR5cGUgPT09IHR5cGVOYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXA/LnV1aWQgfHwgbnVsbDtcclxuICAgICAgICB9IGNhdGNoIChfZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IEVYVF9OQU1FLFxyXG4gICAgICAgICAgICBtZXRob2QsXHJcbiAgICAgICAgICAgIGFyZ3MsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19