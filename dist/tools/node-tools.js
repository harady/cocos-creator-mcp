"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTools = void 0;
const tool_base_1 = require("../tool-base");
const utils_1 = require("../utils");
const node_resolve_1 = require("../node-resolve");
const screenshot_1 = require("../screenshot");
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
            {
                name: "node_set_layout",
                description: "Set UITransform (contentSize, anchorPoint) and Widget (margins) on a node in one call. Much faster than calling component_set_property multiple times for layout adjustments. Set screenshot=true to capture the editor after changes.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID (either uuid or nodeName required)" },
                        nodeName: { type: "string", description: "Node name to find (alternative to uuid)" },
                        contentSize: {
                            type: "object",
                            properties: { width: { type: "number" }, height: { type: "number" } },
                            description: "UITransform contentSize {width, height}",
                        },
                        anchorPoint: {
                            type: "object",
                            properties: { x: { type: "number" }, y: { type: "number" } },
                            description: "UITransform anchorPoint {x, y} (0-1)",
                        },
                        widget: {
                            type: "object",
                            properties: {
                                top: { type: "number" }, bottom: { type: "number" },
                                left: { type: "number" }, right: { type: "number" },
                                horizontalCenter: { type: "number" }, verticalCenter: { type: "number" },
                                isAlignTop: { type: "boolean" }, isAlignBottom: { type: "boolean" },
                                isAlignLeft: { type: "boolean" }, isAlignRight: { type: "boolean" },
                                isAlignHorizontalCenter: { type: "boolean" }, isAlignVerticalCenter: { type: "boolean" },
                            },
                            description: "Widget alignment margins. Setting a value (e.g. top:0) automatically enables the corresponding alignment (isAlignTop:true).",
                        },
                        color: {
                            type: "object",
                            properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" }, a: { type: "number" } },
                            description: "Node color {r,g,b,a} (0-255)",
                        },
                        opacity: { type: "number", description: "Node opacity (0-255)" },
                        screenshot: { type: "boolean", description: "If true, capture editor screenshot after changes (default: false)" },
                    },
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
            case "node_set_layout":
                return this.setLayout(args);
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
    /**
     * UITransform + Widget + color/opacity をまとめて設定する。
     * Widget の値を指定すると、対応する isAlign* フラグを自動で true にする。
     */
    async setLayout(args) {
        var _a, _b, _c, _d, _e;
        try {
            // nodeName → uuid 解決
            let uuid = args.uuid;
            if (!uuid && args.nodeName) {
                const resolved = await (0, node_resolve_1.resolveNodeUuid)({ nodeName: args.nodeName });
                uuid = resolved.uuid;
            }
            if (!uuid)
                return (0, tool_base_1.err)("Either 'uuid' or 'nodeName' is required");
            const results = [];
            // UITransform の設定
            const contentSize = (0, utils_1.parseMaybeJson)(args.contentSize);
            const anchorPoint = (0, utils_1.parseMaybeJson)(args.anchorPoint);
            if (contentSize || anchorPoint) {
                const nodeInfo = await this.sceneScript("getNodeInfo", [uuid]);
                if (!(nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.success))
                    return (0, tool_base_1.err)(`Node ${uuid} not found`);
                const comps = ((_a = nodeInfo.data) === null || _a === void 0 ? void 0 : _a.components) || [];
                const utIdx = comps.findIndex((c) => c.type === "UITransform");
                if (utIdx < 0)
                    return (0, tool_base_1.err)("Node has no UITransform component");
                if (contentSize) {
                    const path = `__comps__.${utIdx}.contentSize`;
                    const dump = { value: { width: { value: contentSize.width }, height: { value: contentSize.height } } };
                    const r = await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
                    results.push({ property: "contentSize", success: (r === null || r === void 0 ? void 0 : r.success) !== false });
                }
                if (anchorPoint) {
                    const path = `__comps__.${utIdx}.anchorPoint`;
                    const dump = { value: { x: { value: anchorPoint.x }, y: { value: anchorPoint.y } } };
                    const r = await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
                    results.push({ property: "anchorPoint", success: (r === null || r === void 0 ? void 0 : r.success) !== false });
                }
            }
            // Widget の設定
            const widget = (0, utils_1.parseMaybeJson)(args.widget);
            if (widget) {
                // Widget コンポーネントを探す（なければ追加）
                let nodeInfo = await this.sceneScript("getNodeInfo", [uuid]);
                if (!(nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.success))
                    return (0, tool_base_1.err)(`Node ${uuid} not found`);
                let comps = ((_b = nodeInfo.data) === null || _b === void 0 ? void 0 : _b.components) || [];
                let wIdx = comps.findIndex((c) => c.type === "Widget");
                if (wIdx < 0) {
                    await this.sceneScript("addComponentToNode", [uuid, "cc.Widget"]);
                    // 再取得
                    nodeInfo = await this.sceneScript("getNodeInfo", [uuid]);
                    comps = ((_c = nodeInfo.data) === null || _c === void 0 ? void 0 : _c.components) || [];
                    wIdx = comps.findIndex((c) => c.type === "Widget");
                    if (wIdx < 0)
                        return (0, tool_base_1.err)("Failed to add Widget component");
                    results.push({ property: "Widget", action: "added" });
                }
                // isAlign* を自動設定（値があれば true にする）
                const alignMap = {
                    top: "isAlignTop", bottom: "isAlignBottom",
                    left: "isAlignLeft", right: "isAlignRight",
                    horizontalCenter: "isAlignHorizontalCenter",
                    verticalCenter: "isAlignVerticalCenter",
                };
                for (const [key, value] of Object.entries(widget)) {
                    // isAlign* を明示指定した場合はそのまま設定
                    const path = `__comps__.${wIdx}.${key}`;
                    if (typeof value === "boolean") {
                        const dump = { value, type: "Boolean" };
                        await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
                        results.push({ property: `Widget.${key}`, success: true });
                    }
                    else if (typeof value === "number") {
                        // まず対応する isAlign* を true にする
                        const alignKey = alignMap[key];
                        if (alignKey && widget[alignKey] === undefined) {
                            const alignPath = `__comps__.${wIdx}.${alignKey}`;
                            await this.sceneScript("setPropertyViaEditor", [uuid, alignPath, { value: true, type: "Boolean" }]);
                        }
                        const dump = { value, type: "Number" };
                        await this.sceneScript("setPropertyViaEditor", [uuid, path, dump]);
                        results.push({ property: `Widget.${key}`, success: true });
                    }
                }
            }
            // color
            const color = (0, utils_1.parseMaybeJson)(args.color);
            if (color) {
                const r = await this.sceneScript("setNodeProperty", [uuid, "color", color]);
                results.push({ property: "color", success: (r === null || r === void 0 ? void 0 : r.success) !== false });
            }
            // opacity
            if (args.opacity !== undefined) {
                // cc.UIOpacity を使う（なければ color.a で設定）
                const nodeInfo = await this.sceneScript("getNodeInfo", [uuid]);
                const comps = ((_d = nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.data) === null || _d === void 0 ? void 0 : _d.components) || [];
                const opIdx = comps.findIndex((c) => c.type === "UIOpacity");
                if (opIdx >= 0) {
                    const path = `__comps__.${opIdx}.opacity`;
                    await this.sceneScript("setPropertyViaEditor", [uuid, path, { value: args.opacity, type: "Number" }]);
                    results.push({ property: "UIOpacity.opacity", success: true });
                }
                else {
                    // UIOpacity がない場合は color.a を直接設定
                    const currentColor = ((_e = nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.data) === null || _e === void 0 ? void 0 : _e.color) || { r: 255, g: 255, b: 255, a: 255 };
                    currentColor.a = args.opacity;
                    const r = await this.sceneScript("setNodeProperty", [uuid, "color", currentColor]);
                    results.push({ property: "color.a", success: (r === null || r === void 0 ? void 0 : r.success) !== false });
                }
            }
            const allOk = results.every(r => r.success !== false);
            let response = { success: allOk, uuid, results };
            // screenshot
            if (args.screenshot) {
                try {
                    const ss = await (0, screenshot_1.takeEditorScreenshot)();
                    response.screenshot = { path: ss.path, size: ss.savedSize };
                }
                catch (ssErr) {
                    response.screenshotError = ssErr.message || String(ssErr);
                }
            }
            return (0, tool_base_1.ok)(response);
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
    "node_create_tree", "node_set_layout",
]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9ub2RlLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRDQUF1QztBQUN2QyxvQ0FBMEM7QUFDMUMsa0RBQWtEO0FBQ2xELDhDQUFxRDtBQUVyRCxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQztBQUVyQyxNQUFhLFNBQVM7SUFBdEI7UUFDYSxpQkFBWSxHQUFHLE1BQU0sQ0FBQztJQXVqQm5DLENBQUM7SUFyakJHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLFdBQVcsRUFBRSxpQ0FBaUM7Z0JBQzlDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFO3dCQUNsRCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxxREFBcUQsRUFBRTt3QkFDOUYsVUFBVSxFQUFFOzRCQUNSLElBQUksRUFBRSxPQUFPOzRCQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7NEJBQ3pCLFdBQVcsRUFBRSwrREFBK0Q7eUJBQy9FO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztpQkFDckI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxlQUFlO2dCQUNyQixXQUFXLEVBQUUsc0VBQXNFO2dCQUNuRixXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRTtxQkFDckQ7b0JBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDO2lCQUNyQjthQUNKO1lBQ0Q7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QyxRQUFRLENBQUMsVUFBVSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEUsQ0FBQztnQkFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO29CQUNsQixRQUFRLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5RCxDQUFDO1lBQ0wsQ0FBQztZQUVELE9BQU8sSUFBQSxjQUFFLEVBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFRCxpQ0FBaUM7SUFDekIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsSUFBVztRQUNqRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEVBQUUsUUFBUTtZQUNkLE1BQU07WUFDTixJQUFJO1NBQ1AsQ0FBQyxDQUFDO0lBQ1AsQ0FBQzs7QUF2akJMLDhCQXdqQkM7QUFqVEcsMkRBQTJEO0FBQ25DLDBCQUFnQixHQUFHLElBQUksR0FBRyxDQUFDO0lBQy9DLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGdCQUFnQjtJQUMzRCxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0I7SUFDOUUsa0JBQWtCLEVBQUUsaUJBQWlCO0NBQ3hDLENBQUMsQUFKc0MsQ0FJckMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBUb29sUmVzdWx0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XHJcbmltcG9ydCB7IG9rLCBlcnIgfSBmcm9tIFwiLi4vdG9vbC1iYXNlXCI7XHJcbmltcG9ydCB7IHBhcnNlTWF5YmVKc29uIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IHJlc29sdmVOb2RlVXVpZCB9IGZyb20gXCIuLi9ub2RlLXJlc29sdmVcIjtcclxuaW1wb3J0IHsgdGFrZUVkaXRvclNjcmVlbnNob3QgfSBmcm9tIFwiLi4vc2NyZWVuc2hvdFwiO1xyXG5cclxuY29uc3QgRVhUX05BTUUgPSBcImNvY29zLWNyZWF0b3ItbWNwXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTm9kZVRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwibm9kZVwiO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9jcmVhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIG5ldyBub2RlIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlBhcmVudCBub2RlIFVVSUQgKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBzY2VuZSByb290KVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNvbXBvbmVudCBjbGFzcyBuYW1lcyB0byBhZGQgKGUuZy4gWydjYy5MYWJlbCcsICdjYy5TcHJpdGUnXSlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJuYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgYSBub2RlIGJ5IFVVSUQsIGluY2x1ZGluZyBjb21wb25lbnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfZmluZF9ieV9uYW1lXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJGaW5kIGFsbCBub2RlcyBtYXRjaGluZyBhIGdpdmVuIG5hbWUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgbmFtZSB0byBzZWFyY2hcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcIm5hbWVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfc2V0X3Byb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgYSBwcm9wZXJ0eSBvbiBhIG5vZGUgKG5hbWUsIGFjdGl2ZSwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSwgZXRjLikuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3BlcnR5IG5hbWUgKGUuZy4gJ25hbWUnLCAnYWN0aXZlJywgJ3Bvc2l0aW9uJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogeyBkZXNjcmlwdGlvbjogXCJWYWx1ZSB0byBzZXQuIEZvciBwb3NpdGlvbi9yb3RhdGlvbi9zY2FsZSB1c2Uge3gseSx6fS5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJwcm9wZXJ0eVwiLCBcInZhbHVlXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX3NldF90cmFuc2Zvcm1cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCBwb3NpdGlvbiwgcm90YXRpb24sIGFuZC9vciBzY2FsZSBvZiBhIG5vZGUgYXQgb25jZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHg6IHsgdHlwZTogXCJudW1iZXJcIiB9LCB5OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgejogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlBvc2l0aW9uIHt4LHksen1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHg6IHsgdHlwZTogXCJudW1iZXJcIiB9LCB5OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgejogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkV1bGVyIHJvdGF0aW9uIHt4LHksen1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHg6IHsgdHlwZTogXCJudW1iZXJcIiB9LCB5OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgejogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNjYWxlIHt4LHksen1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2RlbGV0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRGVsZXRlIGEgbm9kZSBieSBVVUlELlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfbW92ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTW92ZSBhIG5vZGUgdG8gYSBuZXcgcGFyZW50LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5ldyBwYXJlbnQgbm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicGFyZW50VXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9kdXBsaWNhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkR1cGxpY2F0ZSBhIG5vZGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRCB0byBkdXBsaWNhdGVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfZ2V0X2FsbFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGEgZmxhdCBsaXN0IG9mIGFsbCBub2RlcyBpbiB0aGUgY3VycmVudCBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9zZXRfYWN0aXZlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgYSBub2RlJ3MgYWN0aXZlICh2aXNpYmxlKSBzdGF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJXaGV0aGVyIHRoZSBub2RlIGlzIGFjdGl2ZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcImFjdGl2ZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9zZXRfbGF5ZXJcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCBhIG5vZGUncyBsYXllci5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTGF5ZXIgdmFsdWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJsYXllclwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9kZXRlY3RfdHlwZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRGV0ZWN0IG5vZGUgdHlwZSAoMkQsIDNELCBvciByZWd1bGFyIE5vZGUpIGJhc2VkIG9uIGl0cyBjb21wb25lbnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfY3JlYXRlX3RyZWVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIGZ1bGwgbm9kZSB0cmVlIGZyb20gYSBKU09OIHNwZWMgaW4gb25lIGNhbGwuIE11Y2ggZmFzdGVyIHRoYW4gY3JlYXRpbmcgbm9kZXMgb25lIGJ5IG9uZS4gU3BlYyBmb3JtYXQ6IHsgbmFtZSwgY29tcG9uZW50cz86IFsnY2MuVUlUcmFuc2Zvcm0nXSwgcHJvcGVydGllcz86IHsnY2MuVUlUcmFuc2Zvcm0uY29udGVudFNpemUnOiB7d2lkdGg6NzIwLGhlaWdodDoxMjgwfX0sIHdpZGdldD86IHt0b3A6MCwgYm90dG9tOjAsIGxlZnQ6MCwgcmlnaHQ6MH0sIGFjdGl2ZT86IGJvb2wsIHBvc2l0aW9uPzoge3gseSx6fSwgY2hpbGRyZW4/OiBbLi4uXSB9XCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUGFyZW50IG5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWM6IHsgZGVzY3JpcHRpb246IFwiTm9kZSB0cmVlIHNwZWNpZmljYXRpb24gKEpTT04gb2JqZWN0IHdpdGggbmFtZSwgY29tcG9uZW50cywgcHJvcGVydGllcywgY2hpbGRyZW4pXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXJlbnRcIiwgXCJzcGVjXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX3NldF9sYXlvdXRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCBVSVRyYW5zZm9ybSAoY29udGVudFNpemUsIGFuY2hvclBvaW50KSBhbmQgV2lkZ2V0IChtYXJnaW5zKSBvbiBhIG5vZGUgaW4gb25lIGNhbGwuIE11Y2ggZmFzdGVyIHRoYW4gY2FsbGluZyBjb21wb25lbnRfc2V0X3Byb3BlcnR5IG11bHRpcGxlIHRpbWVzIGZvciBsYXlvdXQgYWRqdXN0bWVudHMuIFNldCBzY3JlZW5zaG90PXRydWUgdG8gY2FwdHVyZSB0aGUgZWRpdG9yIGFmdGVyIGNoYW5nZXMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRCAoZWl0aGVyIHV1aWQgb3Igbm9kZU5hbWUgcmVxdWlyZWQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBuYW1lIHRvIGZpbmQgKGFsdGVybmF0aXZlIHRvIHV1aWQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFNpemU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHdpZHRoOiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgaGVpZ2h0OiB7IHR5cGU6IFwibnVtYmVyXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVUlUcmFuc2Zvcm0gY29udGVudFNpemUge3dpZHRoLCBoZWlnaHR9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuY2hvclBvaW50OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB4OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgeTogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlVJVHJhbnNmb3JtIGFuY2hvclBvaW50IHt4LCB5fSAoMC0xKVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWRnZXQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgYm90dG9tOiB7IHR5cGU6IFwibnVtYmVyXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgcmlnaHQ6IHsgdHlwZTogXCJudW1iZXJcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvcml6b250YWxDZW50ZXI6IHsgdHlwZTogXCJudW1iZXJcIiB9LCB2ZXJ0aWNhbENlbnRlcjogeyB0eXBlOiBcIm51bWJlclwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBbGlnblRvcDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LCBpc0FsaWduQm90dG9tOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBbGlnbkxlZnQ6IHsgdHlwZTogXCJib29sZWFuXCIgfSwgaXNBbGlnblJpZ2h0OiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBbGlnbkhvcml6b250YWxDZW50ZXI6IHsgdHlwZTogXCJib29sZWFuXCIgfSwgaXNBbGlnblZlcnRpY2FsQ2VudGVyOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiV2lkZ2V0IGFsaWdubWVudCBtYXJnaW5zLiBTZXR0aW5nIGEgdmFsdWUgKGUuZy4gdG9wOjApIGF1dG9tYXRpY2FsbHkgZW5hYmxlcyB0aGUgY29ycmVzcG9uZGluZyBhbGlnbm1lbnQgKGlzQWxpZ25Ub3A6dHJ1ZSkuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyByOiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgZzogeyB0eXBlOiBcIm51bWJlclwiIH0sIGI6IHsgdHlwZTogXCJudW1iZXJcIiB9LCBhOiB7IHR5cGU6IFwibnVtYmVyXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTm9kZSBjb2xvciB7cixnLGIsYX0gKDAtMjU1KVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgb3BhY2l0eSAoMC0yNTUpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyZWVuc2hvdDogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiSWYgdHJ1ZSwgY2FwdHVyZSBlZGl0b3Igc2NyZWVuc2hvdCBhZnRlciBjaGFuZ2VzIChkZWZhdWx0OiBmYWxzZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgY29uc3QgcmVqZWN0ZWQgPSBhd2FpdCB0aGlzLnJlamVjdElmUHJldmlld1J1bm5pbmcodG9vbE5hbWUpO1xyXG4gICAgICAgIGlmIChyZWplY3RlZCkgcmV0dXJuIHJlamVjdGVkO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX2NyZWF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTm9kZShhcmdzLm5hbWUsIGFyZ3MucGFyZW50LCBhcmdzLmNvbXBvbmVudHMpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9nZXRfaW5mb1wiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZUluZm8oYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZmluZF9ieV9uYW1lXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5maW5kQnlOYW1lKGFyZ3MubmFtZSk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX3NldF9wcm9wZXJ0eVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoYXJncy51dWlkLCBhcmdzLnByb3BlcnR5LCBwYXJzZU1heWJlSnNvbihhcmdzLnZhbHVlKSk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX3NldF90cmFuc2Zvcm1cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFRyYW5zZm9ybShhcmdzLnV1aWQsIGFyZ3MucG9zaXRpb24sIGFyZ3Mucm90YXRpb24sIGFyZ3Muc2NhbGUpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9kZWxldGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRlbGV0ZU5vZGUoYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfbW92ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubW92ZU5vZGUoYXJncy51dWlkLCBhcmdzLnBhcmVudFV1aWQpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9kdXBsaWNhdGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmR1cGxpY2F0ZU5vZGUoYXJncy51dWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZ2V0X2FsbFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QWxsTm9kZXMoKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfc2V0X2FjdGl2ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoYXJncy51dWlkLCBcImFjdGl2ZVwiLCBhcmdzLmFjdGl2ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX3NldF9sYXllclwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoYXJncy51dWlkLCBcImxheWVyXCIsIGFyZ3MubGF5ZXIpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9jcmVhdGVfdHJlZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlTm9kZVRyZWUoYXJncy5wYXJlbnQsIHBhcnNlTWF5YmVKc29uKGFyZ3Muc3BlYykpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfbGF5b3V0XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRMYXlvdXQoYXJncyk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX2RldGVjdF90eXBlXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbYXJncy51dWlkXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbmZvLnN1Y2Nlc3MpIHJldHVybiBvayhpbmZvKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wcyA9IGluZm8uZGF0YT8uY29tcG9uZW50cyB8fCBbXTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wVHlwZXMgPSBjb21wcy5tYXAoKGM6IGFueSkgPT4gYy50eXBlKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbm9kZVR5cGUgPSBcIk5vZGVcIjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcFR5cGVzLmluY2x1ZGVzKFwiVUlUcmFuc2Zvcm1cIikpIG5vZGVUeXBlID0gXCIyRFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbXBUeXBlcy5pbmNsdWRlcyhcIk1lc2hSZW5kZXJlclwiKSB8fCBjb21wVHlwZXMuaW5jbHVkZXMoXCJDYW1lcmFcIikpIG5vZGVUeXBlID0gXCIzRFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCwgbm9kZVR5cGUsIGNvbXBvbmVudHM6IGNvbXBUeXBlcyB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFNjZW5lIGVkaXRpbmcgdG9vbHMgdGhhdCBtdXN0IG5vdCBydW4gZHVyaW5nIHByZXZpZXcgKi9cclxuICAgIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IFNDRU5FX0VESVRfVE9PTFMgPSBuZXcgU2V0KFtcclxuICAgICAgICBcIm5vZGVfY3JlYXRlXCIsIFwibm9kZV9kZWxldGVcIiwgXCJub2RlX21vdmVcIiwgXCJub2RlX2R1cGxpY2F0ZVwiLFxyXG4gICAgICAgIFwibm9kZV9zZXRfcHJvcGVydHlcIiwgXCJub2RlX3NldF90cmFuc2Zvcm1cIiwgXCJub2RlX3NldF9hY3RpdmVcIiwgXCJub2RlX3NldF9sYXllclwiLFxyXG4gICAgICAgIFwibm9kZV9jcmVhdGVfdHJlZVwiLCBcIm5vZGVfc2V0X2xheW91dFwiLFxyXG4gICAgXSk7XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZWplY3RJZlByZXZpZXdSdW5uaW5nKHRvb2xOYW1lOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQgfCBudWxsPiB7XHJcbiAgICAgICAgaWYgKCFOb2RlVG9vbHMuU0NFTkVfRURJVF9UT09MUy5oYXModG9vbE5hbWUpKSByZXR1cm4gbnVsbDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0ZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJwcmV2aWV3XCIsIFwicXVlcnktaW5mb1wiKTtcclxuICAgICAgICAgICAgaWYgKHN0YXRlICYmIChzdGF0ZSBhcyBhbnkpLnJ1bm5pbmcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFwiJHt0b29sTmFtZX1cIiDjga/jg5fjg6zjg5Pjg6Xjg7zkuK3jgavlrp/ooYzjgafjgY3jgb7jgZvjgpPjgILlhYjjgavjg5fjg6zjg5Pjg6Xjg7zjgpLlgZzmraLjgZfjgabjgY/jgaDjgZXjgYTjgIJgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggeyAvKiBxdWVyeSBmYWlsZWQg4oCUIGFsbG93IGV4ZWN1dGlvbiAqLyB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVOb2RlKG5hbWU6IHN0cmluZywgcGFyZW50Pzogc3RyaW5nLCBjb21wb25lbnRzPzogc3RyaW5nW10pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBVc2UgRWRpdG9yIEFQSSB0byBjcmVhdGUgbm9kZVxyXG4gICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiY3JlYXRlLW5vZGVcIiwge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50OiBwYXJlbnQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFdhaXQgdW50aWwgdGhlIG5vZGUgaXMgcXVlcnlhYmxlIGluIHRoZSBzY2VuZSBwcm9jZXNzXHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMud2FpdEZvck5vZGUodXVpZCk7XHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgY29tcG9uZW50cyBpZiBzcGVjaWZpZWRcclxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudHMgJiYgY29tcG9uZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXAgb2YgY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJhZGRDb21wb25lbnRUb05vZGVcIiwgW3V1aWQsIGNvbXBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCwgbmFtZSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXYWl0IHVudGlsIGEgbm9kZSBiZWNvbWVzIHF1ZXJ5YWJsZSBpbiB0aGUgc2NlbmUgcHJvY2Vzcy5cclxuICAgICAqIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImNyZWF0ZS1ub2RlXCIpIHJldHVybnMgYmVmb3JlIHRoZSBub2RlXHJcbiAgICAgKiBpcyBmdWxseSByZWdpc3RlcmVkIGluIHRoZSBzY2VuZSBoaWVyYXJjaHksIHNvIHN1YnNlcXVlbnQgc2NlbmUgc2NyaXB0XHJcbiAgICAgKiBjYWxscyAoZmluZE5vZGUpIG1heSBmYWlsIHdpdGhvdXQgdGhpcyB3YWl0LlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIHdhaXRGb3JOb2RlKHV1aWQ6IHN0cmluZywgbWF4UmV0cmllcyA9IDEwLCBpbnRlcnZhbE1zID0gMTAwKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhSZXRyaWVzOyBpKyspIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbdXVpZF0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdD8uc3VjY2VzcykgcmV0dXJuO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogbm90IHJlYWR5IHlldCAqLyB9XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBpbnRlcnZhbE1zKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIERvbid0IHRocm93IOKAlCBsZXQgdGhlIGNhbGxlciBwcm9jZWVkIGFuZCBnZXQgYSBtb3JlIHNwZWNpZmljIGVycm9yIGlmIG5lZWRlZFxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTm9kZVRyZWUocGFyZW50VXVpZDogc3RyaW5nLCBzcGVjOiBhbnkpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiYnVpbGROb2RlVHJlZVwiLCBbcGFyZW50VXVpZCwgc3BlY10pO1xyXG4gICAgICAgICAgICBpZiAoIXJlc3VsdD8uc3VjY2VzcykgcmV0dXJuIGVycihyZXN1bHQ/LmVycm9yIHx8IFwiYnVpbGROb2RlVHJlZSBmYWlsZWRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldE5vZGVJbmZvKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbdXVpZF0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBmaW5kQnlOYW1lKG5hbWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJmaW5kTm9kZXNCeU5hbWVcIiwgW25hbWVdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2V0UHJvcGVydHkodXVpZDogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgcHJvcGVydHksIHZhbHVlXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcsIHBvc2l0aW9uPzogYW55LCByb3RhdGlvbj86IGFueSwgc2NhbGU/OiBhbnkpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICBpZiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInBvc2l0aW9uXCIsIHBvc2l0aW9uXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyb3RhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwicm90YXRpb25cIiwgcm90YXRpb25dKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHNjYWxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJzY2FsZVwiLCBzY2FsZV0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBhbnlGYWlsZWQgPSByZXN1bHRzLmZpbmQoKHIpID0+ICFyLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICBpZiAoYW55RmFpbGVkKSByZXR1cm4gb2soYW55RmFpbGVkKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBkZWxldGVOb2RlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcInJlbW92ZS1ub2RlXCIsIHsgdXVpZCB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBtb3ZlTm9kZSh1dWlkOiBzdHJpbmcsIHBhcmVudFV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNldC1wcm9wZXJ0eVwiLCB7XHJcbiAgICAgICAgICAgICAgICB1dWlkLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogXCJwYXJlbnRcIixcclxuICAgICAgICAgICAgICAgIGR1bXA6IHsgdHlwZTogXCJjYy5Ob2RlXCIsIHZhbHVlOiB7IHV1aWQ6IHBhcmVudFV1aWQgfSB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCwgcGFyZW50VXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHRyeSBzY2VuZSBzY3JpcHRcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJtb3ZlTm9kZVwiLCBbdXVpZCwgcGFyZW50VXVpZF0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBkdXBsaWNhdGVOb2RlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImR1cGxpY2F0ZS1ub2RlXCIsIHV1aWQpO1xyXG4gICAgICAgICAgICAvLyBkdXBsaWNhdGUtbm9kZSByZXR1cm5zIGFuIGFycmF5IG9mIFVVSURzXHJcbiAgICAgICAgICAgIGNvbnN0IG5ld1V1aWQgPSBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHRbMF0gOiByZXN1bHQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNvdXJjZVV1aWQ6IHV1aWQsIG5ld1V1aWQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0QWxsTm9kZXMoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldEFsbE5vZGVzXCIsIFtdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVUlUcmFuc2Zvcm0gKyBXaWRnZXQgKyBjb2xvci9vcGFjaXR5IOOCkuOBvuOBqOOCgeOBpuioreWumuOBmeOCi+OAglxyXG4gICAgICogV2lkZ2V0IOOBruWApOOCkuaMh+WumuOBmeOCi+OBqOOAgeWvvuW/nOOBmeOCiyBpc0FsaWduKiDjg5Xjg6njgrDjgpLoh6rli5XjgacgdHJ1ZSDjgavjgZnjgovjgIJcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBzZXRMYXlvdXQoYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIG5vZGVOYW1lIOKGkiB1dWlkIOino+axulxyXG4gICAgICAgICAgICBsZXQgdXVpZCA9IGFyZ3MudXVpZDtcclxuICAgICAgICAgICAgaWYgKCF1dWlkICYmIGFyZ3Mubm9kZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gYXdhaXQgcmVzb2x2ZU5vZGVVdWlkKHsgbm9kZU5hbWU6IGFyZ3Mubm9kZU5hbWUgfSk7XHJcbiAgICAgICAgICAgICAgICB1dWlkID0gcmVzb2x2ZWQudXVpZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXV1aWQpIHJldHVybiBlcnIoXCJFaXRoZXIgJ3V1aWQnIG9yICdub2RlTmFtZScgaXMgcmVxdWlyZWRcIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgLy8gVUlUcmFuc2Zvcm0g44Gu6Kit5a6aXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRTaXplID0gcGFyc2VNYXliZUpzb24oYXJncy5jb250ZW50U2l6ZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFuY2hvclBvaW50ID0gcGFyc2VNYXliZUpzb24oYXJncy5hbmNob3JQb2ludCk7XHJcbiAgICAgICAgICAgIGlmIChjb250ZW50U2l6ZSB8fCBhbmNob3JQb2ludCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MpIHJldHVybiBlcnIoYE5vZGUgJHt1dWlkfSBub3QgZm91bmRgKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBzID0gbm9kZUluZm8uZGF0YT8uY29tcG9uZW50cyB8fCBbXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHV0SWR4ID0gY29tcHMuZmluZEluZGV4KChjOiBhbnkpID0+IGMudHlwZSA9PT0gXCJVSVRyYW5zZm9ybVwiKTtcclxuICAgICAgICAgICAgICAgIGlmICh1dElkeCA8IDApIHJldHVybiBlcnIoXCJOb2RlIGhhcyBubyBVSVRyYW5zZm9ybSBjb21wb25lbnRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRlbnRTaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHt1dElkeH0uY29udGVudFNpemVgO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSB7IHZhbHVlOiB7IHdpZHRoOiB7IHZhbHVlOiBjb250ZW50U2l6ZS53aWR0aCB9LCBoZWlnaHQ6IHsgdmFsdWU6IGNvbnRlbnRTaXplLmhlaWdodCB9IH0gfTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgcHJvcGVydHk6IFwiY29udGVudFNpemVcIiwgc3VjY2Vzczogcj8uc3VjY2VzcyAhPT0gZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYW5jaG9yUG9pbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gYF9fY29tcHNfXy4ke3V0SWR4fS5hbmNob3JQb2ludGA7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IHsgdmFsdWU6IHsgeDogeyB2YWx1ZTogYW5jaG9yUG9pbnQueCB9LCB5OiB7IHZhbHVlOiBhbmNob3JQb2ludC55IH0gfSB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0UHJvcGVydHlWaWFFZGl0b3JcIiwgW3V1aWQsIHBhdGgsIGR1bXBdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogXCJhbmNob3JQb2ludFwiLCBzdWNjZXNzOiByPy5zdWNjZXNzICE9PSBmYWxzZSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gV2lkZ2V0IOOBruioreWumlxyXG4gICAgICAgICAgICBjb25zdCB3aWRnZXQgPSBwYXJzZU1heWJlSnNvbihhcmdzLndpZGdldCk7XHJcbiAgICAgICAgICAgIGlmICh3aWRnZXQpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdpZGdldCDjgrPjg7Pjg53jg7zjg43jg7Pjg4jjgpLmjqLjgZnvvIjjgarjgZHjgozjgbDov73liqDvvIlcclxuICAgICAgICAgICAgICAgIGxldCBub2RlSW5mbyA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbdXVpZF0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlSW5mbz8uc3VjY2VzcykgcmV0dXJuIGVycihgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGApO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbXBzID0gbm9kZUluZm8uZGF0YT8uY29tcG9uZW50cyB8fCBbXTtcclxuICAgICAgICAgICAgICAgIGxldCB3SWR4ID0gY29tcHMuZmluZEluZGV4KChjOiBhbnkpID0+IGMudHlwZSA9PT0gXCJXaWRnZXRcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAod0lkeCA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiYWRkQ29tcG9uZW50VG9Ob2RlXCIsIFt1dWlkLCBcImNjLldpZGdldFwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5YaN5Y+W5b6XXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgICAgICAgICBjb21wcyA9IG5vZGVJbmZvLmRhdGE/LmNvbXBvbmVudHMgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgd0lkeCA9IGNvbXBzLmZpbmRJbmRleCgoYzogYW55KSA9PiBjLnR5cGUgPT09IFwiV2lkZ2V0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3SWR4IDwgMCkgcmV0dXJuIGVycihcIkZhaWxlZCB0byBhZGQgV2lkZ2V0IGNvbXBvbmVudFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogXCJXaWRnZXRcIiwgYWN0aW9uOiBcImFkZGVkXCIgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaXNBbGlnbiog44KS6Ieq5YuV6Kit5a6a77yI5YCk44GM44GC44KM44GwIHRydWUg44Gr44GZ44KL77yJXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhbGlnbk1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IFwiaXNBbGlnblRvcFwiLCBib3R0b206IFwiaXNBbGlnbkJvdHRvbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IFwiaXNBbGlnbkxlZnRcIiwgcmlnaHQ6IFwiaXNBbGlnblJpZ2h0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbENlbnRlcjogXCJpc0FsaWduSG9yaXpvbnRhbENlbnRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsQ2VudGVyOiBcImlzQWxpZ25WZXJ0aWNhbENlbnRlclwiLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh3aWRnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaXNBbGlnbiog44KS5piO56S65oyH5a6a44GX44Gf5aC05ZCI44Gv44Gd44Gu44G+44G+6Kit5a6aXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHt3SWR4fS4ke2tleX1gO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSB7IHZhbHVlLCB0eXBlOiBcIkJvb2xlYW5cIiB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0UHJvcGVydHlWaWFFZGl0b3JcIiwgW3V1aWQsIHBhdGgsIGR1bXBdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgcHJvcGVydHk6IGBXaWRnZXQuJHtrZXl9YCwgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDjgb7jgZrlr77lv5zjgZnjgosgaXNBbGlnbiog44KSIHRydWUg44Gr44GZ44KLXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsaWduS2V5ID0gYWxpZ25NYXBba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFsaWduS2V5ICYmIHdpZGdldFthbGlnbktleV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxpZ25QYXRoID0gYF9fY29tcHNfXy4ke3dJZHh9LiR7YWxpZ25LZXl9YDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXRQcm9wZXJ0eVZpYUVkaXRvclwiLCBbdXVpZCwgYWxpZ25QYXRoLCB7IHZhbHVlOiB0cnVlLCB0eXBlOiBcIkJvb2xlYW5cIiB9XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IHsgdmFsdWUsIHR5cGU6IFwiTnVtYmVyXCIgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHByb3BlcnR5OiBgV2lkZ2V0LiR7a2V5fWAsIHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBjb2xvclxyXG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IHBhcnNlTWF5YmVKc29uKGFyZ3MuY29sb3IpO1xyXG4gICAgICAgICAgICBpZiAoY29sb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcImNvbG9yXCIsIGNvbG9yXSk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogXCJjb2xvclwiLCBzdWNjZXNzOiByPy5zdWNjZXNzICE9PSBmYWxzZSB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gb3BhY2l0eVxyXG4gICAgICAgICAgICBpZiAoYXJncy5vcGFjaXR5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNjLlVJT3BhY2l0eSDjgpLkvb/jgYbvvIjjgarjgZHjgozjgbAgY29sb3IuYSDjgafoqK3lrprvvIlcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wcyA9IG5vZGVJbmZvPy5kYXRhPy5jb21wb25lbnRzIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3BJZHggPSBjb21wcy5maW5kSW5kZXgoKGM6IGFueSkgPT4gYy50eXBlID09PSBcIlVJT3BhY2l0eVwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChvcElkeCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHtvcElkeH0ub3BhY2l0eWA7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCB7IHZhbHVlOiBhcmdzLm9wYWNpdHksIHR5cGU6IFwiTnVtYmVyXCIgfV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHByb3BlcnR5OiBcIlVJT3BhY2l0eS5vcGFjaXR5XCIsIHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVJT3BhY2l0eSDjgYzjgarjgYTloLTlkIjjga8gY29sb3IuYSDjgpLnm7TmjqXoqK3lrppcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Q29sb3IgPSBub2RlSW5mbz8uZGF0YT8uY29sb3IgfHwgeyByOiAyNTUsIGc6IDI1NSwgYjogMjU1LCBhOiAyNTUgfTtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q29sb3IuYSA9IGFyZ3Mub3BhY2l0eTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJjb2xvclwiLCBjdXJyZW50Q29sb3JdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogXCJjb2xvci5hXCIsIHN1Y2Nlc3M6IHI/LnN1Y2Nlc3MgIT09IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBhbGxPayA9IHJlc3VsdHMuZXZlcnkociA9PiByLnN1Y2Nlc3MgIT09IGZhbHNlKTtcclxuICAgICAgICAgICAgbGV0IHJlc3BvbnNlOiBhbnkgPSB7IHN1Y2Nlc3M6IGFsbE9rLCB1dWlkLCByZXN1bHRzIH07XHJcblxyXG4gICAgICAgICAgICAvLyBzY3JlZW5zaG90XHJcbiAgICAgICAgICAgIGlmIChhcmdzLnNjcmVlbnNob3QpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3MgPSBhd2FpdCB0YWtlRWRpdG9yU2NyZWVuc2hvdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLnNjcmVlbnNob3QgPSB7IHBhdGg6IHNzLnBhdGgsIHNpemU6IHNzLnNhdmVkU2l6ZSB9O1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoc3NFcnI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLnNjcmVlbnNob3RFcnJvciA9IHNzRXJyLm1lc3NhZ2UgfHwgU3RyaW5nKHNzRXJyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3BvbnNlKTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIENhbGwgYSBzY2VuZSBzY3JpcHQgbWV0aG9kICovXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=