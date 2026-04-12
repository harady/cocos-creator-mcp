/**
 * Scene script — runs inside CocosCreator's scene renderer process.
 * These methods are called via Editor.Message.request('scene', 'execute-scene-script', ...)
 * and have access to the `cc` module (engine runtime).
 */

import { join } from "path";
module.paths.push(join(Editor.App.path, "node_modules"));

// ─── Console Log Buffer ───

interface ConsoleLogEntry {
    timestamp: string;
    level: "log" | "warn" | "error";
    message: string;
}

const MAX_LOG_BUFFER = 500;
const _consoleLogs: ConsoleLogEntry[] = [];

const _originalLog = console.log;
const _originalWarn = console.warn;
const _originalError = console.error;

function formatArgs(args: any[]): string {
    return args.map(a => {
        if (typeof a === "string") return a;
        try { return JSON.stringify(a); } catch { return String(a); }
    }).join(" ");
}

function pushLog(level: ConsoleLogEntry["level"], args: any[]): void {
    _consoleLogs.push({
        timestamp: new Date().toISOString(),
        level,
        message: formatArgs(args),
    });
    if (_consoleLogs.length > MAX_LOG_BUFFER) {
        _consoleLogs.splice(0, _consoleLogs.length - MAX_LOG_BUFFER);
    }
}

console.log = function (...args: any[]) {
    _originalLog.apply(console, args);
    pushLog("log", args);
};

console.warn = function (...args: any[]) {
    _originalWarn.apply(console, args);
    pushLog("warn", args);
};

console.error = function (...args: any[]) {
    _originalError.apply(console, args);
    pushLog("error", args);
};

function getScene() {
    const { director } = require("cc");
    return director.getScene();
}

function findNode(uuid: string) {
    const scene = getScene();
    if (!scene) return null;

    // Recursive search — getChildByUuid is not recursive in cc
    const queue = [...scene.children];
    while (queue.length > 0) {
        const node = queue.shift()!;
        if (node.uuid === uuid) return node;
        if (node.children) queue.push(...node.children);
    }
    return null;
}

/**
 * Recursively build a node tree from a JSON spec.
 * Returns { uuid, name, children: [...] }
 */
function buildNodeRecursive(parent: any, spec: any): any {
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
            if (dotIdx < 0) continue;
            const compName = key.substring(0, dotIdx);
            const propName = key.substring(dotIdx + 1);

            const CompClass = js.getClassByName(compName);
            if (!CompClass) continue;
            const comp = node.getComponent(CompClass);
            if (!comp) continue;

            try {
                // contentSize needs special handling (Size type)
                if (propName === "contentSize" && value && typeof value === "object") {
                    comp.setContentSize((value as any).width ?? 0, (value as any).height ?? 0);
                } else {
                    comp[propName] = value;
                }
            } catch { /* skip invalid property */ }
        }
    }

    // Set UITransform anchorPoint if specified
    if (spec.anchorPoint) {
        const { UITransform } = require("cc");
        const ut = node.getComponent(UITransform);
        if (ut) ut.setAnchorPoint(spec.anchorPoint.x ?? 0.5, spec.anchorPoint.y ?? 0.5);
    }

    // Set node properties (position, scale, active)
    if (spec.active === false) node.active = false;
    if (spec.position) node.setPosition(spec.position.x || 0, spec.position.y || 0, spec.position.z || 0);
    if (spec.scale) node.setScale(spec.scale.x ?? 1, spec.scale.y ?? 1, spec.scale.z ?? 1);

    // Set Widget properties if specified
    // Format: { top: 0, bottom: 0, left: 0, right: 0 } — each field enables the corresponding alignment
    if (spec.widget) {
        const { Widget } = require("cc");
        let w = node.getComponent(Widget);
        if (!w) w = node.addComponent(Widget);
        const wSpec = spec.widget;
        if (wSpec.top !== undefined) { w.isAlignTop = true; w.top = wSpec.top; }
        if (wSpec.bottom !== undefined) { w.isAlignBottom = true; w.bottom = wSpec.bottom; }
        if (wSpec.left !== undefined) { w.isAlignLeft = true; w.left = wSpec.left; }
        if (wSpec.right !== undefined) { w.isAlignRight = true; w.right = wSpec.right; }
        if (wSpec.horizontalCenter !== undefined) { w.isAlignHorizontalCenter = true; w.horizontalCenter = wSpec.horizontalCenter; }
        if (wSpec.verticalCenter !== undefined) { w.isAlignVerticalCenter = true; w.verticalCenter = wSpec.verticalCenter; }
    }

    // Build children
    const childResults: any[] = [];
    if (spec.children && Array.isArray(spec.children)) {
        for (const childSpec of spec.children) {
            childResults.push(buildNodeRecursive(node, childSpec));
        }
    }

    return { uuid: node.uuid, name: node.name, children: childResults };
}

