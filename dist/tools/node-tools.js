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
                    // Wait until the component is reflected in query-node
                    await this.waitForComponent(uuid, comp);
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
    /**
     * Wait until a component added via addComponentToNode is reflected in query-node.
     * sceneScript returns before the Editor API (query-node) reflects the change,
     * so polling is needed to avoid race conditions in subsequent tool calls.
     */
    async waitForComponent(nodeUuid, componentType, maxRetries = 10, intervalMs = 100) {
        const normalizedType = componentType.startsWith("cc.") ? componentType.substring(3) : componentType;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const nodeDump = await Editor.Message.request("scene", "query-node", nodeUuid);
                const comps = (nodeDump === null || nodeDump === void 0 ? void 0 : nodeDump.__comps__) || [];
                const found = comps.some((c) => c.type === componentType || c.type === `cc.${normalizedType}` || c.type === normalizedType);
                if (found)
                    return;
            }
            catch ( /* not ready yet */_a) { /* not ready yet */ }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        // Don't throw — component may still work; let caller get a specific error if needed
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9ub2RlLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRDQUF1QztBQUN2QyxvQ0FBMEM7QUFDMUMsa0RBQWtEO0FBQ2xELDhDQUFxRDtBQUVyRCxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQztBQUVyQyxNQUFhLFNBQVM7SUFBdEI7UUFDYSxpQkFBWSxHQUFHLE1BQU0sQ0FBQztJQThrQm5DLENBQUM7SUE1a0JHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLFdBQVcsRUFBRSxpQ0FBaUM7Z0JBQzlDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFO3dCQUNsRCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxxREFBcUQsRUFBRTt3QkFDOUYsVUFBVSxFQUFFOzRCQUNSLElBQUksRUFBRSxPQUFPOzRCQUNiLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7NEJBQ3pCLFdBQVcsRUFBRSwrREFBK0Q7eUJBQy9FO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztpQkFDckI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxlQUFlO2dCQUNyQixXQUFXLEVBQUUsc0VBQXNFO2dCQUNuRixXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRTtxQkFDckQ7b0JBQ0QsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDO2lCQUNyQjthQUNKO1lBQ0Q7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RyxNQUFNLElBQUEsaUNBQW9CLEdBQUUsQ0FBQztvQkFDeEMsUUFBUSxDQUFDLFVBQVUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hFLENBQUM7Z0JBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztvQkFDbEIsUUFBUSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUQsQ0FBQztZQUNMLENBQUM7WUFFRCxPQUFPLElBQUEsY0FBRSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxJQUFBLGVBQUcsRUFBQyxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0lBRUQsaUNBQWlDO0lBQ3pCLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYyxFQUFFLElBQVc7UUFDakQsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7WUFDM0QsSUFBSSxFQUFFLFFBQVE7WUFDZCxNQUFNO1lBQ04sSUFBSTtTQUNQLENBQUMsQ0FBQztJQUNQLENBQUM7O0FBOWtCTCw4QkEra0JDO0FBeFVHLDJEQUEyRDtBQUNuQywwQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUMvQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0I7SUFDM0QsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCO0lBQzlFLGtCQUFrQixFQUFFLGlCQUFpQjtDQUN4QyxDQUFDLEFBSnNDLENBSXJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5pbXBvcnQgeyBwYXJzZU1heWJlSnNvbiB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgeyByZXNvbHZlTm9kZVV1aWQgfSBmcm9tIFwiLi4vbm9kZS1yZXNvbHZlXCI7XHJcbmltcG9ydCB7IHRha2VFZGl0b3JTY3JlZW5zaG90IH0gZnJvbSBcIi4uL3NjcmVlbnNob3RcIjtcclxuXHJcbmNvbnN0IEVYVF9OQU1FID0gXCJjb2Nvcy1jcmVhdG9yLW1jcFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE5vZGVUb29scyBpbXBsZW1lbnRzIFRvb2xDYXRlZ29yeSB7XHJcbiAgICByZWFkb25seSBjYXRlZ29yeU5hbWUgPSBcIm5vZGVcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfY3JlYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDcmVhdGUgYSBuZXcgbm9kZSBpbiB0aGUgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgbmFtZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQYXJlbnQgbm9kZSBVVUlEIChvcHRpb25hbCwgZGVmYXVsdHMgdG8gc2NlbmUgcm9vdClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDb21wb25lbnQgY2xhc3MgbmFtZXMgdG8gYWRkIChlLmcuIFsnY2MuTGFiZWwnLCAnY2MuU3ByaXRlJ10pXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibmFtZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9nZXRfaW5mb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGRldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IGEgbm9kZSBieSBVVUlELCBpbmNsdWRpbmcgY29tcG9uZW50cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2ZpbmRfYnlfbmFtZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRmluZCBhbGwgbm9kZXMgbWF0Y2hpbmcgYSBnaXZlbiBuYW1lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIG5hbWUgdG8gc2VhcmNoXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJuYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX3NldF9wcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2V0IGEgcHJvcGVydHkgb24gYSBub2RlIChuYW1lLCBhY3RpdmUsIHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUsIGV0Yy4pLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcm9wZXJ0eSBuYW1lIChlLmcuICduYW1lJywgJ2FjdGl2ZScsICdwb3NpdGlvbicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHsgZGVzY3JpcHRpb246IFwiVmFsdWUgdG8gc2V0LiBGb3IgcG9zaXRpb24vcm90YXRpb24vc2NhbGUgdXNlIHt4LHksen0uXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwicHJvcGVydHlcIiwgXCJ2YWx1ZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9zZXRfdHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgcG9zaXRpb24sIHJvdGF0aW9uLCBhbmQvb3Igc2NhbGUgb2YgYSBub2RlIGF0IG9uY2UuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB4OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgeTogeyB0eXBlOiBcIm51bWJlclwiIH0sIHo6IHsgdHlwZTogXCJudW1iZXJcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJQb3NpdGlvbiB7eCx5LHp9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB4OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgeTogeyB0eXBlOiBcIm51bWJlclwiIH0sIHo6IHsgdHlwZTogXCJudW1iZXJcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFdWxlciByb3RhdGlvbiB7eCx5LHp9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB4OiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgeTogeyB0eXBlOiBcIm51bWJlclwiIH0sIHo6IHsgdHlwZTogXCJudW1iZXJcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTY2FsZSB7eCx5LHp9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9kZWxldGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkRlbGV0ZSBhIG5vZGUgYnkgVVVJRC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX21vdmVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk1vdmUgYSBub2RlIHRvIGEgbmV3IHBhcmVudC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOZXcgcGFyZW50IG5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhcmVudFV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfZHVwbGljYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJEdXBsaWNhdGUgYSBub2RlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgdG8gZHVwbGljYXRlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2dldF9hbGxcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBhIGZsYXQgbGlzdCBvZiBhbGwgbm9kZXMgaW4gdGhlIGN1cnJlbnQgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfc2V0X2FjdGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2V0IGEgbm9kZSdzIGFjdGl2ZSAodmlzaWJsZSkgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiV2hldGhlciB0aGUgbm9kZSBpcyBhY3RpdmVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIiwgXCJhY3RpdmVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfc2V0X2xheWVyXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgYSBub2RlJ3MgbGF5ZXIuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkxheWVyIHZhbHVlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCIsIFwibGF5ZXJcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm5vZGVfZGV0ZWN0X3R5cGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkRldGVjdCBub2RlIHR5cGUgKDJELCAzRCwgb3IgcmVndWxhciBOb2RlKSBiYXNlZCBvbiBpdHMgY29tcG9uZW50cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJub2RlX2NyZWF0ZV90cmVlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDcmVhdGUgYSBmdWxsIG5vZGUgdHJlZSBmcm9tIGEgSlNPTiBzcGVjIGluIG9uZSBjYWxsLiBNdWNoIGZhc3RlciB0aGFuIGNyZWF0aW5nIG5vZGVzIG9uZSBieSBvbmUuIFNwZWMgZm9ybWF0OiB7IG5hbWUsIGNvbXBvbmVudHM/OiBbJ2NjLlVJVHJhbnNmb3JtJ10sIHByb3BlcnRpZXM/OiB7J2NjLlVJVHJhbnNmb3JtLmNvbnRlbnRTaXplJzoge3dpZHRoOjcyMCxoZWlnaHQ6MTI4MH19LCB3aWRnZXQ/OiB7dG9wOjAsIGJvdHRvbTowLCBsZWZ0OjAsIHJpZ2h0OjB9LCBhY3RpdmU/OiBib29sLCBwb3NpdGlvbj86IHt4LHksen0sIGNoaWxkcmVuPzogWy4uLl0gfVwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlBhcmVudCBub2RlIFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVjOiB7IGRlc2NyaXB0aW9uOiBcIk5vZGUgdHJlZSBzcGVjaWZpY2F0aW9uIChKU09OIG9iamVjdCB3aXRoIG5hbWUsIGNvbXBvbmVudHMsIHByb3BlcnRpZXMsIGNoaWxkcmVuKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicGFyZW50XCIsIFwic3BlY1wiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibm9kZV9zZXRfbGF5b3V0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZXQgVUlUcmFuc2Zvcm0gKGNvbnRlbnRTaXplLCBhbmNob3JQb2ludCkgYW5kIFdpZGdldCAobWFyZ2lucykgb24gYSBub2RlIGluIG9uZSBjYWxsLiBNdWNoIGZhc3RlciB0aGFuIGNhbGxpbmcgY29tcG9uZW50X3NldF9wcm9wZXJ0eSBtdWx0aXBsZSB0aW1lcyBmb3IgbGF5b3V0IGFkanVzdG1lbnRzLiBTZXQgc2NyZWVuc2hvdD10cnVlIHRvIGNhcHR1cmUgdGhlIGVkaXRvciBhZnRlciBjaGFuZ2VzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJOb2RlIFVVSUQgKGVpdGhlciB1dWlkIG9yIG5vZGVOYW1lIHJlcXVpcmVkKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVOYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgbmFtZSB0byBmaW5kIChhbHRlcm5hdGl2ZSB0byB1dWlkKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRTaXplOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB3aWR0aDogeyB0eXBlOiBcIm51bWJlclwiIH0sIGhlaWdodDogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlVJVHJhbnNmb3JtIGNvbnRlbnRTaXplIHt3aWR0aCwgaGVpZ2h0fVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbmNob3JQb2ludDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgeDogeyB0eXBlOiBcIm51bWJlclwiIH0sIHk6IHsgdHlwZTogXCJudW1iZXJcIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJVSVRyYW5zZm9ybSBhbmNob3JQb2ludCB7eCwgeX0gKDAtMSlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkZ2V0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogeyB0eXBlOiBcIm51bWJlclwiIH0sIGJvdHRvbTogeyB0eXBlOiBcIm51bWJlclwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogeyB0eXBlOiBcIm51bWJlclwiIH0sIHJpZ2h0OiB7IHR5cGU6IFwibnVtYmVyXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsQ2VudGVyOiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgdmVydGljYWxDZW50ZXI6IHsgdHlwZTogXCJudW1iZXJcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQWxpZ25Ub3A6IHsgdHlwZTogXCJib29sZWFuXCIgfSwgaXNBbGlnbkJvdHRvbTogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQWxpZ25MZWZ0OiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sIGlzQWxpZ25SaWdodDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQWxpZ25Ib3Jpem9udGFsQ2VudGVyOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sIGlzQWxpZ25WZXJ0aWNhbENlbnRlcjogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIldpZGdldCBhbGlnbm1lbnQgbWFyZ2lucy4gU2V0dGluZyBhIHZhbHVlIChlLmcuIHRvcDowKSBhdXRvbWF0aWNhbGx5IGVuYWJsZXMgdGhlIGNvcnJlc3BvbmRpbmcgYWxpZ25tZW50IChpc0FsaWduVG9wOnRydWUpLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgcjogeyB0eXBlOiBcIm51bWJlclwiIH0sIGc6IHsgdHlwZTogXCJudW1iZXJcIiB9LCBiOiB7IHR5cGU6IFwibnVtYmVyXCIgfSwgYTogeyB0eXBlOiBcIm51bWJlclwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk5vZGUgY29sb3Ige3IsZyxiLGF9ICgwLTI1NSlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJOb2RlIG9wYWNpdHkgKDAtMjU1KVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcmVlbnNob3Q6IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIklmIHRydWUsIGNhcHR1cmUgZWRpdG9yIHNjcmVlbnNob3QgYWZ0ZXIgY2hhbmdlcyAoZGVmYXVsdDogZmFsc2UpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGNvbnN0IHJlamVjdGVkID0gYXdhaXQgdGhpcy5yZWplY3RJZlByZXZpZXdSdW5uaW5nKHRvb2xOYW1lKTtcclxuICAgICAgICBpZiAocmVqZWN0ZWQpIHJldHVybiByZWplY3RlZDtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9jcmVhdGVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU5vZGUoYXJncy5uYW1lLCBhcmdzLnBhcmVudCwgYXJncy5jb21wb25lbnRzKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZ2V0X2luZm9cIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE5vZGVJbmZvKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX2ZpbmRfYnlfbmFtZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluZEJ5TmFtZShhcmdzLm5hbWUpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfcHJvcGVydHlcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgYXJncy5wcm9wZXJ0eSwgcGFyc2VNYXliZUpzb24oYXJncy52YWx1ZSkpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfdHJhbnNmb3JtXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRUcmFuc2Zvcm0oYXJncy51dWlkLCBhcmdzLnBvc2l0aW9uLCBhcmdzLnJvdGF0aW9uLCBhcmdzLnNjYWxlKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZGVsZXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kZWxldGVOb2RlKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX21vdmVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1vdmVOb2RlKGFyZ3MudXVpZCwgYXJncy5wYXJlbnRVdWlkKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfZHVwbGljYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kdXBsaWNhdGVOb2RlKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX2dldF9hbGxcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEFsbE5vZGVzKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJub2RlX3NldF9hY3RpdmVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgXCJhY3RpdmVcIiwgYXJncy5hY3RpdmUpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9zZXRfbGF5ZXJcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFByb3BlcnR5KGFyZ3MudXVpZCwgXCJsYXllclwiLCBhcmdzLmxheWVyKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfY3JlYXRlX3RyZWVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU5vZGVUcmVlKGFyZ3MucGFyZW50LCBwYXJzZU1heWJlSnNvbihhcmdzLnNwZWMpKTtcclxuICAgICAgICAgICAgY2FzZSBcIm5vZGVfc2V0X2xheW91dFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0TGF5b3V0KGFyZ3MpO1xyXG4gICAgICAgICAgICBjYXNlIFwibm9kZV9kZXRlY3RfdHlwZVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW2FyZ3MudXVpZF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5mby5zdWNjZXNzKSByZXR1cm4gb2soaW5mbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcHMgPSBpbmZvLmRhdGE/LmNvbXBvbmVudHMgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcFR5cGVzID0gY29tcHMubWFwKChjOiBhbnkpID0+IGMudHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5vZGVUeXBlID0gXCJOb2RlXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBUeXBlcy5pbmNsdWRlcyhcIlVJVHJhbnNmb3JtXCIpKSBub2RlVHlwZSA9IFwiMkRcIjtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb21wVHlwZXMuaW5jbHVkZXMoXCJNZXNoUmVuZGVyZXJcIikgfHwgY29tcFR5cGVzLmluY2x1ZGVzKFwiQ2FtZXJhXCIpKSBub2RlVHlwZSA9IFwiM0RcIjtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkOiBhcmdzLnV1aWQsIG5vZGVUeXBlLCBjb21wb25lbnRzOiBjb21wVHlwZXMgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBTY2VuZSBlZGl0aW5nIHRvb2xzIHRoYXQgbXVzdCBub3QgcnVuIGR1cmluZyBwcmV2aWV3ICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBTQ0VORV9FRElUX1RPT0xTID0gbmV3IFNldChbXHJcbiAgICAgICAgXCJub2RlX2NyZWF0ZVwiLCBcIm5vZGVfZGVsZXRlXCIsIFwibm9kZV9tb3ZlXCIsIFwibm9kZV9kdXBsaWNhdGVcIixcclxuICAgICAgICBcIm5vZGVfc2V0X3Byb3BlcnR5XCIsIFwibm9kZV9zZXRfdHJhbnNmb3JtXCIsIFwibm9kZV9zZXRfYWN0aXZlXCIsIFwibm9kZV9zZXRfbGF5ZXJcIixcclxuICAgICAgICBcIm5vZGVfY3JlYXRlX3RyZWVcIiwgXCJub2RlX3NldF9sYXlvdXRcIixcclxuICAgIF0pO1xyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVqZWN0SWZQcmV2aWV3UnVubmluZyh0b29sTmFtZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0IHwgbnVsbD4ge1xyXG4gICAgICAgIGlmICghTm9kZVRvb2xzLlNDRU5FX0VESVRfVE9PTFMuaGFzKHRvb2xOYW1lKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwicHJldmlld1wiLCBcInF1ZXJ5LWluZm9cIik7XHJcbiAgICAgICAgICAgIGlmIChzdGF0ZSAmJiAoc3RhdGUgYXMgYW55KS5ydW5uaW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBcIiR7dG9vbE5hbWV9XCIg44Gv44OX44Os44OT44Ol44O85Lit44Gr5a6f6KGM44Gn44GN44G+44Gb44KT44CC5YWI44Gr44OX44Os44OT44Ol44O844KS5YGc5q2i44GX44Gm44GP44Gg44GV44GE44CCYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIHsgLyogcXVlcnkgZmFpbGVkIOKAlCBhbGxvdyBleGVjdXRpb24gKi8gfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTm9kZShuYW1lOiBzdHJpbmcsIHBhcmVudD86IHN0cmluZywgY29tcG9uZW50cz86IHN0cmluZ1tdKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gVXNlIEVkaXRvciBBUEkgdG8gY3JlYXRlIG5vZGVcclxuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImNyZWF0ZS1ub2RlXCIsIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudDogcGFyZW50IHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBXYWl0IHVudGlsIHRoZSBub2RlIGlzIHF1ZXJ5YWJsZSBpbiB0aGUgc2NlbmUgcHJvY2Vzc1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JOb2RlKHV1aWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gQWRkIGNvbXBvbmVudHMgaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRzICYmIGNvbXBvbmVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wIG9mIGNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiYWRkQ29tcG9uZW50VG9Ob2RlXCIsIFt1dWlkLCBjb21wXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2FpdCB1bnRpbCB0aGUgY29tcG9uZW50IGlzIHJlZmxlY3RlZCBpbiBxdWVyeS1ub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yQ29tcG9uZW50KHV1aWQsIGNvbXApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1dWlkLCBuYW1lIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFdhaXQgdW50aWwgYSBub2RlIGJlY29tZXMgcXVlcnlhYmxlIGluIHRoZSBzY2VuZSBwcm9jZXNzLlxyXG4gICAgICogRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiY3JlYXRlLW5vZGVcIikgcmV0dXJucyBiZWZvcmUgdGhlIG5vZGVcclxuICAgICAqIGlzIGZ1bGx5IHJlZ2lzdGVyZWQgaW4gdGhlIHNjZW5lIGhpZXJhcmNoeSwgc28gc3Vic2VxdWVudCBzY2VuZSBzY3JpcHRcclxuICAgICAqIGNhbGxzIChmaW5kTm9kZSkgbWF5IGZhaWwgd2l0aG91dCB0aGlzIHdhaXQuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgd2FpdEZvck5vZGUodXVpZDogc3RyaW5nLCBtYXhSZXRyaWVzID0gMTAsIGludGVydmFsTXMgPSAxMDApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heFJldHJpZXM7IGkrKykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Py5zdWNjZXNzKSByZXR1cm47XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBub3QgcmVhZHkgeWV0ICovIH1cclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGludGVydmFsTXMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRG9uJ3QgdGhyb3cg4oCUIGxldCB0aGUgY2FsbGVyIHByb2NlZWQgYW5kIGdldCBhIG1vcmUgc3BlY2lmaWMgZXJyb3IgaWYgbmVlZGVkXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXYWl0IHVudGlsIGEgY29tcG9uZW50IGFkZGVkIHZpYSBhZGRDb21wb25lbnRUb05vZGUgaXMgcmVmbGVjdGVkIGluIHF1ZXJ5LW5vZGUuXHJcbiAgICAgKiBzY2VuZVNjcmlwdCByZXR1cm5zIGJlZm9yZSB0aGUgRWRpdG9yIEFQSSAocXVlcnktbm9kZSkgcmVmbGVjdHMgdGhlIGNoYW5nZSxcclxuICAgICAqIHNvIHBvbGxpbmcgaXMgbmVlZGVkIHRvIGF2b2lkIHJhY2UgY29uZGl0aW9ucyBpbiBzdWJzZXF1ZW50IHRvb2wgY2FsbHMuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgd2FpdEZvckNvbXBvbmVudChub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcsIG1heFJldHJpZXMgPSAxMCwgaW50ZXJ2YWxNcyA9IDEwMCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRUeXBlID0gY29tcG9uZW50VHlwZS5zdGFydHNXaXRoKFwiY2MuXCIpID8gY29tcG9uZW50VHlwZS5zdWJzdHJpbmcoMykgOiBjb21wb25lbnRUeXBlO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4UmV0cmllczsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlRHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGVcIiwgbm9kZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcHM6IGFueVtdID0gbm9kZUR1bXA/Ll9fY29tcHNfXyB8fCBbXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gY29tcHMuc29tZSgoYykgPT5cclxuICAgICAgICAgICAgICAgICAgICBjLnR5cGUgPT09IGNvbXBvbmVudFR5cGUgfHwgYy50eXBlID09PSBgY2MuJHtub3JtYWxpemVkVHlwZX1gIHx8IGMudHlwZSA9PT0gbm9ybWFsaXplZFR5cGVcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybjtcclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIG5vdCByZWFkeSB5ZXQgKi8gfVxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgaW50ZXJ2YWxNcykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBEb24ndCB0aHJvdyDigJQgY29tcG9uZW50IG1heSBzdGlsbCB3b3JrOyBsZXQgY2FsbGVyIGdldCBhIHNwZWNpZmljIGVycm9yIGlmIG5lZWRlZFxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTm9kZVRyZWUocGFyZW50VXVpZDogc3RyaW5nLCBzcGVjOiBhbnkpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiYnVpbGROb2RlVHJlZVwiLCBbcGFyZW50VXVpZCwgc3BlY10pO1xyXG4gICAgICAgICAgICBpZiAoIXJlc3VsdD8uc3VjY2VzcykgcmV0dXJuIGVycihyZXN1bHQ/LmVycm9yIHx8IFwiYnVpbGROb2RlVHJlZSBmYWlsZWRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldE5vZGVJbmZvKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbdXVpZF0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBmaW5kQnlOYW1lKG5hbWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJmaW5kTm9kZXNCeU5hbWVcIiwgW25hbWVdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2V0UHJvcGVydHkodXVpZDogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgcHJvcGVydHksIHZhbHVlXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldFRyYW5zZm9ybSh1dWlkOiBzdHJpbmcsIHBvc2l0aW9uPzogYW55LCByb3RhdGlvbj86IGFueSwgc2NhbGU/OiBhbnkpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICBpZiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcInBvc2l0aW9uXCIsIHBvc2l0aW9uXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyb3RhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXROb2RlUHJvcGVydHlcIiwgW3V1aWQsIFwicm90YXRpb25cIiwgcm90YXRpb25dKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHNjYWxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJzY2FsZVwiLCBzY2FsZV0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBhbnlGYWlsZWQgPSByZXN1bHRzLmZpbmQoKHIpID0+ICFyLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICBpZiAoYW55RmFpbGVkKSByZXR1cm4gb2soYW55RmFpbGVkKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBkZWxldGVOb2RlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcInJlbW92ZS1ub2RlXCIsIHsgdXVpZCB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBtb3ZlTm9kZSh1dWlkOiBzdHJpbmcsIHBhcmVudFV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNldC1wcm9wZXJ0eVwiLCB7XHJcbiAgICAgICAgICAgICAgICB1dWlkLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogXCJwYXJlbnRcIixcclxuICAgICAgICAgICAgICAgIGR1bXA6IHsgdHlwZTogXCJjYy5Ob2RlXCIsIHZhbHVlOiB7IHV1aWQ6IHBhcmVudFV1aWQgfSB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXVpZCwgcGFyZW50VXVpZCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHRyeSBzY2VuZSBzY3JpcHRcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJtb3ZlTm9kZVwiLCBbdXVpZCwgcGFyZW50VXVpZF0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBkdXBsaWNhdGVOb2RlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImR1cGxpY2F0ZS1ub2RlXCIsIHV1aWQpO1xyXG4gICAgICAgICAgICAvLyBkdXBsaWNhdGUtbm9kZSByZXR1cm5zIGFuIGFycmF5IG9mIFVVSURzXHJcbiAgICAgICAgICAgIGNvbnN0IG5ld1V1aWQgPSBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHRbMF0gOiByZXN1bHQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNvdXJjZVV1aWQ6IHV1aWQsIG5ld1V1aWQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0QWxsTm9kZXMoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldEFsbE5vZGVzXCIsIFtdKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVUlUcmFuc2Zvcm0gKyBXaWRnZXQgKyBjb2xvci9vcGFjaXR5IOOCkuOBvuOBqOOCgeOBpuioreWumuOBmeOCi+OAglxyXG4gICAgICogV2lkZ2V0IOOBruWApOOCkuaMh+WumuOBmeOCi+OBqOOAgeWvvuW/nOOBmeOCiyBpc0FsaWduKiDjg5Xjg6njgrDjgpLoh6rli5XjgacgdHJ1ZSDjgavjgZnjgovjgIJcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBhc3luYyBzZXRMYXlvdXQoYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIG5vZGVOYW1lIOKGkiB1dWlkIOino+axulxyXG4gICAgICAgICAgICBsZXQgdXVpZCA9IGFyZ3MudXVpZDtcclxuICAgICAgICAgICAgaWYgKCF1dWlkICYmIGFyZ3Mubm9kZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gYXdhaXQgcmVzb2x2ZU5vZGVVdWlkKHsgbm9kZU5hbWU6IGFyZ3Mubm9kZU5hbWUgfSk7XHJcbiAgICAgICAgICAgICAgICB1dWlkID0gcmVzb2x2ZWQudXVpZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXV1aWQpIHJldHVybiBlcnIoXCJFaXRoZXIgJ3V1aWQnIG9yICdub2RlTmFtZScgaXMgcmVxdWlyZWRcIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgLy8gVUlUcmFuc2Zvcm0g44Gu6Kit5a6aXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRTaXplID0gcGFyc2VNYXliZUpzb24oYXJncy5jb250ZW50U2l6ZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFuY2hvclBvaW50ID0gcGFyc2VNYXliZUpzb24oYXJncy5hbmNob3JQb2ludCk7XHJcbiAgICAgICAgICAgIGlmIChjb250ZW50U2l6ZSB8fCBhbmNob3JQb2ludCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MpIHJldHVybiBlcnIoYE5vZGUgJHt1dWlkfSBub3QgZm91bmRgKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBzID0gbm9kZUluZm8uZGF0YT8uY29tcG9uZW50cyB8fCBbXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHV0SWR4ID0gY29tcHMuZmluZEluZGV4KChjOiBhbnkpID0+IGMudHlwZSA9PT0gXCJVSVRyYW5zZm9ybVwiKTtcclxuICAgICAgICAgICAgICAgIGlmICh1dElkeCA8IDApIHJldHVybiBlcnIoXCJOb2RlIGhhcyBubyBVSVRyYW5zZm9ybSBjb21wb25lbnRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRlbnRTaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHt1dElkeH0uY29udGVudFNpemVgO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSB7IHZhbHVlOiB7IHdpZHRoOiB7IHZhbHVlOiBjb250ZW50U2l6ZS53aWR0aCB9LCBoZWlnaHQ6IHsgdmFsdWU6IGNvbnRlbnRTaXplLmhlaWdodCB9IH0gfTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgcHJvcGVydHk6IFwiY29udGVudFNpemVcIiwgc3VjY2Vzczogcj8uc3VjY2VzcyAhPT0gZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYW5jaG9yUG9pbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gYF9fY29tcHNfXy4ke3V0SWR4fS5hbmNob3JQb2ludGA7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IHsgdmFsdWU6IHsgeDogeyB2YWx1ZTogYW5jaG9yUG9pbnQueCB9LCB5OiB7IHZhbHVlOiBhbmNob3JQb2ludC55IH0gfSB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0UHJvcGVydHlWaWFFZGl0b3JcIiwgW3V1aWQsIHBhdGgsIGR1bXBdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogXCJhbmNob3JQb2ludFwiLCBzdWNjZXNzOiByPy5zdWNjZXNzICE9PSBmYWxzZSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gV2lkZ2V0IOOBruioreWumlxyXG4gICAgICAgICAgICBjb25zdCB3aWRnZXQgPSBwYXJzZU1heWJlSnNvbihhcmdzLndpZGdldCk7XHJcbiAgICAgICAgICAgIGlmICh3aWRnZXQpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdpZGdldCDjgrPjg7Pjg53jg7zjg43jg7Pjg4jjgpLmjqLjgZnvvIjjgarjgZHjgozjgbDov73liqDvvIlcclxuICAgICAgICAgICAgICAgIGxldCBub2RlSW5mbyA9IGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJnZXROb2RlSW5mb1wiLCBbdXVpZF0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlSW5mbz8uc3VjY2VzcykgcmV0dXJuIGVycihgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGApO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbXBzID0gbm9kZUluZm8uZGF0YT8uY29tcG9uZW50cyB8fCBbXTtcclxuICAgICAgICAgICAgICAgIGxldCB3SWR4ID0gY29tcHMuZmluZEluZGV4KChjOiBhbnkpID0+IGMudHlwZSA9PT0gXCJXaWRnZXRcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAod0lkeCA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiYWRkQ29tcG9uZW50VG9Ob2RlXCIsIFt1dWlkLCBcImNjLldpZGdldFwiXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5YaN5Y+W5b6XXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW3V1aWRdKTtcclxuICAgICAgICAgICAgICAgICAgICBjb21wcyA9IG5vZGVJbmZvLmRhdGE/LmNvbXBvbmVudHMgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgd0lkeCA9IGNvbXBzLmZpbmRJbmRleCgoYzogYW55KSA9PiBjLnR5cGUgPT09IFwiV2lkZ2V0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3SWR4IDwgMCkgcmV0dXJuIGVycihcIkZhaWxlZCB0byBhZGQgV2lkZ2V0IGNvbXBvbmVudFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogXCJXaWRnZXRcIiwgYWN0aW9uOiBcImFkZGVkXCIgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaXNBbGlnbiog44KS6Ieq5YuV6Kit5a6a77yI5YCk44GM44GC44KM44GwIHRydWUg44Gr44GZ44KL77yJXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhbGlnbk1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IFwiaXNBbGlnblRvcFwiLCBib3R0b206IFwiaXNBbGlnbkJvdHRvbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IFwiaXNBbGlnbkxlZnRcIiwgcmlnaHQ6IFwiaXNBbGlnblJpZ2h0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbENlbnRlcjogXCJpc0FsaWduSG9yaXpvbnRhbENlbnRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsQ2VudGVyOiBcImlzQWxpZ25WZXJ0aWNhbENlbnRlclwiLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh3aWRnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaXNBbGlnbiog44KS5piO56S65oyH5a6a44GX44Gf5aC05ZCI44Gv44Gd44Gu44G+44G+6Kit5a6aXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHt3SWR4fS4ke2tleX1gO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSB7IHZhbHVlLCB0eXBlOiBcIkJvb2xlYW5cIiB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0UHJvcGVydHlWaWFFZGl0b3JcIiwgW3V1aWQsIHBhdGgsIGR1bXBdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgcHJvcGVydHk6IGBXaWRnZXQuJHtrZXl9YCwgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDjgb7jgZrlr77lv5zjgZnjgosgaXNBbGlnbiog44KSIHRydWUg44Gr44GZ44KLXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsaWduS2V5ID0gYWxpZ25NYXBba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFsaWduS2V5ICYmIHdpZGdldFthbGlnbktleV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxpZ25QYXRoID0gYF9fY29tcHNfXy4ke3dJZHh9LiR7YWxpZ25LZXl9YDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2NlbmVTY3JpcHQoXCJzZXRQcm9wZXJ0eVZpYUVkaXRvclwiLCBbdXVpZCwgYWxpZ25QYXRoLCB7IHZhbHVlOiB0cnVlLCB0eXBlOiBcIkJvb2xlYW5cIiB9XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IHsgdmFsdWUsIHR5cGU6IFwiTnVtYmVyXCIgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCBkdW1wXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHByb3BlcnR5OiBgV2lkZ2V0LiR7a2V5fWAsIHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBjb2xvclxyXG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IHBhcnNlTWF5YmVKc29uKGFyZ3MuY29sb3IpO1xyXG4gICAgICAgICAgICBpZiAoY29sb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwic2V0Tm9kZVByb3BlcnR5XCIsIFt1dWlkLCBcImNvbG9yXCIsIGNvbG9yXSk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogXCJjb2xvclwiLCBzdWNjZXNzOiByPy5zdWNjZXNzICE9PSBmYWxzZSB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gb3BhY2l0eVxyXG4gICAgICAgICAgICBpZiAoYXJncy5vcGFjaXR5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNjLlVJT3BhY2l0eSDjgpLkvb/jgYbvvIjjgarjgZHjgozjgbAgY29sb3IuYSDjgafoqK3lrprvvIlcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcImdldE5vZGVJbmZvXCIsIFt1dWlkXSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wcyA9IG5vZGVJbmZvPy5kYXRhPy5jb21wb25lbnRzIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3BJZHggPSBjb21wcy5maW5kSW5kZXgoKGM6IGFueSkgPT4gYy50eXBlID09PSBcIlVJT3BhY2l0eVwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChvcElkeCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGBfX2NvbXBzX18uJHtvcElkeH0ub3BhY2l0eWA7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldFByb3BlcnR5VmlhRWRpdG9yXCIsIFt1dWlkLCBwYXRoLCB7IHZhbHVlOiBhcmdzLm9wYWNpdHksIHR5cGU6IFwiTnVtYmVyXCIgfV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHByb3BlcnR5OiBcIlVJT3BhY2l0eS5vcGFjaXR5XCIsIHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVJT3BhY2l0eSDjgYzjgarjgYTloLTlkIjjga8gY29sb3IuYSDjgpLnm7TmjqXoqK3lrppcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Q29sb3IgPSBub2RlSW5mbz8uZGF0YT8uY29sb3IgfHwgeyByOiAyNTUsIGc6IDI1NSwgYjogMjU1LCBhOiAyNTUgfTtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q29sb3IuYSA9IGFyZ3Mub3BhY2l0eTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gYXdhaXQgdGhpcy5zY2VuZVNjcmlwdChcInNldE5vZGVQcm9wZXJ0eVwiLCBbdXVpZCwgXCJjb2xvclwiLCBjdXJyZW50Q29sb3JdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwcm9wZXJ0eTogXCJjb2xvci5hXCIsIHN1Y2Nlc3M6IHI/LnN1Y2Nlc3MgIT09IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBhbGxPayA9IHJlc3VsdHMuZXZlcnkociA9PiByLnN1Y2Nlc3MgIT09IGZhbHNlKTtcclxuICAgICAgICAgICAgbGV0IHJlc3BvbnNlOiBhbnkgPSB7IHN1Y2Nlc3M6IGFsbE9rLCB1dWlkLCByZXN1bHRzIH07XHJcblxyXG4gICAgICAgICAgICAvLyBzY3JlZW5zaG90XHJcbiAgICAgICAgICAgIGlmIChhcmdzLnNjcmVlbnNob3QpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3MgPSBhd2FpdCB0YWtlRWRpdG9yU2NyZWVuc2hvdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLnNjcmVlbnNob3QgPSB7IHBhdGg6IHNzLnBhdGgsIHNpemU6IHNzLnNhdmVkU2l6ZSB9O1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoc3NFcnI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLnNjcmVlbnNob3RFcnJvciA9IHNzRXJyLm1lc3NhZ2UgfHwgU3RyaW5nKHNzRXJyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3BvbnNlKTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIENhbGwgYSBzY2VuZSBzY3JpcHQgbWV0aG9kICovXHJcbiAgICBwcml2YXRlIGFzeW5jIHNjZW5lU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=