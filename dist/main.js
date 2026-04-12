"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const mcp_server_1 = require("./mcp-server");
const scene_tools_1 = require("./tools/scene-tools");
const node_tools_1 = require("./tools/node-tools");
const component_tools_1 = require("./tools/component-tools");
const prefab_tools_1 = require("./tools/prefab-tools");
const project_tools_1 = require("./tools/project-tools");
const debug_tools_1 = require("./tools/debug-tools");
const scene_advanced_tools_1 = require("./tools/scene-advanced-tools");
const scene_view_tools_1 = require("./tools/scene-view-tools");
const asset_tools_1 = require("./tools/asset-tools");
const preferences_tools_1 = require("./tools/preferences-tools");
const server_tools_1 = require("./tools/server-tools");
const builder_tools_1 = require("./tools/builder-tools");
const reference_image_tools_1 = require("./tools/reference-image-tools");
const types_1 = require("./types");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let server = null;
function getSettingsPath() {
    return path_1.default.join(Editor.Project.path, "settings", "cocos-creator-mcp.json");
}
function loadConfig() {
    try {
        const p = getSettingsPath();
        if (fs_1.default.existsSync(p)) {
            const data = JSON.parse(fs_1.default.readFileSync(p, "utf-8"));
            return Object.assign(Object.assign({}, types_1.DEFAULT_CONFIG), data);
        }
    }
    catch (e) {
        console.warn("[cocos-creator-mcp] Failed to load settings, using defaults");
    }
    return Object.assign({}, types_1.DEFAULT_CONFIG);
}
function saveConfig(config) {
    try {
        const p = getSettingsPath();
        const dir = path_1.default.dirname(p);
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        fs_1.default.writeFileSync(p, JSON.stringify(config, null, 2), "utf-8");
    }
    catch (e) {
        console.error("[cocos-creator-mcp] Failed to save settings:", e);
    }
}
function createServer(config) {
    const s = new mcp_server_1.McpServer(config);
    s.register(new scene_tools_1.SceneTools());
    s.register(new node_tools_1.NodeTools());
    const componentTools = new component_tools_1.ComponentTools();
    s.register(componentTools);
    s.register(new prefab_tools_1.PrefabTools(componentTools));
    s.register(new project_tools_1.ProjectTools());
    s.register(new debug_tools_1.DebugTools());
    s.register(new scene_advanced_tools_1.SceneAdvancedTools());
    s.register(new scene_view_tools_1.SceneViewTools());
    s.register(new asset_tools_1.AssetTools());
    s.register(new preferences_tools_1.PreferencesTools());
    s.register(new server_tools_1.ServerTools());
    s.register(new builder_tools_1.BuilderTools());
    s.register(new reference_image_tools_1.ReferenceImageTools());
    return s;
}
exports.methods = {
    openPanel() {
        Editor.Panel.open("cocos-creator-mcp");
    },
    openRecorder() {
        Editor.Panel.open("cocos-creator-mcp.recorder");
    },
    async startServer() {
        if (server === null || server === void 0 ? void 0 : server.isRunning)
            return { running: true, port: server.port };
        const config = loadConfig();
        server = createServer(config);
        await server.start();
        return { running: true, port: server.port };
    },
    async stopServer() {
        if (server) {
            await server.stop();
            server = null;
        }
        return { running: false };
    },
    async updatePort(_port) {
        var _a;
        const config = loadConfig();
        config.port = _port;
        saveConfig(config);
        // Restart server if running
        if (server === null || server === void 0 ? void 0 : server.isRunning) {
            await server.stop();
            server = createServer(config);
            await server.start();
        }
        return { port: _port, running: (_a = server === null || server === void 0 ? void 0 : server.isRunning) !== null && _a !== void 0 ? _a : false };
    },
    getServerStatus() {
        var _a, _b, _c, _d;
        return {
            running: (_a = server === null || server === void 0 ? void 0 : server.isRunning) !== null && _a !== void 0 ? _a : false,
            port: (_b = server === null || server === void 0 ? void 0 : server.port) !== null && _b !== void 0 ? _b : loadConfig().port,
            toolCount: (_c = server === null || server === void 0 ? void 0 : server.getAllTools().length) !== null && _c !== void 0 ? _c : 0,
            toolNames: (_d = server === null || server === void 0 ? void 0 : server.getAllTools().map((t) => t.name).sort()) !== null && _d !== void 0 ? _d : [],
        };
    },
};
async function load() {
    console.log("[cocos-creator-mcp] Extension loaded");
    const config = loadConfig();
    server = createServer(config);
    if (config.autoStart) {
        try {
            await server.start();
            console.log(`[cocos-creator-mcp] Auto-started on port ${config.port}`);
        }
        catch (e) {
            console.error("[cocos-creator-mcp] Auto-start failed:", e);
        }
    }
}
async function unload() {
    if (server) {
        await server.stop();
        server = null;
    }
    console.log("[cocos-creator-mcp] Extension unloaded");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQW1IQSxvQkFhQztBQUVELHdCQU1DO0FBeElELDZDQUF5QztBQUN6QyxxREFBaUQ7QUFDakQsbURBQStDO0FBQy9DLDZEQUF5RDtBQUN6RCx1REFBbUQ7QUFDbkQseURBQXFEO0FBQ3JELHFEQUFpRDtBQUNqRCx1RUFBa0U7QUFDbEUsK0RBQTBEO0FBQzFELHFEQUFpRDtBQUNqRCxpRUFBNkQ7QUFDN0QsdURBQW1EO0FBQ25ELHlEQUFxRDtBQUNyRCx5RUFBb0U7QUFDcEUsbUNBQXVEO0FBQ3ZELGdEQUF3QjtBQUN4Qiw0Q0FBb0I7QUFFcEIsSUFBSSxNQUFNLEdBQXFCLElBQUksQ0FBQztBQUVwQyxTQUFTLGVBQWU7SUFDcEIsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO0FBQ2hGLENBQUM7QUFFRCxTQUFTLFVBQVU7SUFDZixJQUFJLENBQUM7UUFDRCxNQUFNLENBQUMsR0FBRyxlQUFlLEVBQUUsQ0FBQztRQUM1QixJQUFJLFlBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNuQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckQsdUNBQVksc0JBQWMsR0FBSyxJQUFJLEVBQUc7UUFDMUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFDRCx5QkFBWSxzQkFBYyxFQUFHO0FBQ2pDLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxNQUFvQjtJQUNw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QyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLG1DQUFJLEVBQUU7U0FDbkUsQ0FBQztJQUNOLENBQUM7Q0FDSixDQUFDO0FBRUssS0FBSyxVQUFVLElBQUk7SUFDdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0lBQ3BELE1BQU0sTUFBTSxHQUFHLFVBQVUsRUFBRSxDQUFDO0lBQzVCLE1BQU0sR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUIsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0Q0FBNEMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9ELENBQUM7SUFDTCxDQUFDO0FBQ0wsQ0FBQztBQUVNLEtBQUssVUFBVSxNQUFNO0lBQ3hCLElBQUksTUFBTSxFQUFFLENBQUM7UUFDVCxNQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQixNQUFNLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLENBQUM7SUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7QUFDMUQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1jcFNlcnZlciB9IGZyb20gXCIuL21jcC1zZXJ2ZXJcIjtcclxuaW1wb3J0IHsgU2NlbmVUb29scyB9IGZyb20gXCIuL3Rvb2xzL3NjZW5lLXRvb2xzXCI7XHJcbmltcG9ydCB7IE5vZGVUb29scyB9IGZyb20gXCIuL3Rvb2xzL25vZGUtdG9vbHNcIjtcclxuaW1wb3J0IHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tIFwiLi90b29scy9jb21wb25lbnQtdG9vbHNcIjtcclxuaW1wb3J0IHsgUHJlZmFiVG9vbHMgfSBmcm9tIFwiLi90b29scy9wcmVmYWItdG9vbHNcIjtcclxuaW1wb3J0IHsgUHJvamVjdFRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvcHJvamVjdC10b29sc1wiO1xyXG5pbXBvcnQgeyBEZWJ1Z1Rvb2xzIH0gZnJvbSBcIi4vdG9vbHMvZGVidWctdG9vbHNcIjtcclxuaW1wb3J0IHsgU2NlbmVBZHZhbmNlZFRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvc2NlbmUtYWR2YW5jZWQtdG9vbHNcIjtcclxuaW1wb3J0IHsgU2NlbmVWaWV3VG9vbHMgfSBmcm9tIFwiLi90b29scy9zY2VuZS12aWV3LXRvb2xzXCI7XHJcbmltcG9ydCB7IEFzc2V0VG9vbHMgfSBmcm9tIFwiLi90b29scy9hc3NldC10b29sc1wiO1xyXG5pbXBvcnQgeyBQcmVmZXJlbmNlc1Rvb2xzIH0gZnJvbSBcIi4vdG9vbHMvcHJlZmVyZW5jZXMtdG9vbHNcIjtcclxuaW1wb3J0IHsgU2VydmVyVG9vbHMgfSBmcm9tIFwiLi90b29scy9zZXJ2ZXItdG9vbHNcIjtcclxuaW1wb3J0IHsgQnVpbGRlclRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvYnVpbGRlci10b29sc1wiO1xyXG5pbXBvcnQgeyBSZWZlcmVuY2VJbWFnZVRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvcmVmZXJlbmNlLWltYWdlLXRvb2xzXCI7XHJcbmltcG9ydCB7IFNlcnZlckNvbmZpZywgREVGQVVMVF9DT05GSUcgfSBmcm9tIFwiLi90eXBlc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XHJcblxyXG5sZXQgc2VydmVyOiBNY3BTZXJ2ZXIgfCBudWxsID0gbnVsbDtcclxuXHJcbmZ1bmN0aW9uIGdldFNldHRpbmdzUGF0aCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcInNldHRpbmdzXCIsIFwiY29jb3MtY3JlYXRvci1tY3AuanNvblwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZENvbmZpZygpOiBTZXJ2ZXJDb25maWcge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwID0gZ2V0U2V0dGluZ3NQYXRoKCk7XHJcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocCkpIHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHAsIFwidXRmLThcIikpO1xyXG4gICAgICAgICAgICByZXR1cm4geyAuLi5ERUZBVUxUX0NPTkZJRywgLi4uZGF0YSB9O1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCJbY29jb3MtY3JlYXRvci1tY3BdIEZhaWxlZCB0byBsb2FkIHNldHRpbmdzLCB1c2luZyBkZWZhdWx0c1wiKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7IC4uLkRFRkFVTFRfQ09ORklHIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhdmVDb25maWcoY29uZmlnOiBTZXJ2ZXJDb25maWcpOiB2b2lkIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcCA9IGdldFNldHRpbmdzUGF0aCgpO1xyXG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShwKTtcclxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwLCBKU09OLnN0cmluZ2lmeShjb25maWcsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbY29jb3MtY3JlYXRvci1tY3BdIEZhaWxlZCB0byBzYXZlIHNldHRpbmdzOlwiLCBlKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlU2VydmVyKGNvbmZpZzogU2VydmVyQ29uZmlnKTogTWNwU2VydmVyIHtcclxuICAgIGNvbnN0IHMgPSBuZXcgTWNwU2VydmVyKGNvbmZpZyk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBTY2VuZVRvb2xzKCkpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgTm9kZVRvb2xzKCkpO1xyXG4gICAgY29uc3QgY29tcG9uZW50VG9vbHMgPSBuZXcgQ29tcG9uZW50VG9vbHMoKTtcclxuICAgIHMucmVnaXN0ZXIoY29tcG9uZW50VG9vbHMpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgUHJlZmFiVG9vbHMoY29tcG9uZW50VG9vbHMpKTtcclxuICAgIHMucmVnaXN0ZXIobmV3IFByb2plY3RUb29scygpKTtcclxuICAgIHMucmVnaXN0ZXIobmV3IERlYnVnVG9vbHMoKSk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBTY2VuZUFkdmFuY2VkVG9vbHMoKSk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBTY2VuZVZpZXdUb29scygpKTtcclxuICAgIHMucmVnaXN0ZXIobmV3IEFzc2V0VG9vbHMoKSk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBQcmVmZXJlbmNlc1Rvb2xzKCkpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgU2VydmVyVG9vbHMoKSk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBCdWlsZGVyVG9vbHMoKSk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBSZWZlcmVuY2VJbWFnZVRvb2xzKCkpO1xyXG4gICAgcmV0dXJuIHM7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBtZXRob2RzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IGFueT4gPSB7XHJcbiAgICBvcGVuUGFuZWwoKSB7XHJcbiAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oXCJjb2Nvcy1jcmVhdG9yLW1jcFwiKTtcclxuICAgIH0sXHJcblxyXG4gICAgb3BlblJlY29yZGVyKCkge1xyXG4gICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKFwiY29jb3MtY3JlYXRvci1tY3AucmVjb3JkZXJcIik7XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIHN0YXJ0U2VydmVyKCkge1xyXG4gICAgICAgIGlmIChzZXJ2ZXI/LmlzUnVubmluZykgcmV0dXJuIHsgcnVubmluZzogdHJ1ZSwgcG9ydDogc2VydmVyLnBvcnQgfTtcclxuICAgICAgICBjb25zdCBjb25maWcgPSBsb2FkQ29uZmlnKCk7XHJcbiAgICAgICAgc2VydmVyID0gY3JlYXRlU2VydmVyKGNvbmZpZyk7XHJcbiAgICAgICAgYXdhaXQgc2VydmVyLnN0YXJ0KCk7XHJcbiAgICAgICAgcmV0dXJuIHsgcnVubmluZzogdHJ1ZSwgcG9ydDogc2VydmVyLnBvcnQgfTtcclxuICAgIH0sXHJcblxyXG4gICAgYXN5bmMgc3RvcFNlcnZlcigpIHtcclxuICAgICAgICBpZiAoc2VydmVyKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHNlcnZlci5zdG9wKCk7XHJcbiAgICAgICAgICAgIHNlcnZlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHJ1bm5pbmc6IGZhbHNlIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIHVwZGF0ZVBvcnQoX3BvcnQ6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGxvYWRDb25maWcoKTtcclxuICAgICAgICBjb25maWcucG9ydCA9IF9wb3J0O1xyXG4gICAgICAgIHNhdmVDb25maWcoY29uZmlnKTtcclxuICAgICAgICAvLyBSZXN0YXJ0IHNlcnZlciBpZiBydW5uaW5nXHJcbiAgICAgICAgaWYgKHNlcnZlcj8uaXNSdW5uaW5nKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHNlcnZlci5zdG9wKCk7XHJcbiAgICAgICAgICAgIHNlcnZlciA9IGNyZWF0ZVNlcnZlcihjb25maWcpO1xyXG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgcG9ydDogX3BvcnQsIHJ1bm5pbmc6IHNlcnZlcj8uaXNSdW5uaW5nID8/IGZhbHNlIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFNlcnZlclN0YXR1cygpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBydW5uaW5nOiBzZXJ2ZXI/LmlzUnVubmluZyA/PyBmYWxzZSxcclxuICAgICAgICAgICAgcG9ydDogc2VydmVyPy5wb3J0ID8/IGxvYWRDb25maWcoKS5wb3J0LFxyXG4gICAgICAgICAgICB0b29sQ291bnQ6IHNlcnZlcj8uZ2V0QWxsVG9vbHMoKS5sZW5ndGggPz8gMCxcclxuICAgICAgICAgICAgdG9vbE5hbWVzOiBzZXJ2ZXI/LmdldEFsbFRvb2xzKCkubWFwKCh0KSA9PiB0Lm5hbWUpLnNvcnQoKSA/PyBbXSxcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJbY29jb3MtY3JlYXRvci1tY3BdIEV4dGVuc2lvbiBsb2FkZWRcIik7XHJcbiAgICBjb25zdCBjb25maWcgPSBsb2FkQ29uZmlnKCk7XHJcbiAgICBzZXJ2ZXIgPSBjcmVhdGVTZXJ2ZXIoY29uZmlnKTtcclxuXHJcbiAgICBpZiAoY29uZmlnLmF1dG9TdGFydCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW2NvY29zLWNyZWF0b3ItbWNwXSBBdXRvLXN0YXJ0ZWQgb24gcG9ydCAke2NvbmZpZy5wb3J0fWApO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltjb2Nvcy1jcmVhdG9yLW1jcF0gQXV0by1zdGFydCBmYWlsZWQ6XCIsIGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVubG9hZCgpIHtcclxuICAgIGlmIChzZXJ2ZXIpIHtcclxuICAgICAgICBhd2FpdCBzZXJ2ZXIuc3RvcCgpO1xyXG4gICAgICAgIHNlcnZlciA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhcIltjb2Nvcy1jcmVhdG9yLW1jcF0gRXh0ZW5zaW9uIHVubG9hZGVkXCIpO1xyXG59XHJcbiJdfQ==