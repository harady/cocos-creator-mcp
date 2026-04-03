import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

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

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
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
        if (value !== null && typeof value === "object" && typeof value.uuid === "string") {
            const refType = typeof value.type === "string" ? value.type : "cc.Node";
            return { type: refType, value: { uuid: value.uuid } };
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
