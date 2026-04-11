"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTools = void 0;
const tool_base_1 = require("../tool-base");
const utils_1 = require("../utils");
const EXT_NAME = "cocos-creator-mcp";
class NodeTools {
    constructor() {
        this.categoryName = "node";
    }
    getTools() {
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
                description: "Create a full node tree from a JSON spec in one call. Much faster than creating nodes one by one. Spec format: { name, components?: ['cc.UITransform'], properties?: {'cc.UITransform.contentSize': {width:720,height:1280}}, widget?: {top:0, bottom:0, left:0, right:0}, active?: bool, position?: {x,y,z}, children?: [...] }",
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
    async execute(toolName, args) {
        var _a;
        const rejected = await this.rejectIfPreviewRunning(toolName);
        if (rejected)
            return rejected;
        switch (toolName) {
            case "node_create":
                return this.createNode(args.name, args.parent, args.components);
            case "node_get_info":
                return this.getNodeInfo(args.uuid);
            case "node_find_by_name":
                return this.findByName(args.name);
            case "node_set_property":
                return this.setProperty(args.uuid, args.property, (0, utils_1.parseMaybeJson)(args.value));
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
                return this.createNodeTree(args.parent, (0, utils_1.parseMaybeJson)(args.spec));
            case "node_detect_type": {
                try {
                    const info = await this.sceneScript("getNodeInfo", [args.uuid]);
                    if (!info.success)
                        return (0, tool_base_1.ok)(info);
                    const comps = ((_a = info.data) === null || _a === void 0 ? void 0 : _a.components) || [];
                    const compTypes = comps.map((c) => c.type);
                    let nodeType = "Node";
                    if (compTypes.includes("UITransform"))
                        nodeType = "2D";
                    else if (compTypes.includes("MeshRenderer") || compTypes.includes("Camera"))
                        nodeType = "3D";
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid, nodeType, components: compTypes });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            default:
                return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
        }
    }
    async rejectIfPreviewRunning(toolName) {
        if (!NodeTools.SCENE_EDIT_TOOLS.has(toolName))
            return null;
        try {
            const state = await Editor.Message.request("preview", "query-info");
            if (state && state.running) {
                return (0, tool_base_1.err)(`"${toolName}" はプレビュー中に実行できません。先にプレビューを停止してください。`);
            }
        }
        catch ( /* query failed — allow execution */_a) { /* query failed — allow execution */ }
        return null;
    }
    async createNode(name, parent, components) {
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
            return (0, tool_base_1.ok)({ success: true, uuid, name });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    /**
     * Wait until a node becomes queryable in the scene process.
     * Editor.Message.request("scene", "create-node") returns before the node
     * is fully registered in the scene hierarchy, so subsequent scene script
     * calls (findNode) may fail without this wait.
     */
    async waitForNode(uuid, maxRetries = 10, intervalMs = 100) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await this.sceneScript("getNodeInfo", [uuid]);
                if (result === null || result === void 0 ? void 0 : result.success)
                    return;
            }
            catch ( /* not ready yet */_a) { /* not ready yet */ }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        // Don't throw — let the caller proceed and get a more specific error if needed
    }
    async createNodeTree(parentUuid, spec) {
        try {
            const result = await this.sceneScript("buildNodeTree", [parentUuid, spec]);
            if (!(result === null || result === void 0 ? void 0 : result.success))
                return (0, tool_base_1.err)((result === null || result === void 0 ? void 0 : result.error) || "buildNodeTree failed");
            return (0, tool_base_1.ok)(result);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getNodeInfo(uuid) {
        try {
            const result = await this.sceneScript("getNodeInfo", [uuid]);
            return (0, tool_base_1.ok)(result);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async findByName(name) {
        try {
            const result = await this.sceneScript("findNodesByName", [name]);
            return (0, tool_base_1.ok)(result);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async setProperty(uuid, property, value) {
        try {
            const result = await this.sceneScript("setNodeProperty", [uuid, property, value]);
            return (0, tool_base_1.ok)(result);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async setTransform(uuid, position, rotation, scale) {
        try {
            const results = [];
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
            if (anyFailed)
                return (0, tool_base_1.ok)(anyFailed);
            return (0, tool_base_1.ok)({ success: true, uuid });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async deleteNode(uuid) {
        try {
            await Editor.Message.request("scene", "remove-node", { uuid });
            return (0, tool_base_1.ok)({ success: true, uuid });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async moveNode(uuid, parentUuid) {
        try {
            await Editor.Message.request("scene", "set-property", {
                uuid,
                path: "parent",
                dump: { type: "cc.Node", value: { uuid: parentUuid } },
            });
            return (0, tool_base_1.ok)({ success: true, uuid, parentUuid });
        }
        catch (e) {
            // Fallback: try scene script
            try {
                const result = await this.sceneScript("moveNode", [uuid, parentUuid]);
                return (0, tool_base_1.ok)(result);
            }
            catch (e2) {
                return (0, tool_base_1.err)(e.message || String(e));
            }
        }
    }
    async duplicateNode(uuid) {
        try {
            const result = await Editor.Message.request("scene", "duplicate-node", uuid);
            // duplicate-node returns an array of UUIDs
            const newUuid = Array.isArray(result) ? result[0] : result;
            return (0, tool_base_1.ok)({ success: true, sourceUuid: uuid, newUuid });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getAllNodes() {
        try {
            const result = await this.sceneScript("getAllNodes", []);
            return (0, tool_base_1.ok)(result);
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    /** Call a scene script method */
    async sceneScript(method, args) {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: EXT_NAME,
            method,
            args,
        });
    }
}
exports.NodeTools = NodeTools;
/** Scene editing tools that must not run during preview */
NodeTools.SCENE_EDIT_TOOLS = new Set([
    "node_create", "node_delete", "node_move", "node_duplicate",
    "node_set_property", "node_set_transform", "node_set_active", "node_set_layer",
    "node_create_tree",
]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9ub2RlLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRDQUF1QztBQUN2QyxvQ0FBMEM7QUFFMUMsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFFckMsTUFBYSxTQUFTO0lBQXRCO1FBQ2EsaUJBQVksR0FBRyxNQUFNLENBQUM7SUF5WW5DLENBQUM7SUF2WUcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsV0FBVyxFQUFFLGlDQUFpQztnQkFDOUMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7d0JBQ2xELE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHFEQUFxRCxFQUFFO3dCQUM5RixVQUFVLEVBQUU7NEJBQ1IsSUFBSSxFQUFFLE9BQU87NEJBQ2IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTs0QkFDekIsV0FBVyxFQUFFLCtEQUErRDt5QkFDL0U7cUJBQ0o7b0JBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDO2lCQUNyQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGVBQWU7Z0JBQ3JCLFdBQVcsRUFBRSxzRUFBc0U7Z0JBQ25GLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFO3FCQUNyRDtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUM7aUJBQ3JCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsbUJBQW1CO2dCQUN6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RSxVQUFVLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVztRQUNyQixJQUFJLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELE9BQU8sSUFBQSxjQUFFLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFRCxpQ0FBaUM7SUFDekIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsSUFBVztRQUNqRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEVBQUUsUUFBUTtZQUNkLE1BQU07WUFDTixJQUFJO1NBQ1AsQ0FBQyxDQUFDO0lBQ1AsQ0FBQzs7QUF6WUwsOEJBMFlDO0FBN0tHLDJEQUEyRDtBQUNuQywwQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUMvQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0I7SUFDM0QsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCO0lBQzlFLGtCQUFrQjtDQUNyQixDQUFDLEFBSnNDLENBSXJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5pbXBvcnQgeyBwYXJzZU1heWJlSnNvbiB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5cclxuY29uc3QgRVhUX05BTUUgPSBcImNvY29zLWNyZWF0b3ItbWNwXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTm9kZVRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwibm9kZVwiO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9jcmVhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIG5ldyBub2RlIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlBhcmVudCBub2RlIFVVSUQgKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBzY2VuZSByb290KVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lcyB0byBhZGQgKGUuZy4gWydjYy5MYWJlbCcsICdjYy5TcHJpdGUnXSlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJuYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgYSBub2RlIGJ5IFVVSUQsIGluY2x1ZGluZyBjb21wb25lbnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfZmluZF9ieV9uYW1lXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJGaW5kIGFsbCBub2RlcyBtYXRjaGluZyBhIGdpdmVuIG5hbWUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgbmFtZSB0byBzZWFyY2hcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcIm5hbWVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfc2V0X3Byb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgYSBwcm9wZXJ0eSBvbiBhIG5vZGUgKG5hbWUsIGFjdGl2ZSwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSwgZXRjLikuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IG5hbWUgKGUuZy4gJ25hbWUnLCAnYWN0aXZlJywgJ3Bvc2l0aW9uJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogeyBkZXNjcmlwdGlvbjogXCJWYWx1ZSB0byBzZXQuIEZvciBwb3NpdGlvbi9yb3RhdGlvbi9zY2FsZSB1c2Uge3gseSx6fS5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJwcm9wZXJ0eVwiLCBcInZhbHVlXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX3NldF90cmFuc2Zvcm1cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCBwb3NpdGlvbiwgcm90YXRpb24sIGFuZC9vciBzY2FsZSBvZiBhIG5vZGUgYXQgb25jZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHg6IHsgdHlwZTogXCJudW1iZXJcIiB9LCB5OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgejogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlBvc2l0aW9uIHt4LHksen1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHg6IHsgdHlwZTogXCJudW1iZXJcIiB9LCB5OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgejogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkV1bGVyIHJvdGF0aW9uIHt4LHksen1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHg6IHsgdHlwZTogXCJudW1iZXJcIiB9LCB5OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgejogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNjYWxlIHt4LHksen1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2RlbGV0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRGVsZXRlIGEgbm9kZSBieSBVVUlELlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfbW92ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTW92ZSBhIG5vZGUgdG8gYSBuZXcgcGFyZW50LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5ldyBwYXJlbnQgbm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGFyZW50VXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9kdXBsaWNhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkR1cGxpY2F0ZSBhIG5vZGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRCB0byBkdXBsaWNhdGVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfZ2V0X2FsbFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGEgZmxhdCBsaXN0IG9mIGFsbCBub2RlcyBpbiB0aGUgY3VycmVudCBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9zZXRfYWN0aXZlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgYSBub2RlJ3MgYWN0aXZlICh2aXNpYmxlKSBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJXaGV0aGVyIHRoZSBub2RlIGlzIGFjdGl2ZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcImFjdGl2ZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9zZXRfbGF5ZXJcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCBhIG5vZGUncyBsYXllci5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTGF5ZXIgdmFsdWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJsYXllclwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9kZXRlY3RfdHlwZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRGV0ZWN0IG5vZGUgdHlwZSAoMkQsIDNELCBvciByZWd1bGFyIE5vZGUpIGJhc2VkIG9uIGl0cyBjb21wb25lbnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfY3JlYXRlX3RyZWVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIGZ1bGwgbm9kZSB0cmVlIGZyb20gYSBKU09OIHNwZWMgaW4gb25lIGNhbGwuIE11Y2ggZmFzdGVyIHRoYW4gY3JlYXRpbmcgbm9kZXMgb25lIGJ5IG9uZS4gU3BlYyBmb3JtYXQ6IHsgbmFtZSwgY29tcG9uZW50cz86IFsnY2MuVUlUcmFuc2Zvcm0nXSwgcHJvcGVydGllcz86IHsnY2MuVUlUcmFuc2Zvcm0uY29udGVudFNpemUnOiB7d2lkdGg6NzIwLGhlaWdodDoxMjgwfX0sIHdpZGdldD86IHt0b3A6MCwgYm90dG9tOjAsIGxlZnQ6MCwgcmlnaHQ6MH0sIGFjdGl2ZT86IGJvb2wsIHBvc2l0aW9uPzoge3gseSx6fSwgY2hpbGRyZW4/OiBbLi4uXSB9XCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUGFyZW50IG5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWM6IHsgZGVzY3JpcHRpb246IFwiTm9kZSB0cmVlIHNwZWNpZmljYXRpb24gKEpTT04gb2JqZWN0IHdpdGggbmFtZSwgY29tcG9uZW50cywgcHJvcGVydGllcywgY2hpbGRyZW4pXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXJlbnRcIiwgXCJzcGVjXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGNvbnN0IHJlamVjdGVkID0gYXdhaXQgdGhpcy5yZWplY3RJZlByZXZpZXdSdW5uaW5nKHRvb2xOYW1lKTtcclxuICAgICAgICBpZiAocmVqZWN0ZWQpIHJldHVybiByZWplY3RlZDtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9jcmVhdGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU5vZGUoYXJncy5uYW1lLCBhcmdzLnBhcmVudCwgYXJncy5jb21wb25lbnRzKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZ2V0X2luZm9cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE5vZGVJbmZvKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX2ZpbmRfYnlfbmFtZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluZEJ5TmFtZShhcmdzLm5hbWUpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfcHJvcGVydHlcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgYXJncy5wcm9wZXJ0eSwgcGFyc2VNYXliZUpzb24oYXJncy52YWx1ZSkpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfdHJhbnNmb3JtXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRUcmFuc2Zvcm0oYXJncy51dWlkLCBhcmdzLnBvc2l0aW9uLCBhcmdzLnJvdGF0aW9uLCBhcmdzLnNjYWxlKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZGVsZXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kZWxldGVOb2RlKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX21vdmVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1vdmVOb2RlKGFyZ3MudXVpZCwgYXJncy5wYXJlbnRVdWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZHVwbGljYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kdXBsaWNhdGVOb2RlKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX2dldF9hbGxcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEFsbE5vZGVzKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX3NldF9hY3RpdmVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgXCJhY3RpdmVcIiwgYXJncy5hY3RpdmUpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfbGF5ZXJcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgXCJsYXllclwiLCBhcmdzLmxheWVyKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfY3JlYXRlX3RyZWVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU5vZGVUcmVlKGFyZ3MucGFyZW50LCBwYXJzZU1heWJlSnNvbihhcmdzLnNwZWMpKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZGV0ZWN0X3R5cGVcIjoge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFthcmdzLnV1aWRdKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8uc3VjY2VzcykgcmV0dXJuIG9rKGluZm8pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBzID0gaW5mby5kYXRhPy5jb21wb25lbnRzIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBUeXBlcyA9IGNvbXBzLm1hcCgoYzogYW55KSA9PiBjLnR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBub2RlVHlwZSA9IFwiTm9kZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wVHlwZXMuaW5jbHVkZXMoXCJVSVRyYW5zZm9ybVwiKSkgbm9kZVR5cGUgPSBcIjJEXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29tcFR5cGVzLmluY2x1ZGVzKFwiTWVzaFJlbmRlcmVyXCIpIHx8IGNvbXBUeXBlcy5pbmNsdWRlcyhcIkNhbWVyYVwiKSkgbm9kZVR5cGUgPSBcIjNEXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkLCBub2RlVHlwZSwgY29tcG9uZW50czogY29tcFR5cGVzIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogU2NlbmUgZWRpdGluZyB0b29scyB0aGF0IG11c3Qgbm90IHJ1biBkdXJpbmcgcHJldmlldyAqL1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgU0NFTkVfRURJVF9UT09MUyA9IG5ldyBTZXQoW1xyXG4gICAgICAgIFwibm9kZV9jcmVhdGVcIiwgXCJub2RlX2RlbGV0ZVwiLCBcIm5vZGVfbW92ZVwiLCBcIm5vZGVfZHVwbGljYXRlXCIsXHJcbiAgICAgICAgXCJub2RlX3NldF9wcm9wZXJ0eVwiLCBcIm5vZGVfc2V0X3RyYW5zZm9ybVwiLCBcIm5vZGVfc2V0X2FjdGl2ZVwiLCBcIm5vZGVfc2V0X2xheWVyXCIsXHJcbiAgICAgICAgXCJub2RlX2NyZWF0ZV90cmVlXCIsXHJcbiAgICBdKTtcclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJlamVjdElmUHJldmlld1J1bm5pbmcodG9vbE5hbWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdCB8IG51bGw+IHtcclxuICAgICAgICBpZiAoIU5vZGVUb29scy5TQ0VORV9FRElUX1RPT0xTLmhhcyh0b29sTmFtZSkpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInByZXZpZXdcIiwgXCJxdWVyeS1pbmZvXCIpO1xyXG4gICAgICAgICAgICBpZiAoc3RhdGUgJiYgKHN0YXRlIGFzIGFueSkucnVubmluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgXCIke3Rvb2xOYW1lfVwiIOOBr+ODl+ODrOODk+ODpeODvOS4reOBq+Wun+ihjOOBp+OBjeOBvuOBm+OCk+OAguWFiOOBq+ODl+ODrOODk+ODpeODvOOCkuWBnOatouOBl+OBpuOBj+OBoOOBleOBhOOAgmApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCB7IC8qIHF1ZXJ5IGZhaWxlZCDigJQgYWxsb3cgZXhlY3V0aW9uICovIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZU5vZGUobmFtZTogc3RyaW5nLCBwYXJlbnQ/OiBzdHJpbmcsIGNvbXBvbmVudHM/OiBzdHJpbmdbXSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBFZGl0b3IgQVBJIHRvIGNyZWF0ZSBub2RlXHJcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJjcmVhdGUtbm9kZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gV2FpdCB1bnRpbCB0aGUgbm9kZSBpcyBxdWVyeWFibGUgaW4gdGhlIHNjZW5lIHByb2Nlc3NcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yTm9kZSh1dWlkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBjb21wb25lbnRzIGlmIHNwZWNpZmllZFxyXG4gICAgICAgICAgICBpZiAoY29tcG9uZW50cyAmJiBjb21wb25lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY29tcCBvZiBjb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImFkZENvbXBvbmVudFRvTm9kZVwiLCBbdXVpZCwgY29tcF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkLCBuYW1lIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFdhaXQgdW50aWwgYSBub2RlIGJlY29tZXMgcXVlcnlhYmxlIGluIHRoZSBzY2VuZSBwcm9jZXNzLlxyXG4gICAgICogRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiY3JlYXRlLW5vZGVcIikgcmV0dXJucyBiZWZvcmUgdGhlIG5vZGVcclxuICAgICAqIGlzIGZ1bGx5IHJlZ2lzdGVyZWQgaW4gdGhlIHNjZW5lIGhpZXJhcmNoeSwgc28gc3Vic2VxdWVudCBzY2VuZSBzY3JpcHRcclxuICAgICAqIGNhbGxzIChmaW5kTm9kZSkgbWF5IGZhaWwgd2l0aG91dCB0aGlzIHdhaXQuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgd2FpdEZvck5vZGUodXVpZDogc3RyaW5nLCBtYXhSZXRyaWVzID0gMTAsIGludGVydmFsTXMgPSAxMDApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heFJldHJpZXM7IGkrKykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Py5zdWNjZXNzKSByZXR1cm47XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBub3QgcmVhZHkgeWV0ICovIH1cclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGludGVydmFsTXMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRG9uJ3QgdGhyb3cg4oCUIGxldCB0aGUgY2FsbGVyIHByb2NlZWQgYW5kIGdldCBhIG1vcmUgc3BlY2lmaWMgZXJyb3IgaWYgbmVlZGVkXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVOb2RlVHJlZShwYXJlbnRVdWlkOiBzdHJpbmcsIHNwZWM6IGFueSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJidWlsZE5vZGVUcmVlXCIsIFtwYXJlbnRVdWlkLCBzcGVjXSk7XHJcbiAgICAgICAgICAgIGlmICghcmVzdWx0Py5zdWNjZXNzKSByZXR1cm4gZXJyKHJlc3VsdD8uZXJyb3IgfHwgXCJidWlsZE5vZGVUcmVlIGZhaWxlZFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Tm9kZUluZm8odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGZpbmRCeU5hbWUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImZpbmROb2Rlc0J5TmFtZVwiLCBbbmFtZV0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzZXRQcm9wZXJ0eSh1dWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBwcm9wZXJ0eSwgdmFsdWVdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2V0VHJhbnNmb3JtKHV1aWQ6IHN0cmluZywgcG9zaXRpb24/OiBhbnksIHJvdGF0aW9uPzogYW55LCBzY2FsZT86IGFueSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIGlmIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwicG9zaXRpb25cIiwgcG9zaXRpb25dKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJvdGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJyb3RhdGlvblwiLCByb3RhdGlvbl0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc2NhbGUpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInNjYWxlXCIsIHNjYWxlXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGFueUZhaWxlZCA9IHJlc3VsdHMuZmluZCgocikgPT4gIXIuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIGlmIChhbnlGYWlsZWQpIHJldHVybiBvayhhbnlGYWlsZWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGRlbGV0ZU5vZGUodXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwicmVtb3ZlLW5vZGVcIiwgeyB1dWlkIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIG1vdmVOb2RlKHV1aWQ6IHN0cmluZywgcGFyZW50VXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2V0LXByb3BlcnR5XCIsIHtcclxuICAgICAgICAgICAgICAgIHV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBcInBhcmVudFwiLFxyXG4gICAgICAgICAgICAgICAgZHVtcDogeyB0eXBlOiBcImNjLk5vZGVcIiwgdmFsdWU6IHsgdXVpZDogcGFyZW50VXVpZCB9IH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkLCBwYXJlbnRVdWlkIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAvLyBGYWxsYmFjazogdHJ5IHNjZW5lIHNjcmlwdFxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcIm1vdmVOb2RlXCIsIFt1dWlkLCBwYXJlbnRVdWlkXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZTI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGR1cGxpY2F0ZU5vZGUodXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZHVwbGljYXRlLW5vZGVcIiwgdXVpZCk7XHJcbiAgICAgICAgICAgIC8vIGR1cGxpY2F0ZS1ub2RlIHJldHVybnMgYW4gYXJyYXkgb2YgVVVJRHNcclxuICAgICAgICAgICAgY29uc3QgbmV3VXVpZCA9IEFycmF5LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdFswXSA6IHJlc3VsdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgc291cmNlVXVpZDogdXVpZCwgbmV3VXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBbGxOb2RlcygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0QWxsTm9kZXNcIiwgW10pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIENhbGwgYSBzY2VuZSBzY3JpcHQgbWV0aG9kICovXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=