function collectNodeInfo(node: any, includeComponents: boolean = false): any {
    const info: any = {
        uuid: node.uuid,
        name: node.name,
        active: node.active,
        position: { x: node.position.x, y: node.position.y, z: node.position.z },
        scale: { x: node.scale.x, y: node.scale.y, z: node.scale.z },
        parent: node.parent?.uuid || null,
        childCount: node.children?.length || 0,
    };
    if (includeComponents && node.components) {
        info.components = node.components.map((c: any) => ({
            type: c.constructor.name,
            uuid: c.uuid,
            enabled: c.enabled,
        }));
    }
    return info;
}

export const methods: Record<string, (...args: any[]) => any> = {
    getSceneHierarchy(includeComponents: boolean = false) {
        try {
            const scene = getScene();
            if (!scene) return { success: false, error: "No active scene" };

            const walk = (node: any): any => {
                const item: any = {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    children: [],
                };
                if (includeComponents && node.components) {
                    item.components = node.components.map((c: any) => ({
                        type: c.constructor.name,
                        uuid: c.uuid,
                        enabled: c.enabled,
                    }));
                }
                if (node.children) {
                    item.children = node.children.map((ch: any) => walk(ch));
                }
                return item;
            };

            return {
                success: true,
                sceneName: scene.name,
                sceneUuid: scene.uuid,
                hierarchy: scene.children.map((ch: any) => walk(ch)),
            };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    getNodeInfo(uuid: string) {
        try {
            const node = findNode(uuid);
            if (!node) return { success: false, error: `Node ${uuid} not found` };
            return { success: true, data: collectNodeInfo(node, true) };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    getAllNodes() {
        try {
            const scene = getScene();
            if (!scene) return { success: false, error: "No active scene" };

            const nodes: any[] = [];
            const walk = (node: any) => {
                nodes.push(collectNodeInfo(node));
                if (node.children) node.children.forEach(walk);
            };
            scene.children.forEach(walk);
            return { success: true, data: nodes };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * 指定ノードの子孫から名前で検索する。auto_bind 用。
     * rootUuid が空の場合はシーン全体を検索（後方互換）。
     */
    findDescendantsByName(rootUuid: string, name: string) {
        try {
            let root: any;
            if (rootUuid) {
                root = findNode(rootUuid);
                if (!root) return { success: false, error: `Root node ${rootUuid} not found` };
            } else {
                root = getScene();
                if (!root) return { success: false, error: "No active scene" };
            }

            const results: any[] = [];
            const walk = (node: any) => {
                if (node.name === name) results.push(collectNodeInfo(node));
                if (node.children) node.children.forEach(walk);
            };
            if (root.children) root.children.forEach(walk);
            return { success: true, data: results };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    /**
     * 指定ノードの全子孫を depth 付きで返す。auto_bind の一括検索用。
     */
    getAllDescendants(rootUuid: string) {
        try {
            const root = findNode(rootUuid);
            if (!root) return { success: false, error: `Node ${rootUuid} not found` };

            const results: Array<{uuid: string, name: string, depth: number}> = [];
            const walk = (node: any, depth: number) => {
                results.push({ uuid: node.uuid, name: node.name, depth });
                if (node.children) node.children.forEach((c: any) => walk(c, depth + 1));
            };
            if (root.children) root.children.forEach((c: any) => walk(c, 1));
            return { success: true, data: results };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    findNodesByName(name: string) {
        try {
            const scene = getScene();
            if (!scene) return { success: false, error: "No active scene" };

            const results: any[] = [];
            const walk = (node: any) => {
                if (node.name === name) results.push(collectNodeInfo(node));
                if (node.children) node.children.forEach(walk);
            };
            scene.children.forEach(walk);
            return { success: true, data: results };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    findNodeByPath(path: string) {
        try {
            const scene = getScene();
            if (!scene) return { success: false, error: "No active scene" };

            const parts = path.split("/");
            let current: any = null;

            const walk = (node: any): any => {
                if (node.name === parts[0]) return node;
                if (node.children) {
                    for (const child of node.children) {
                        const found = walk(child);
                        if (found) return found;
                    }
                }
                return null;
            };
            for (const child of scene.children) {
                current = walk(child);
                if (current) break;
            }
            if (!current) return { success: false, error: `Node "${parts[0]}" not found` };

            for (let i = 1; i < parts.length; i++) {
                const child = current.children?.find((c: any) => c.name === parts[i]);
                if (!child) return { success: false, error: `Child "${parts[i]}" not found in "${current.name}"` };
                current = child;
            }

            return { success: true, data: collectNodeInfo(current) };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    setNodeProperty(uuid: string, property: string, value: any) {
        try {
            const node = findNode(uuid);
            if (!node) return { success: false, error: `Node ${uuid} not found` };

            switch (property) {
                case "position":
                    node.setPosition(value.x ?? 0, value.y ?? 0, value.z ?? 0);
                    break;
                case "rotation":
                    node.setRotationFromEuler(value.x ?? 0, value.y ?? 0, value.z ?? 0);
                    break;
                case "scale":
                    node.setScale(value.x ?? 1, value.y ?? 1, value.z ?? 1);
                    break;
                case "active":
                    node.active = !!value;
                    break;
                case "name":
                    node.name = String(value);
                    break;
                default:
                    (node as any)[property] = value;
            }
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    setComponentProperty(uuid: string, componentType: string, property: string, value: any) {
        try {
            const { js } = require("cc");
            const node = findNode(uuid);
            if (!node) return { success: false, error: `Node ${uuid} not found` };

            const CompClass = js.getClassByName(componentType);
            if (!CompClass) return { success: false, error: `Component class ${componentType} not found` };

            const comp = node.getComponent(CompClass);
            if (!comp) return { success: false, error: `Component ${componentType} not on node ${uuid}` };

            comp[property] = value;
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    addComponentToNode(uuid: string, componentType: string) {
        try {
            const { js } = require("cc");
            const node = findNode(uuid);
            if (!node) return { success: false, error: `Node ${uuid} not found` };

            const CompClass = js.getClassByName(componentType);
            if (!CompClass) return { success: false, error: `Component class ${componentType} not found` };

            const comp = node.addComponent(CompClass);
            return { success: true, data: { uuid: comp.uuid, type: componentType } };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    moveNode(uuid: string, parentUuid: string) {
        try {
            const node = findNode(uuid);
            if (!node) return { success: false, error: `Node ${uuid} not found` };
            const parent = findNode(parentUuid);
            if (!parent) return { success: false, error: `Parent ${parentUuid} not found` };
            node.setParent(parent);
            return { success: true };
        } catch (e: any) {
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
    buildNodeTree(parentUuid: string, spec: any) {
        try {
            const { Node, js, UITransform } = require("cc");
            const parent = findNode(parentUuid);
            if (!parent) return { success: false, error: `Parent ${parentUuid} not found` };

            const result = buildNodeRecursive(parent, spec);
            return { success: true, data: result };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },

    testLog(message: string = "test message") {
        console.log("[testLog]", message);
        const methods = Object.keys(exports.methods || {});
        return { success: true, bufferSize: _consoleLogs.length, methods };
    },

    getConsoleLogs(count: number = 50, level?: string) {
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

    async setPropertyViaEditor(nodeUuid: string, path: string, dump: any) {
        try {
            // scene:set-property API
            // uuid: ノードUUID（コンポーネントUUIDではない）
            // path: __comps__.{index}.{property} 形式
            // dump: { value, type } 形式
            const opts = { uuid: nodeUuid, path, dump };
            const result = await (Editor as any).Message.request("scene", "set-property", opts);
            return { success: true, result };
        } catch (e: any) {
            return { success: false, error: e.message || String(e) };
        }
    },

    removeComponentFromNode(uuid: string, componentType: string) {
        try {
            const { js } = require("cc");
            const node = findNode(uuid);
            if (!node) return { success: false, error: `Node ${uuid} not found` };

            const CompClass = js.getClassByName(componentType);
            if (!CompClass) return { success: false, error: `Component class ${componentType} not found` };

            const comp = node.getComponent(CompClass);
            if (!comp) return { success: false, error: `Component ${componentType} not on node` };

            node.removeComponent(comp);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    },
};
