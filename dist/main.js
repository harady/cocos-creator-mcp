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
    s.register(new component_tools_1.ComponentTools());
    s.register(new prefab_tools_1.PrefabTools());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQWtIQSxvQkFhQztBQUVELHdCQU1DO0FBdklELDZDQUF5QztBQUN6QyxxREFBaUQ7QUFDakQsbURBQStDO0FBQy9DLDZEQUF5RDtBQUN6RCx1REFBbUQ7QUFDbkQseURBQXFEO0FBQ3JELHFEQUFpRDtBQUNqRCx1RUFBa0U7QUFDbEUsK0RBQTBEO0FBQzFELHFEQUFpRDtBQUNqRCxpRUFBNkQ7QUFDN0QsdURBQW1EO0FBQ25ELHlEQUFxRDtBQUNyRCx5RUFBb0U7QUFDcEUsbUNBQXVEO0FBQ3ZELGdEQUF3QjtBQUN4Qiw0Q0FBb0I7QUFFcEIsSUFBSSxNQUFNLEdBQXFCLElBQUksQ0FBQztBQUVwQyxTQUFTLGVBQWU7SUFDcEIsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO0FBQ2hGLENBQUM7QUFFRCxTQUFTLFVBQVU7SUFDZixJQUFJLENBQUM7UUFDRCxNQUFNLENBQUMsR0FBRyxlQUFlLEVBQUUsQ0FBQztRQUM1QixJQUFJLFlBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNuQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckQsdUNBQVksc0JBQWMsR0FBSyxJQUFJLEVBQUc7UUFDMUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFDRCx5QkFBWSxzQkFBYyxFQUFHO0FBQ2pDLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxNQUFvQjtJQUNw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LElBQUksRUFBRSxtQ0FBSSxFQUFFO1NBQ25FLENBQUM7SUFDTixDQUFDO0NBQ0osQ0FBQztBQUVLLEtBQUssVUFBVSxJQUFJO0lBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLENBQUMsQ0FBQztJQUNwRCxNQUFNLE1BQU0sR0FBRyxVQUFVLEVBQUUsQ0FBQztJQUM1QixNQUFNLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTlCLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25CLElBQUksQ0FBQztZQUNELE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsNENBQTRDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUM7QUFFTSxLQUFLLFVBQVUsTUFBTTtJQUN4QixJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1QsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEIsTUFBTSxHQUFHLElBQUksQ0FBQztJQUNsQixDQUFDO0lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0FBQzFELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNY3BTZXJ2ZXIgfSBmcm9tIFwiLi9tY3Atc2VydmVyXCI7XHJcbmltcG9ydCB7IFNjZW5lVG9vbHMgfSBmcm9tIFwiLi90b29scy9zY2VuZS10b29sc1wiO1xyXG5pbXBvcnQgeyBOb2RlVG9vbHMgfSBmcm9tIFwiLi90b29scy9ub2RlLXRvb2xzXCI7XHJcbmltcG9ydCB7IENvbXBvbmVudFRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvY29tcG9uZW50LXRvb2xzXCI7XHJcbmltcG9ydCB7IFByZWZhYlRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvcHJlZmFiLXRvb2xzXCI7XHJcbmltcG9ydCB7IFByb2plY3RUb29scyB9IGZyb20gXCIuL3Rvb2xzL3Byb2plY3QtdG9vbHNcIjtcclxuaW1wb3J0IHsgRGVidWdUb29scyB9IGZyb20gXCIuL3Rvb2xzL2RlYnVnLXRvb2xzXCI7XHJcbmltcG9ydCB7IFNjZW5lQWR2YW5jZWRUb29scyB9IGZyb20gXCIuL3Rvb2xzL3NjZW5lLWFkdmFuY2VkLXRvb2xzXCI7XHJcbmltcG9ydCB7IFNjZW5lVmlld1Rvb2xzIH0gZnJvbSBcIi4vdG9vbHMvc2NlbmUtdmlldy10b29sc1wiO1xyXG5pbXBvcnQgeyBBc3NldFRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvYXNzZXQtdG9vbHNcIjtcclxuaW1wb3J0IHsgUHJlZmVyZW5jZXNUb29scyB9IGZyb20gXCIuL3Rvb2xzL3ByZWZlcmVuY2VzLXRvb2xzXCI7XHJcbmltcG9ydCB7IFNlcnZlclRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvc2VydmVyLXRvb2xzXCI7XHJcbmltcG9ydCB7IEJ1aWxkZXJUb29scyB9IGZyb20gXCIuL3Rvb2xzL2J1aWxkZXItdG9vbHNcIjtcclxuaW1wb3J0IHsgUmVmZXJlbmNlSW1hZ2VUb29scyB9IGZyb20gXCIuL3Rvb2xzL3JlZmVyZW5jZS1pbWFnZS10b29sc1wiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJDb25maWcsIERFRkFVTFRfQ09ORklHIH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5cclxubGV0IHNlcnZlcjogTWNwU2VydmVyIHwgbnVsbCA9IG51bGw7XHJcblxyXG5mdW5jdGlvbiBnZXRTZXR0aW5nc1BhdGgoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJzZXR0aW5nc1wiLCBcImNvY29zLWNyZWF0b3ItbWNwLmpzb25cIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvYWRDb25maWcoKTogU2VydmVyQ29uZmlnIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcCA9IGdldFNldHRpbmdzUGF0aCgpO1xyXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHApKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwLCBcInV0Zi04XCIpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgLi4uREVGQVVMVF9DT05GSUcsIC4uLmRhdGEgfTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwiW2NvY29zLWNyZWF0b3ItbWNwXSBGYWlsZWQgdG8gbG9hZCBzZXR0aW5ncywgdXNpbmcgZGVmYXVsdHNcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geyAuLi5ERUZBVUxUX0NPTkZJRyB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBzYXZlQ29uZmlnKGNvbmZpZzogU2VydmVyQ29uZmlnKTogdm9pZCB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHAgPSBnZXRTZXR0aW5nc1BhdGgoKTtcclxuICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUocCk7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMocCwgSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKSwgXCJ1dGYtOFwiKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiW2NvY29zLWNyZWF0b3ItbWNwXSBGYWlsZWQgdG8gc2F2ZSBzZXR0aW5nczpcIiwgZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVNlcnZlcihjb25maWc6IFNlcnZlckNvbmZpZyk6IE1jcFNlcnZlciB7XHJcbiAgICBjb25zdCBzID0gbmV3IE1jcFNlcnZlcihjb25maWcpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgU2NlbmVUb29scygpKTtcclxuICAgIHMucmVnaXN0ZXIobmV3IE5vZGVUb29scygpKTtcclxuICAgIHMucmVnaXN0ZXIobmV3IENvbXBvbmVudFRvb2xzKCkpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgUHJlZmFiVG9vbHMoKSk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBQcm9qZWN0VG9vbHMoKSk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBEZWJ1Z1Rvb2xzKCkpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgU2NlbmVBZHZhbmNlZFRvb2xzKCkpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgU2NlbmVWaWV3VG9vbHMoKSk7XHJcbiAgICBzLnJlZ2lzdGVyKG5ldyBBc3NldFRvb2xzKCkpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgUHJlZmVyZW5jZXNUb29scygpKTtcclxuICAgIHMucmVnaXN0ZXIobmV3IFNlcnZlclRvb2xzKCkpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgQnVpbGRlclRvb2xzKCkpO1xyXG4gICAgcy5yZWdpc3RlcihuZXcgUmVmZXJlbmNlSW1hZ2VUb29scygpKTtcclxuICAgIHJldHVybiBzO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgbWV0aG9kczogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+ID0ge1xyXG4gICAgb3BlblBhbmVsKCkge1xyXG4gICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKFwiY29jb3MtY3JlYXRvci1tY3BcIik7XHJcbiAgICB9LFxyXG5cclxuICAgIG9wZW5SZWNvcmRlcigpIHtcclxuICAgICAgICBFZGl0b3IuUGFuZWwub3BlbihcImNvY29zLWNyZWF0b3ItbWNwLnJlY29yZGVyXCIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhc3luYyBzdGFydFNlcnZlcigpIHtcclxuICAgICAgICBpZiAoc2VydmVyPy5pc1J1bm5pbmcpIHJldHVybiB7IHJ1bm5pbmc6IHRydWUsIHBvcnQ6IHNlcnZlci5wb3J0IH07XHJcbiAgICAgICAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZygpO1xyXG4gICAgICAgIHNlcnZlciA9IGNyZWF0ZVNlcnZlcihjb25maWcpO1xyXG4gICAgICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xyXG4gICAgICAgIHJldHVybiB7IHJ1bm5pbmc6IHRydWUsIHBvcnQ6IHNlcnZlci5wb3J0IH07XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIHN0b3BTZXJ2ZXIoKSB7XHJcbiAgICAgICAgaWYgKHNlcnZlcikge1xyXG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuc3RvcCgpO1xyXG4gICAgICAgICAgICBzZXJ2ZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyBydW5uaW5nOiBmYWxzZSB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBhc3luYyB1cGRhdGVQb3J0KF9wb3J0OiBudW1iZXIpIHtcclxuICAgICAgICBjb25zdCBjb25maWcgPSBsb2FkQ29uZmlnKCk7XHJcbiAgICAgICAgY29uZmlnLnBvcnQgPSBfcG9ydDtcclxuICAgICAgICBzYXZlQ29uZmlnKGNvbmZpZyk7XHJcbiAgICAgICAgLy8gUmVzdGFydCBzZXJ2ZXIgaWYgcnVubmluZ1xyXG4gICAgICAgIGlmIChzZXJ2ZXI/LmlzUnVubmluZykge1xyXG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuc3RvcCgpO1xyXG4gICAgICAgICAgICBzZXJ2ZXIgPSBjcmVhdGVTZXJ2ZXIoY29uZmlnKTtcclxuICAgICAgICAgICAgYXdhaXQgc2VydmVyLnN0YXJ0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHBvcnQ6IF9wb3J0LCBydW5uaW5nOiBzZXJ2ZXI/LmlzUnVubmluZyA/PyBmYWxzZSB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRTZXJ2ZXJTdGF0dXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcnVubmluZzogc2VydmVyPy5pc1J1bm5pbmcgPz8gZmFsc2UsXHJcbiAgICAgICAgICAgIHBvcnQ6IHNlcnZlcj8ucG9ydCA/PyBsb2FkQ29uZmlnKCkucG9ydCxcclxuICAgICAgICAgICAgdG9vbENvdW50OiBzZXJ2ZXI/LmdldEFsbFRvb2xzKCkubGVuZ3RoID8/IDAsXHJcbiAgICAgICAgICAgIHRvb2xOYW1lczogc2VydmVyPy5nZXRBbGxUb29scygpLm1hcCgodCkgPT4gdC5uYW1lKS5zb3J0KCkgPz8gW10sXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZCgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiW2NvY29zLWNyZWF0b3ItbWNwXSBFeHRlbnNpb24gbG9hZGVkXCIpO1xyXG4gICAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZygpO1xyXG4gICAgc2VydmVyID0gY3JlYXRlU2VydmVyKGNvbmZpZyk7XHJcblxyXG4gICAgaWYgKGNvbmZpZy5hdXRvU3RhcnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBzZXJ2ZXIuc3RhcnQoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFtjb2Nvcy1jcmVhdG9yLW1jcF0gQXV0by1zdGFydGVkIG9uIHBvcnQgJHtjb25maWcucG9ydH1gKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbY29jb3MtY3JlYXRvci1tY3BdIEF1dG8tc3RhcnQgZmFpbGVkOlwiLCBlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1bmxvYWQoKSB7XHJcbiAgICBpZiAoc2VydmVyKSB7XHJcbiAgICAgICAgYXdhaXQgc2VydmVyLnN0b3AoKTtcclxuICAgICAgICBzZXJ2ZXIgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coXCJbY29jb3MtY3JlYXRvci1tY3BdIEV4dGVuc2lvbiB1bmxvYWRlZFwiKTtcclxufVxyXG4iXX0=