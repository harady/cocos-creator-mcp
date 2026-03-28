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
            {
                name: "node_set_active",
                description: "Set a node's active (visible) state.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        active: { type: "boolean", description: "Whether the node is active" },
                    },
                    required: ["uuid", "active"],
                },
            },
            {
                name: "node_set_layer",
                description: "Set a node's layer.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                        layer: { type: "number", description: "Layer value" },
                    },
                    required: ["uuid", "layer"],
                },
            },
            {
                name: "node_detect_type",
                description: "Detect node type (2D, 3D, or regular Node) based on its components.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "node_create_tree",
                description: "Create a full node tree from a JSON spec in one call. Much faster than creating nodes one by one. Spec format: { name, components?: ['cc.UITransform'], properties?: {'cc.UITransform.contentSize': {width:720,height:1280}}, active?: bool, position?: {x,y,z}, children?: [...] }",
                inputSchema: {
                    type: "object",
                    properties: {
                        parent: { type: "string", description: "Parent node UUID" },
                        spec: { description: "Node tree specification (JSON object with name, components, properties, children)" },
                    },
                    required: ["parent", "spec"],
                },
            },
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        const rejected = await this.rejectIfPreviewRunning(toolName);
        if (rejected) return rejected;

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
            case "node_set_active":
                return this.setProperty(args.uuid, "active", args.active);
            case "node_set_layer":
                return this.setProperty(args.uuid, "layer", args.layer);
            case "node_create_tree":
                return this.createNodeTree(args.parent, args.spec);
            case "node_detect_type": {
                try {
                    const info = await this.sceneScript("getNodeInfo", [args.uuid]);
                    if (!info.success) return ok(info);
                    const comps = info.data?.components || [];
                    const compTypes = comps.map((c: any) => c.type);
                    let nodeType = "Node";
                    if (compTypes.includes("UITransform")) nodeType = "2D";
                    else if (compTypes.includes("MeshRenderer") || compTypes.includes("Camera")) nodeType = "3D";
                    return ok({ success: true, uuid: args.uuid, nodeType, components: compTypes });
                } catch (e: any) { return err(e.message || String(e)); }
            }
            default:
                return err(`Unknown tool: ${toolName}`);
        }
    }

    /** Scene editing tools that must not run during preview */
    private static readonly SCENE_EDIT_TOOLS = new Set([
        "node_create", "node_delete", "node_move", "node_duplicate",
        "node_set_property", "node_set_transform", "node_set_active", "node_set_layer",
        "node_create_tree",
    ]);

    private async rejectIfPreviewRunning(toolName: string): Promise<ToolResult | null> {
        if (!NodeTools.SCENE_EDIT_TOOLS.has(toolName)) return null;
        try {
            const state = await Editor.Message.request("preview", "query-info");
            if (state && (state as any).running) {
                return err(`"${toolName}" はプレビュー中に実行できません。先にプレビューを停止してください。`);
            }
        } catch { /* query failed — allow execution */ }
        return null;
    }

    private async createNode(name: string, parent?: string, components?: string[]): Promise<ToolResult> {
        try {
            // Use Editor API to create node
            const uuid = await Editor.Message.request("scene", "create-node", {
                parent: parent || undefined,
                name,
                assetUuid: undefined,
            });

            // Wait until the node is queryable in the scene process
            await this.waitForNode(uuid);

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

    /**
     * Wait until a node becomes queryable in the scene process.
     * Editor.Message.request("scene", "create-node") returns before the node
     * is fully registered in the scene hierarchy, so subsequent scene script
     * calls (findNode) may fail without this wait.
     */
    private async waitForNode(uuid: string, maxRetries = 10, intervalMs = 100): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await this.sceneScript("getNodeInfo", [uuid]);
                if (result?.success) return;
            } catch { /* not ready yet */ }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        // Don't throw — let the caller proceed and get a more specific error if needed
    }

    private async createNodeTree(parentUuid: string, spec: any): Promise<ToolResult> {
        try {
            const result = await this.sceneScript("buildNodeTree", [parentUuid, spec]);
            if (!result?.success) return err(result?.error || "buildNodeTree failed");
            return ok(result);
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
