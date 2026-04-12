"use strict";
/**
 * Scene script — runs inside CocosCreator's scene renderer process.
 * These methods are called via Editor.Message.request('scene', 'execute-scene-script', ...)
 * and have access to the `cc` module (engine runtime).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
const path_1 = require("path");
module.paths.push((0, path_1.join)(Editor.App.path, "node_modules"));
const MAX_LOG_BUFFER = 500;
const _consoleLogs = [];
const _originalLog = console.log;
const _originalWarn = console.warn;
const _originalError = console.error;
function formatArgs(args) {
    return args.map(a => {
        if (typeof a === "string")
            return a;
        try {
            return JSON.stringify(a);
        }
        catch (_a) {
            return String(a);
        }
    }).join(" ");
}
function pushLog(level, args) {
    _consoleLogs.push({
        timestamp: new Date().toISOString(),
        level,
        message: formatArgs(args),
    });
    if (_consoleLogs.length > MAX_LOG_BUFFER) {
        _consoleLogs.splice(0, _consoleLogs.length - MAX_LOG_BUFFER);
    }
}
console.log = function (...args) {
    _originalLog.apply(console, args);
    pushLog("log", args);
};
console.warn = function (...args) {
    _originalWarn.apply(console, args);
    pushLog("warn", args);
};
console.error = function (...args) {
    _originalError.apply(console, args);
    pushLog("error", args);
};
function getScene() {
    const { director } = require("cc");
    return director.getScene();
}
function findNode(uuid) {
    const scene = getScene();
    if (!scene)
        return null;
    // Recursive search — getChildByUuid is not recursive in cc
    const queue = [...scene.children];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node.uuid === uuid)
            return node;
        if (node.children)
            queue.push(...node.children);
    }
    return null;
}
/**
 * Recursively build a node tree from a JSON spec.
 * Returns { uuid, name, children: [...] }
 */
