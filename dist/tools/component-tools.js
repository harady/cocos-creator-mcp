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
                description: "Set a property on a component. Examples: Label.string, Label.fontSize, Sprite.color, UITransform.contentSize.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        componentType: { type: "string", description: "Component class name (e.g. 'cc.Label')" },
                        property: { type: "string", description: "Property name (e.g. 'string', 'fontSize')" },
                        value: { description: "Value to set" },
                    },
                    required: ["uuid", "componentType", "property", "value"],
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
                        // Node/Component参照型: cc.Nodeを継承するもの
                        const isNodeRef = propType === "cc.Node" ||
                            extendsArr.includes("cc.Component") ||
                            extendsArr.includes("cc.Object");
                        // Asset参照型: cc.Assetを継承するもの（cc.Prefab, cc.SpriteFrame等）
                        const isAssetRef = extendsArr.includes("cc.Asset");
                        if (isNodeRef || isAssetRef) {
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
    async sceneScript(method, args) {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
exports.ComponentTools = ComponentTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvbXBvbmVudC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0Q0FBdUM7QUFFdkMsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFFckMsTUFBYSxjQUFjO0lBQTNCO1FBQ2EsaUJBQVksR0FBRyxXQUFXLENBQUM7SUFzUHhDLENBQUM7SUFwUEcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsZUFBZTtnQkFDckIsV0FBVyxFQUFFLDJGQUEyRjtnQkFDeEcsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7d0JBQ2xELGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHdDQUF3QyxFQUFFO3FCQUMzRjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO2lCQUN0QzthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGtCQUFrQjtnQkFDeEIsV0FBVyxFQUFFLGlDQUFpQztnQkFDOUMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7d0JBQ2xELGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFO3FCQUNuRjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO2lCQUN0QzthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLDBCQUEwQjtnQkFDaEMsV0FBVyxFQUFFLHFEQUFxRDtnQkFDbEUs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ZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuXHJcbmNvbnN0IEVYVF9OQU1FID0gXCJjb2Nvcy1jcmVhdG9yLW1jcFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbXBvbmVudFRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwiY29tcG9uZW50XCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfYWRkXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBZGQgYSBjb21wb25lbnQgdG8gYSBub2RlLiBVc2UgY2MuWFhYIGZvcm1hdCAoZS5nLiAnY2MuTGFiZWwnLCAnY2MuU3ByaXRlJywgJ2NjLkJ1dHRvbicpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lIChlLmcuICdjYy5MYWJlbCcpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwiY29tcG9uZW50VHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X3JlbW92ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVtb3ZlIGEgY29tcG9uZW50IGZyb20gYSBub2RlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lIHRvIHJlbW92ZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcImNvbXBvbmVudFR5cGVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImNvbXBvbmVudF9nZXRfY29tcG9uZW50c1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGFsbCBjb21wb25lbnRzIG9uIGEgbm9kZSB3aXRoIHRoZWlyIHByb3BlcnRpZXMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X3NldF9wcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2V0IGEgcHJvcGVydHkgb24gYSBjb21wb25lbnQuIEV4YW1wbGVzOiBMYWJlbC5zdHJpbmcsIExhYmVsLmZvbnRTaXplLCBTcHJpdGUuY29sb3IsIFVJVHJhbnNmb3JtLmNvbnRlbnRTaXplLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lIChlLmcuICdjYy5MYWJlbCcpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJvcGVydHkgbmFtZSAoZS5nLiAnc3RyaW5nJywgJ2ZvbnRTaXplJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogeyBkZXNjcmlwdGlvbjogXCJWYWx1ZSB0byBzZXRcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJjb21wb25lbnRUeXBlXCIsIFwicHJvcGVydHlcIiwgXCJ2YWx1ZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiY29tcG9uZW50X2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgZHVtcCBvZiBhIHNwZWNpZmljIGNvbXBvbmVudCBieSBpdHMgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50IFVVSUQgKG5vdCBub2RlIFVVSUQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJjb21wb25lbnRVdWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb21wb25lbnRfZ2V0X2F2YWlsYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhbGwgYXZhaWxhYmxlIGNvbXBvbmVudCBjbGFzc2VzIHRoYXQgY2FuIGJlIGFkZGVkIHRvIG5vZGVzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIOODkeODqeODoeODvOOCv+OCqOOCpOODquOCouOCuTogY29tcG9uZW50IOKGkiBjb21wb25lbnRUeXBlXHJcbiAgICAgICAgY29uc3QgY29tcFR5cGUgPSBhcmdzLmNvbXBvbmVudFR5cGUgfHwgYXJncy5jb21wb25lbnQ7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2FkZFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ29tcG9uZW50KGFyZ3MudXVpZCwgY29tcFR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X3JlbW92ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlQ29tcG9uZW50KGFyZ3MudXVpZCwgY29tcFR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tcG9uZW50X2dldF9jb21wb25lbnRzXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRzKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJjb21wb25lbnRfc2V0X3Byb3BlcnR5XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eShhcmdzLnV1aWQsIGNvbXBUeXBlLCBhcmdzLnByb3BlcnR5LCBhcmdzLnZhbHVlKTtcclxuICAgICAgICAgICAgY2FzZSBcImNvbXBvbmVudF9nZXRfaW5mb1wiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jb21wb25lbnRcIiwgYXJncy5jb21wb25lbnRVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBjb21wb25lbnQ6IGR1bXAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJjb21wb25lbnRfZ2V0X2F2YWlsYWJsZVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1jbGFzc2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGNsYXNzZXMgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYWRkQ29tcG9uZW50KHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImFkZENvbXBvbmVudFRvTm9kZVwiLCBbdXVpZCwgY29tcG9uZW50VHlwZV0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZW1vdmVDb21wb25lbnQodXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwicmVtb3ZlQ29tcG9uZW50RnJvbU5vZGVcIiwgW3V1aWQsIGNvbXBvbmVudFR5cGVdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Q29tcG9uZW50cyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2VzcykgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgdXVpZCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IHJlc3VsdC5kYXRhPy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgY29tcG9uZW50czogcmVzdWx0LmRhdGE/LmNvbXBvbmVudHMgfHwgW10sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldFByb3BlcnR5KHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8g44Kz44Oz44Od44O844ON44Oz44OI44Gu44Kk44Oz44OH44OD44Kv44K544KS5Y+W5b6XXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MgfHwgIW5vZGVJbmZvPy5kYXRhPy5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBOb2RlICR7dXVpZH0gbm90IGZvdW5kIG9yIGhhcyBubyBjb21wb25lbnRzYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY29tcE5hbWUgPSBjb21wb25lbnRUeXBlLnJlcGxhY2UoXCJjYy5cIiwgXCJcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBJbmRleCA9IG5vZGVJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kSW5kZXgoKGM6IGFueSkgPT4gYy50eXBlID09PSBjb21wTmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChjb21wSW5kZXggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZSAke3V1aWR9YCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNjZW5lOnNldC1wcm9wZXJ0eSDjgafjg5fjg63jg5Hjg4bjgqPlpInmm7TvvIhQcmVmYWLkv53lrZjmmYLjgavjgoLlj43mmKDjgZXjgozjgovvvIlcclxuICAgICAgICAgICAgLy8g44OR44K55b2i5byPOiBfX2NvbXBzX18ue2luZGV4fS57cHJvcGVydHl9XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgX19jb21wc19fLiR7Y29tcEluZGV4fS4ke3Byb3BlcnR5fWA7XHJcblxyXG4gICAgICAgICAgICAvLyDjg5fjg63jg5Hjg4bjgqPjga7lnovmg4XloLHjgpJxdWVyeS1ub2Rl44GL44KJ5Y+W5b6X44GX44Gm44CB6YGp5YiH44GqZHVtcOW9ouW8j+OCkuani+eviVxyXG4gICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgdGhpcy5idWlsZER1bXBXaXRoVHlwZUluZm8odXVpZCwgcGF0aCwgdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHBhdGgsIGR1bXAsIHJlc3VsdCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5fjg63jg5Hjg4bjgqPjga7lnovmg4XloLHjgpJFZGl0b3IgQVBJ44GL44KJ5Y+W5b6X44GX44CB6YGp5YiH44GqZHVtcOW9ouW8j+OCkuani+evieOBmeOCi+OAglxyXG4gICAgICpcclxuICAgICAqIFVVSUTmloflrZfliJfjgYzmuKHjgZXjgozjgZ/loLTlkIjjgIHjg5fjg63jg5Hjg4bjgqPjga7lnovjgavlv5zjgZjjgaY6XHJcbiAgICAgKiAtIE5vZGUvQ29tcG9uZW505Y+C54Wn5Z6LIOKGkiB7dHlwZTogcHJvcFR5cGUsIHZhbHVlOiB7dXVpZDogbm9kZVV1aWR9fVxyXG4gICAgICogLSBBc3NldOWPgueFp+Wei++8iGNjLlByZWZhYuetie+8iSDihpIge3R5cGU6IHByb3BUeXBlLCB2YWx1ZToge3V1aWQ6IGFzc2V0VXVpZH19XHJcbiAgICAgKiAtIFN0cmluZ+WeiyDihpIge3ZhbHVlLCB0eXBlOiBcIlN0cmluZ1wifVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIGJ1aWxkRHVtcFdpdGhUeXBlSW5mbyhub2RlVXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIC8vIOODl+ODquODn+ODhuOCo+ODluWei+OBr+OBneOBruOBvuOBvlxyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpIHJldHVybiB7IHZhbHVlLCB0eXBlOiBcIk51bWJlclwiIH07XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIpIHJldHVybiB7IHZhbHVlLCB0eXBlOiBcIkJvb2xlYW5cIiB9O1xyXG5cclxuICAgICAgICAvLyDjgqrjg5bjgrjjgqfjgq/jg4jlvaLlvI8ge3V1aWQ6IFwieHh4XCIsIHR5cGU6IFwiY2MuTm9kZVwifSDjga/jgZ3jga7jgb7jgb5cclxuICAgICAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZS51dWlkID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSB0eXBlb2YgdmFsdWUudHlwZSA9PT0gXCJzdHJpbmdcIiA/IHZhbHVlLnR5cGUgOiBcImNjLk5vZGVcIjtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogcmVmVHlwZSwgdmFsdWU6IHsgdXVpZDogdmFsdWUudXVpZCB9IH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDmloflrZfliJfjga7loLTlkIg6IOODl+ODreODkeODhuOCo+OBruWei+aDheWgseOCkuWPluW+l+OBl+OBpuWIpOWumlxyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVEdW1wID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktbm9kZVwiLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZUR1bXApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wRHVtcCA9IHRoaXMucmVzb2x2ZUR1bXBQYXRoKG5vZGVEdW1wLCBwYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcER1bXA/LnR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcFR5cGUgPSBwcm9wRHVtcC50eXBlIGFzIHN0cmluZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXh0ZW5kc0FyciA9IChwcm9wRHVtcC5leHRlbmRzIHx8IFtdKSBhcyBzdHJpbmdbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9kZS9Db21wb25lbnTlj4Lnhaflnos6IGNjLk5vZGXjgpLntpnmib/jgZnjgovjgoLjga5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNOb2RlUmVmID0gcHJvcFR5cGUgPT09IFwiY2MuTm9kZVwiIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRlbmRzQXJyLmluY2x1ZGVzKFwiY2MuQ29tcG9uZW50XCIpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRlbmRzQXJyLmluY2x1ZGVzKFwiY2MuT2JqZWN0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3NldOWPgueFp+WeizogY2MuQXNzZXTjgpLntpnmib/jgZnjgovjgoLjga7vvIhjYy5QcmVmYWIsIGNjLlNwcml0ZUZyYW1l562J77yJXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQXNzZXRSZWYgPSBleHRlbmRzQXJyLmluY2x1ZGVzKFwiY2MuQXNzZXRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOb2RlUmVmIHx8IGlzQXNzZXRSZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHByb3BUeXBlLCB2YWx1ZTogeyB1dWlkOiB2YWx1ZSB9IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKF9lKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBxdWVyeS1ub2Rl5aSx5pWX5pmC44Gv44OV44Kp44O844Or44OQ44OD44KvXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWUsIHR5cGU6IFwiU3RyaW5nXCIgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIOOBneOBruS7luOBruOCquODluOCuOOCp+OCr+ODiO+8iGNvbnRlbnRTaXplLCBjb2xvcuetieOBruani+mAoOS9k++8iVxyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHdyYXBwZWQ6IGFueSA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHdyYXBwZWRba10gPSB7IHZhbHVlOiB2IH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHdyYXBwZWQgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7IHZhbHVlIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBxdWVyeS1ub2Rl44GuZHVtcOOBi+OCieODieODg+ODiOODkeOCueOBp+ODl+ODreODkeODhuOCo+OCkuino+axuuOBmeOCi+OAglxyXG4gICAgICog5L6LOiBcIl9fY29tcHNfXy4yLnNjcm9sbFZpZXdcIiDihpIgbm9kZUR1bXAuX19jb21wc19fWzJdLnZhbHVlLnNjcm9sbFZpZXdcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZXNvbHZlRHVtcFBhdGgobm9kZUR1bXA6IGFueSwgcGF0aDogc3RyaW5nKTogYW55IHtcclxuICAgICAgICBjb25zdCBwYXJ0cyA9IHBhdGguc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIGxldCBjdXJyZW50ID0gbm9kZUR1bXA7XHJcbiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGlmIChwYXJ0ID09PSBcIl9fY29tcHNfX1wiKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5fX2NvbXBzX187XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL15cXGQrJC8udGVzdChwYXJ0KSkge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGFyc2VJbnQocGFydCldPy52YWx1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50Py5bcGFydF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IEVYVF9OQU1FLFxyXG4gICAgICAgICAgICBtZXRob2QsXHJcbiAgICAgICAgICAgIGFyZ3MsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19