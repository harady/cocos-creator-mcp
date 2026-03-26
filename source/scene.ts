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

    testLog(message: string = "test message") {
        console.log("[testLog]", message);
        return { success: true, bufferSize: _consoleLogs.length };
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
