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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvbXBvbmVudC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0Q0FBdUM7QUFFdkMsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFFckMsTUFBYSxjQUFjO0lBQTNCO1FBQ2EsaUJBQVksR0FBRyxXQUFXLENBQUM7SUF5VHhDLENBQUM7SUF2VEcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsZUFBZTtnQkFDckIsV0FBVyxFQUFFLDJGQUEyRjtnQkFDeEcsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7d0JBQ2xELGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHdDQUF3QyxFQUFFO3FCQUMzRjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO2lCQUN0QzthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGtCQUFrQjtnQkFDeEIsV0FBVyxFQUFFLGlDQUFpQztnQkFDOUMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7d0JBQ2xELGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFO3FCQUNuRjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO2lCQUN0QzthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLDBCQUEwQjtnQkFDaEMsV0FBVyxFQUFFLHFEQUFxRDtnQkFDbEUs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QUMsV0FBVyxDQUFDLE1BQWMsRUFBRSxJQUFXO1FBQ2pELE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFO1lBQzNELElBQUksRUFBRSxRQUFRO1lBQ2QsTUFBTTtZQUNOLElBQUk7U0FDUCxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUExVEQsd0NBMFRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5cclxuY29uc3QgRVhUX05BTUUgPSBcImNvY29zLWNyZWF0b3ItbWNwXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50VG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJjb21wb25lbnRcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImNvbXBvbmVudF9hZGRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkZCBhIGNvbXBvbmVudCB0byBhIG5vZGUuIFVzZSBjYy5YWFggZm9ybWF0IChlLmcuICdjYy5MYWJlbCcsICdjYy5TcHJpdGUnLCAnY2MuQnV0dG9uJykuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IGNsYXNzIG5hbWUgKGUuZy4gJ2NjLkxhYmVsJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJjb21wb25lbnRUeXBlXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfcmVtb3ZlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZW1vdmUgYSBjb21wb25lbnQgZnJvbSBhIG5vZGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IGNsYXNzIG5hbWUgdG8gcmVtb3ZlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwiY29tcG9uZW50VHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X2dldF9jb21wb25lbnRzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgYWxsIGNvbXBvbmVudHMgb24gYSBub2RlIHdpdGggdGhlaXIgcHJvcGVydGllcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfc2V0X3Byb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgb25lIG9yIG1vcmUgcHJvcGVydGllcyBvbiBhIGNvbXBvbmVudC4gRm9yIHNpbmdsZTogdXNlIHByb3BlcnR5K3ZhbHVlLiBGb3IgYmF0Y2g6IHVzZSBwcm9wZXJ0aWVzIGFycmF5LiBFeGFtcGxlczogTGFiZWwuc3RyaW5nLCBMYWJlbC5mb250U2l6ZSwgU3ByaXRlLmNvbG9yLCBVSVRyYW5zZm9ybS5jb250ZW50U2l6ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgY2xhc3MgbmFtZSAoZS5nLiAnY2MuTGFiZWwnKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IG5hbWUgKHNpbmdsZSBtb2RlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7IGRlc2NyaXB0aW9uOiBcIlZhbHVlIHRvIHNldCAoc2luZ2xlIG1vZGUpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQmF0Y2ggbW9kZTogYXJyYXkgb2Yge3Byb3BlcnR5LCB2YWx1ZX0gb2JqZWN0cyB0byBzZXQgbXVsdGlwbGUgcHJvcGVydGllcyBhdCBvbmNlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcm9wZXJ0eSBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHsgZGVzY3JpcHRpb246IFwiVmFsdWUgdG8gc2V0XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwcm9wZXJ0eVwiLCBcInZhbHVlXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwiY29tcG9uZW50VHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgZHVtcCBvZiBhIHNwZWNpZmljIGNvbXBvbmVudCBieSBpdHMgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSUQgKG5vdCBub2RlIFVVSUQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJjb21wb25lbnRVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfZ2V0X2F2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhbGwgYXZhaWxhYmxlIGNvbXBvbmVudCBjbGFzc2VzIHRoYXQgY2FuIGJlIGFkZGVkIHRvIG5vZGVzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIOODkeODqeODoeODvOOCv+OCqOOCpOODquOCouOCuTogY29tcG9uZW50IOKGkiBjb21wb25lbnRUeXBlXHJcbiAgICAgICAgY29uc3QgY29tcFR5cGUgPSBhcmdzLmNvbXBvbmVudFR5cGUgfHwgYXJncy5jb21wb25lbnQ7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2FkZFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ29tcG9uZW50KGFyZ3MudXVpZCwgY29tcFR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X3JlbW92ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlQ29tcG9uZW50KGFyZ3MudXVpZCwgY29tcFR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2dldF9jb21wb25lbnRzXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRzKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJjb21wb25lbnRfc2V0X3Byb3BlcnR5XCI6XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5wcm9wZXJ0aWVzICYmIEFycmF5LmlzQXJyYXkoYXJncy5wcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnRpZXMoYXJncy51dWlkLCBjb21wVHlwZSwgYXJncy5wcm9wZXJ0aWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgY29tcFR5cGUsIGFyZ3MucHJvcGVydHksIGFyZ3MudmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2dldF9pbmZvXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudFwiLCBhcmdzLmNvbXBvbmVudFV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNvbXBvbmVudDogZHVtcCB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcImNvbXBvbmVudF9nZXRfYXZhaWxhYmxlXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNsYXNzZXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY2xhc3NlcyB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBhZGRDb21wb25lbnQodXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiYWRkQ29tcG9uZW50VG9Ob2RlXCIsIFt1dWlkLCBjb21wb25lbnRUeXBlXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJlbW92ZUNvbXBvbmVudCh1dWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJyZW1vdmVDb21wb25lbnRGcm9tTm9kZVwiLCBbdXVpZCwgY29tcG9uZW50VHlwZV0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRDb21wb25lbnRzKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbdXVpZF0pO1xyXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICB1dWlkLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogcmVzdWx0LmRhdGE/Lm5hbWUsXHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnRzOiByZXN1bHQuZGF0YT8uY29tcG9uZW50cyB8fCBbXSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2V0UHJvcGVydHkodXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyDjgrPjg7Pjg53jg7zjg43jg7Pjg4jjga7jgqTjg7Pjg4fjg4Pjgq/jgrnjgpLlj5blvpdcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlSW5mbz8uc3VjY2VzcyB8fCAhbm9kZUluZm8/LmRhdGE/LmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYE5vZGUgJHt1dWlkfSBub3QgZm91bmQgb3IgaGFzIG5vIGNvbXBvbmVudHNgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjb21wTmFtZSA9IGNvbXBvbmVudFR5cGUucmVwbGFjZShcImNjLlwiLCBcIlwiKTtcclxuICAgICAgICAgICAgY29uc3QgY29tcEluZGV4ID0gbm9kZUluZm8uZGF0YS5jb21wb25lbnRzLmZpbmRJbmRleCgoYzogYW55KSA9PiBjLnR5cGUgPT09IGNvbXBOYW1lKTtcclxuICAgICAgICAgICAgaWYgKGNvbXBJbmRleCA8IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZCBvbiBub2RlICR7dXVpZH1gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc2NlbmU6c2V0LXByb3BlcnR5IOOBp+ODl+ODreODkeODhuOCo+WkieabtO+8iFByZWZhYuS/neWtmOaZguOBq+OCguWPjeaYoOOBleOCjOOCi++8iVxyXG4gICAgICAgICAgICAvLyDjg5HjgrnlvaLlvI86IF9fY29tcHNfXy57aW5kZXh9Lntwcm9wZXJ0eX1cclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHtjb21wSW5kZXh9LiR7cHJvcGVydHl9YDtcclxuXHJcbiAgICAgICAgICAgIC8vIOODl+ODreODkeODhuOCo+OBruWei+aDheWgseOCknF1ZXJ5LW5vZGXjgYvjgonlj5blvpfjgZfjgabjgIHpganliIfjgapkdW1w5b2i5byP44KS5qeL56+JXHJcbiAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCB0aGlzLmJ1aWxkRHVtcFdpdGhUeXBlSW5mbyh1dWlkLCBwYXRoLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0UHJvcGVydHlWaWFFZGl0b3JcIiwgW3V1aWQsIHBhdGgsIGR1bXBdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcGF0aCwgZHVtcCwgcmVzdWx0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldFByb3BlcnRpZXModXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcsIHByb3BlcnRpZXM6IEFycmF5PHtwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55fT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoIWNvbXBvbmVudFR5cGUpIHJldHVybiBlcnIoXCJjb21wb25lbnRUeXBlIGlzIHJlcXVpcmVkXCIpO1xyXG4gICAgICAgICAgICBpZiAoIXByb3BlcnRpZXMubGVuZ3RoKSByZXR1cm4gZXJyKFwicHJvcGVydGllcyBhcnJheSBpcyBlbXB0eVwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOOCs+ODs+ODneODvOODjeODs+ODiOOBruOCpOODs+ODh+ODg+OCr+OCueOCkuWPluW+l++8iDHlm57jgaDjgZHvvIlcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlSW5mbz8uc3VjY2VzcyB8fCAhbm9kZUluZm8/LmRhdGE/LmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYE5vZGUgJHt1dWlkfSBub3QgZm91bmQgb3IgaGFzIG5vIGNvbXBvbmVudHNgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjb21wTmFtZSA9IGNvbXBvbmVudFR5cGUucmVwbGFjZShcImNjLlwiLCBcIlwiKTtcclxuICAgICAgICAgICAgY29uc3QgY29tcEluZGV4ID0gbm9kZUluZm8uZGF0YS5jb21wb25lbnRzLmZpbmRJbmRleCgoYzogYW55KSA9PiBjLnR5cGUgPT09IGNvbXBOYW1lKTtcclxuICAgICAgICAgICAgaWYgKGNvbXBJbmRleCA8IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZCBvbiBub2RlICR7dXVpZH1gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCB7IHByb3BlcnR5LCB2YWx1ZSB9IG9mIHByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgX19jb21wc19fLiR7Y29tcEluZGV4fS4ke3Byb3BlcnR5fWA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgdGhpcy5idWlsZER1bXBXaXRoVHlwZUluZm8odXVpZCwgcGF0aCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eSwgc3VjY2VzczogcmVzdWx0Py5zdWNjZXNzICE9PSBmYWxzZSwgcGF0aCB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgYWxsT2sgPSByZXN1bHRzLmV2ZXJ5KHIgPT4gci5zdWNjZXNzKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogYWxsT2ssIHJlc3VsdHMgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44OX44Ot44OR44OG44Kj44Gu5Z6L5oOF5aCx44KSRWRpdG9yIEFQSeOBi+OCieWPluW+l+OBl+OAgemBqeWIh+OBqmR1bXDlvaLlvI/jgpLmp4vnr4njgZnjgovjgIJcclxuICAgICAqXHJcbiAgICAgKiBVVUlE5paH5a2X5YiX44GM5rih44GV44KM44Gf5aC05ZCI44CB44OX44Ot44OR44OG44Kj44Gu5Z6L44Gr5b+c44GY44GmOlxyXG4gICAgICogLSBOb2RlL0NvbXBvbmVudOWPgueFp+WeiyDihpIge3R5cGU6IHByb3BUeXBlLCB2YWx1ZToge3V1aWQ6IG5vZGVVdWlkfX1cclxuICAgICAqIC0gQXNzZXTlj4LnhaflnovvvIhjYy5QcmVmYWLnrYnvvIkg4oaSIHt0eXBlOiBwcm9wVHlwZSwgdmFsdWU6IHt1dWlkOiBhc3NldFV1aWR9fVxyXG4gICAgICogLSBTdHJpbmflnosg4oaSIHt2YWx1ZSwgdHlwZTogXCJTdHJpbmdcIn1cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBidWlsZER1bXBXaXRoVHlwZUluZm8obm9kZVV1aWQ6IHN0cmluZywgcGF0aDogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICAvLyDjg5fjg6rjg5/jg4bjgqPjg5blnovjga/jgZ3jga7jgb7jgb5cclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiKSByZXR1cm4geyB2YWx1ZSwgdHlwZTogXCJOdW1iZXJcIiB9O1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiKSByZXR1cm4geyB2YWx1ZSwgdHlwZTogXCJCb29sZWFuXCIgfTtcclxuXHJcbiAgICAgICAgLy8g44Kq44OW44K444Kn44Kv44OI5b2i5byPIHt1dWlkOiBcInh4eFwiLCB0eXBlOiBcImNjLk5vZGVcIn0g44Gv44Gd44Gu44G+44G+XHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUudXVpZCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gdHlwZW9mIHZhbHVlLnR5cGUgPT09IFwic3RyaW5nXCIgPyB2YWx1ZS50eXBlIDogXCJjYy5Ob2RlXCI7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHJlZlR5cGUsIHZhbHVlOiB7IHV1aWQ6IHZhbHVlLnV1aWQgfSB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5paH5a2X5YiX44Gu5aC05ZCIOiDjg5fjg63jg5Hjg4bjgqPjga7lnovmg4XloLHjgpLlj5blvpfjgZfjgabliKTlrppcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlRHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGVcIiwgbm9kZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVEdW1wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcER1bXAgPSB0aGlzLnJlc29sdmVEdW1wUGF0aChub2RlRHVtcCwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BEdW1wPy50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BUeXBlID0gcHJvcER1bXAudHlwZSBhcyBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dGVuZHNBcnIgPSAocHJvcER1bXAuZXh0ZW5kcyB8fCBbXSkgYXMgc3RyaW5nW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQ29tcG9uZW50UmVmID0gZXh0ZW5kc0Fyci5pbmNsdWRlcyhcImNjLkNvbXBvbmVudFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNOb2RlUmVmID0gcHJvcFR5cGUgPT09IFwiY2MuTm9kZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0Fzc2V0UmVmID0gZXh0ZW5kc0Fyci5pbmNsdWRlcyhcImNjLkFzc2V0XCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQ29tcG9uZW50UmVmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDjgrPjg7Pjg53jg7zjg43jg7Pjg4jlj4Lnhac6IOODjuODvOODiVVVSUTjgYvjgonjgrPjg7Pjg53jg7zjg43jg7Pjg4hVVUlE44KS6Kej5rG6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wVXVpZCA9IGF3YWl0IHRoaXMucmVzb2x2ZUNvbXBvbmVudFV1aWQodmFsdWUsIHByb3BUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHByb3BUeXBlLCB2YWx1ZTogeyB1dWlkOiBjb21wVXVpZCB8fCB2YWx1ZSB9IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTm9kZVJlZikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogcHJvcFR5cGUsIHZhbHVlOiB7IHV1aWQ6IHZhbHVlIH0gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNBc3NldFJlZikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogcHJvcFR5cGUsIHZhbHVlOiB7IHV1aWQ6IHZhbHVlIH0gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoX2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIHF1ZXJ5LW5vZGXlpLHmlZfmmYLjga/jg5Xjgqnjg7zjg6vjg5Djg4Pjgq9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZSwgdHlwZTogXCJTdHJpbmdcIiB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g44Gd44Gu5LuW44Gu44Kq44OW44K444Kn44Kv44OI77yIY29udGVudFNpemUsIGNvbG9y562J44Gu5qeL6YCg5L2T77yJXHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgY29uc3Qgd3JhcHBlZDogYW55ID0ge307XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgd3JhcHBlZFtrXSA9IHsgdmFsdWU6IHYgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogd3JhcHBlZCB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdmFsdWUgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHF1ZXJ5LW5vZGXjga5kdW1w44GL44KJ44OJ44OD44OI44OR44K544Gn44OX44Ot44OR44OG44Kj44KS6Kej5rG644GZ44KL44CCXHJcbiAgICAgKiDkvos6IFwiX19jb21wc19fLjIuc2Nyb2xsVmlld1wiIOKGkiBub2RlRHVtcC5fX2NvbXBzX19bMl0udmFsdWUuc2Nyb2xsVmlld1xyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlc29sdmVEdW1wUGF0aChub2RlRHVtcDogYW55LCBwYXRoOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgICAgIGNvbnN0IHBhcnRzID0gcGF0aC5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBub2RlRHVtcDtcclxuICAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcclxuICAgICAgICAgICAgaWYgKCFjdXJyZW50KSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgaWYgKHBhcnQgPT09IFwiX19jb21wc19fXCIpIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50Ll9fY29tcHNfXztcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgvXlxcZCskLy50ZXN0KHBhcnQpKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudFtwYXJzZUludChwYXJ0KV0/LnZhbHVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQ/LltwYXJ0XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3VycmVudDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODjuODvOODiVVVSUTjgYvjgonjgrPjg7Pjg53jg7zjg43jg7Pjg4hVVUlE44KS6Kej5rG644GZ44KL44CCXHJcbiAgICAgKiBwcm9wVHlwZe+8iOS+izogXCJjYy5TY3JvbGxWaWV3XCIsIFwiTWlzc2lvbkxpc3RQYW5lbFwi77yJ44Gr5LiA6Ie044GZ44KL44Kz44Oz44Od44O844ON44Oz44OI44KS5o6i44GZ44CCXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgcmVzb2x2ZUNvbXBvbmVudFV1aWQobm9kZVV1aWQ6IHN0cmluZywgcHJvcFR5cGU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFtub2RlVXVpZF0pO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVJbmZvPy5zdWNjZXNzIHx8ICFub2RlSW5mbz8uZGF0YT8uY29tcG9uZW50cykgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGNvbnN0IHR5cGVOYW1lID0gcHJvcFR5cGUucmVwbGFjZShcImNjLlwiLCBcIlwiKTtcclxuICAgICAgICAgICAgY29uc3QgY29tcCA9IG5vZGVJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kKChjOiBhbnkpID0+IGMudHlwZSA9PT0gdHlwZU5hbWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcD8udXVpZCB8fCBudWxsO1xyXG4gICAgICAgIH0gY2F0Y2ggKF9lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=