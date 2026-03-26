import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

const EXT_NAME = "cocos-creator-mcp";

export class NodeTools implements ToolCategory {
    readonly categoryName = "node";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "node_create",
                description: "Create a new node in the scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Node name" },
                        parent: { type: "string", description: "Parent node UUID (optional, defaults to scene root)" },
                        components: {
                            type: "array",
                            items: { type: "string" },
                            description: "Component class names to add (e.g. ['cc.Label', 'cc.Sprite'])",
                        },
                    },
                    required: ["name"],
                },
            },
            {
                name: "node_get_info",
                description: "Get detailed information about a node by UUID, including components.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "node_find_by_name",
                description: "Find all nodes matching a given name.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Node name to search" },
                    },
                    required: ["name"],
                },
            },
            {
                name: "node_set_property",
                description: "Set a property on a node (name, active, position, rotation, scale, etc.).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        property: { type: "string", description: "Property name (e.g. 'name', 'active', 'position')" },
                        value: { description: "Value to set. For position/rotation/scale use {x,y,z}." },
                    },
                    required: ["uuid", "property", "value"],
                },
            },
            {
                name: "node_set_transform",
                description: "Set position, rotation, and/or scale of a node at once.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        position: {
                            type: "object",
                            properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
                            description: "Position {x,y,z}",
                        },
                        rotation: {
                            type: "object",
                            properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
                            description: "Euler rotation {x,y,z}",
                        },
                        scale: {
                            type: "object",
                            properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } },
                            description: "Scale {x,y,z}",
                        },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "node_delete",
                description: "Delete a node by UUID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "node_move",
                description: "Move a node to a new parent.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        parentUuid: { type: "string", description: "New parent node UUID" },
                    },
                    required: ["uuid", "parentUuid"],
                },
            },
            {
                name: "node_duplicate",
                description: "Duplicate a node.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID to duplicate" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "node_get_all",
                description: "Get a flat list of all nodes in the current scene.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        switch (toolName) {
            case "node_create":
                return this.createNode(args.name, args.parent, args.components);
            case "node_get_info":
                return this.getNodeInfo(args.uuid);
            case "node_find_by_name":
                return this.findByName(args.name);
            case "node_set_property":
                return this.setProperty(args.uuid, args.property, args.value);
            case "node_set_transform":
                return this.setTransform(args.uuid, args.position, args.rotation, args.scale);
            case "node_delete":
                return this.deleteNode(args.uuid);
            case "node_move":
                return this.moveNode(args.uuid, args.parentUuid);
            case "node_duplicate":
                return this.duplicateNode(args.uuid);
            case "node_get_all":
                return this.getAllNodes();
            default:
                return err(`Unknown tool: ${toolName}`);
        }
    }

    private async createNode(name: string, parent?: string, components?: string[]): Promise<ToolResult> {
        try {
            // Use Editor API to create node
            const uuid = await Editor.Message.request("scene", "create-node", {
                parent: parent || undefined,
                name,
                assetUuid: undefined,
            });

            // Add components if specified
            if (components && components.length > 0) {
                for (const comp of components) {
                    await this.sceneScript("addComponentToNode", [uuid, comp]);
                }
            }

            return ok({ success: true, uuid, name });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getNodeInfo(uuid: string): Promise<ToolResult> {
        try {
            const result = await this.sceneScript("getNodeInfo", [uuid]);
            return ok(result);
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async findByName(name: string): Promise<ToolResult> {
        try {
            const result = await this.sceneScript("findNodesByName", [name]);
            return ok(result);
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async setProperty(uuid: string, property: string, value: any): Promise<ToolResult> {
        try {
            const result = await this.sceneScript("setNodeProperty", [uuid, property, value]);
            return ok(result);
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async setTransform(uuid: string, position?: any, rotation?: any, scale?: any): Promise<ToolResult> {
        try {
            const results: any[] = [];
            if (position) {
                results.push(await this.sceneScript("setNodeProperty", [uuid, "position", position]));
            }
            if (rotation) {
                results.push(await this.sceneScript("setNodeProperty", [uuid, "rotation", rotation]));
            }
            if (scale) {
                results.push(await this.sceneScript("setNodeProperty", [uuid, "scale", scale]));
            }
            const anyFailed = results.find((r) => !r.success);
            if (anyFailed) return ok(anyFailed);
            return ok({ success: true, uuid });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async deleteNode(uuid: string): Promise<ToolResult> {
        try {
            await Editor.Message.request("scene", "remove-node", { uuid });
            return ok({ success: true, uuid });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async moveNode(uuid: string, parentUuid: string): Promise<ToolResult> {
        try {
            await (Editor.Message.request as any)("scene", "set-property", {
                uuid,
                path: "parent",
                dump: { type: "cc.Node", value: { uuid: parentUuid } },
            });
            return ok({ success: true, uuid, parentUuid });
        } catch (e: any) {
            // Fallback: try scene script
            try {
                const result = await this.sceneScript("moveNode", [uuid, parentUuid]);
                return ok(result);
            } catch (e2: any) {
                return err(e.message || String(e));
            }
        }
    }

    private async duplicateNode(uuid: string): Promise<ToolResult> {
        try {
            const result = await Editor.Message.request("scene", "duplicate-node", uuid);
            // duplicate-node returns an array of UUIDs
            const newUuid = Array.isArray(result) ? result[0] : result;
            return ok({ success: true, sourceUuid: uuid, newUuid });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getAllNodes(): Promise<ToolResult> {
        try {
            const result = await this.sceneScript("getAllNodes", []);
            return ok(result);
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    /** Call a scene script method */
    private async sceneScript(method: string, args: any[]): Promise<any> {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
