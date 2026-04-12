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
                    // Label: useSystemFont=true で文字化け防止（フォントは後から設定可）
                    if (comp instanceof Label) {
                        comp.useSystemFont = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7OztBQUVILCtCQUE0QjtBQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBVXpELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUMzQixNQUFNLFlBQVksR0FBc0IsRUFBRSxDQUFDO0FBRTNDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDakMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNuQyxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBRXJDLFNBQVMsVUFBVSxDQUFDLElBQVc7SUFDM0IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2hCLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUTtZQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQztZQUFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7UUFBQyxXQUFNLENBQUM7WUFBQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7SUFDakUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxLQUErQixFQUFFLElBQVc7SUFDekQsWUFBWSxDQUFDLElBQUksQ0FBQztRQUNkLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtRQUNuQyxLQUFLO1FBQ0wsT0FBTyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7S0FDNUIsQ0FBQyxDQUFDO0lB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RSxNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxTQUFTO2dCQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsYUFBYSxZQUFZLEVBQUUsQ0FBQztZQUUvRixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxJQUFJO2dCQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLGFBQWEsY0FBYyxFQUFFLENBQUM7WUFFdEYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQixPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoRCxDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogU2NlbmUgc2NyaXB0IOKAlCBydW5zIGluc2lkZSBDb2Nvc0NyZWF0b3IncyBzY2VuZSByZW5kZXJlciBwcm9jZXNzLlxyXG4gKiBUaGVzZSBtZXRob2RzIGFyZSBjYWxsZWQgdmlhIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0JywgLi4uKVxyXG4gKiBhbmQgaGF2ZSBhY2Nlc3MgdG8gdGhlIGBjY2AgbW9kdWxlIChlbmdpbmUgcnVudGltZSkuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgam9pbiB9IGZyb20gXCJwYXRoXCI7XHJcbm1vZHVsZS5wYXRocy5wdXNoKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCBcIm5vZGVfbW9kdWxlc1wiKSk7XHJcblxyXG4vLyDilIDilIDilIAgQ29uc29sZSBMb2cgQnVmZmVyIOKUgOKUgOKUgFxyXG5cclxuaW50ZXJmYWNlIENvbnNvbGVMb2dFbnRyeSB7XHJcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcclxuICAgIGxldmVsOiBcImxvZ1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCI7XHJcbiAgICBtZXNzYWdlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IE1BWF9MT0dfQlVGRkVSID0gNTAwO1xyXG5jb25zdCBfY29uc29sZUxvZ3M6IENvbnNvbGVMb2dFbnRyeVtdID0gW107XHJcblxyXG5jb25zdCBfb3JpZ2luYWxMb2cgPSBjb25zb2xlLmxvZztcclxuY29uc3QgX29yaWdpbmFsV2FybiA9IGNvbnNvbGUud2FybjtcclxuY29uc3QgX29yaWdpbmFsRXJyb3IgPSBjb25zb2xlLmVycm9yO1xyXG5cclxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzOiBhbnlbXSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYXJncy5tYXAoYSA9PiB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhID09PSBcInN0cmluZ1wiKSByZXR1cm4gYTtcclxuICAgICAgICB0cnkgeyByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYSk7IH0gY2F0Y2ggeyByZXR1cm4gU3RyaW5nKGEpOyB9XHJcbiAgICB9KS5qb2luKFwiIFwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHVzaExvZyhsZXZlbDogQ29uc29sZUxvZ0VudHJ5W1wibGV2ZWxcIl0sIGFyZ3M6IGFueVtdKTogdm9pZCB7XHJcbiAgICBfY29uc29sZUxvZ3MucHVzaCh7XHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgbGV2ZWwsXHJcbiAgICAgICAgbWVzc2FnZTogZm9ybWF0QXJncyhhcmdzKSxcclxuICAgIH0pO1xyXG4gICAgaWYgKF9jb25zb2xlTG9ncy5sZW5ndGggPiBNQVhfTE9HX0JVRkZFUikge1xyXG4gICAgICAgIF9jb25zb2xlTG9ncy5zcGxpY2UoMCwgX2NvbnNvbGVMb2dzLmxlbmd0aCAtIE1BWF9MT0dfQlVGRkVSKTtcclxuICAgIH1cclxufVxyXG5cclxuY29uc29sZS5sb2cgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuICAgIF9vcmlnaW5hbExvZy5hcHBseShjb25zb2xlLCBhcmdzKTtcclxuICAgIHB1c2hMb2coXCJsb2dcIiwgYXJncyk7XHJcbn07XHJcblxyXG5jb25zb2xlLndhcm4gPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuICAgIF9vcmlnaW5hbFdhcm4uYXBwbHkoY29uc29sZSwgYXJncyk7XHJcbiAgICBwdXNoTG9nKFwid2FyblwiLCBhcmdzKTtcclxufTtcclxuXHJcbmNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuICAgIF9vcmlnaW5hbEVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xyXG4gICAgcHVzaExvZyhcImVycm9yXCIsIGFyZ3MpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZ2V0U2NlbmUoKSB7XHJcbiAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICByZXR1cm4gZGlyZWN0b3IuZ2V0U2NlbmUoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE5vZGUodXVpZDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBzY2VuZSA9IGdldFNjZW5lKCk7XHJcbiAgICBpZiAoIXNjZW5lKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAvLyBSZWN1cnNpdmUgc2VhcmNoIOKAlCBnZXRDaGlsZEJ5VXVpZCBpcyBub3QgcmVjdXJzaXZlIGluIGNjXHJcbiAgICBjb25zdCBxdWV1ZSA9IFsuLi5zY2VuZS5jaGlsZHJlbl07XHJcbiAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBxdWV1ZS5zaGlmdCgpITtcclxuICAgICAgICBpZiAobm9kZS51dWlkID09PSB1dWlkKSByZXR1cm4gbm9kZTtcclxuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgcXVldWUucHVzaCguLi5ub2RlLmNoaWxkcmVuKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG4vKipcclxuICogUmVjdXJzaXZlbHkgYnVpbGQgYSBub2RlIHRyZWUgZnJvbSBhIEpTT04gc3BlYy5cclxuICogUmV0dXJucyB7IHV1aWQsIG5hbWUsIGNoaWxkcmVuOiBbLi4uXSB9XHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZE5vZGVSZWN1cnNpdmUocGFyZW50OiBhbnksIHNwZWM6IGFueSk6IGFueSB7XHJcbiAgICBjb25zdCB7IE5vZGUsIGpzLCBWZWMzIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcblxyXG4gICAgY29uc3Qgbm9kZSA9IG5ldyBOb2RlKHNwZWMubmFtZSB8fCBcIk5vZGVcIik7XHJcbiAgICBwYXJlbnQuYWRkQ2hpbGQobm9kZSk7XHJcblxyXG4gICAgLy8gQWRkIGNvbXBvbmVudHNcclxuICAgIGlmIChzcGVjLmNvbXBvbmVudHMgJiYgQXJyYXkuaXNBcnJheShzcGVjLmNvbXBvbmVudHMpKSB7XHJcbiAgICAgICAgY29uc3QgeyBTcHJpdGUsIExhYmVsIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICAgICAgZm9yIChjb25zdCBjb21wTmFtZSBvZiBzcGVjLmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgY29uc3QgQ29tcENsYXNzID0ganMuZ2V0Q2xhc3NCeU5hbWUoY29tcE5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoQ29tcENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUuZ2V0Q29tcG9uZW50KENvbXBDbGFzcykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gbm9kZS5hZGRDb21wb25lbnQoQ29tcENsYXNzKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTcHJpdGU6IHNpemVNb2RlPUNVU1RPTSDjgadVSVRyYW5zZm9ybeOCteOCpOOCuuOBruS4iuabuOOBjeOCkumYsuOBkFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wIGluc3RhbmNlb2YgU3ByaXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAuc2l6ZU1vZGUgPSAwOyAvLyBTaXplTW9kZS5DVVNUT01cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTGFiZWw6IHVzZVN5c3RlbUZvbnQ9dHJ1ZSDjgafmloflrZfljJbjgZHpmLLmraLvvIjjg5Xjgqnjg7Pjg4jjga/lvozjgYvjgonoqK3lrprlj6/vvIlcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcCBpbnN0YW5jZW9mIExhYmVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudXNlU3lzdGVtRm9udCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNldCBjb21wb25lbnQgcHJvcGVydGllc1xyXG4gICAgLy8gRm9ybWF0OiB7IFwiY2MuVUlUcmFuc2Zvcm0uY29udGVudFNpemVcIjoge3dpZHRoOjcyMCwgaGVpZ2h0OjEyODB9IH1cclxuICAgIGlmIChzcGVjLnByb3BlcnRpZXMpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzcGVjLnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRvdElkeCA9IGtleS5sYXN0SW5kZXhPZihcIi5cIik7XHJcbiAgICAgICAgICAgIGlmIChkb3RJZHggPCAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgY29tcE5hbWUgPSBrZXkuc3Vic3RyaW5nKDAsIGRvdElkeCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0ga2V5LnN1YnN0cmluZyhkb3RJZHggKyAxKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IENvbXBDbGFzcyA9IGpzLmdldENsYXNzQnlOYW1lKGNvbXBOYW1lKTtcclxuICAgICAgICAgICAgaWYgKCFDb21wQ2xhc3MpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zdCBjb21wID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcENsYXNzKTtcclxuICAgICAgICAgICAgaWYgKCFjb21wKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb250ZW50U2l6ZSBuZWVkcyBzcGVjaWFsIGhhbmRsaW5nIChTaXplIHR5cGUpXHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcE5hbWUgPT09IFwiY29udGVudFNpemVcIiAmJiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21wLnNldENvbnRlbnRTaXplKCh2YWx1ZSBhcyBhbnkpLndpZHRoID8/IDAsICh2YWx1ZSBhcyBhbnkpLmhlaWdodCA/PyAwKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcFtwcm9wTmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIHNraXAgaW52YWxpZCBwcm9wZXJ0eSAqLyB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNldCBVSVRyYW5zZm9ybSBhbmNob3JQb2ludCBpZiBzcGVjaWZpZWRcclxuICAgIGlmIChzcGVjLmFuY2hvclBvaW50KSB7XHJcbiAgICAgICAgY29uc3QgeyBVSVRyYW5zZm9ybSB9ID0gcmVxdWlyZShcImNjXCIpO1xyXG4gICAgICAgIGNvbnN0IHV0ID0gbm9kZS5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pO1xyXG4gICAgICAgIGlmICh1dCkgdXQuc2V0QW5jaG9yUG9pbnQoc3BlYy5hbmNob3JQb2ludC54ID8/IDAuNSwgc3BlYy5hbmNob3JQb2ludC55ID8/IDAuNSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0IG5vZGUgcHJvcGVydGllcyAocG9zaXRpb24sIHNjYWxlLCBhY3RpdmUpXHJcbiAgICBpZiAoc3BlYy5hY3RpdmUgPT09IGZhbHNlKSBub2RlLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgaWYgKHNwZWMucG9zaXRpb24pIG5vZGUuc2V0UG9zaXRpb24oc3BlYy5wb3NpdGlvbi54IHx8IDAsIHNwZWMucG9zaXRpb24ueSB8fCAwLCBzcGVjLnBvc2l0aW9uLnogfHwgMCk7XHJcbiAgICBpZiAoc3BlYy5zY2FsZSkgbm9kZS5zZXRTY2FsZShzcGVjLnNjYWxlLnggPz8gMSwgc3BlYy5zY2FsZS55ID8/IDEsIHNwZWMuc2NhbGUueiA/PyAxKTtcclxuXHJcbiAgICAvLyBTZXQgV2lkZ2V0IHByb3BlcnRpZXMgaWYgc3BlY2lmaWVkXHJcbiAgICAvLyBGb3JtYXQ6IHsgdG9wOiAwLCBib3R0b206IDAsIGxlZnQ6IDAsIHJpZ2h0OiAwIH0g4oCUIGVhY2ggZmllbGQgZW5hYmxlcyB0aGUgY29ycmVzcG9uZGluZyBhbGlnbm1lbnRcclxuICAgIGlmIChzcGVjLndpZGdldCkge1xyXG4gICAgICAgIGNvbnN0IHsgV2lkZ2V0IH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICAgICAgbGV0IHcgPSBub2RlLmdldENvbXBvbmVudChXaWRnZXQpO1xyXG4gICAgICAgIGlmICghdykgdyA9IG5vZGUuYWRkQ29tcG9uZW50KFdpZGdldCk7XHJcbiAgICAgICAgY29uc3Qgd1NwZWMgPSBzcGVjLndpZGdldDtcclxuICAgICAgICBpZiAod1NwZWMudG9wICE9PSB1bmRlZmluZWQpIHsgdy5pc0FsaWduVG9wID0gdHJ1ZTsgdy50b3AgPSB3U3BlYy50b3A7IH1cclxuICAgICAgICBpZiAod1NwZWMuYm90dG9tICE9PSB1bmRlZmluZWQpIHsgdy5pc0FsaWduQm90dG9tID0gdHJ1ZTsgdy5ib3R0b20gPSB3U3BlYy5ib3R0b207IH1cclxuICAgICAgICBpZiAod1NwZWMubGVmdCAhPT0gdW5kZWZpbmVkKSB7IHcuaXNBbGlnbkxlZnQgPSB0cnVlOyB3LmxlZnQgPSB3U3BlYy5sZWZ0OyB9XHJcbiAgICAgICAgaWYgKHdTcGVjLnJpZ2h0ICE9PSB1bmRlZmluZWQpIHsgdy5pc0FsaWduUmlnaHQgPSB0cnVlOyB3LnJpZ2h0ID0gd1NwZWMucmlnaHQ7IH1cclxuICAgICAgICBpZiAod1NwZWMuaG9yaXpvbnRhbENlbnRlciAhPT0gdW5kZWZpbmVkKSB7IHcuaXNBbGlnbkhvcml6b250YWxDZW50ZXIgPSB0cnVlOyB3Lmhvcml6b250YWxDZW50ZXIgPSB3U3BlYy5ob3Jpem9udGFsQ2VudGVyOyB9XHJcbiAgICAgICAgaWYgKHdTcGVjLnZlcnRpY2FsQ2VudGVyICE9PSB1bmRlZmluZWQpIHsgdy5pc0FsaWduVmVydGljYWxDZW50ZXIgPSB0cnVlOyB3LnZlcnRpY2FsQ2VudGVyID0gd1NwZWMudmVydGljYWxDZW50ZXI7IH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBCdWlsZCBjaGlsZHJlblxyXG4gICAgY29uc3QgY2hpbGRSZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgaWYgKHNwZWMuY2hpbGRyZW4gJiYgQXJyYXkuaXNBcnJheShzcGVjLmNoaWxkcmVuKSkge1xyXG4gICAgICAgIGZvciAoY29uc3QgY2hpbGRTcGVjIG9mIHNwZWMuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgY2hpbGRSZXN1bHRzLnB1c2goYnVpbGROb2RlUmVjdXJzaXZlKG5vZGUsIGNoaWxkU3BlYykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geyB1dWlkOiBub2RlLnV1aWQsIG5hbWU6IG5vZGUubmFtZSwgY2hpbGRyZW46IGNoaWxkUmVzdWx0cyB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb2xsZWN0Tm9kZUluZm8obm9kZTogYW55LCBpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbiA9IGZhbHNlKTogYW55IHtcclxuICAgIGNvbnN0IGluZm86IGFueSA9IHtcclxuICAgICAgICB1dWlkOiBub2RlLnV1aWQsXHJcbiAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxyXG4gICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXHJcbiAgICAgICAgcG9zaXRpb246IHsgeDogbm9kZS5wb3NpdGlvbi54LCB5OiBub2RlLnBvc2l0aW9uLnksIHo6IG5vZGUucG9zaXRpb24ueiB9LFxyXG4gICAgICAgIHNjYWxlOiB7IHg6IG5vZGUuc2NhbGUueCwgeTogbm9kZS5zY2FsZS55LCB6OiBub2RlLnNjYWxlLnogfSxcclxuICAgICAgICBwYXJlbnQ6IG5vZGUucGFyZW50Py51dWlkIHx8IG51bGwsXHJcbiAgICAgICAgY2hpbGRDb3VudDogbm9kZS5jaGlsZHJlbj8ubGVuZ3RoIHx8IDAsXHJcbiAgICB9O1xyXG4gICAgaWYgKGluY2x1ZGVDb21wb25lbnRzICYmIG5vZGUuY29tcG9uZW50cykge1xyXG4gICAgICAgIGluZm8uY29tcG9uZW50cyA9IG5vZGUuY29tcG9uZW50cy5tYXAoKGM6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgdHlwZTogYy5jb25zdHJ1Y3Rvci5uYW1lLFxyXG4gICAgICAgICAgICB1dWlkOiBjLnV1aWQsXHJcbiAgICAgICAgICAgIGVuYWJsZWQ6IGMuZW5hYmxlZCxcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5mbztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IFJlY29yZDxzdHJpbmcsICguLi5hcmdzOiBhbnlbXSkgPT4gYW55PiA9IHtcclxuICAgIGdldFNjZW5lSGllcmFyY2h5KGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGdldFNjZW5lKCk7XHJcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJObyBhY3RpdmUgc2NlbmVcIiB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgd2FsayA9IChub2RlOiBhbnkpOiBhbnkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbTogYW55ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVDb21wb25lbnRzICYmIG5vZGUuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY29tcG9uZW50cyA9IG5vZGUuY29tcG9uZW50cy5tYXAoKGM6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYy5jb25zdHJ1Y3Rvci5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBjLnV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGMuZW5hYmxlZCxcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuLm1hcCgoY2g6IGFueSkgPT4gd2FsayhjaCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNjZW5lTmFtZTogc2NlbmUubmFtZSxcclxuICAgICAgICAgICAgICAgIHNjZW5lVXVpZDogc2NlbmUudXVpZCxcclxuICAgICAgICAgICAgICAgIGhpZXJhcmNoeTogc2NlbmUuY2hpbGRyZW4ubWFwKChjaDogYW55KSA9PiB3YWxrKGNoKSksXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXROb2RlSW5mbyh1dWlkOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGUodXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogY29sbGVjdE5vZGVJbmZvKG5vZGUsIHRydWUpIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBbGxOb2RlcygpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGdldFNjZW5lKCk7XHJcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJObyBhY3RpdmUgc2NlbmVcIiB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgbm9kZXM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHdhbGsgPSAobm9kZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKGNvbGxlY3ROb2RlSW5mbyhub2RlKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKHdhbGspO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBzY2VuZS5jaGlsZHJlbi5mb3JFYWNoKHdhbGspO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmjIflrprjg47jg7zjg4njga7lrZDlravjgYvjgonlkI3liY3jgafmpJzntKLjgZnjgovjgIJhdXRvX2JpbmQg55So44CCXHJcbiAgICAgKiByb290VXVpZCDjgYznqbrjga7loLTlkIjjga/jgrfjg7zjg7PlhajkvZPjgpLmpJzntKLvvIjlvozmlrnkupLmj5vvvInjgIJcclxuICAgICAqL1xyXG4gICAgZmluZERlc2NlbmRhbnRzQnlOYW1lKHJvb3RVdWlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxldCByb290OiBhbnk7XHJcbiAgICAgICAgICAgIGlmIChyb290VXVpZCkge1xyXG4gICAgICAgICAgICAgICAgcm9vdCA9IGZpbmROb2RlKHJvb3RVdWlkKTtcclxuICAgICAgICAgICAgICAgIGlmICghcm9vdCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgUm9vdCBub2RlICR7cm9vdFV1aWR9IG5vdCBmb3VuZGAgfTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJvb3QgPSBnZXRTY2VuZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFwiTm8gYWN0aXZlIHNjZW5lXCIgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcclxuICAgICAgICAgICAgY29uc3Qgd2FsayA9IChub2RlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLm5hbWUgPT09IG5hbWUpIHJlc3VsdHMucHVzaChjb2xsZWN0Tm9kZUluZm8obm9kZSkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCh3YWxrKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKHJvb3QuY2hpbGRyZW4pIHJvb3QuY2hpbGRyZW4uZm9yRWFjaCh3YWxrKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0cyB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmjIflrprjg47jg7zjg4njga7lhajlrZDlravjgpIgZGVwdGgg5LuY44GN44Gn6L+U44GZ44CCYXV0b19iaW5kIOOBruS4gOaLrOaknOe0oueUqOOAglxyXG4gICAgICovXHJcbiAgICBnZXRBbGxEZXNjZW5kYW50cyhyb290VXVpZDogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgcm9vdCA9IGZpbmROb2RlKHJvb3RVdWlkKTtcclxuICAgICAgICAgICAgaWYgKCFyb290KSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlICR7cm9vdFV1aWR9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IEFycmF5PHt1dWlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgZGVwdGg6IG51bWJlcn0+ID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHdhbGsgPSAobm9kZTogYW55LCBkZXB0aDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyB1dWlkOiBub2RlLnV1aWQsIG5hbWU6IG5vZGUubmFtZSwgZGVwdGggfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjOiBhbnkpID0+IHdhbGsoYywgZGVwdGggKyAxKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChyb290LmNoaWxkcmVuKSByb290LmNoaWxkcmVuLmZvckVhY2goKGM6IGFueSkgPT4gd2FsayhjLCAxKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdHMgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbmROb2Rlc0J5TmFtZShuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGdldFNjZW5lKCk7XHJcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJObyBhY3RpdmUgc2NlbmVcIiB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcclxuICAgICAgICAgICAgY29uc3Qgd2FsayA9IChub2RlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLm5hbWUgPT09IG5hbWUpIHJlc3VsdHMucHVzaChjb2xsZWN0Tm9kZUluZm8obm9kZSkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCh3YWxrKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgc2NlbmUuY2hpbGRyZW4uZm9yRWFjaCh3YWxrKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0cyB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZmluZE5vZGVCeVBhdGgocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBnZXRTY2VuZSgpO1xyXG4gICAgICAgICAgICBpZiAoIXNjZW5lKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFwiTm8gYWN0aXZlIHNjZW5lXCIgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gcGF0aC5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50OiBhbnkgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgd2FsayA9IChub2RlOiBhbnkpOiBhbnkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUubmFtZSA9PT0gcGFydHNbMF0pIHJldHVybiBub2RlO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSB3YWxrKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygc2NlbmUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSB3YWxrKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50KSBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnQpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgXCIke3BhcnRzWzBdfVwiIG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY3VycmVudC5jaGlsZHJlbj8uZmluZCgoYzogYW55KSA9PiBjLm5hbWUgPT09IHBhcnRzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICghY2hpbGQpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENoaWxkIFwiJHtwYXJ0c1tpXX1cIiBub3QgZm91bmQgaW4gXCIke2N1cnJlbnQubmFtZX1cImAgfTtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjaGlsZDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogY29sbGVjdE5vZGVJbmZvKGN1cnJlbnQpIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZXROb2RlUHJvcGVydHkodXVpZDogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlKHV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJHt1dWlkfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwicG9zaXRpb25cIjpcclxuICAgICAgICAgICAgICAgICAgICBub2RlLnNldFBvc2l0aW9uKHZhbHVlLnggPz8gMCwgdmFsdWUueSA/PyAwLCB2YWx1ZS56ID8/IDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInJvdGF0aW9uXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRSb3RhdGlvbkZyb21FdWxlcih2YWx1ZS54ID8/IDAsIHZhbHVlLnkgPz8gMCwgdmFsdWUueiA/PyAwKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzY2FsZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0U2NhbGUodmFsdWUueCA/PyAxLCB2YWx1ZS55ID8/IDEsIHZhbHVlLnogPz8gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiYWN0aXZlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5hY3RpdmUgPSAhIXZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcclxuICAgICAgICAgICAgICAgICAgICBub2RlLm5hbWUgPSBTdHJpbmcodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAobm9kZSBhcyBhbnkpW3Byb3BlcnR5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNldENvbXBvbmVudFByb3BlcnR5KHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBqcyB9ID0gcmVxdWlyZShcImNjXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGUodXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IENvbXBDbGFzcyA9IGpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xyXG4gICAgICAgICAgICBpZiAoIUNvbXBDbGFzcykgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IGNsYXNzICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29tcCA9IG5vZGUuZ2V0Q29tcG9uZW50KENvbXBDbGFzcyk7XHJcbiAgICAgICAgICAgIGlmICghY29tcCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IG9uIG5vZGUgJHt1dWlkfWAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbXBbcHJvcGVydHldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZENvbXBvbmVudFRvTm9kZSh1dWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsganMgfSA9IHJlcXVpcmUoXCJjY1wiKTtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlKHV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJHt1dWlkfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBDb21wQ2xhc3MgPSBqcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcclxuICAgICAgICAgICAgaWYgKCFDb21wQ2xhc3MpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCBjbGFzcyAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBub2RlLmFkZENvbXBvbmVudChDb21wQ2xhc3MpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB7IHV1aWQ6IGNvbXAudXVpZCwgdHlwZTogY29tcG9uZW50VHlwZSB9IH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBtb3ZlTm9kZSh1dWlkOiBzdHJpbmcsIHBhcmVudFV1aWQ6IHN0cmluZykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZSh1dWlkKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlICR7dXVpZH0gbm90IGZvdW5kYCB9O1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBmaW5kTm9kZShwYXJlbnRVdWlkKTtcclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFBhcmVudCAke3BhcmVudFV1aWR9IG5vdCBmb3VuZGAgfTtcclxuICAgICAgICAgICAgbm9kZS5zZXRQYXJlbnQocGFyZW50KTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCdWlsZCBhIG5vZGUgdHJlZSBmcm9tIGEgSlNPTiBzcGVjIGluIG9uZSBjYWxsLlxyXG4gICAgICogU3BlYyBmb3JtYXQ6XHJcbiAgICAgKiB7XHJcbiAgICAgKiAgIG5hbWU6IHN0cmluZyxcclxuICAgICAqICAgY29tcG9uZW50cz86IHN0cmluZ1tdLCAgICAgICAgICAgIC8vIGUuZy4gW1wiY2MuVUlUcmFuc2Zvcm1cIiwgXCJjYy5MYXlvdXRcIl1cclxuICAgICAqICAgcHJvcGVydGllcz86IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGUuZy4geyBcImNjLlVJVHJhbnNmb3JtLmNvbnRlbnRTaXplXCI6IHt3aWR0aDo3MjAsaGVpZ2h0OjEyODB9IH1cclxuICAgICAqICAgY2hpbGRyZW4/OiBOb2RlU3BlY1tdXHJcbiAgICAgKiB9XHJcbiAgICAgKi9cclxuICAgIGJ1aWxkTm9kZVRyZWUocGFyZW50VXVpZDogc3RyaW5nLCBzcGVjOiBhbnkpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IE5vZGUsIGpzLCBVSVRyYW5zZm9ybSB9ID0gcmVxdWlyZShcImNjXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBmaW5kTm9kZShwYXJlbnRVdWlkKTtcclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFBhcmVudCAke3BhcmVudFV1aWR9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGJ1aWxkTm9kZVJlY3Vyc2l2ZShwYXJlbnQsIHNwZWMpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRlc3RMb2cobWVzc2FnZTogc3RyaW5nID0gXCJ0ZXN0IG1lc3NhZ2VcIikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiW3Rlc3RMb2ddXCIsIG1lc3NhZ2UpO1xyXG4gICAgICAgIGNvbnN0IG1ldGhvZHMgPSBPYmplY3Qua2V5cyhleHBvcnRzLm1ldGhvZHMgfHwge30pO1xyXG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGJ1ZmZlclNpemU6IF9jb25zb2xlTG9ncy5sZW5ndGgsIG1ldGhvZHMgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0Q29uc29sZUxvZ3MoY291bnQ6IG51bWJlciA9IDUwLCBsZXZlbD86IHN0cmluZykge1xyXG4gICAgICAgIGxldCBsb2dzID0gX2NvbnNvbGVMb2dzO1xyXG4gICAgICAgIGlmIChsZXZlbCkge1xyXG4gICAgICAgICAgICBsb2dzID0gbG9ncy5maWx0ZXIobCA9PiBsLmxldmVsID09PSBsZXZlbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGxvZ3M6IGxvZ3Muc2xpY2UoLWNvdW50KSwgdG90YWw6IF9jb25zb2xlTG9ncy5sZW5ndGggfTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJDb25zb2xlTG9ncygpIHtcclxuICAgICAgICBfY29uc29sZUxvZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIHNldFByb3BlcnR5VmlhRWRpdG9yKG5vZGVVdWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgZHVtcDogYW55KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gc2NlbmU6c2V0LXByb3BlcnR5IEFQSVxyXG4gICAgICAgICAgICAvLyB1dWlkOiDjg47jg7zjg4lVVUlE77yI44Kz44Oz44Od44O844ON44Oz44OIVVVJROOBp+OBr+OBquOBhO+8iVxyXG4gICAgICAgICAgICAvLyBwYXRoOiBfX2NvbXBzX18ue2luZGV4fS57cHJvcGVydHl9IOW9ouW8j1xyXG4gICAgICAgICAgICAvLyBkdW1wOiB7IHZhbHVlLCB0eXBlIH0g5b2i5byPXHJcbiAgICAgICAgICAgIGNvbnN0IG9wdHMgPSB7IHV1aWQ6IG5vZGVVdWlkLCBwYXRoLCBkdW1wIH07XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IgYXMgYW55KS5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcInNldC1wcm9wZXJ0eVwiLCBvcHRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIHx8IFN0cmluZyhlKSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ29tcG9uZW50RnJvbU5vZGUodXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGpzIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZSh1dWlkKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlICR7dXVpZH0gbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgQ29tcENsYXNzID0ganMuZ2V0Q2xhc3NCeU5hbWUoY29tcG9uZW50VHlwZSk7XHJcbiAgICAgICAgICAgIGlmICghQ29tcENsYXNzKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgY2xhc3MgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb21wID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcENsYXNzKTtcclxuICAgICAgICAgICAgaWYgKCFjb21wKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3Qgb24gbm9kZWAgfTtcclxuXHJcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ29tcG9uZW50KGNvbXApO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxufTtcclxuIl19