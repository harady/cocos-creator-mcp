"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTools = void 0;
const tool_base_1 = require("../tool-base");
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
        ];
    }
    async execute(toolName, args) {
        var _a;
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
    async createNode(name, parent, components) {
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
            return (0, tool_base_1.ok)({ success: true, uuid, name });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9ub2RlLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRDQUF1QztBQUV2QyxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQztBQUVyQyxNQUFhLFNBQVM7SUFBdEI7UUFDYSxpQkFBWSxHQUFHLE1BQU0sQ0FBQztJQXdVbkMsQ0FBQztJQXRVRyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxhQUFhO2dCQUNuQixXQUFXLEVBQUUsaUNBQWlDO2dCQUM5QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRTt3QkFDbEQsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUscURBQXFELEVBQUU7d0JBQzlGLFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsT0FBTzs0QkFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFOzRCQUN6QixXQUFXLEVBQUUsK0RBQStEO3lCQUMvRTtxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUM7aUJBQ3JCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsZUFBZTtnQkFDckIsV0FBVyxFQUFFLHNFQUFzRTtnQkFDbkYsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUU7cUJBQ3JEO29CQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztpQkFDckI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLFdBQVcsRUFBRSx1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Q0FBQztJQUNMLENBQUM7SUFFTyxLQUFLLENBQUMsV0FBVztRQUNyQixJQUFJLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELE9BQU8sSUFBQSxjQUFFLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFRCxpQ0FBaUM7SUFDekIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsSUFBVztRQUNqRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEVBQUUsUUFBUTtZQUNkLE1BQU07WUFDTixJQUFJO1NBQ1AsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBelVELDhCQXlVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuXHJcbmNvbnN0IEVYVF9OQU1FID0gXCJjb2Nvcy1jcmVhdG9yLW1jcFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE5vZGVUb29scyBpbXBsZW1lbnRzIFRvb2xDYXRlZ29yeSB7XHJcbiAgICByZWFkb25seSBjYXRlZ29yeU5hbWUgPSBcIm5vZGVcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfY3JlYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDcmVhdGUgYSBuZXcgbm9kZSBpbiB0aGUgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgbmFtZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQYXJlbnQgbm9kZSBVVUlEIChvcHRpb25hbCwgZGVmYXVsdHMgdG8gc2NlbmUgcm9vdClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgY2xhc3MgbmFtZXMgdG8gYWRkIChlLmcuIFsnY2MuTGFiZWwnLCAnY2MuU3ByaXRlJ10pXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibmFtZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9nZXRfaW5mb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGRldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IGEgbm9kZSBieSBVVUlELCBpbmNsdWRpbmcgY29tcG9uZW50cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2ZpbmRfYnlfbmFtZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRmluZCBhbGwgbm9kZXMgbWF0Y2hpbmcgYSBnaXZlbiBuYW1lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIG5hbWUgdG8gc2VhcmNoXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJuYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX3NldF9wcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2V0IGEgcHJvcGVydHkgb24gYSBub2RlIChuYW1lLCBhY3RpdmUsIHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUsIGV0Yy4pLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcm9wZXJ0eSBuYW1lIChlLmcuICduYW1lJywgJ2FjdGl2ZScsICdwb3NpdGlvbicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHsgZGVzY3JpcHRpb246IFwiVmFsdWUgdG8gc2V0LiBGb3IgcG9zaXRpb24vcm90YXRpb24vc2NhbGUgdXNlIHt4LHksen0uXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicHJvcGVydHlcIiwgXCJ2YWx1ZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9zZXRfdHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgcG9zaXRpb24sIHJvdGF0aW9uLCBhbmQvb3Igc2NhbGUgb2YgYSBub2RlIGF0IG9uY2UuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB4OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgeTogeyB0eXBlOiBcIm51bWJlclwiIH0sIHo6IHsgdHlwZTogXCJudW1iZXJcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJQb3NpdGlvbiB7eCx5LHp9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB4OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgeTogeyB0eXBlOiBcIm51bWJlclwiIH0sIHo6IHsgdHlwZTogXCJudW1iZXJcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFdWxlciByb3RhdGlvbiB7eCx5LHp9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB4OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgeTogeyB0eXBlOiBcIm51bWJlclwiIH0sIHo6IHsgdHlwZTogXCJudW1iZXJcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTY2FsZSB7eCx5LHp9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9kZWxldGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkRlbGV0ZSBhIG5vZGUgYnkgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX21vdmVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk1vdmUgYSBub2RlIHRvIGEgbmV3IHBhcmVudC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOZXcgcGFyZW50IG5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhcmVudFV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfZHVwbGljYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJEdXBsaWNhdGUgYSBub2RlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgdG8gZHVwbGljYXRlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2dldF9hbGxcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBhIGZsYXQgbGlzdCBvZiBhbGwgbm9kZXMgaW4gdGhlIGN1cnJlbnQgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfc2V0X2FjdGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2V0IGEgbm9kZSdzIGFjdGl2ZSAodmlzaWJsZSkgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiV2hldGhlciB0aGUgbm9kZSBpcyBhY3RpdmVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJhY3RpdmVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfc2V0X2xheWVyXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgYSBub2RlJ3MgbGF5ZXIuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkxheWVyIHZhbHVlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwibGF5ZXJcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfZGV0ZWN0X3R5cGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkRldGVjdCBub2RlIHR5cGUgKDJELCAzRCwgb3IgcmVndWxhciBOb2RlKSBiYXNlZCBvbiBpdHMgY29tcG9uZW50cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVOb2RlKGFyZ3MubmFtZSwgYXJncy5wYXJlbnQsIGFyZ3MuY29tcG9uZW50cyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX2dldF9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXROb2RlSW5mbyhhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9maW5kX2J5X25hbWVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbmRCeU5hbWUoYXJncy5uYW1lKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfc2V0X3Byb3BlcnR5XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eShhcmdzLnV1aWQsIGFyZ3MucHJvcGVydHksIGFyZ3MudmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfdHJhbnNmb3JtXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRUcmFuc2Zvcm0oYXJncy51dWlkLCBhcmdzLnBvc2l0aW9uLCBhcmdzLnJvdGF0aW9uLCBhcmdzLnNjYWxlKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZGVsZXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kZWxldGVOb2RlKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX21vdmVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1vdmVOb2RlKGFyZ3MudXVpZCwgYXJncy5wYXJlbnRVdWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZHVwbGljYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kdXBsaWNhdGVOb2RlKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX2dldF9hbGxcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEFsbE5vZGVzKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX3NldF9hY3RpdmVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgXCJhY3RpdmVcIiwgYXJncy5hY3RpdmUpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfbGF5ZXJcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgXCJsYXllclwiLCBhcmdzLmxheWVyKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZGV0ZWN0X3R5cGVcIjoge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFthcmdzLnV1aWRdKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8uc3VjY2VzcykgcmV0dXJuIG9rKGluZm8pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBzID0gaW5mby5kYXRhPy5jb21wb25lbnRzIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBUeXBlcyA9IGNvbXBzLm1hcCgoYzogYW55KSA9PiBjLnR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBub2RlVHlwZSA9IFwiTm9kZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wVHlwZXMuaW5jbHVkZXMoXCJVSVRyYW5zZm9ybVwiKSkgbm9kZVR5cGUgPSBcIjJEXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29tcFR5cGVzLmluY2x1ZGVzKFwiTWVzaFJlbmRlcmVyXCIpIHx8IGNvbXBUeXBlcy5pbmNsdWRlcyhcIkNhbWVyYVwiKSkgbm9kZVR5cGUgPSBcIjNEXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZDogYXJncy51dWlkLCBub2RlVHlwZSwgY29tcG9uZW50czogY29tcFR5cGVzIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZU5vZGUobmFtZTogc3RyaW5nLCBwYXJlbnQ/OiBzdHJpbmcsIGNvbXBvbmVudHM/OiBzdHJpbmdbXSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBFZGl0b3IgQVBJIHRvIGNyZWF0ZSBub2RlXHJcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJjcmVhdGUtbm9kZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQWRkIGNvbXBvbmVudHMgaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzICYmIGNvbXBvbmVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wIG9mIGNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiYWRkQ29tcG9uZW50VG9Ob2RlXCIsIFt1dWlkLCBjb21wXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQsIG5hbWUgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Tm9kZUluZm8odXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGZpbmRCeU5hbWUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImZpbmROb2Rlc0J5TmFtZVwiLCBbbmFtZV0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzZXRQcm9wZXJ0eSh1dWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBwcm9wZXJ0eSwgdmFsdWVdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2V0VHJhbnNmb3JtKHV1aWQ6IHN0cmluZywgcG9zaXRpb24/OiBhbnksIHJvdGF0aW9uPzogYW55LCBzY2FsZT86IGFueSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIGlmIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwicG9zaXRpb25cIiwgcG9zaXRpb25dKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJvdGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJyb3RhdGlvblwiLCByb3RhdGlvbl0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc2NhbGUpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInNjYWxlXCIsIHNjYWxlXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGFueUZhaWxlZCA9IHJlc3VsdHMuZmluZCgocikgPT4gIXIuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIGlmIChhbnlGYWlsZWQpIHJldHVybiBvayhhbnlGYWlsZWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGRlbGV0ZU5vZGUodXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwicmVtb3ZlLW5vZGVcIiwgeyB1dWlkIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIG1vdmVOb2RlKHV1aWQ6IHN0cmluZywgcGFyZW50VXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2V0LXByb3BlcnR5XCIsIHtcclxuICAgICAgICAgICAgICAgIHV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBcInBhcmVudFwiLFxyXG4gICAgICAgICAgICAgICAgZHVtcDogeyB0eXBlOiBcImNjLk5vZGVcIiwgdmFsdWU6IHsgdXVpZDogcGFyZW50VXVpZCB9IH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkLCBwYXJlbnRVdWlkIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAvLyBGYWxsYmFjazogdHJ5IHNjZW5lIHNjcmlwdFxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcIm1vdmVOb2RlXCIsIFt1dWlkLCBwYXJlbnRVdWlkXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZTI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGR1cGxpY2F0ZU5vZGUodXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZHVwbGljYXRlLW5vZGVcIiwgdXVpZCk7XHJcbiAgICAgICAgICAgIC8vIGR1cGxpY2F0ZS1ub2RlIHJldHVybnMgYW4gYXJyYXkgb2YgVVVJRHNcclxuICAgICAgICAgICAgY29uc3QgbmV3VXVpZCA9IEFycmF5LmlzQXJyYXkocmVzdWx0KSA/IHJlc3VsdFswXSA6IHJlc3VsdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgc291cmNlVXVpZDogdXVpZCwgbmV3VXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBbGxOb2RlcygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0QWxsTm9kZXNcIiwgW10pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIENhbGwgYSBzY2VuZSBzY3JpcHQgbWV0aG9kICovXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=