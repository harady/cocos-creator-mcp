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
        for (const compName of spec.components) {
            const CompClass = js.getClassByName(compName);
            if (CompClass) {
                // Skip if already has this component (e.g. UITransform on UI nodes)
                if (!node.getComponent(CompClass)) {
                    node.addComponent(CompClass);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7OztBQUVILCtCQUE0QjtBQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBVXpELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUMzQixNQUFNLFlBQVksR0FBc0IsRUFBRSxDQUFDO0FBRTNDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDakMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNuQyxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBRXJDLFNBQVMsVUFBVSxDQUFDLElBQVc7SUFDM0IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2hCLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUTtZQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQztZQUFDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7UUFBQyxXQUFNLENBQUM7WUFBQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7SUFDakUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxLQUErQixFQUFFLElBQVc7SUFDekQsWUFBWSxDQUFDLElBQUksQ0FBQztRQUNkLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtRQUNuQyxLQUFLO1FBQ0wsT0FBTyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7S0FDNUIsQ0FBQyxDQUFDO0lB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LE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGFBQWEsYUFBYSxjQUFjLEVBQUUsQ0FBQztZQUV0RixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNCLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hELENBQUM7SUFDTCxDQUFDO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBTY2VuZSBzY3JpcHQg4oCUIHJ1bnMgaW5zaWRlIENvY29zQ3JlYXRvcidzIHNjZW5lIHJlbmRlcmVyIHByb2Nlc3MuXHJcbiAqIFRoZXNlIG1ldGhvZHMgYXJlIGNhbGxlZCB2aWEgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCAuLi4pXHJcbiAqIGFuZCBoYXZlIGFjY2VzcyB0byB0aGUgYGNjYCBtb2R1bGUgKGVuZ2luZSBydW50aW1lKS5cclxuICovXHJcblxyXG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcInBhdGhcIjtcclxubW9kdWxlLnBhdGhzLnB1c2goam9pbihFZGl0b3IuQXBwLnBhdGgsIFwibm9kZV9tb2R1bGVzXCIpKTtcclxuXHJcbi8vIOKUgOKUgOKUgCBDb25zb2xlIExvZyBCdWZmZXIg4pSA4pSA4pSAXHJcblxyXG5pbnRlcmZhY2UgQ29uc29sZUxvZ0VudHJ5IHtcclxuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xyXG4gICAgbGV2ZWw6IFwibG9nXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIjtcclxuICAgIG1lc3NhZ2U6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgTUFYX0xPR19CVUZGRVIgPSA1MDA7XHJcbmNvbnN0IF9jb25zb2xlTG9nczogQ29uc29sZUxvZ0VudHJ5W10gPSBbXTtcclxuXHJcbmNvbnN0IF9vcmlnaW5hbExvZyA9IGNvbnNvbGUubG9nO1xyXG5jb25zdCBfb3JpZ2luYWxXYXJuID0gY29uc29sZS53YXJuO1xyXG5jb25zdCBfb3JpZ2luYWxFcnJvciA9IGNvbnNvbGUuZXJyb3I7XHJcblxyXG5mdW5jdGlvbiBmb3JtYXRBcmdzKGFyZ3M6IGFueVtdKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBhcmdzLm1hcChhID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIGEgPT09IFwic3RyaW5nXCIpIHJldHVybiBhO1xyXG4gICAgICAgIHRyeSB7IHJldHVybiBKU09OLnN0cmluZ2lmeShhKTsgfSBjYXRjaCB7IHJldHVybiBTdHJpbmcoYSk7IH1cclxuICAgIH0pLmpvaW4oXCIgXCIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwdXNoTG9nKGxldmVsOiBDb25zb2xlTG9nRW50cnlbXCJsZXZlbFwiXSwgYXJnczogYW55W10pOiB2b2lkIHtcclxuICAgIF9jb25zb2xlTG9ncy5wdXNoKHtcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICBsZXZlbCxcclxuICAgICAgICBtZXNzYWdlOiBmb3JtYXRBcmdzKGFyZ3MpLFxyXG4gICAgfSk7XHJcbiAgICBpZiAoX2NvbnNvbGVMb2dzLmxlbmd0aCA+IE1BWF9MT0dfQlVGRkVSKSB7XHJcbiAgICAgICAgX2NvbnNvbGVMb2dzLnNwbGljZSgwLCBfY29uc29sZUxvZ3MubGVuZ3RoIC0gTUFYX0xPR19CVUZGRVIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jb25zb2xlLmxvZyA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xyXG4gICAgX29yaWdpbmFsTG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xyXG4gICAgcHVzaExvZyhcImxvZ1wiLCBhcmdzKTtcclxufTtcclxuXHJcbmNvbnNvbGUud2FybiA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xyXG4gICAgX29yaWdpbmFsV2Fybi5hcHBseShjb25zb2xlLCBhcmdzKTtcclxuICAgIHB1c2hMb2coXCJ3YXJuXCIsIGFyZ3MpO1xyXG59O1xyXG5cclxuY29uc29sZS5lcnJvciA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xyXG4gICAgX29yaWdpbmFsRXJyb3IuYXBwbHkoY29uc29sZSwgYXJncyk7XHJcbiAgICBwdXNoTG9nKFwiZXJyb3JcIiwgYXJncyk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZXRTY2VuZSgpIHtcclxuICAgIGNvbnN0IHsgZGlyZWN0b3IgfSA9IHJlcXVpcmUoXCJjY1wiKTtcclxuICAgIHJldHVybiBkaXJlY3Rvci5nZXRTY2VuZSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kTm9kZSh1dWlkOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHNjZW5lID0gZ2V0U2NlbmUoKTtcclxuICAgIGlmICghc2NlbmUpIHJldHVybiBudWxsO1xyXG5cclxuICAgIC8vIFJlY3Vyc2l2ZSBzZWFyY2gg4oCUIGdldENoaWxkQnlVdWlkIGlzIG5vdCByZWN1cnNpdmUgaW4gY2NcclxuICAgIGNvbnN0IHF1ZXVlID0gWy4uLnNjZW5lLmNoaWxkcmVuXTtcclxuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IHF1ZXVlLnNoaWZ0KCkhO1xyXG4gICAgICAgIGlmIChub2RlLnV1aWQgPT09IHV1aWQpIHJldHVybiBub2RlO1xyXG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSBxdWV1ZS5wdXNoKC4uLm5vZGUuY2hpbGRyZW4pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZWN1cnNpdmVseSBidWlsZCBhIG5vZGUgdHJlZSBmcm9tIGEgSlNPTiBzcGVjLlxyXG4gKiBSZXR1cm5zIHsgdXVpZCwgbmFtZSwgY2hpbGRyZW46IFsuLi5dIH1cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkTm9kZVJlY3Vyc2l2ZShwYXJlbnQ6IGFueSwgc3BlYzogYW55KTogYW55IHtcclxuICAgIGNvbnN0IHsgTm9kZSwganMsIFZlYzMgfSA9IHJlcXVpcmUoXCJjY1wiKTtcclxuXHJcbiAgICBjb25zdCBub2RlID0gbmV3IE5vZGUoc3BlYy5uYW1lIHx8IFwiTm9kZVwiKTtcclxuICAgIHBhcmVudC5hZGRDaGlsZChub2RlKTtcclxuXHJcbiAgICAvLyBBZGQgY29tcG9uZW50c1xyXG4gICAgaWYgKHNwZWMuY29tcG9uZW50cyAmJiBBcnJheS5pc0FycmF5KHNwZWMuY29tcG9uZW50cykpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGNvbXBOYW1lIG9mIHNwZWMuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICBjb25zdCBDb21wQ2xhc3MgPSBqcy5nZXRDbGFzc0J5TmFtZShjb21wTmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChDb21wQ2xhc3MpIHtcclxuICAgICAgICAgICAgICAgIC8vIFNraXAgaWYgYWxyZWFkeSBoYXMgdGhpcyBjb21wb25lbnQgKGUuZy4gVUlUcmFuc2Zvcm0gb24gVUkgbm9kZXMpXHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUuZ2V0Q29tcG9uZW50KENvbXBDbGFzcykpIHtcclxuICAgICAgICAgICAgICAgICAgICBub2RlLmFkZENvbXBvbmVudChDb21wQ2xhc3MpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNldCBjb21wb25lbnQgcHJvcGVydGllc1xyXG4gICAgLy8gRm9ybWF0OiB7IFwiY2MuVUlUcmFuc2Zvcm0uY29udGVudFNpemVcIjoge3dpZHRoOjcyMCwgaGVpZ2h0OjEyODB9IH1cclxuICAgIGlmIChzcGVjLnByb3BlcnRpZXMpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzcGVjLnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRvdElkeCA9IGtleS5sYXN0SW5kZXhPZihcIi5cIik7XHJcbiAgICAgICAgICAgIGlmIChkb3RJZHggPCAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgY29tcE5hbWUgPSBrZXkuc3Vic3RyaW5nKDAsIGRvdElkeCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0ga2V5LnN1YnN0cmluZyhkb3RJZHggKyAxKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IENvbXBDbGFzcyA9IGpzLmdldENsYXNzQnlOYW1lKGNvbXBOYW1lKTtcclxuICAgICAgICAgICAgaWYgKCFDb21wQ2xhc3MpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zdCBjb21wID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcENsYXNzKTtcclxuICAgICAgICAgICAgaWYgKCFjb21wKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb250ZW50U2l6ZSBuZWVkcyBzcGVjaWFsIGhhbmRsaW5nIChTaXplIHR5cGUpXHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcE5hbWUgPT09IFwiY29udGVudFNpemVcIiAmJiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21wLnNldENvbnRlbnRTaXplKCh2YWx1ZSBhcyBhbnkpLndpZHRoID8/IDAsICh2YWx1ZSBhcyBhbnkpLmhlaWdodCA/PyAwKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcFtwcm9wTmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIHNraXAgaW52YWxpZCBwcm9wZXJ0eSAqLyB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNldCBVSVRyYW5zZm9ybSBhbmNob3JQb2ludCBpZiBzcGVjaWZpZWRcclxuICAgIGlmIChzcGVjLmFuY2hvclBvaW50KSB7XHJcbiAgICAgICAgY29uc3QgeyBVSVRyYW5zZm9ybSB9ID0gcmVxdWlyZShcImNjXCIpO1xyXG4gICAgICAgIGNvbnN0IHV0ID0gbm9kZS5nZXRDb21wb25lbnQoVUlUcmFuc2Zvcm0pO1xyXG4gICAgICAgIGlmICh1dCkgdXQuc2V0QW5jaG9yUG9pbnQoc3BlYy5hbmNob3JQb2ludC54ID8/IDAuNSwgc3BlYy5hbmNob3JQb2ludC55ID8/IDAuNSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0IG5vZGUgcHJvcGVydGllcyAocG9zaXRpb24sIHNjYWxlLCBhY3RpdmUpXHJcbiAgICBpZiAoc3BlYy5hY3RpdmUgPT09IGZhbHNlKSBub2RlLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgaWYgKHNwZWMucG9zaXRpb24pIG5vZGUuc2V0UG9zaXRpb24oc3BlYy5wb3NpdGlvbi54IHx8IDAsIHNwZWMucG9zaXRpb24ueSB8fCAwLCBzcGVjLnBvc2l0aW9uLnogfHwgMCk7XHJcbiAgICBpZiAoc3BlYy5zY2FsZSkgbm9kZS5zZXRTY2FsZShzcGVjLnNjYWxlLnggPz8gMSwgc3BlYy5zY2FsZS55ID8/IDEsIHNwZWMuc2NhbGUueiA/PyAxKTtcclxuXHJcbiAgICAvLyBTZXQgV2lkZ2V0IHByb3BlcnRpZXMgaWYgc3BlY2lmaWVkXHJcbiAgICAvLyBGb3JtYXQ6IHsgdG9wOiAwLCBib3R0b206IDAsIGxlZnQ6IDAsIHJpZ2h0OiAwIH0g4oCUIGVhY2ggZmllbGQgZW5hYmxlcyB0aGUgY29ycmVzcG9uZGluZyBhbGlnbm1lbnRcclxuICAgIGlmIChzcGVjLndpZGdldCkge1xyXG4gICAgICAgIGNvbnN0IHsgV2lkZ2V0IH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICAgICAgbGV0IHcgPSBub2RlLmdldENvbXBvbmVudChXaWRnZXQpO1xyXG4gICAgICAgIGlmICghdykgdyA9IG5vZGUuYWRkQ29tcG9uZW50KFdpZGdldCk7XHJcbiAgICAgICAgY29uc3Qgd1NwZWMgPSBzcGVjLndpZGdldDtcclxuICAgICAgICBpZiAod1NwZWMudG9wICE9PSB1bmRlZmluZWQpIHsgdy5pc0FsaWduVG9wID0gdHJ1ZTsgdy50b3AgPSB3U3BlYy50b3A7IH1cclxuICAgICAgICBpZiAod1NwZWMuYm90dG9tICE9PSB1bmRlZmluZWQpIHsgdy5pc0FsaWduQm90dG9tID0gdHJ1ZTsgdy5ib3R0b20gPSB3U3BlYy5ib3R0b207IH1cclxuICAgICAgICBpZiAod1NwZWMubGVmdCAhPT0gdW5kZWZpbmVkKSB7IHcuaXNBbGlnbkxlZnQgPSB0cnVlOyB3LmxlZnQgPSB3U3BlYy5sZWZ0OyB9XHJcbiAgICAgICAgaWYgKHdTcGVjLnJpZ2h0ICE9PSB1bmRlZmluZWQpIHsgdy5pc0FsaWduUmlnaHQgPSB0cnVlOyB3LnJpZ2h0ID0gd1NwZWMucmlnaHQ7IH1cclxuICAgICAgICBpZiAod1NwZWMuaG9yaXpvbnRhbENlbnRlciAhPT0gdW5kZWZpbmVkKSB7IHcuaXNBbGlnbkhvcml6b250YWxDZW50ZXIgPSB0cnVlOyB3Lmhvcml6b250YWxDZW50ZXIgPSB3U3BlYy5ob3Jpem9udGFsQ2VudGVyOyB9XHJcbiAgICAgICAgaWYgKHdTcGVjLnZlcnRpY2FsQ2VudGVyICE9PSB1bmRlZmluZWQpIHsgdy5pc0FsaWduVmVydGljYWxDZW50ZXIgPSB0cnVlOyB3LnZlcnRpY2FsQ2VudGVyID0gd1NwZWMudmVydGljYWxDZW50ZXI7IH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBCdWlsZCBjaGlsZHJlblxyXG4gICAgY29uc3QgY2hpbGRSZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgaWYgKHNwZWMuY2hpbGRyZW4gJiYgQXJyYXkuaXNBcnJheShzcGVjLmNoaWxkcmVuKSkge1xyXG4gICAgICAgIGZvciAoY29uc3QgY2hpbGRTcGVjIG9mIHNwZWMuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgY2hpbGRSZXN1bHRzLnB1c2goYnVpbGROb2RlUmVjdXJzaXZlKG5vZGUsIGNoaWxkU3BlYykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geyB1dWlkOiBub2RlLnV1aWQsIG5hbWU6IG5vZGUubmFtZSwgY2hpbGRyZW46IGNoaWxkUmVzdWx0cyB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb2xsZWN0Tm9kZUluZm8obm9kZTogYW55LCBpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbiA9IGZhbHNlKTogYW55IHtcclxuICAgIGNvbnN0IGluZm86IGFueSA9IHtcclxuICAgICAgICB1dWlkOiBub2RlLnV1aWQsXHJcbiAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxyXG4gICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXHJcbiAgICAgICAgcG9zaXRpb246IHsgeDogbm9kZS5wb3NpdGlvbi54LCB5OiBub2RlLnBvc2l0aW9uLnksIHo6IG5vZGUucG9zaXRpb24ueiB9LFxyXG4gICAgICAgIHNjYWxlOiB7IHg6IG5vZGUuc2NhbGUueCwgeTogbm9kZS5zY2FsZS55LCB6OiBub2RlLnNjYWxlLnogfSxcclxuICAgICAgICBwYXJlbnQ6IG5vZGUucGFyZW50Py51dWlkIHx8IG51bGwsXHJcbiAgICAgICAgY2hpbGRDb3VudDogbm9kZS5jaGlsZHJlbj8ubGVuZ3RoIHx8IDAsXHJcbiAgICB9O1xyXG4gICAgaWYgKGluY2x1ZGVDb21wb25lbnRzICYmIG5vZGUuY29tcG9uZW50cykge1xyXG4gICAgICAgIGluZm8uY29tcG9uZW50cyA9IG5vZGUuY29tcG9uZW50cy5tYXAoKGM6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgdHlwZTogYy5jb25zdHJ1Y3Rvci5uYW1lLFxyXG4gICAgICAgICAgICB1dWlkOiBjLnV1aWQsXHJcbiAgICAgICAgICAgIGVuYWJsZWQ6IGMuZW5hYmxlZCxcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5mbztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IFJlY29yZDxzdHJpbmcsICguLi5hcmdzOiBhbnlbXSkgPT4gYW55PiA9IHtcclxuICAgIGdldFNjZW5lSGllcmFyY2h5KGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGdldFNjZW5lKCk7XHJcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJObyBhY3RpdmUgc2NlbmVcIiB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgd2FsayA9IChub2RlOiBhbnkpOiBhbnkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbTogYW55ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVDb21wb25lbnRzICYmIG5vZGUuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY29tcG9uZW50cyA9IG5vZGUuY29tcG9uZW50cy5tYXAoKGM6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYy5jb25zdHJ1Y3Rvci5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBjLnV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGMuZW5hYmxlZCxcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuLm1hcCgoY2g6IGFueSkgPT4gd2FsayhjaCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNjZW5lTmFtZTogc2NlbmUubmFtZSxcclxuICAgICAgICAgICAgICAgIHNjZW5lVXVpZDogc2NlbmUudXVpZCxcclxuICAgICAgICAgICAgICAgIGhpZXJhcmNoeTogc2NlbmUuY2hpbGRyZW4ubWFwKChjaDogYW55KSA9PiB3YWxrKGNoKSksXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXROb2RlSW5mbyh1dWlkOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGUodXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogY29sbGVjdE5vZGVJbmZvKG5vZGUsIHRydWUpIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBbGxOb2RlcygpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGdldFNjZW5lKCk7XHJcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJObyBhY3RpdmUgc2NlbmVcIiB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgbm9kZXM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHdhbGsgPSAobm9kZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKGNvbGxlY3ROb2RlSW5mbyhub2RlKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKHdhbGspO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBzY2VuZS5jaGlsZHJlbi5mb3JFYWNoKHdhbGspO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZmluZE5vZGVzQnlOYW1lKG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gZ2V0U2NlbmUoKTtcclxuICAgICAgICAgICAgaWYgKCFzY2VuZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBcIk5vIGFjdGl2ZSBzY2VuZVwiIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCB3YWxrID0gKG5vZGU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUubmFtZSA9PT0gbmFtZSkgcmVzdWx0cy5wdXNoKGNvbGxlY3ROb2RlSW5mbyhub2RlKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKHdhbGspO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBzY2VuZS5jaGlsZHJlbi5mb3JFYWNoKHdhbGspO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHRzIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBmaW5kTm9kZUJ5UGF0aChwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGdldFNjZW5lKCk7XHJcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJObyBhY3RpdmUgc2NlbmVcIiB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBwYXRoLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnQ6IGFueSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB3YWxrID0gKG5vZGU6IGFueSk6IGFueSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5uYW1lID09PSBwYXJ0c1swXSkgcmV0dXJuIG5vZGU7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IHdhbGsoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBzY2VuZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHdhbGsoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQpIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSBcIiR7cGFydHNbMF19XCIgbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjdXJyZW50LmNoaWxkcmVuPy5maW5kKChjOiBhbnkpID0+IGMubmFtZSA9PT0gcGFydHNbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjaGlsZCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ2hpbGQgXCIke3BhcnRzW2ldfVwiIG5vdCBmb3VuZCBpbiBcIiR7Y3VycmVudC5uYW1lfVwiYCB9O1xyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGNoaWxkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBjb2xsZWN0Tm9kZUluZm8oY3VycmVudCkgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNldE5vZGVQcm9wZXJ0eSh1dWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGUodXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJwb3NpdGlvblwiOlxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0UG9zaXRpb24odmFsdWUueCA/PyAwLCB2YWx1ZS55ID8/IDAsIHZhbHVlLnogPz8gMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwicm90YXRpb25cIjpcclxuICAgICAgICAgICAgICAgICAgICBub2RlLnNldFJvdGF0aW9uRnJvbUV1bGVyKHZhbHVlLnggPz8gMCwgdmFsdWUueSA/PyAwLCB2YWx1ZS56ID8/IDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNjYWxlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRTY2FsZSh2YWx1ZS54ID8/IDEsIHZhbHVlLnkgPz8gMSwgdmFsdWUueiA/PyAxKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJhY3RpdmVcIjpcclxuICAgICAgICAgICAgICAgICAgICBub2RlLmFjdGl2ZSA9ICEhdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUubmFtZSA9IFN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIChub2RlIGFzIGFueSlbcHJvcGVydHldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2V0Q29tcG9uZW50UHJvcGVydHkodXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IGpzIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZSh1dWlkKTtcclxuICAgICAgICAgICAgaWYgKCFub2RlKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlICR7dXVpZH0gbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgQ29tcENsYXNzID0ganMuZ2V0Q2xhc3NCeU5hbWUoY29tcG9uZW50VHlwZSk7XHJcbiAgICAgICAgICAgIGlmICghQ29tcENsYXNzKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgY2xhc3MgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb21wID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcENsYXNzKTtcclxuICAgICAgICAgICAgaWYgKCFjb21wKSByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3Qgb24gbm9kZSAke3V1aWR9YCB9O1xyXG5cclxuICAgICAgICAgICAgY29tcFtwcm9wZXJ0eV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ29tcG9uZW50VG9Ob2RlKHV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBqcyB9ID0gcmVxdWlyZShcImNjXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGUodXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZSkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSAke3V1aWR9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IENvbXBDbGFzcyA9IGpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xyXG4gICAgICAgICAgICBpZiAoIUNvbXBDbGFzcykgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IGNsYXNzICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29tcCA9IG5vZGUuYWRkQ29tcG9uZW50KENvbXBDbGFzcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgdXVpZDogY29tcC51dWlkLCB0eXBlOiBjb21wb25lbnRUeXBlIH0gfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIG1vdmVOb2RlKHV1aWQ6IHN0cmluZywgcGFyZW50VXVpZDogc3RyaW5nKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlKHV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJHt1dWlkfSBub3QgZm91bmRgIH07XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGZpbmROb2RlKHBhcmVudFV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgUGFyZW50ICR7cGFyZW50VXVpZH0gbm90IGZvdW5kYCB9O1xyXG4gICAgICAgICAgICBub2RlLnNldFBhcmVudChwYXJlbnQpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ1aWxkIGEgbm9kZSB0cmVlIGZyb20gYSBKU09OIHNwZWMgaW4gb25lIGNhbGwuXHJcbiAgICAgKiBTcGVjIGZvcm1hdDpcclxuICAgICAqIHtcclxuICAgICAqICAgbmFtZTogc3RyaW5nLFxyXG4gICAgICogICBjb21wb25lbnRzPzogc3RyaW5nW10sICAgICAgICAgICAgLy8gZS5nLiBbXCJjYy5VSVRyYW5zZm9ybVwiLCBcImNjLkxheW91dFwiXVxyXG4gICAgICogICBwcm9wZXJ0aWVzPzogUmVjb3JkPHN0cmluZywgYW55PiwgLy8gZS5nLiB7IFwiY2MuVUlUcmFuc2Zvcm0uY29udGVudFNpemVcIjoge3dpZHRoOjcyMCxoZWlnaHQ6MTI4MH0gfVxyXG4gICAgICogICBjaGlsZHJlbj86IE5vZGVTcGVjW11cclxuICAgICAqIH1cclxuICAgICAqL1xyXG4gICAgYnVpbGROb2RlVHJlZShwYXJlbnRVdWlkOiBzdHJpbmcsIHNwZWM6IGFueSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgTm9kZSwganMsIFVJVHJhbnNmb3JtIH0gPSByZXF1aXJlKFwiY2NcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGZpbmROb2RlKHBhcmVudFV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgUGFyZW50ICR7cGFyZW50VXVpZH0gbm90IGZvdW5kYCB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYnVpbGROb2RlUmVjdXJzaXZlKHBhcmVudCwgc3BlYyk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdCB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdGVzdExvZyhtZXNzYWdlOiBzdHJpbmcgPSBcInRlc3QgbWVzc2FnZVwiKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJbdGVzdExvZ11cIiwgbWVzc2FnZSk7XHJcbiAgICAgICAgY29uc3QgbWV0aG9kcyA9IE9iamVjdC5rZXlzKGV4cG9ydHMubWV0aG9kcyB8fCB7fSk7XHJcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgYnVmZmVyU2l6ZTogX2NvbnNvbGVMb2dzLmxlbmd0aCwgbWV0aG9kcyB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRDb25zb2xlTG9ncyhjb3VudDogbnVtYmVyID0gNTAsIGxldmVsPzogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGxvZ3MgPSBfY29uc29sZUxvZ3M7XHJcbiAgICAgICAgaWYgKGxldmVsKSB7XHJcbiAgICAgICAgICAgIGxvZ3MgPSBsb2dzLmZpbHRlcihsID0+IGwubGV2ZWwgPT09IGxldmVsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbG9nczogbG9ncy5zbGljZSgtY291bnQpLCB0b3RhbDogX2NvbnNvbGVMb2dzLmxlbmd0aCB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhckNvbnNvbGVMb2dzKCkge1xyXG4gICAgICAgIF9jb25zb2xlTG9ncy5sZW5ndGggPSAwO1xyXG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcclxuICAgIH0sXHJcblxyXG4gICAgYXN5bmMgc2V0UHJvcGVydHlWaWFFZGl0b3Iobm9kZVV1aWQ6IHN0cmluZywgcGF0aDogc3RyaW5nLCBkdW1wOiBhbnkpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBzY2VuZTpzZXQtcHJvcGVydHkgQVBJXHJcbiAgICAgICAgICAgIC8vIHV1aWQ6IOODjuODvOODiVVVSUTvvIjjgrPjg7Pjg53jg7zjg43jg7Pjg4hVVUlE44Gn44Gv44Gq44GE77yJXHJcbiAgICAgICAgICAgIC8vIHBhdGg6IF9fY29tcHNfXy57aW5kZXh9Lntwcm9wZXJ0eX0g5b2i5byPXHJcbiAgICAgICAgICAgIC8vIGR1bXA6IHsgdmFsdWUsIHR5cGUgfSDlvaLlvI9cclxuICAgICAgICAgICAgY29uc3Qgb3B0cyA9IHsgdXVpZDogbm9kZVV1aWQsIHBhdGgsIGR1bXAgfTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvciBhcyBhbnkpLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwic2V0LXByb3BlcnR5XCIsIG9wdHMpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVDb21wb25lbnRGcm9tTm9kZSh1dWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsganMgfSA9IHJlcXVpcmUoXCJjY1wiKTtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlKHV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGUpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJHt1dWlkfSBub3QgZm91bmRgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBDb21wQ2xhc3MgPSBqcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcclxuICAgICAgICAgICAgaWYgKCFDb21wQ2xhc3MpIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCBjbGFzcyAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBub2RlLmdldENvbXBvbmVudChDb21wQ2xhc3MpO1xyXG4gICAgICAgICAgICBpZiAoIWNvbXApIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBvbiBub2RlYCB9O1xyXG5cclxuICAgICAgICAgICAgbm9kZS5yZW1vdmVDb21wb25lbnQoY29tcCk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG59O1xyXG4iXX0=