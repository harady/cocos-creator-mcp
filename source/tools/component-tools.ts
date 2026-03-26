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
        switch (toolName) {
            case "component_add":
                return this.addComponent(args.uuid, args.componentType);
            case "component_remove":
                return this.removeComponent(args.uuid, args.componentType);
            case "component_get_components":
                return this.getComponents(args.uuid);
            case "component_set_property":
                return this.setProperty(args.uuid, args.componentType, args.property, args.value);
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
            const result = await this.sceneScript("setComponentProperty", [uuid, componentType, property, value]);
            return ok(result);
        } catch (e: any) {
            return err(e.message || String(e));
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