function buildNodeRecursive(parent, spec) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { Node, js, Vec3 } = require("cc");
    const node = new Node(spec.name || "Node");
    parent.addChild(node);
    // Add components
    if (spec.components && Array.isArray(spec.components)) {
        const { Sprite, Label } = require("cc");
        for (const compName of spec.components) {
            const CompClass = js.getClassByName(compName);
            if (CompClass) {
                if (!node.getComponent(CompClass)) {
                    const comp = node.addComponent(CompClass);
                    // Sprite: sizeMode=CUSTOM でUITransformサイズの上書きを防ぐ
                    if (comp instanceof Sprite) {
                        comp.sizeMode = 0; // SizeMode.CUSTOM
                    }
                    // Label: useSystemFont + 色を黒に（白パネル上で見えるように）
                    if (comp instanceof Label) {
                        comp.useSystemFont = true;
                        const { Color } = require("cc");
                        comp.color = new Color(51, 51, 51, 255);
                    }
                }
            }
        }
    }
    // Set component properties
    // Format: { "cc.UITransform.contentSize": {width:720, height:1280} }
    if (spec.properties) {
        for (const [key, value] of Object.entries(spec.properties)) {
            const dotIdx = key.lastIndexOf(".");
            if (dotIdx < 0)
                continue;
            const compName = key.substring(0, dotIdx);
            const propName = key.substring(dotIdx + 1);
            const CompClass = js.getClassByName(compName);
            if (!CompClass)
                continue;
            const comp = node.getComponent(CompClass);
            if (!comp)
                continue;
            try {
                // contentSize needs special handling (Size type)
                if (propName === "contentSize" && value && typeof value === "object") {
                    comp.setContentSize((_a = value.width) !== null && _a !== void 0 ? _a : 0, (_b = value.height) !== null && _b !== void 0 ? _b : 0);
                }
                else {
                    comp[propName] = value;
                }
            }
            catch ( /* skip invalid property */_h) { /* skip invalid property */ }
        }
    }
    // Set UITransform anchorPoint if specified
    if (spec.anchorPoint) {
        const { UITransform } = require("cc");
        const ut = node.getComponent(UITransform);
        if (ut)
            ut.setAnchorPoint((_c = spec.anchorPoint.x) !== null && _c !== void 0 ? _c : 0.5, (_d = spec.anchorPoint.y) !== null && _d !== void 0 ? _d : 0.5);
    }
    // Set node properties (position, scale, active)
    if (spec.active === false)
        node.active = false;
    if (spec.position)
        node.setPosition(spec.position.x || 0, spec.position.y || 0, spec.position.z || 0);
    if (spec.scale)
        node.setScale((_e = spec.scale.x) !== null && _e !== void 0 ? _e : 1, (_f = spec.scale.y) !== null && _f !== void 0 ? _f : 1, (_g = spec.scale.z) !== null && _g !== void 0 ? _g : 1);
    // Set Widget properties if specified
    // Format: { top: 0, bottom: 0, left: 0, right: 0 } — each field enables the corresponding alignment
    if (spec.widget) {
        const { Widget } = require("cc");
        let w = node.getComponent(Widget);
        if (!w)
            w = node.addComponent(Widget);
        const wSpec = spec.widget;
        if (wSpec.top !== undefined) {
            w.isAlignTop = true;
            w.top = wSpec.top;
        }
        if (wSpec.bottom !== undefined) {
            w.isAlignBottom = true;
            w.bottom = wSpec.bottom;
        }
        if (wSpec.left !== undefined) {
            w.isAlignLeft = true;
            w.left = wSpec.left;
        }
        if (wSpec.right !== undefined) {
            w.isAlignRight = true;
            w.right = wSpec.right;
        }
        if (wSpec.horizontalCenter !== undefined) {
            w.isAlignHorizontalCenter = true;
            w.horizontalCenter = wSpec.horizontalCenter;
        }
        if (wSpec.verticalCenter !== undefined) {
            w.isAlignVerticalCenter = true;
            w.verticalCenter = wSpec.verticalCenter;
        }
    }
    // Build children
    const childResults = [];
    if (spec.children && Array.isArray(spec.children)) {
        for (const childSpec of spec.children) {
            childResults.push(buildNodeRecursive(node, childSpec));
        }
    }
    return { uuid: node.uuid, name: node.name, children: childResults };
}
function collectNodeInfo(node, includeComponents = false) {
    var _a, _b;
    const info = {
        uuid: node.uuid,
        name: node.name,
        active: node.active,
        position: { x: node.position.x, y: node.position.y, z: node.position.z },
        scale: { x: node.scale.x, y: node.scale.y, z: node.scale.z },
        parent: ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.uuid) || null,
        childCount: ((_b = node.children) === null || _b === void 0 ? void 0 : _b.length) || 0,
    };
    if (includeComponents && node.components) {
        info.components = node.components.map((c) => ({
            type: c.constructor.name,
            uuid: c.uuid,
            enabled: c.enabled,
        }));
    }
    return info;
}
exports.methods = {
    getSceneHierarchy(includeComponents = false) {
        try {
            const scene = getScene();
            if (!scene)
                return { success: false, error: "No active scene" };
            const walk = (node) => {
                const item = {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    children: [],
                };
                if (includeComponents && node.components) {
                    item.components = node.components.map((c) => ({
                        type: c.constructor.name,
                        uuid: c.uuid,
                        enabled: c.enabled,
                    }));
                }
                if (node.children) {
                    item.children = node.children.map((ch) => walk(ch));
                }
                return item;
            };
            return {
                success: true,
                sceneName: scene.name,
                sceneUuid: scene.uuid,
                hierarchy: scene.children.map((ch) => walk(ch)),
            };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    getNodeInfo(uuid) {
        try {
            const node = findNode(uuid);
            if (!node)
                return { success: false, error: `Node ${uuid} not found` };
            return { success: true, data: collectNodeInfo(node, true) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    getAllNodes() {
        try {
            const scene = getScene();
            if (!scene)
                return { success: false, error: "No active scene" };
            const nodes = [];
            const walk = (node) => {
                nodes.push(collectNodeInfo(node));
                if (node.children)
                    node.children.forEach(walk);
            };
            scene.children.forEach(walk);
            return { success: true, data: nodes };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    /**
     * 指定ノードの子孫から名前で検索する。auto_bind 用。
     * rootUuid が空の場合はシーン全体を検索（後方互換）。
     */
    findDescendantsByName(rootUuid, name) {
        try {
            let root;
            if (rootUuid) {
                root = findNode(rootUuid);
                if (!root)
                    return { success: false, error: `Root node ${rootUuid} not found` };
            }
            else {
                root = getScene();
                if (!root)
                    return { success: false, error: "No active scene" };
            }
            const results = [];
            const walk = (node) => {
                if (node.name === name)
                    results.push(collectNodeInfo(node));
                if (node.children)
                    node.children.forEach(walk);
            };
            if (root.children)
                root.children.forEach(walk);
            return { success: true, data: results };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    /**
     * 指定ノードの全子孫を depth 付きで返す。auto_bind の一括検索用。
     */
    getAllDescendants(rootUuid) {
        try {
            const root = findNode(rootUuid);
            if (!root)
                return { success: false, error: `Node ${rootUuid} not found` };
            const results = [];
            const walk = (node, depth) => {
                results.push({ uuid: node.uuid, name: node.name, depth });
                if (node.children)
                    node.children.forEach((c) => walk(c, depth + 1));
            };
            if (root.children)
                root.children.forEach((c) => walk(c, 1));
            return { success: true, data: results };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    findNodesByName(name) {
        try {
            const scene = getScene();
            if (!scene)
                return { success: false, error: "No active scene" };
            const results = [];
            const walk = (node) => {
                if (node.name === name)
                    results.push(collectNodeInfo(node));
                if (node.children)
                    node.children.forEach(walk);
            };
            scene.children.forEach(walk);
            return { success: true, data: results };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    findNodeByPath(path) {
        var _a;
        try {
            const scene = getScene();
            if (!scene)
                return { success: false, error: "No active scene" };
            const parts = path.split("/");
            let current = null;
            const walk = (node) => {
                if (node.name === parts[0])
                    return node;
                if (node.children) {
                    for (const child of node.children) {
                        const found = walk(child);
                        if (found)
                            return found;
                    }
                }
                return null;
            };
            for (const child of scene.children) {
                current = walk(child);
                if (current)
                    break;
            }
            if (!current)
                return { success: false, error: `Node "${parts[0]}" not found` };
            for (let i = 1; i < parts.length; i++) {
                const child = (_a = current.children) === null || _a === void 0 ? void 0 : _a.find((c) => c.name === parts[i]);
                if (!child)
                    return { success: false, error: `Child "${parts[i]}" not found in "${current.name}"` };
                current = child;
            }
            return { success: true, data: collectNodeInfo(current) };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    setNodeProperty(uuid, property, value) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            const node = findNode(uuid);
            if (!node)
                return { success: false, error: `Node ${uuid} not found` };
            switch (property) {
                case "position":
                    node.setPosition((_a = value.x) !== null && _a !== void 0 ? _a : 0, (_b = value.y) !== null && _b !== void 0 ? _b : 0, (_c = value.z) !== null && _c !== void 0 ? _c : 0);
                    break;
                case "rotation":
                    node.setRotationFromEuler((_d = value.x) !== null && _d !== void 0 ? _d : 0, (_e = value.y) !== null && _e !== void 0 ? _e : 0, (_f = value.z) !== null && _f !== void 0 ? _f : 0);
                    break;
                case "scale":
                    node.setScale((_g = value.x) !== null && _g !== void 0 ? _g : 1, (_h = value.y) !== null && _h !== void 0 ? _h : 1, (_j = value.z) !== null && _j !== void 0 ? _j : 1);
                    break;
                case "active":
                    node.active = !!value;
                    break;
                case "name":
                    node.name = String(value);
                    break;
                default:
                    node[property] = value;
            }
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    setComponentProperty(uuid, componentType, property, value) {
        try {
            const { js } = require("cc");
            const node = findNode(uuid);
            if (!node)
                return { success: false, error: `Node ${uuid} not found` };
            const CompClass = js.getClassByName(componentType);
            if (!CompClass)
                return { success: false, error: `Component class ${componentType} not found` };
            const comp = node.getComponent(CompClass);
            if (!comp)
                return { success: false, error: `Component ${componentType} not on node ${uuid}` };
            comp[property] = value;
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    addComponentToNode(uuid, componentType) {
        try {
            const { js } = require("cc");
            const node = findNode(uuid);
            if (!node)
                return { success: false, error: `Node ${uuid} not found` };
            const CompClass = js.getClassByName(componentType);
            if (!CompClass)
                return { success: false, error: `Component class ${componentType} not found` };
            const comp = node.addComponent(CompClass);
            return { success: true, data: { uuid: comp.uuid, type: componentType } };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    moveNode(uuid, parentUuid) {
        try {
            const node = findNode(uuid);
            if (!node)
                return { success: false, error: `Node ${uuid} not found` };
            const parent = findNode(parentUuid);
            if (!parent)
                return { success: false, error: `Parent ${parentUuid} not found` };
            node.setParent(parent);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    /**
     * Build a node tree from a JSON spec in one call.
     * Spec format:
     * {
     *   name: string,
     *   components?: string[],            // e.g. ["cc.UITransform", "cc.Layout"]
     *   properties?: Record<string, any>, // e.g. { "cc.UITransform.contentSize": {width:720,height:1280} }
     *   children?: NodeSpec[]
     * }
     */
    buildNodeTree(parentUuid, spec) {
        try {
            const { Node, js, UITransform } = require("cc");
            const parent = findNode(parentUuid);
            if (!parent)
                return { success: false, error: `Parent ${parentUuid} not found` };
            const result = buildNodeRecursive(parent, spec);
            return { success: true, data: result };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
    testLog(message = "test message") {
        console.log("[testLog]", message);
        const methods = Object.keys(exports.methods || {});
        return { success: true, bufferSize: _consoleLogs.length, methods };
    },
    getConsoleLogs(count = 50, level) {
        let logs = _consoleLogs;
        if (level) {
            logs = logs.filter(l => l.level === level);
        }
        return { success: true, logs: logs.slice(-count), total: _consoleLogs.length };
    },
    clearConsoleLogs() {
        _consoleLogs.length = 0;
        return { success: true };
    },
    async setPropertyViaEditor(nodeUuid, path, dump) {
        try {
            // scene:set-property API
            // uuid: ノードUUID（コンポーネントUUIDではない）
            // path: __comps__.{index}.{property} 形式
            // dump: { value, type } 形式
            const opts = { uuid: nodeUuid, path, dump };
            const result = await Editor.Message.request("scene", "set-property", opts);
            return { success: true, result };
        }
        catch (e) {
            return { success: false, error: e.message || String(e) };
        }
    },
    removeComponentFromNode(uuid, componentType) {
        try {
            const { js } = require("cc");
            const node = findNode(uuid);
            if (!node)
                return { success: false, error: `Node ${uuid} not found` };
            const CompClass = js.getClassByName(componentType);
            if (!CompClass)
                return { success: false, error: `Component class ${componentType} not found` };
            const comp = node.getComponent(CompClass);
            if (!comp)
                return { success: false, error: `Component ${componentType} not on node` };
            node.removeComponent(comp);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7OztBQUVILCtCQUE0QjtBQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBVXpELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUMzQixNQUFNLFlBQVksR0FBc0IsRUFBRSxDQUFDO0FBRTNDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDakMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNuQyxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBRXJDLFNBQVMsVUFBVSxDQUFDLElBQVc7SUFDM0IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2hCLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUTtZQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQztZQUFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7UUFBQyxXQUFNLENBQUM7WUFBQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7SUFDakUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxLQUErQixFQUFFLElBQVc7SUFDekQsWUFBWSxDQUFDLElBQUksQ0FBQztRQUNkLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtRQUNuQyxLQUFLO1FBQ0wsT0FBTyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7S0FDNUIsQ0FBQyxDQUFDO0lB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QztZQUM3QixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUk7Z0JBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVEsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUV0RSxNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxTQUFTO2dCQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsYUFBYSxZQUFZLEVBQUUsQ0FBQztZQUUvRixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxJQUFJO2dCQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLGFBQWEsY0FBYyxFQUFFLENBQUM7WUFFdEYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQixPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoRCxDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogU2NlbmUgc2NyaXB0IOKAlCBydW5zIGluc2lkZSBDb2Nvc0NyZWF0b3IncyBzY2VuZSByZW5kZXJlciBwcm9jZXNzLlxyXG4gKiBUaGVzZSBtZXRob2RzIGFyZSBjYWxsZWQgdmlhIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0JywgLi4uKVxyXG4gKiBhbmQgaGF2ZSBhY2Nlc3MgdG8gdGhlIGBjY2AgbW9kdWxlIChlbmdpbmUgcnVudGltZSkuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgam9pbiB9IGZyb20gXCJwYXRoXCI7XHJcbm1vZHVsZS5wYXRocy5wdXNoKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCBcIm5vZGVfbW9kdWxlc1wiKSk7XHJcblxyXG4vLyDilIDilIDilIAgQ29uc29sZSBMb2cgQnVmZmVyIOKUgOKUgOKUgFxyXG5cclxuaW50ZXJmYWNlIENvbnNvbGVMb2dFbnRyeSB7XHJcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcclxuICAgIGxldmVsOiBcImxvZ1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCI7XHJcbiAgICBtZXNzYWdlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IE1BWF9MT0dfQlVGRkVSID0gNTAwO1xyXG5jb25zdCBfY29uc29sZUxvZ3M6IENvbnNvbGVMb2dFbnRyeVtdID0gW107XHJcblxyXG5jb25zdCBfb3JpZ2luYWxMb2cgPSBjb25zb2xlLmxvZztcclxuY29uc3QgX29yaWdpbmFsV2FybiA9IGNvbnNvbGUud2FybjtcclxuY29uc3QgX29yaWdpbmFsRXJyb3IgPSBjb25zb2xlLmVycm9yO1xyXG5cclxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzOiBhbnlbXSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYXJncy5tYXAoYSA9PiB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhID09PSBcInN0cmluZ1wiKSByZXR1cm4gYTtcclxuICAgICAgICB0cnkgeyByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYSk7IH0gY2F0Y2ggeyByZXR1cm4gU3RyaW5nKGEpOyB9XHJcbiAgICB9KS5qb2luKFwiIFwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHVzaExvZyhsZXZlbDogQ29uc29sZUxvZ0VudHJ5W1wibGV2ZWxcIl0sIGFyZ3M6IGFueVtdKTogdm9pZCB7XHJcbiAgICBfY29uc29sZUxvZ3MucHVzaCh7XHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgbGV2ZWwsXHJcbiAgICAgICAgbWVzc2FnZTogZm9ybWF0QXJncyhhcmdzKSxcclxuICAgIH0pO1xyXG4gICAgaWYgKF9jb25zb2xlTG9ncy5sZW5ndGggPiBNQVhfTE9HX0JVRkZFUikge1xyXG4gICAgICAgIF9jb25zb2xlTG9ncy5zcGxpY2UoMCwgX2NvbnNvbGVMb2dzLmxlbmd0aCAtIE1BWF9MT0dfQlVGRkVSKTtcclxuICAgIH1cclxufVxyXG5cclxuY29uc29sZS5sb2cgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuICAgIF9vcmlnaW5hbExvZy5hcHBseShjb25zb2xlLCBhcmdzKTtcclxuICAgIHB1c2hMb2coXCJsb2dcIiwgYXJncyk7XHJcbn07XHJcblxyXG5jb25zb2xlLndhcm4gPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuICAgIF9vcmlnaW5hbFdhcm4uYXBwbHkoY29uc29sZSwgYXJncyk7XHJcbiAgICBwdXNoTG9nKFwid2FyblwiLCBhcmdzKTtcclxufTtcclxuXHJcbmNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuICAgIF9vcmlnaW5hbEVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xyXG4gICAgcHVzaExvZyhcImVycm9yXCIsIGFyZ3MpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZ2V0U2NlbmUoKSB7XHJcbiAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICByZXR1cm4gZGlyZWN0b3IuZ2V0U2NlbmUoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE5vZGUodXVpZDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBzY2VuZSA9IGdldFNjZW5lKCk7XHJcbiAgICBpZiAoIXNjZW5lKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAvLyBSZWN1cnNpdmUgc2VhcmNoIOKAlCBnZXRDaGlsZEJ5VXVpZCBpcyBub3QgcmVjdXJzaXZlIGluIGNjXHJcbiAgICBjb25zdCBxdWV1ZSA9IFsuLi5zY2VuZS5jaGlsZHJlbl07XHJcbiAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBxdWV1ZS5zaGlmdCgpITtcclxuICAgICAgICBpZiAobm9kZS51dWlkID09PSB1dWlkKSByZXR1cm4gbm9kZTtcclxuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgcXVldWUucHVzaCguLi5ub2RlLmNoaWxkcmVuKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG4vKipcclxuICogUmVjdXJzaXZlbHkgYnVpbGQgYSBub2RlIHRyZWUgZnJvbSBhIEpTT04gc3BlYy5cclxuICogUmV0dXJucyB7IHV1aWQsIG5hbWUsIGNoaWxkcmVuOiBbLi4uXSB9XHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZE5vZGVSZWN1cnNpdmUocGFyZW50OiBhbnksIHNwZWM6IGFueSk6IGFueSB7XHJcbiAgICBjb25zdCB7IE5vZGUsIGpzLCBWZWMzIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcblxyXG4gICAgY29uc3Qgbm9kZSA9IG5ldyBOb2RlKHNwZWMubmFtZSB8fCBcIk5vZGVcIik7XHJcbiAgICBwYXJlbnQuYWRkQ2hpbGQobm9kZSk7XHJcblxyXG4gICAgLy8gQWRkIGNvbXBvbmVudHNcclxuICAgIGlmIChzcGVjLmNvbXBvbmVudHMgJiYgQXJyYXkuaXNBcnJheShzcGVjLmNvbXBvbmVudHMpKSB7XHJcbiAgICAgICAgY29uc3QgeyBTcHJpdGUsIExhYmVsIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICAgICAgZm9yIChjb25zdCBjb21wTmFtZSBvZiBzcGVjLmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgY29uc3QgQ29tcENsYXNzID0ganMuZ2V0Q2xhc3NCeU5hbWUoY29tcE5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoQ29tcENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUuZ2V0Q29tcG9uZW50KENvbXBDbGFzcykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbm9kZS5hZGRDb21wb25lbnQoQ29tcENsYXNzKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTcHJpdGU6IHNpemVNb2RlPUNVU1RPTSDjgadVSVRyYW5zZm9ybeOCteOCpOOCuuOBruS4iuabuOOBjeOCkumYsuOBkFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wIGluc3RhbmNlb2YgU3ByaXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAuc2l6ZU1vZGUgPSAwOyAvLyBTaXplTW9kZS5DVVNUT01cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTGFiZWw6IHVzZVN5c3RlbUZvbnQgKyDoibLjgpLpu5LjgavvvIjnmb3jg5Hjg43jg6vkuIrjgafopovjgYjjgovjgojjgYbjgavvvIlcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcCBpbnN0YW5jZW9mIExhYmVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudXNlU3lzdGVtRm9udCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgQ29sb3IgfSA9IHJlcXVpcmUoXCJjY1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC5jb2xvciA9IG5ldyBDb2xvcig1MSwgNTEsIDUxLCAyNTUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBTZXQgY29tcG9uZW50IHByb3BlcnRpZXNcclxuICAgIC8vIEZvcm1hdDogeyBcImNjLlVJVHJhbnNmb3JtLmNvbnRlbnRTaXplXCI6IHt3aWR0aDo3MjAsIGhlaWdodDoxMjgwfSB9XHJcbiAgICBpZiAoc3BlYy5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoc3BlYy5wcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICBjb25zdCBkb3RJZHggPSBrZXkubGFzdEluZGV4T2YoXCIuXCIpO1xyXG4gICAgICAgICAgICBpZiAoZG90SWR4IDwgMCkgY29udGludWU7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBOYW1lID0ga2V5LnN1YnN0cmluZygwLCBkb3RJZHgpO1xyXG4gICAgICAgICAgICBjb25zdCBwcm9wTmFtZSA9IGtleS5zdWJzdHJpbmcoZG90SWR4ICsgMSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBDb21wQ2xhc3MgPSBqcy5nZXRDbGFzc0J5TmFtZShjb21wTmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghQ29tcENsYXNzKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgY29tcCA9IG5vZGUuZ2V0Q29tcG9uZW50KENvbXBDbGFzcyk7XHJcbiAgICAgICAgICAgIGlmICghY29tcCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gY29udGVudFNpemUgbmVlZHMgc3BlY2lhbCBoYW5kbGluZyAoU2l6ZSB0eXBlKVxyXG4gICAgICAgICAgICAgICAgaWYgKHByb3BOYW1lID09PSBcImNvbnRlbnRTaXplXCIgJiYgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcC5zZXRDb250ZW50U2l6ZSgodmFsdWUgYXMgYW55KS53aWR0aCA/PyAwLCAodmFsdWUgYXMgYW55KS5oZWlnaHQgPz8gMCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBbcHJvcE5hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBza2lwIGludmFsaWQgcHJvcGVydHkgKi8gfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBTZXQgVUlUcmFuc2Zvcm0gYW5jaG9yUG9pbnQgaWYgc3BlY2lmaWVkXHJcbiAgICBpZiAoc3BlYy5hbmNob3JQb2ludCkge1xyXG4gICAgICAgIGNvbnN0IHsgVUlUcmFuc2Zvcm0gfSA9IHJlcXVpcmUoXCJjY1wiKTtcclxuICAgICAgICBjb25zdCB1dCA9IG5vZGUuZ2V0Q29tcG9uZW50KFVJVHJhbnNmb3JtKTtcclxuICAgICAgICBpZiAodXQpIHV0LnNldEFuY2hvclBvaW50KHNwZWMuYW5jaG9yUG9pbnQueCA/PyAwLjUsIHNwZWMuYW5jaG9yUG9pbnQueSA/PyAwLjUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNldCBub2RlIHByb3BlcnRpZXMgKHBvc2l0aW9uLCBzY2FsZSwgYWN0aXZlKVxyXG4gICAgaWYgKHNwZWMuYWN0aXZlID09PSBmYWxzZSkgbm9kZS5hY3RpdmUgPSBmYWxzZTtcclxuICAgIGlmIChzcGVjLnBvc2l0aW9uKSBub2RlLnNldFBvc2l0aW9uKHNwZWMucG9zaXRpb24ueCB8fCAwLCBzcGVjLnBvc2l0aW9uLnkgfHwgMCwgc3BlYy5wb3NpdGlvbi56IHx8IDApO1xyXG4gICAgaWYgKHNwZWMuc2NhbGUpIG5vZGUuc2V0U2NhbGUoc3BlYy5zY2FsZS54ID8/IDEsIHNwZWMuc2NhbGUueSA/PyAxLCBzcGVjLnNjYWxlLnogPz8gMSk7XHJcblxyXG4gICAgLy8gU2V0IFdpZGdldCBwcm9wZXJ0aWVzIGlmIHNwZWNpZmllZFxyXG4gICAgLy8gRm9ybWF0OiB7IHRvcDogMCwgYm90dG9tOiAwLCBsZWZ0OiAwLCByaWdodDogMCB9IOKAlCBlYWNoIGZpZWxkIGVuYWJsZXMgdGhlIGNvcnJlc3BvbmRpbmcgYWxpZ25tZW50XHJcbiAgICBpZiAoc3BlYy53aWRnZXQpIHtcclxuICAgICAgICBjb25zdCB7IFdpZGdldCB9ID0gcmVxdWlyZShcImNjXCIpO1xyXG4gICAgICAgIGxldCB3ID0gbm9kZS5nZXRDb21wb25lbnQoV2lkZ2V0KTtcclxuICAgICAgICBpZiAoIXcpIHcgPSBub2RlLmFkZENvbXBvbmVudChXaWRnZXQpO1xyXG4gICAgICAgIGNvbnN0IHdTcGVjID0gc3BlYy53aWRnZXQ7XHJcbiAgICAgICAgaWYgKHdTcGVjLnRvcCAhPT0gdW5kZWZpbmVkKSB7IHcuaXNBbGlnblRvcCA9IHRydWU7IHcudG9wID0gd1NwZWMudG9wOyB9XHJcbiAgICAgICAgaWYgKHdTcGVjLmJvdHRvbSAhPT0gdW5kZWZpbmVkKSB7IHcuaXNBbGlnbkJvdHRvbSA9IHRydWU7IHcuYm90dG9tID0gd1NwZWMuYm90dG9tOyB9XHJcbiAgICAgICAgaWYgKHdTcGVjLmxlZnQgIT09IHVuZGVmaW5lZCkgeyB3LmlzQWxpZ25MZWZ0ID0gdHJ1ZTsgdy5sZWZ0ID0gd1NwZWMubGVmdDsgfVxyXG4gICAgICAgIGlmICh3U3BlYy5yaWdodCAhPT0gdW5kZWZpbmVkKSB7IHcuaXNBbGlnblJpZ2h0ID0gdHJ1ZTsgdy5yaWdodCA9IHdTcGVjLnJpZ2h0OyB9XHJcbiAgICAgICAgaWYgKHdTcGVjLmhvcml6b250YWxDZW50ZXIgIT09IHVuZGVmaW5lZCkgeyB3LmlzQWxpZ25Ib3Jpem9udGFsQ2VudGVyID0gdHJ1ZTsgdy5ob3Jpem9udGFsQ2VudGVyID0gd1NwZWMuaG9yaXpvbnRhbENlbnRlcjsgfVxyXG4gICAgICAgIGlmICh3U3BlYy52ZXJ0aWNhbENlbnRlciAhPT0gdW5kZWZpbmVkKSB7IHcuaXNBbGlnblZlcnRpY2FsQ2VudGVyID0gdHJ1ZTsgdy52ZXJ0aWNhbENlbnRlciA9IHdTcGVjLnZlcnRpY2FsQ2VudGVyOyB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQnVpbGQgY2hpbGRyZW5cclxuICAgIGNvbnN0IGNoaWxkUmVzdWx0czogYW55W10gPSBbXTtcclxuICAgIGlmIChzcGVjLmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkoc3BlYy5jaGlsZHJlbikpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkU3BlYyBvZiBzcGVjLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIGNoaWxkUmVzdWx0cy5wdXNoKGJ1aWxkTm9kZVJlY3Vyc2l2ZShub2RlLCBjaGlsZFNwZWMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHsgdXVpZDogbm9kZS51dWlkLCBuYW1lOiBub2RlLm5hbWUsIGNoaWxkcmVuOiBjaGlsZFJlc3VsdHMgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29sbGVjdE5vZGVJbmZvKG5vZGU6IGFueSwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4gPSBmYWxzZSk6IGFueSB7XHJcbiAgICBjb25zdCBpbmZvOiBhbnkgPSB7XHJcbiAgICAgICAgdXVpZDogbm9kZS51dWlkLFxyXG4gICAgICAgIG5hbWU6IG5vZGUubmFtZSxcclxuICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxyXG4gICAgICAgIHBvc2l0aW9uOiB7IHg6IG5vZGUucG9zaXRpb24ueCwgeTogbm9kZS5wb3NpdGlvbi55LCB6OiBub2RlLnBvc2l0aW9uLnogfSxcclxuICAgICAgICBzY2FsZTogeyB4OiBub2RlLnNjYWxlLngsIHk6IG5vZGUuc2NhbGUueSwgejogbm9kZS5zY2FsZS56IH0sXHJcbiAgICAgICAgcGFyZW50OiBub2RlLnBhcmVudD8udXVpZCB8fCBudWxsLFxyXG4gICAgICAgIGNoaWxkQ291bnQ6IG5vZGUuY2hpbGRyZW4/Lmxlbmd0aCB8fCAwLFxyXG4gICAgfTtcclxuICAgIGlmIChpbmNsdWRlQ29tcG9uZW50cyAmJiBub2RlLmNvbXBvbmVudHMpIHtcclxuICAgICAgICBpbmZvLmNvbXBvbmVudHMgPSBub2RlLmNvbXBvbmVudHMubWFwKChjOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgIHR5cGU6IGMuY29uc3RydWN0b3IubmFtZSxcclxuICAgICAgICAgICAgdXVpZDogYy51dWlkLFxyXG4gICAgICAgICAgICBlbmFibGVkOiBjLmVuYWJsZWQsXHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGluZm87XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBtZXRob2RzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IGFueT4gPSB7XHJcbiAgICBnZXRTY2VuZUhpZXJhcmNoeShpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBnZXRTY2VuZSgpO1xyXG4gICAgICAgICAgICBpZiAoIXNjZW5lKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFwiTm8gYWN0aXZlIHNjZW5lXCIgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHdhbGsgPSAobm9kZTogYW55KTogYW55ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW06IGFueSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGlmIChpbmNsdWRlQ29tcG9uZW50cyAmJiBub2RlLmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbXBvbmVudHMgPSBub2RlLmNvbXBvbmVudHMubWFwKChjOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGMuY29uc3RydWN0b3IubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYy51dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBjLmVuYWJsZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbi5tYXAoKGNoOiBhbnkpID0+IHdhbGsoY2gpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzY2VuZU5hbWU6IHNjZW5lLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBzY2VuZVV1aWQ6IHNjZW5lLnV1aWQsXHJcbiAgICAgICAgICAgICAgICBoaWVyYXJjaHk6IHNjZW5lLmNoaWxkcmVuLm1hcCgoY2g6IGFueSkgPT4gd2FsayhjaCkpLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0Tm9kZUluZm8odXVpZDogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlKHV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJHt1dWlkfSBub3QgZm91bmRgIH07XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGNvbGxlY3ROb2RlSW5mbyhub2RlLCB0cnVlKSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QWxsTm9kZXMoKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBnZXRTY2VuZSgpO1xyXG4gICAgICAgICAgICBpZiAoIXNjZW5lKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFwiTm8gYWN0aXZlIHNjZW5lXCIgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCB3YWxrID0gKG5vZGU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbm9kZXMucHVzaChjb2xsZWN0Tm9kZUluZm8obm9kZSkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCh3YWxrKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgc2NlbmUuY2hpbGRyZW4uZm9yRWFjaCh3YWxrKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogbm9kZXMgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5oyH5a6a44OO44O844OJ44Gu5a2Q5a2r44GL44KJ5ZCN5YmN44Gn5qSc57Si44GZ44KL44CCYXV0b19iaW5kIOeUqOOAglxyXG4gICAgICogcm9vdFV1aWQg44GM56m644Gu5aC05ZCI44Gv44K344O844Oz5YWo5L2T44KS5qSc57Si77yI5b6M5pa55LqS5o+b77yJ44CCXHJcbiAgICAgKi9cclxuICAgIGZpbmREZXNjZW5kYW50c0J5TmFtZShyb290VXVpZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgcm9vdDogYW55O1xyXG4gICAgICAgICAgICBpZiAocm9vdFV1aWQpIHtcclxuICAgICAgICAgICAgICAgIHJvb3QgPSBmaW5kTm9kZShyb290VXVpZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXJvb3QpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFJvb3Qgbm9kZSAke3Jvb3RVdWlkfSBub3QgZm91bmRgIH07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByb290ID0gZ2V0U2NlbmUoKTtcclxuICAgICAgICAgICAgICAgIGlmICghcm9vdCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBcIk5vIGFjdGl2ZSBzY2VuZVwiIH07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHdhbGsgPSAobm9kZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5uYW1lID09PSBuYW1lKSByZXN1bHRzLnB1c2goY29sbGVjdE5vZGVJbmZvKG5vZGUpKTtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSBub2RlLmNoaWxkcmVuLmZvckVhY2god2Fsayk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChyb290LmNoaWxkcmVuKSByb290LmNoaWxkcmVuLmZvckVhY2god2Fsayk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdHMgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5oyH5a6a44OO44O844OJ44Gu5YWo5a2Q5a2r44KSIGRlcHRoIOS7mOOBjeOBp+i/lOOBmeOAgmF1dG9fYmluZCDjga7kuIDmi6zmpJzntKLnlKjjgIJcclxuICAgICAqL1xyXG4gICAgZ2V0QWxsRGVzY2VuZGFudHMocm9vdFV1aWQ6IHN0cmluZykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBmaW5kTm9kZShyb290VXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghcm9vdCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSAke3Jvb3RVdWlkfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzOiBBcnJheTx7dXVpZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGRlcHRoOiBudW1iZXJ9PiA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCB3YWxrID0gKG5vZGU6IGFueSwgZGVwdGg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgdXVpZDogbm9kZS51dWlkLCBuYW1lOiBub2RlLm5hbWUsIGRlcHRoIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoYzogYW55KSA9PiB3YWxrKGMsIGRlcHRoICsgMSkpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAocm9vdC5jaGlsZHJlbikgcm9vdC5jaGlsZHJlbi5mb3JFYWNoKChjOiBhbnkpID0+IHdhbGsoYywgMSkpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHRzIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBmaW5kTm9kZXNCeU5hbWUobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBnZXRTY2VuZSgpO1xyXG4gICAgICAgICAgICBpZiAoIXNjZW5lKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFwiTm8gYWN0aXZlIHNjZW5lXCIgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHdhbGsgPSAobm9kZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5uYW1lID09PSBuYW1lKSByZXN1bHRzLnB1c2goY29sbGVjdE5vZGVJbmZvKG5vZGUpKTtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSBub2RlLmNoaWxkcmVuLmZvckVhY2god2Fsayk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHNjZW5lLmNoaWxkcmVuLmZvckVhY2god2Fsayk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdHMgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbmROb2RlQnlQYXRoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gZ2V0U2NlbmUoKTtcclxuICAgICAgICAgICAgaWYgKCFzY2VuZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBcIk5vIGFjdGl2ZSBzY2VuZVwiIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHBhdGguc3BsaXQoXCIvXCIpO1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudDogYW55ID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHdhbGsgPSAobm9kZTogYW55KTogYW55ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLm5hbWUgPT09IHBhcnRzWzBdKSByZXR1cm4gbm9kZTtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gd2FsayhjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHNjZW5lLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gd2FsayhjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCkgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFjdXJyZW50KSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIFwiJHtwYXJ0c1swXX1cIiBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IGN1cnJlbnQuY2hpbGRyZW4/LmZpbmQoKGM6IGFueSkgPT4gYy5uYW1lID09PSBwYXJ0c1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNoaWxkKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDaGlsZCBcIiR7cGFydHNbaV19XCIgbm90IGZvdW5kIGluIFwiJHtjdXJyZW50Lm5hbWV9XCJgIH07XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY2hpbGQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGNvbGxlY3ROb2RlSW5mbyhjdXJyZW50KSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2V0Tm9kZVByb3BlcnR5KHV1aWQ6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZSh1dWlkKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlICR7dXVpZH0gbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInBvc2l0aW9uXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRQb3NpdGlvbih2YWx1ZS54ID8/IDAsIHZhbHVlLnkgPz8gMCwgdmFsdWUueiA/PyAwKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJyb3RhdGlvblwiOlxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0Um90YXRpb25Gcm9tRXVsZXIodmFsdWUueCA/PyAwLCB2YWx1ZS55ID8/IDAsIHZhbHVlLnogPz8gMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic2NhbGVcIjpcclxuICAgICAgICAgICAgICAgICAgICBub2RlLnNldFNjYWxlKHZhbHVlLnggPz8gMSwgdmFsdWUueSA/PyAxLCB2YWx1ZS56ID8/IDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImFjdGl2ZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuYWN0aXZlID0gISF2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5uYW1lID0gU3RyaW5nKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgKG5vZGUgYXMgYW55KVtwcm9wZXJ0eV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZXRDb21wb25lbnRQcm9wZXJ0eSh1dWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsganMgfSA9IHJlcXVpcmUoXCJjY1wiKTtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlKHV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJHt1dWlkfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBDb21wQ2xhc3MgPSBqcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcclxuICAgICAgICAgICAgaWYgKCFDb21wQ2xhc3MpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCBjbGFzcyAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBub2RlLmdldENvbXBvbmVudChDb21wQ2xhc3MpO1xyXG4gICAgICAgICAgICBpZiAoIWNvbXApIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBvbiBub2RlICR7dXVpZH1gIH07XHJcblxyXG4gICAgICAgICAgICBjb21wW3Byb3BlcnR5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBhZGRDb21wb25lbnRUb05vZGUodXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGpzIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZSh1dWlkKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlICR7dXVpZH0gbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgQ29tcENsYXNzID0ganMuZ2V0Q2xhc3NCeU5hbWUoY29tcG9uZW50VHlwZSk7XHJcbiAgICAgICAgICAgIGlmICghQ29tcENsYXNzKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgY2xhc3MgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb21wID0gbm9kZS5hZGRDb21wb25lbnQoQ29tcENsYXNzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogeyB1dWlkOiBjb21wLnV1aWQsIHR5cGU6IGNvbXBvbmVudFR5cGUgfSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgbW92ZU5vZGUodXVpZDogc3RyaW5nLCBwYXJlbnRVdWlkOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGUodXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGAgfTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gZmluZE5vZGUocGFyZW50VXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50KSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBQYXJlbnQgJHtwYXJlbnRVdWlkfSBub3QgZm91bmRgIH07XHJcbiAgICAgICAgICAgIG5vZGUuc2V0UGFyZW50KHBhcmVudCk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQnVpbGQgYSBub2RlIHRyZWUgZnJvbSBhIEpTT04gc3BlYyBpbiBvbmUgY2FsbC5cclxuICAgICAqIFNwZWMgZm9ybWF0OlxyXG4gICAgICoge1xyXG4gICAgICogICBuYW1lOiBzdHJpbmcsXHJcbiAgICAgKiAgIGNvbXBvbmVudHM/OiBzdHJpbmdbXSwgICAgICAgICAgICAvLyBlLmcuIFtcImNjLlVJVHJhbnNmb3JtXCIsIFwiY2MuTGF5b3V0XCJdXHJcbiAgICAgKiAgIHByb3BlcnRpZXM/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCAvLyBlLmcuIHsgXCJjYy5VSVRyYW5zZm9ybS5jb250ZW50U2l6ZVwiOiB7d2lkdGg6NzIwLGhlaWdodDoxMjgwfSB9XHJcbiAgICAgKiAgIGNoaWxkcmVuPzogTm9kZVNwZWNbXVxyXG4gICAgICogfVxyXG4gICAgICovXHJcbiAgICBidWlsZE5vZGVUcmVlKHBhcmVudFV1aWQ6IHN0cmluZywgc3BlYzogYW55KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBOb2RlLCBqcywgVUlUcmFuc2Zvcm0gfSA9IHJlcXVpcmUoXCJjY1wiKTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gZmluZE5vZGUocGFyZW50VXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50KSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBQYXJlbnQgJHtwYXJlbnRVdWlkfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBidWlsZE5vZGVSZWN1cnNpdmUocGFyZW50LCBzcGVjKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0IH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXN0TG9nKG1lc3NhZ2U6IHN0cmluZyA9IFwidGVzdCBtZXNzYWdlXCIpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlt0ZXN0TG9nXVwiLCBtZXNzYWdlKTtcclxuICAgICAgICBjb25zdCBtZXRob2RzID0gT2JqZWN0LmtleXMoZXhwb3J0cy5tZXRob2RzIHx8IHt9KTtcclxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBidWZmZXJTaXplOiBfY29uc29sZUxvZ3MubGVuZ3RoLCBtZXRob2RzIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldENvbnNvbGVMb2dzKGNvdW50OiBudW1iZXIgPSA1MCwgbGV2ZWw/OiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgbG9ncyA9IF9jb25zb2xlTG9ncztcclxuICAgICAgICBpZiAobGV2ZWwpIHtcclxuICAgICAgICAgICAgbG9ncyA9IGxvZ3MuZmlsdGVyKGwgPT4gbC5sZXZlbCA9PT0gbGV2ZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBsb2dzOiBsb2dzLnNsaWNlKC1jb3VudCksIHRvdGFsOiBfY29uc29sZUxvZ3MubGVuZ3RoIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyQ29uc29sZUxvZ3MoKSB7XHJcbiAgICAgICAgX2NvbnNvbGVMb2dzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBhc3luYyBzZXRQcm9wZXJ0eVZpYUVkaXRvcihub2RlVXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGR1bXA6IGFueSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIHNjZW5lOnNldC1wcm9wZXJ0eSBBUElcclxuICAgICAgICAgICAgLy8gdXVpZDog44OO44O844OJVVVJRO+8iOOCs+ODs+ODneODvOODjeODs+ODiFVVSUTjgafjga/jgarjgYTvvIlcclxuICAgICAgICAgICAgLy8gcGF0aDogX19jb21wc19fLntpbmRleH0ue3Byb3BlcnR5fSDlvaLlvI9cclxuICAgICAgICAgICAgLy8gZHVtcDogeyB2YWx1ZSwgdHlwZSB9IOW9ouW8j1xyXG4gICAgICAgICAgICBjb25zdCBvcHRzID0geyB1dWlkOiBub2RlVXVpZCwgcGF0aCwgZHVtcCB9O1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yIGFzIGFueSkuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJzZXQtcHJvcGVydHlcIiwgb3B0cyk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdCB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB8fCBTdHJpbmcoZSkgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNvbXBvbmVudEZyb21Ob2RlKHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBqcyB9ID0gcmVxdWlyZShcImNjXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGUodXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IENvbXBDbGFzcyA9IGpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xyXG4gICAgICAgICAgICBpZiAoIUNvbXBDbGFzcykgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IGNsYXNzICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29tcCA9IG5vZGUuZ2V0Q29tcG9uZW50KENvbXBDbGFzcyk7XHJcbiAgICAgICAgICAgIGlmICghY29tcCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IG9uIG5vZGVgIH07XHJcblxyXG4gICAgICAgICAgICBub2RlLnJlbW92ZUNvbXBvbmVudChjb21wKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbn07XHJcbiJdfQ==