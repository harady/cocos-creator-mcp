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
            const dump = this.buildDump(value);

            const result = await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
            return ok({ success: true, path, dump, result });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    /**
     * 値からEditorのset-propertyに渡すdumpオブジェクトを構築する。
     *
     * - プリミティブ（number, boolean, string）: そのまま {value, type} 形式
     * - Node/Component参照 {uuid: "xxx"}: {type: "cc.Node", value: {uuid}} 形式
     *   ※ Editorが自動的にNode上のコンポーネントに解決するため、
     *     Label/Spriteなどの参照もtype:"cc.Node"でNodeのUUIDを指定すればよい
     * - その他のオブジェクト: {value} としてそのまま渡す
     */
    private buildDump(value: any): any {
        if (typeof value === "number") return { value, type: "Number" };
        if (typeof value === "boolean") return { value, type: "Boolean" };

        // Node/Asset参照: {uuid: "xxx"} または {uuid: "xxx", type: "cc.SpriteFrame"} 形式
        // type未指定の場合はcc.Nodeとして扱う（後方互換）
        // Asset参照（SpriteFrame等）の場合はtypeを明示的に指定する
        if (value !== null && typeof value === "object" && typeof value.uuid === "string") {
            const refType = typeof value.type === "string" ? value.type : "cc.Node";
            return { type: refType, value: { uuid: value.uuid } };
        }

        // 生のUUID文字列（後方互換）: "xxx" 形式の場合もNode参照として扱う
        // ただし、明らかに通常のテキスト値の場合はString型にする必要がある。
        // 判定基準: UUIDは通常20文字以上のBase64風文字列
        if (typeof value === "string") {
            return { value, type: "String" };
        }

        // その他のオブジェクト（contentSize, color等の構造体）
        // Editor APIはcc.Size/cc.Vec2/cc.Color等の構造体で各フィールドを
        // {value: 数値} でラップした形式を期待する
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            const wrapped: any = {};
            for (const [k, v] of Object.entries(value)) {
                wrapped[k] = { value: v };
            }
            return { value: wrapped };
        }

        return { value };
    }

    private async sceneScript(method: string, args: any[]): Promise<any> {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
