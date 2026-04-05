"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugTools = void 0;
const tool_base_1 = require("../tool-base");
const mcp_server_1 = require("../mcp-server");
class DebugTools {
    constructor() {
        this.categoryName = "debug";
    }
    getTools() {
        return [
            {
                name: "debug_get_editor_info",
                description: "Get Cocos Creator editor information (version, platform, language).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_list_messages",
                description: "List available Editor messages for a given extension or built-in module.",
                inputSchema: {
                    type: "object",
                    properties: {
                        target: { type: "string", description: "Message target (e.g. 'scene', 'asset-db', 'extension')" },
                    },
                    required: ["target"],
                },
            },
            {
                name: "debug_execute_script",
                description: "Execute a custom scene script method. The method must be registered in scene.ts.",
                inputSchema: {
                    type: "object",
                    properties: {
                        method: { type: "string", description: "Method name from scene.ts" },
                        args: { type: "array", description: "Arguments to pass", items: {} },
                    },
                    required: ["method"],
                },
            },
            {
                name: "debug_get_console_logs",
                description: "Get recent console log entries. Automatically captures scene process logs (console.log/warn/error in scene scripts). Game preview logs can also be captured by sending POST requests to /log endpoint — see README for setup.",
                inputSchema: {
                    type: "object",
                    properties: {
                        count: { type: "number", description: "Max number of entries (default 50)" },
                        level: { type: "string", description: "Filter by level: 'log', 'warn', or 'error'" },
                        source: { type: "string", description: "Filter by source: 'scene' or 'game'. Returns both if omitted." },
                    },
                },
            },
            {
                name: "debug_clear_console",
                description: "Clear the editor console.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_list_extensions",
                description: "List all installed extensions.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_get_project_logs",
                description: "Read recent project log entries from the log file.",
                inputSchema: {
                    type: "object",
                    properties: {
                        lines: { type: "number", description: "Number of lines to read (default 100)" },
                    },
                },
            },
            {
                name: "debug_search_project_logs",
                description: "Search for a pattern in project logs.",
                inputSchema: {
                    type: "object",
                    properties: {
                        pattern: { type: "string", description: "Search pattern (regex supported)" },
                    },
                    required: ["pattern"],
                },
            },
            {
                name: "debug_get_log_file_info",
                description: "Get information about the project log file (size, path, last modified).",
                inputSchema: { type: "object", properties: {} },
            },
            // ── 以下、既存MCP未対応のEditor API ──
            {
                name: "debug_query_devices",
                description: "List connected devices (for native debugging).",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_open_url",
                description: "Open a URL in the system browser from the editor.",
                inputSchema: {
                    type: "object",
                    properties: { url: { type: "string", description: "URL to open" } },
                    required: ["url"],
                },
            },
            {
                name: "debug_validate_scene",
                description: "Validate the current scene for common issues.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_game_command",
                description: "Send a command to the running game preview. Requires GameDebugClient in the game. Commands: 'screenshot' (capture game canvas), 'state' (dump GameDb), 'navigate' (go to a page), 'click' (click a node by name), 'inspect' (get runtime node info: UITransform sizes, Widget, Layout, position). Returns the result from the game.",
                inputSchema: {
                    type: "object",
                    properties: {
                        type: { type: "string", description: "Command type: 'screenshot', 'state', 'navigate', 'click', 'inspect'" },
                        args: { description: "Command arguments (e.g. {page: 'HomePageView'} for navigate, {name: 'ButtonName'} for click)" },
                        timeout: { type: "number", description: "Max wait time in ms (default 5000)" },
                        maxWidth: { type: "number", description: "Max width for screenshot resize (default: 960, 0 = no resize)" },
                    },
                    required: ["type"],
                },
            },
            {
                name: "debug_screenshot",
                description: "Take a screenshot of the editor window and save to a file. Returns the file path of the saved PNG.",
                inputSchema: {
                    type: "object",
                    properties: {
                        savePath: { type: "string", description: "File path to save the PNG (default: temp/screenshots/screenshot_<timestamp>.png)" },
                        maxWidth: { type: "number", description: "Max width in pixels for resize (default: 960, 0 = no resize). Aspect ratio is preserved." },
                    },
                },
            },
            {
                name: "debug_preview",
                description: "Start or stop the game preview. Uses Preview in Editor (auto-opens MainScene if needed). Falls back to browser preview if editor preview fails.",
                inputSchema: {
                    type: "object",
                    properties: {
                        action: { type: "string", description: "'start' (default) or 'stop'" },
                        waitForReady: { type: "boolean", description: "If true, wait until GameDebugClient connects after start (default: false)" },
                        waitTimeout: { type: "number", description: "Max wait time in ms for waitForReady (default: 15000)" },
                    },
                },
            },
            {
                name: "debug_clear_code_cache",
                description: "Clear the code cache (equivalent to Developer > Cache > Clear code cache) and soft-reload the scene.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_reload_extension",
                description: "Reload the MCP extension itself. Use after npm run build to apply code changes without restarting CocosCreator. Response is sent before reload starts.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "debug_get_extension_info",
                description: "Get detailed information about a specific extension.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Extension name" },
                    },
                    required: ["name"],
                },
            },
            {
                name: "debug_record_start",
                description: "Start recording the game preview canvas to a WebM video file. Uses MediaRecorder on the game side (requires GameDebugClient with record_start handler). Returns recording id.",
                inputSchema: {
                    type: "object",
                    properties: {
                        fps: { type: "number", description: "Frames per second (default: 30)" },
                        videoBitsPerSecond: { type: "number", description: "Bitrate in bps (default: 4000000)" },
                    },
                },
            },
            {
                name: "debug_record_stop",
                description: "Stop recording started by debug_record_start. Returns the saved WebM file path and size. Video is saved to project's temp/recordings/rec_<datetime>.webm.",
                inputSchema: {
                    type: "object",
                    properties: {
                        timeout: { type: "number", description: "Max wait time in ms for file upload (default: 30000)" },
                    },
                },
            },
            {
                name: "debug_batch_screenshot",
                description: "Navigate to multiple pages and take a screenshot of each. Requires game preview running with GameDebugClient. Returns an array of screenshot file paths.",
                inputSchema: {
                    type: "object",
                    properties: {
                        pages: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of page names to screenshot (e.g. ['HomePageView', 'ShopPageView'])",
                        },
                        delay: { type: "number", description: "Delay in ms between navigate and screenshot (default: 1000)" },
                        maxWidth: { type: "number", description: "Max width for screenshot resize (default: 960)" },
                    },
                    required: ["pages"],
                },
            },
        ];
    }
    async execute(toolName, args) {
        try {
            switch (toolName) {
                case "debug_get_editor_info":
                    return this.getEditorInfo();
                case "debug_list_messages":
                    return this.listMessages(args.target);
                case "debug_execute_script":
                    return this.executeScript(args.method, args.args || []);
                case "debug_get_console_logs":
                    return this.getConsoleLogs(args.count || 50, args.level, args.source);
                case "debug_clear_console":
                    Editor.Message.send("console", "clear");
                    // Clear scene process log buffer
                    await Editor.Message.request("scene", "execute-scene-script", {
                        name: "cocos-creator-mcp",
                        method: "clearConsoleLogs",
                        args: [],
                    }).catch(() => { });
                    // Clear game preview log buffer
                    (0, mcp_server_1.clearGameLogs)();
                    return (0, tool_base_1.ok)({ success: true });
                case "debug_list_extensions":
                    return this.listExtensions();
                case "debug_get_project_logs":
                    return this.getProjectLogs(args.lines || 100);
                case "debug_search_project_logs":
                    return this.searchProjectLogs(args.pattern);
                case "debug_get_log_file_info":
                    return this.getLogFileInfo();
                case "debug_query_devices": {
                    const devices = await Editor.Message.request("device", "query").catch(() => []);
                    return (0, tool_base_1.ok)({ success: true, devices });
                }
                case "debug_open_url":
                    await Editor.Message.request("program", "open-url", args.url);
                    return (0, tool_base_1.ok)({ success: true, url: args.url });
                case "debug_game_command":
                    return this.gameCommand(args.type || args.command, args.args, args.timeout || 5000, args.maxWidth);
                case "debug_screenshot":
                    return this.takeScreenshot(args.savePath, args.maxWidth);
                case "debug_preview":
                    return this.handlePreview(args.action || "start", args.waitForReady, args.waitTimeout || 15000);
                case "debug_clear_code_cache":
                    return this.clearCodeCache();
                case "debug_reload_extension":
                    return this.reloadExtension();
                case "debug_validate_scene":
                    return this.validateScene();
                case "debug_get_extension_info":
                    return this.getExtensionInfo(args.name);
                case "debug_batch_screenshot":
                    return this.batchScreenshot(args.pages, args.delay || 1000, args.maxWidth);
                case "debug_record_start":
                    return this.gameCommand("record_start", { fps: args.fps, videoBitsPerSecond: args.videoBitsPerSecond }, 5000);
                case "debug_record_stop":
                    return this.gameCommand("record_stop", undefined, args.timeout || 30000);
                default:
                    return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
            }
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getEditorInfo() {
        var _a, _b;
        return (0, tool_base_1.ok)({
            success: true,
            version: Editor.App.version,
            path: Editor.App.path,
            home: Editor.App.home,
            language: ((_b = (_a = Editor.I18n) === null || _a === void 0 ? void 0 : _a.getLanguage) === null || _b === void 0 ? void 0 : _b.call(_a)) || "unknown",
        });
    }
    async listMessages(target) {
        try {
            const info = await Editor.Message.request("extension", "query-info", target);
            return (0, tool_base_1.ok)({ success: true, target, info });
        }
        catch (e) {
            const knownMessages = {
                "scene": [
                    "query-node-tree", "create-node", "remove-node", "duplicate-node",
                    "set-property", "create-prefab", "save-scene", "execute-scene-script",
                    "query-is-dirty", "query-classes", "soft-reload", "snapshot",
                    "change-gizmo-tool", "query-gizmo-tool-name", "focus-camera-on-nodes",
                ],
                "asset-db": [
                    "query-assets", "query-asset-info", "query-asset-meta",
                    "refresh-asset", "save-asset", "create-asset", "delete-asset",
                    "move-asset", "copy-asset", "open-asset", "reimport-asset",
                    "query-path", "query-uuid", "query-url", "query-asset-depends",
                ],
            };
            const messages = knownMessages[target];
            if (messages) {
                return (0, tool_base_1.ok)({ success: true, target, messages, note: "Static list (query failed)" });
            }
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async executeScript(method, args) {
        const result = await Editor.Message.request("scene", "execute-scene-script", {
            name: "cocos-creator-mcp",
            method,
            args,
        });
        return (0, tool_base_1.ok)(result);
    }
    async getConsoleLogs(count, level, source) {
        // 1. Try Editor's native console API first (may be supported in future CocosCreator versions)
        if (!source) {
            try {
                const logs = await Editor.Message.request("console", "query-last-logs", count);
                if (Array.isArray(logs) && logs.length > 0) {
                    return (0, tool_base_1.ok)({ success: true, logs, source: "editor-api", note: "Using native Editor console API" });
                }
            }
            catch ( /* Not supported in this version — use fallback */_a) { /* Not supported in this version — use fallback */ }
        }
        // 2. Fallback: collect from scene process buffer + game preview buffer
        let sceneLogs = [];
        let gameLogs = [];
        // 2a. Scene process logs (console wrapper in scene.ts)
        if (!source || source === "scene") {
            try {
                const result = await Editor.Message.request("scene", "execute-scene-script", {
                    name: "cocos-creator-mcp",
                    method: "getConsoleLogs",
                    args: [count * 2, level], // request more, will trim after merge
                });
                if (result === null || result === void 0 ? void 0 : result.logs) {
                    sceneLogs = result.logs.map((l) => (Object.assign(Object.assign({}, l), { source: "scene" })));
                }
            }
            catch ( /* scene not available */_b) { /* scene not available */ }
        }
        // 2b. Game preview logs (received via POST /log endpoint)
        if (!source || source === "game") {
            const gameResult = (0, mcp_server_1.getGameLogs)(count * 2, level);
            gameLogs = gameResult.logs.map((l) => (Object.assign(Object.assign({}, l), { source: "game" })));
        }
        // Merge and sort by timestamp, take last `count`
        const merged = [...sceneLogs, ...gameLogs]
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
            .slice(-count);
        return (0, tool_base_1.ok)({
            success: true,
            logs: merged,
            total: { scene: sceneLogs.length, game: (source === "scene" ? 0 : gameLogs.length) },
        });
    }
    async listExtensions() {
        try {
            const list = await Editor.Message.request("extension", "query-all");
            return (0, tool_base_1.ok)({ success: true, extensions: list });
        }
        catch (_a) {
            return (0, tool_base_1.ok)({ success: true, extensions: [], note: "Extension query not supported" });
        }
    }
    async getExtensionInfo(name) {
        try {
            const info = await Editor.Message.request("extension", "query-info", name);
            return (0, tool_base_1.ok)({ success: true, name, info });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getProjectLogs(lines) {
        try {
            const fs = require("fs");
            const path = require("path");
            const logPath = path.join(Editor.Project.tmpDir, "logs", "project.log");
            if (!fs.existsSync(logPath))
                return (0, tool_base_1.ok)({ success: true, logs: [], note: "Log file not found" });
            const content = fs.readFileSync(logPath, "utf-8");
            const allLines = content.split("\n");
            const recent = allLines.slice(-lines);
            return (0, tool_base_1.ok)({ success: true, lines: recent.length, logs: recent });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async searchProjectLogs(pattern) {
        try {
            const fs = require("fs");
            const path = require("path");
            const logPath = path.join(Editor.Project.tmpDir, "logs", "project.log");
            if (!fs.existsSync(logPath))
                return (0, tool_base_1.ok)({ success: true, matches: [] });
            const content = fs.readFileSync(logPath, "utf-8");
            const regex = new RegExp(pattern, "gi");
            const matches = content.split("\n").filter((line) => regex.test(line));
            return (0, tool_base_1.ok)({ success: true, pattern, count: matches.length, matches: matches.slice(0, 100) });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getLogFileInfo() {
        try {
            const fs = require("fs");
            const path = require("path");
            const logPath = path.join(Editor.Project.tmpDir, "logs", "project.log");
            if (!fs.existsSync(logPath))
                return (0, tool_base_1.ok)({ success: true, exists: false });
            const stat = fs.statSync(logPath);
            return (0, tool_base_1.ok)({ success: true, exists: true, path: logPath, size: stat.size, modified: stat.mtime });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async handlePreview(action, waitForReady, waitTimeout) {
        if (action === "stop") {
            return this.stopPreview();
        }
        const result = await this.startPreview();
        if (waitForReady) {
            const resultData = JSON.parse(result.content[0].text);
            if (resultData.success) {
                const ready = await this.waitForGameReady(waitTimeout || 15000);
                resultData.gameReady = ready;
                if (!ready) {
                    resultData.note = (resultData.note || "") + " GameDebugClient did not connect within timeout.";
                }
                return (0, tool_base_1.ok)(resultData);
            }
        }
        return result;
    }
    async waitForGameReady(timeout) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            // Check if game has sent any log or command result recently
            const gameResult = (0, mcp_server_1.getGameLogs)(1);
            if (gameResult.total > 0)
                return true;
            await new Promise(r => setTimeout(r, 500));
        }
        return false;
    }
    async startPreview() {
        try {
            await this.ensureMainSceneOpen();
            // ツールバーのVueインスタンス経由でplay()を呼ぶ（UI状態も同期される）
            const played = await this.executeOnToolbar("start");
            if (played) {
                return (0, tool_base_1.ok)({ success: true, action: "start", mode: "editor" });
            }
            // フォールバック: 直接API
            const isPlaying = await Editor.Message.request("scene", "editor-preview-set-play", true);
            return (0, tool_base_1.ok)({ success: true, isPlaying, action: "start", mode: "editor", note: "direct API (toolbar UI may not sync)" });
        }
        catch (e) {
            try {
                const electron = require("electron");
                await electron.shell.openExternal("http://127.0.0.1:7456");
                return (0, tool_base_1.ok)({ success: true, action: "start", mode: "browser" });
            }
            catch (e2) {
                return (0, tool_base_1.err)(e2.message || String(e2));
            }
        }
    }
    async stopPreview() {
        try {
            // ツールバー経由で停止（UI同期）
            const stopped = await this.executeOnToolbar("stop");
            if (!stopped) {
                // フォールバック: 直接API
                await Editor.Message.request("scene", "editor-preview-set-play", false);
            }
            // scene:preview-stop ブロードキャストでツールバーUI状態をリセット
            Editor.Message.broadcast("scene:preview-stop");
            // シーンビューに戻す
            await new Promise(r => setTimeout(r, 500));
            await this.ensureMainSceneOpen();
            return (0, tool_base_1.ok)({ success: true, action: "stop" });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async executeOnToolbar(action) {
        try {
            const electron = require("electron");
            const allContents = electron.webContents.getAllWebContents();
            for (const wc of allContents) {
                try {
                    // play()をawaitしない — プレビュー完了を待つとタイムアウトするため
                    if (action === "start") {
                        const result = await wc.executeJavaScript(`(function() { if (window.xxx && window.xxx.play && !window.xxx.gameView.isPlay) { window.xxx.play(); return true; } return false; })()`);
                        if (result)
                            return true;
                    }
                    else {
                        const result = await wc.executeJavaScript(`(function() { if (window.xxx && window.xxx.gameView.isPlay) { window.xxx.play(); return true; } return false; })()`);
                        if (result)
                            return true;
                    }
                }
                catch ( /* not the toolbar webContents */_a) { /* not the toolbar webContents */ }
            }
        }
        catch ( /* electron API not available */_b) { /* electron API not available */ }
        return false;
    }
    async ensureMainSceneOpen() {
        const hierarchy = await Editor.Message.request("scene", "execute-scene-script", {
            name: "cocos-creator-mcp",
            method: "getSceneHierarchy",
            args: [false],
        }).catch(() => null);
        if (!(hierarchy === null || hierarchy === void 0 ? void 0 : hierarchy.sceneName) || hierarchy.sceneName === "scene-2d") {
            // プロジェクト設定のStart Sceneを参照
            let sceneUuid = null;
            try {
                sceneUuid = await Editor.Profile.getConfig("preview", "general.start_scene", "local");
            }
            catch ( /* ignore */_a) { /* ignore */ }
            // Start Sceneが未設定 or "current_scene" の場合、最初のシーンを使う
            if (!sceneUuid || sceneUuid === "current_scene") {
                const scenes = await Editor.Message.request("asset-db", "query-assets", {
                    ccType: "cc.SceneAsset",
                    pattern: "db://assets/**/*",
                });
                if (Array.isArray(scenes) && scenes.length > 0) {
                    sceneUuid = scenes[0].uuid;
                }
            }
            if (sceneUuid) {
                await Editor.Message.request("scene", "open-scene", sceneUuid);
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    }
    async clearCodeCache() {
        try {
            const electron = require("electron");
            const menu = electron.Menu.getApplicationMenu();
            if (!menu)
                return (0, tool_base_1.err)("Application menu not found");
            const findMenuItem = (items, path) => {
                var _a;
                for (const item of items) {
                    if (item.label === path[0]) {
                        if (path.length === 1)
                            return item;
                        if ((_a = item.submenu) === null || _a === void 0 ? void 0 : _a.items)
                            return findMenuItem(item.submenu.items, path.slice(1));
                    }
                }
                return null;
            };
            const cacheItem = findMenuItem(menu.items, ["Developer", "Cache", "Clear code cache"]);
            if (!cacheItem)
                return (0, tool_base_1.err)("Menu item 'Developer > Cache > Clear code cache' not found");
            cacheItem.click();
            await new Promise(r => setTimeout(r, 1000));
            return (0, tool_base_1.ok)({ success: true, note: "Code cache cleared via menu" });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async gameCommand(type, args, timeout, maxWidth) {
        var _a;
        const cmdId = (0, mcp_server_1.queueGameCommand)(type, args);
        // Poll for result
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const result = (0, mcp_server_1.getCommandResult)();
            if (result && result.id === cmdId) {
                // If screenshot, save to file and return path
                if (type === "screenshot" && result.success && ((_a = result.data) === null || _a === void 0 ? void 0 : _a.dataUrl)) {
                    try {
                        const fs = require("fs");
                        const path = require("path");
                        const dir = path.join(Editor.Project.tmpDir, "screenshots");
                        if (!fs.existsSync(dir))
                            fs.mkdirSync(dir, { recursive: true });
                        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                        const base64 = result.data.dataUrl.replace(/^data:image\/png;base64,/, "");
                        const pngBuffer = Buffer.from(base64, "base64");
                        const effectiveMaxWidth = maxWidth !== undefined ? maxWidth : 960;
                        const electron = require("electron");
                        const origImage = electron.nativeImage.createFromBuffer(pngBuffer);
                        const originalSize = origImage.getSize();
                        const { buffer, width, height, format } = await this.processImage(pngBuffer, effectiveMaxWidth);
                        const ext = format === "webp" ? "webp" : format === "jpeg" ? "jpg" : "png";
                        const filePath = path.join(dir, `game_${timestamp}.${ext}`);
                        fs.writeFileSync(filePath, buffer);
                        return (0, tool_base_1.ok)({
                            success: true, path: filePath, size: buffer.length, format,
                            originalSize: `${originalSize.width}x${originalSize.height}`,
                            savedSize: `${width}x${height}`,
                        });
                    }
                    catch (e) {
                        return (0, tool_base_1.ok)({ success: true, note: "Screenshot captured but file save failed", error: e.message });
                    }
                }
                return (0, tool_base_1.ok)(result);
            }
            await new Promise(r => setTimeout(r, 200));
        }
        return (0, tool_base_1.err)(`Game did not respond within ${timeout}ms. Is GameDebugClient running in the preview?`);
    }
    async processImage(pngBuffer, maxWidth) {
        try {
            const Vips = require("wasm-vips");
            const vips = await Vips();
            let image = vips.Image.newFromBuffer(pngBuffer);
            const origW = image.width;
            const origH = image.height;
            if (maxWidth > 0 && origW > maxWidth) {
                image = image.thumbnailImage(maxWidth);
            }
            const outBuf = image.webpsaveBuffer({ Q: 85 });
            const result = { buffer: Buffer.from(outBuf), width: image.width, height: image.height, format: "webp" };
            image.delete();
            return result;
        }
        catch (_a) {
            // Fallback: NativeImage resize + JPEG
            const electron = require("electron");
            let image = electron.nativeImage.createFromBuffer(pngBuffer);
            if (maxWidth > 0) {
                const size = image.getSize();
                if (size.width > maxWidth) {
                    const ratio = maxWidth / size.width;
                    image = image.resize({ width: Math.round(size.width * ratio), height: Math.round(size.height * ratio) });
                }
            }
            const size = image.getSize();
            const buffer = image.toJPEG(85);
            return { buffer, width: size.width, height: size.height, format: "jpeg" };
        }
    }
    async takeScreenshot(savePath, maxWidth) {
        try {
            const fs = require("fs");
            const path = require("path");
            const electron = require("electron");
            const windows = electron.BrowserWindow.getAllWindows();
            if (!windows || windows.length === 0) {
                return (0, tool_base_1.err)("No editor window found");
            }
            // Find the main (largest) window
            let win = windows[0];
            let maxArea = 0;
            for (const w of windows) {
                const bounds = w.getBounds();
                const area = bounds.width * bounds.height;
                if (area > maxArea) {
                    maxArea = area;
                    win = w;
                }
            }
            // Bring to front and wait for render
            win.show();
            await new Promise(r => setTimeout(r, 300));
            const nativeImage = await win.webContents.capturePage();
            const originalSize = nativeImage.getSize();
            const pngBuffer = nativeImage.toPNG();
            const effectiveMaxWidth = maxWidth !== undefined ? maxWidth : 960;
            const { buffer, width, height, format } = await this.processImage(pngBuffer, effectiveMaxWidth);
            // Determine save path
            const ext = format === "webp" ? "webp" : format === "jpeg" ? "jpg" : "png";
            if (!savePath) {
                const dir = path.join(Editor.Project.tmpDir, "screenshots");
                if (!fs.existsSync(dir))
                    fs.mkdirSync(dir, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                savePath = path.join(dir, `screenshot_${timestamp}.${ext}`);
            }
            fs.writeFileSync(savePath, buffer);
            return (0, tool_base_1.ok)({
                success: true, path: savePath, size: buffer.length, format,
                originalSize: `${originalSize.width}x${originalSize.height}`,
                savedSize: `${width}x${height}`,
            });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async reloadExtension() {
        // Schedule reload after response is sent
        setTimeout(async () => {
            try {
                await Editor.Message.request("extension", "reload", "cocos-creator-mcp");
            }
            catch (e) {
                console.error("[MCP] Extension reload failed:", e.message);
            }
        }, 500);
        return (0, tool_base_1.ok)({ success: true, note: "Extension reload scheduled. MCP server will restart in ~1s. NOTE: Adding new tool definitions or modifying scene.ts requires a full CocosCreator restart (reload is not sufficient)." });
    }
    async batchScreenshot(pages, delay, maxWidth) {
        const results = [];
        const timeout = 10000;
        for (const page of pages) {
            // Navigate
            const navResult = await this.gameCommand("navigate", { page }, timeout, maxWidth);
            const navData = JSON.parse(navResult.content[0].text);
            if (!navData.success) {
                results.push({ page, success: false, error: "navigate failed" });
                continue;
            }
            // Wait for page to render
            await new Promise(r => setTimeout(r, delay));
            // Screenshot
            const ssResult = await this.gameCommand("screenshot", {}, timeout, maxWidth);
            const ssData = JSON.parse(ssResult.content[0].text);
            results.push({
                page,
                success: ssData.success || false,
                path: ssData.path,
                error: ssData.success ? undefined : (ssData.error || ssData.message),
            });
        }
        const succeeded = results.filter(r => r.success).length;
        return (0, tool_base_1.ok)({
            success: true,
            total: pages.length,
            succeeded,
            failed: pages.length - succeeded,
            results,
        });
    }
    async validateScene() {
        try {
            const tree = await Editor.Message.request("scene", "query-node-tree");
            const issues = [];
            const checkNodes = (nodes) => {
                if (!nodes)
                    return;
                for (const node of nodes) {
                    if (!node.name)
                        issues.push(`Node ${node.uuid} has no name`);
                    if (node.children)
                        checkNodes(node.children);
                }
            };
            if (Array.isArray(tree))
                checkNodes(tree);
            return (0, tool_base_1.ok)({ success: true, issueCount: issues.length, issues });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
}
exports.DebugTools = DebugTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWctdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvZGVidWctdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBQ3ZDLDhDQUErRjtBQUUvRixNQUFhLFVBQVU7SUFBdkI7UUFDYSxpQkFBWSxHQUFHLE9BQU8sQ0FBQztJQTJ2QnBDLENBQUM7SUF6dkJHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLHVCQUF1QjtnQkFDN0IsV0FBVyxFQUFFLHFFQUFxRTtnQkFDbEYsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHFCQUFxQjtnQkFDM0IsV0FBVyxFQUFFLDBFQUEwRTtnQkFDdkYsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx3REFBd0QsRUFBRTtxQkFDcEc7b0JBQ0QsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUN2QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsV0FBVyxFQUFFLGtGQUFrRjtnQkFDL0YsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSwyQkFBMkIsRUFBRTt3QkFDcEUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtxQkFDdkU7b0JBQ0QsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUN2QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHdC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QUM7WUFDRCxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztZQUM1QixNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQVksRUFBRSxFQUFFO2dCQUNoQyxJQUFJLENBQUMsS0FBSztvQkFBRSxPQUFPO2dCQUNuQixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7d0JBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLGNBQWMsQ0FBQyxDQUFDO29CQUM3RCxJQUFJLElBQUksQ0FBQyxRQUFRO3dCQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pELENBQUM7WUFDTCxDQUFDLENBQUM7WUFDRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQyxPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxJQUFBLGVBQUcsRUFBQyxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUE1dkJELGdDQTR2QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBUb29sUmVzdWx0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XHJcbmltcG9ydCB7IG9rLCBlcnIgfSBmcm9tIFwiLi4vdG9vbC1iYXNlXCI7XHJcbmltcG9ydCB7IGdldEdhbWVMb2dzLCBjbGVhckdhbWVMb2dzLCBxdWV1ZUdhbWVDb21tYW5kLCBnZXRDb21tYW5kUmVzdWx0IH0gZnJvbSBcIi4uL21jcC1zZXJ2ZXJcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEZWJ1Z1Rvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwiZGVidWdcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dldF9lZGl0b3JfaW5mb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IENvY29zIENyZWF0b3IgZWRpdG9yIGluZm9ybWF0aW9uICh2ZXJzaW9uLCBwbGF0Zm9ybSwgbGFuZ3VhZ2UpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19saXN0X21lc3NhZ2VzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGF2YWlsYWJsZSBFZGl0b3IgbWVzc2FnZXMgZm9yIGEgZ2l2ZW4gZXh0ZW5zaW9uIG9yIGJ1aWx0LWluIG1vZHVsZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJNZXNzYWdlIHRhcmdldCAoZS5nLiAnc2NlbmUnLCAnYXNzZXQtZGInLCAnZXh0ZW5zaW9uJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInRhcmdldFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZXhlY3V0ZV9zY3JpcHRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkV4ZWN1dGUgYSBjdXN0b20gc2NlbmUgc2NyaXB0IG1ldGhvZC4gVGhlIG1ldGhvZCBtdXN0IGJlIHJlZ2lzdGVyZWQgaW4gc2NlbmUudHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTWV0aG9kIG5hbWUgZnJvbSBzY2VuZS50c1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IHsgdHlwZTogXCJhcnJheVwiLCBkZXNjcmlwdGlvbjogXCJBcmd1bWVudHMgdG8gcGFzc1wiLCBpdGVtczoge30gfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJtZXRob2RcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dldF9jb25zb2xlX2xvZ3NcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCByZWNlbnQgY29uc29sZSBsb2cgZW50cmllcy4gQXV0b21hdGljYWxseSBjYXB0dXJlcyBzY2VuZSBwcm9jZXNzIGxvZ3MgKGNvbnNvbGUubG9nL3dhcm4vZXJyb3IgaW4gc2NlbmUgc2NyaXB0cykuIEdhbWUgcHJldmlldyBsb2dzIGNhbiBhbHNvIGJlIGNhcHR1cmVkIGJ5IHNlbmRpbmcgUE9TVCByZXF1ZXN0cyB0byAvbG9nIGVuZHBvaW50IOKAlCBzZWUgUkVBRE1FIGZvciBzZXR1cC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCBudW1iZXIgb2YgZW50cmllcyAoZGVmYXVsdCA1MClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXZlbDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJGaWx0ZXIgYnkgbGV2ZWw6ICdsb2cnLCAnd2FybicsIG9yICdlcnJvcidcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiRmlsdGVyIGJ5IHNvdXJjZTogJ3NjZW5lJyBvciAnZ2FtZScuIFJldHVybnMgYm90aCBpZiBvbWl0dGVkLlwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfY2xlYXJfY29uc29sZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2xlYXIgdGhlIGVkaXRvciBjb25zb2xlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19saXN0X2V4dGVuc2lvbnNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkxpc3QgYWxsIGluc3RhbGxlZCBleHRlbnNpb25zLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfcHJvamVjdF9sb2dzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZWFkIHJlY2VudCBwcm9qZWN0IGxvZyBlbnRyaWVzIGZyb20gdGhlIGxvZyBmaWxlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXM6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTnVtYmVyIG9mIGxpbmVzIHRvIHJlYWQgKGRlZmF1bHQgMTAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfc2VhcmNoX3Byb2plY3RfbG9nc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2VhcmNoIGZvciBhIHBhdHRlcm4gaW4gcHJvamVjdCBsb2dzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTZWFyY2ggcGF0dGVybiAocmVnZXggc3VwcG9ydGVkKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicGF0dGVyblwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X2xvZ19maWxlX2luZm9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgcHJvamVjdCBsb2cgZmlsZSAoc2l6ZSwgcGF0aCwgbGFzdCBtb2RpZmllZCkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyDilIDilIAg5Lul5LiL44CB5pei5a2YTUNQ5pyq5a++5b+c44GuRWRpdG9yIEFQSSDilIDilIBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19xdWVyeV9kZXZpY2VzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGNvbm5lY3RlZCBkZXZpY2VzIChmb3IgbmF0aXZlIGRlYnVnZ2luZykuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX29wZW5fdXJsXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPcGVuIGEgVVJMIGluIHRoZSBzeXN0ZW0gYnJvd3NlciBmcm9tIHRoZSBlZGl0b3IuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogeyB1cmw6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiVVJMIHRvIG9wZW5cIiB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInVybFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfdmFsaWRhdGVfc2NlbmVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlZhbGlkYXRlIHRoZSBjdXJyZW50IHNjZW5lIGZvciBjb21tb24gaXNzdWVzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nYW1lX2NvbW1hbmRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNlbmQgYSBjb21tYW5kIHRvIHRoZSBydW5uaW5nIGdhbWUgcHJldmlldy4gUmVxdWlyZXMgR2FtZURlYnVnQ2xpZW50IGluIHRoZSBnYW1lLiBDb21tYW5kczogJ3NjcmVlbnNob3QnIChjYXB0dXJlIGdhbWUgY2FudmFzKSwgJ3N0YXRlJyAoZHVtcCBHYW1lRGIpLCAnbmF2aWdhdGUnIChnbyB0byBhIHBhZ2UpLCAnY2xpY2snIChjbGljayBhIG5vZGUgYnkgbmFtZSksICdpbnNwZWN0JyAoZ2V0IHJ1bnRpbWUgbm9kZSBpbmZvOiBVSVRyYW5zZm9ybSBzaXplcywgV2lkZ2V0LCBMYXlvdXQsIHBvc2l0aW9uKS4gUmV0dXJucyB0aGUgcmVzdWx0IGZyb20gdGhlIGdhbWUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkNvbW1hbmQgdHlwZTogJ3NjcmVlbnNob3QnLCAnc3RhdGUnLCAnbmF2aWdhdGUnLCAnY2xpY2snLCAnaW5zcGVjdCdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7IGRlc2NyaXB0aW9uOiBcIkNvbW1hbmQgYXJndW1lbnRzIChlLmcuIHtwYWdlOiAnSG9tZVBhZ2VWaWV3J30gZm9yIG5hdmlnYXRlLCB7bmFtZTogJ0J1dHRvbk5hbWUnfSBmb3IgY2xpY2spXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggd2FpdCB0aW1lIGluIG1zIChkZWZhdWx0IDUwMDApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdpZHRoIGZvciBzY3JlZW5zaG90IHJlc2l6ZSAoZGVmYXVsdDogOTYwLCAwID0gbm8gcmVzaXplKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfc2NyZWVuc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGFrZSBhIHNjcmVlbnNob3Qgb2YgdGhlIGVkaXRvciB3aW5kb3cgYW5kIHNhdmUgdG8gYSBmaWxlLiBSZXR1cm5zIHRoZSBmaWxlIHBhdGggb2YgdGhlIHNhdmVkIFBORy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkZpbGUgcGF0aCB0byBzYXZlIHRoZSBQTkcgKGRlZmF1bHQ6IHRlbXAvc2NyZWVuc2hvdHMvc2NyZWVuc2hvdF88dGltZXN0YW1wPi5wbmcpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdpZHRoIGluIHBpeGVscyBmb3IgcmVzaXplIChkZWZhdWx0OiA5NjAsIDAgPSBubyByZXNpemUpLiBBc3BlY3QgcmF0aW8gaXMgcHJlc2VydmVkLlwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcHJldmlld1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU3RhcnQgb3Igc3RvcCB0aGUgZ2FtZSBwcmV2aWV3LiBVc2VzIFByZXZpZXcgaW4gRWRpdG9yIChhdXRvLW9wZW5zIE1haW5TY2VuZSBpZiBuZWVkZWQpLiBGYWxscyBiYWNrIHRvIGJyb3dzZXIgcHJldmlldyBpZiBlZGl0b3IgcHJldmlldyBmYWlscy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCInc3RhcnQnIChkZWZhdWx0KSBvciAnc3RvcCdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yUmVhZHk6IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIklmIHRydWUsIHdhaXQgdW50aWwgR2FtZURlYnVnQ2xpZW50IGNvbm5lY3RzIGFmdGVyIHN0YXJ0IChkZWZhdWx0OiBmYWxzZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0VGltZW91dDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggd2FpdCB0aW1lIGluIG1zIGZvciB3YWl0Rm9yUmVhZHkgKGRlZmF1bHQ6IDE1MDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfY2xlYXJfY29kZV9jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2xlYXIgdGhlIGNvZGUgY2FjaGUgKGVxdWl2YWxlbnQgdG8gRGV2ZWxvcGVyID4gQ2FjaGUgPiBDbGVhciBjb2RlIGNhY2hlKSBhbmQgc29mdC1yZWxvYWQgdGhlIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWxvYWRfZXh0ZW5zaW9uXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZWxvYWQgdGhlIE1DUCBleHRlbnNpb24gaXRzZWxmLiBVc2UgYWZ0ZXIgbnBtIHJ1biBidWlsZCB0byBhcHBseSBjb2RlIGNoYW5nZXMgd2l0aG91dCByZXN0YXJ0aW5nIENvY29zQ3JlYXRvci4gUmVzcG9uc2UgaXMgc2VudCBiZWZvcmUgcmVsb2FkIHN0YXJ0cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X2V4dGVuc2lvbl9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgYSBzcGVjaWZpYyBleHRlbnNpb24uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkV4dGVuc2lvbiBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJuYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWNvcmRfc3RhcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlN0YXJ0IHJlY29yZGluZyB0aGUgZ2FtZSBwcmV2aWV3IGNhbnZhcyB0byBhIFdlYk0gdmlkZW8gZmlsZS4gVXNlcyBNZWRpYVJlY29yZGVyIG9uIHRoZSBnYW1lIHNpZGUgKHJlcXVpcmVzIEdhbWVEZWJ1Z0NsaWVudCB3aXRoIHJlY29yZF9zdGFydCBoYW5kbGVyKS4gUmV0dXJucyByZWNvcmRpbmcgaWQuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcHM6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiRnJhbWVzIHBlciBzZWNvbmQgKGRlZmF1bHQ6IDMwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvQml0c1BlclNlY29uZDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJCaXRyYXRlIGluIGJwcyAoZGVmYXVsdDogNDAwMDAwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3JlY29yZF9zdG9wXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTdG9wIHJlY29yZGluZyBzdGFydGVkIGJ5IGRlYnVnX3JlY29yZF9zdGFydC4gUmV0dXJucyB0aGUgc2F2ZWQgV2ViTSBmaWxlIHBhdGggYW5kIHNpemUuIFZpZGVvIGlzIHNhdmVkIHRvIHByb2plY3QncyB0ZW1wL3JlY29yZGluZ3MvcmVjXzxkYXRldGltZT4ud2VibS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdhaXQgdGltZSBpbiBtcyBmb3IgZmlsZSB1cGxvYWQgKGRlZmF1bHQ6IDMwMDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfYmF0Y2hfc2NyZWVuc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTmF2aWdhdGUgdG8gbXVsdGlwbGUgcGFnZXMgYW5kIHRha2UgYSBzY3JlZW5zaG90IG9mIGVhY2guIFJlcXVpcmVzIGdhbWUgcHJldmlldyBydW5uaW5nIHdpdGggR2FtZURlYnVnQ2xpZW50LiBSZXR1cm5zIGFuIGFycmF5IG9mIHNjcmVlbnNob3QgZmlsZSBwYXRocy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IG9mIHBhZ2UgbmFtZXMgdG8gc2NyZWVuc2hvdCAoZS5nLiBbJ0hvbWVQYWdlVmlldycsICdTaG9wUGFnZVZpZXcnXSlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsYXk6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiRGVsYXkgaW4gbXMgYmV0d2VlbiBuYXZpZ2F0ZSBhbmQgc2NyZWVuc2hvdCAoZGVmYXVsdDogMTAwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggd2lkdGggZm9yIHNjcmVlbnNob3QgcmVzaXplIChkZWZhdWx0OiA5NjApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYWdlc1wiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZ2V0X2VkaXRvcl9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RWRpdG9ySW5mbygpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2xpc3RfbWVzc2FnZXNcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5saXN0TWVzc2FnZXMoYXJncy50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2V4ZWN1dGVfc2NyaXB0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0ZVNjcmlwdChhcmdzLm1ldGhvZCwgYXJncy5hcmdzIHx8IFtdKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfY29uc29sZV9sb2dzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29uc29sZUxvZ3MoYXJncy5jb3VudCB8fCA1MCwgYXJncy5sZXZlbCwgYXJncy5zb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2NsZWFyX2NvbnNvbGVcIjpcclxuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKFwiY29uc29sZVwiLCBcImNsZWFyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHNjZW5lIHByb2Nlc3MgbG9nIGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJjb2Nvcy1jcmVhdG9yLW1jcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiY2xlYXJDb25zb2xlTG9nc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgZ2FtZSBwcmV2aWV3IGxvZyBidWZmZXJcclxuICAgICAgICAgICAgICAgICAgICBjbGVhckdhbWVMb2dzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19saXN0X2V4dGVuc2lvbnNcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5saXN0RXh0ZW5zaW9ucygpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9wcm9qZWN0X2xvZ3NcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0TG9ncyhhcmdzLmxpbmVzIHx8IDEwMCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfc2VhcmNoX3Byb2plY3RfbG9nc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlYXJjaFByb2plY3RMb2dzKGFyZ3MucGF0dGVybik7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZ2V0X2xvZ19maWxlX2luZm9cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRMb2dGaWxlSW5mbygpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3F1ZXJ5X2RldmljZXNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRldmljZXMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZGV2aWNlXCIsIFwicXVlcnlcIikuY2F0Y2goKCkgPT4gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGRldmljZXMgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfb3Blbl91cmxcIjpcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwicHJvZ3JhbVwiLCBcIm9wZW4tdXJsXCIsIGFyZ3MudXJsKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB1cmw6IGFyZ3MudXJsIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dhbWVfY29tbWFuZFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdhbWVDb21tYW5kKGFyZ3MudHlwZSB8fCBhcmdzLmNvbW1hbmQsIGFyZ3MuYXJncywgYXJncy50aW1lb3V0IHx8IDUwMDAsIGFyZ3MubWF4V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3NjcmVlbnNob3RcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50YWtlU2NyZWVuc2hvdChhcmdzLnNhdmVQYXRoLCBhcmdzLm1heFdpZHRoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19wcmV2aWV3XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlUHJldmlldyhhcmdzLmFjdGlvbiB8fCBcInN0YXJ0XCIsIGFyZ3Mud2FpdEZvclJlYWR5LCBhcmdzLndhaXRUaW1lb3V0IHx8IDE1MDAwKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19jbGVhcl9jb2RlX2NhY2hlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xlYXJDb2RlQ2FjaGUoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19yZWxvYWRfZXh0ZW5zaW9uXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVsb2FkRXh0ZW5zaW9uKCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfdmFsaWRhdGVfc2NlbmVcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZVNjZW5lKCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZ2V0X2V4dGVuc2lvbl9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RXh0ZW5zaW9uSW5mbyhhcmdzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2JhdGNoX3NjcmVlbnNob3RcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5iYXRjaFNjcmVlbnNob3QoYXJncy5wYWdlcywgYXJncy5kZWxheSB8fCAxMDAwLCBhcmdzLm1heFdpZHRoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19yZWNvcmRfc3RhcnRcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nYW1lQ29tbWFuZChcInJlY29yZF9zdGFydFwiLCB7IGZwczogYXJncy5mcHMsIHZpZGVvQml0c1BlclNlY29uZDogYXJncy52aWRlb0JpdHNQZXJTZWNvbmQgfSwgNTAwMCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfcmVjb3JkX3N0b3BcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nYW1lQ29tbWFuZChcInJlY29yZF9zdG9wXCIsIHVuZGVmaW5lZCwgYXJncy50aW1lb3V0IHx8IDMwMDAwKTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0RWRpdG9ySW5mbygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICByZXR1cm4gb2soe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICB2ZXJzaW9uOiBFZGl0b3IuQXBwLnZlcnNpb24sXHJcbiAgICAgICAgICAgIHBhdGg6IEVkaXRvci5BcHAucGF0aCxcclxuICAgICAgICAgICAgaG9tZTogRWRpdG9yLkFwcC5ob21lLFxyXG4gICAgICAgICAgICBsYW5ndWFnZTogRWRpdG9yLkkxOG4/LmdldExhbmd1YWdlPy4oKSB8fCBcInVua25vd25cIixcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGxpc3RNZXNzYWdlcyh0YXJnZXQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicXVlcnktaW5mb1wiLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB0YXJnZXQsIGluZm8gfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGtub3duTWVzc2FnZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHtcclxuICAgICAgICAgICAgICAgIFwic2NlbmVcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwicXVlcnktbm9kZS10cmVlXCIsIFwiY3JlYXRlLW5vZGVcIiwgXCJyZW1vdmUtbm9kZVwiLCBcImR1cGxpY2F0ZS1ub2RlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzZXQtcHJvcGVydHlcIiwgXCJjcmVhdGUtcHJlZmFiXCIsIFwic2F2ZS1zY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJxdWVyeS1pcy1kaXJ0eVwiLCBcInF1ZXJ5LWNsYXNzZXNcIiwgXCJzb2Z0LXJlbG9hZFwiLCBcInNuYXBzaG90XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjaGFuZ2UtZ2l6bW8tdG9vbFwiLCBcInF1ZXJ5LWdpem1vLXRvb2wtbmFtZVwiLCBcImZvY3VzLWNhbWVyYS1vbi1ub2Rlc1wiLFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiYXNzZXQtZGJcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwicXVlcnktYXNzZXRzXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCBcInF1ZXJ5LWFzc2V0LW1ldGFcIixcclxuICAgICAgICAgICAgICAgICAgICBcInJlZnJlc2gtYXNzZXRcIiwgXCJzYXZlLWFzc2V0XCIsIFwiY3JlYXRlLWFzc2V0XCIsIFwiZGVsZXRlLWFzc2V0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJtb3ZlLWFzc2V0XCIsIFwiY29weS1hc3NldFwiLCBcIm9wZW4tYXNzZXRcIiwgXCJyZWltcG9ydC1hc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicXVlcnktcGF0aFwiLCBcInF1ZXJ5LXV1aWRcIiwgXCJxdWVyeS11cmxcIiwgXCJxdWVyeS1hc3NldC1kZXBlbmRzXCIsXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IGtub3duTWVzc2FnZXNbdGFyZ2V0XTtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB0YXJnZXQsIG1lc3NhZ2VzLCBub3RlOiBcIlN0YXRpYyBsaXN0IChxdWVyeSBmYWlsZWQpXCIgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBleGVjdXRlU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogXCJjb2Nvcy1jcmVhdG9yLW1jcFwiLFxyXG4gICAgICAgICAgICBtZXRob2QsXHJcbiAgICAgICAgICAgIGFyZ3MsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRDb25zb2xlTG9ncyhjb3VudDogbnVtYmVyLCBsZXZlbD86IHN0cmluZywgc291cmNlPzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgLy8gMS4gVHJ5IEVkaXRvcidzIG5hdGl2ZSBjb25zb2xlIEFQSSBmaXJzdCAobWF5IGJlIHN1cHBvcnRlZCBpbiBmdXR1cmUgQ29jb3NDcmVhdG9yIHZlcnNpb25zKVxyXG4gICAgICAgIGlmICghc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2dzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImNvbnNvbGVcIiwgXCJxdWVyeS1sYXN0LWxvZ3NcIiwgY291bnQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobG9ncykgJiYgbG9ncy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbG9ncywgc291cmNlOiBcImVkaXRvci1hcGlcIiwgbm90ZTogXCJVc2luZyBuYXRpdmUgRWRpdG9yIGNvbnNvbGUgQVBJXCIgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBOb3Qgc3VwcG9ydGVkIGluIHRoaXMgdmVyc2lvbiDigJQgdXNlIGZhbGxiYWNrICovIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDIuIEZhbGxiYWNrOiBjb2xsZWN0IGZyb20gc2NlbmUgcHJvY2VzcyBidWZmZXIgKyBnYW1lIHByZXZpZXcgYnVmZmVyXHJcbiAgICAgICAgbGV0IHNjZW5lTG9nczogYW55W10gPSBbXTtcclxuICAgICAgICBsZXQgZ2FtZUxvZ3M6IGFueVtdID0gW107XHJcblxyXG4gICAgICAgIC8vIDJhLiBTY2VuZSBwcm9jZXNzIGxvZ3MgKGNvbnNvbGUgd3JhcHBlciBpbiBzY2VuZS50cylcclxuICAgICAgICBpZiAoIXNvdXJjZSB8fCBzb3VyY2UgPT09IFwic2NlbmVcIikge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiZ2V0Q29uc29sZUxvZ3NcIixcclxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbY291bnQgKiAyLCBsZXZlbF0sIC8vIHJlcXVlc3QgbW9yZSwgd2lsbCB0cmltIGFmdGVyIG1lcmdlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQ/LmxvZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY2VuZUxvZ3MgPSByZXN1bHQubG9ncy5tYXAoKGw6IGFueSkgPT4gKHsgLi4ubCwgc291cmNlOiBcInNjZW5lXCIgfSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogc2NlbmUgbm90IGF2YWlsYWJsZSAqLyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAyYi4gR2FtZSBwcmV2aWV3IGxvZ3MgKHJlY2VpdmVkIHZpYSBQT1NUIC9sb2cgZW5kcG9pbnQpXHJcbiAgICAgICAgaWYgKCFzb3VyY2UgfHwgc291cmNlID09PSBcImdhbWVcIikge1xyXG4gICAgICAgICAgICBjb25zdCBnYW1lUmVzdWx0ID0gZ2V0R2FtZUxvZ3MoY291bnQgKiAyLCBsZXZlbCk7XHJcbiAgICAgICAgICAgIGdhbWVMb2dzID0gZ2FtZVJlc3VsdC5sb2dzLm1hcCgobDogYW55KSA9PiAoeyAuLi5sLCBzb3VyY2U6IFwiZ2FtZVwiIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1lcmdlIGFuZCBzb3J0IGJ5IHRpbWVzdGFtcCwgdGFrZSBsYXN0IGBjb3VudGBcclxuICAgICAgICBjb25zdCBtZXJnZWQgPSBbLi4uc2NlbmVMb2dzLCAuLi5nYW1lTG9nc11cclxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEudGltZXN0YW1wLmxvY2FsZUNvbXBhcmUoYi50aW1lc3RhbXApKVxyXG4gICAgICAgICAgICAuc2xpY2UoLWNvdW50KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgbG9nczogbWVyZ2VkLFxyXG4gICAgICAgICAgICB0b3RhbDogeyBzY2VuZTogc2NlbmVMb2dzLmxlbmd0aCwgZ2FtZTogKHNvdXJjZSA9PT0gXCJzY2VuZVwiID8gMCA6IGdhbWVMb2dzLmxlbmd0aCkgfSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGxpc3RFeHRlbnNpb25zKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicXVlcnktYWxsXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBleHRlbnNpb25zOiBsaXN0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBleHRlbnNpb25zOiBbXSwgbm90ZTogXCJFeHRlbnNpb24gcXVlcnkgbm90IHN1cHBvcnRlZFwiIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEV4dGVuc2lvbkluZm8obmFtZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJleHRlbnNpb25cIiwgXCJxdWVyeS1pbmZvXCIsIG5hbWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBuYW1lLCBpbmZvIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFByb2plY3RMb2dzKGxpbmVzOiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBsb2dQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJsb2dzXCIsIFwicHJvamVjdC5sb2dcIik7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhsb2dQYXRoKSkgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbG9nczogW10sIG5vdGU6IFwiTG9nIGZpbGUgbm90IGZvdW5kXCIgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobG9nUGF0aCwgXCJ1dGYtOFwiKTtcclxuICAgICAgICAgICAgY29uc3QgYWxsTGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xyXG4gICAgICAgICAgICBjb25zdCByZWNlbnQgPSBhbGxMaW5lcy5zbGljZSgtbGluZXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBsaW5lczogcmVjZW50Lmxlbmd0aCwgbG9nczogcmVjZW50IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNlYXJjaFByb2plY3RMb2dzKHBhdHRlcm46IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvZ1BhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcImxvZ3NcIiwgXCJwcm9qZWN0LmxvZ1wiKTtcclxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGxvZ1BhdGgpKSByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBtYXRjaGVzOiBbXSB9KTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsb2dQYXRoLCBcInV0Zi04XCIpO1xyXG4gICAgICAgICAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAocGF0dGVybiwgXCJnaVwiKTtcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKChsaW5lOiBzdHJpbmcpID0+IHJlZ2V4LnRlc3QobGluZSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwYXR0ZXJuLCBjb3VudDogbWF0Y2hlcy5sZW5ndGgsIG1hdGNoZXM6IG1hdGNoZXMuc2xpY2UoMCwgMTAwKSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRMb2dGaWxlSW5mbygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBsb2dQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJsb2dzXCIsIFwicHJvamVjdC5sb2dcIik7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhsb2dQYXRoKSkgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZXhpc3RzOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGxvZ1BhdGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBleGlzdHM6IHRydWUsIHBhdGg6IGxvZ1BhdGgsIHNpemU6IHN0YXQuc2l6ZSwgbW9kaWZpZWQ6IHN0YXQubXRpbWUgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlUHJldmlldyhhY3Rpb246IHN0cmluZywgd2FpdEZvclJlYWR5PzogYm9vbGVhbiwgd2FpdFRpbWVvdXQ/OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBpZiAoYWN0aW9uID09PSBcInN0b3BcIikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdG9wUHJldmlldygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnN0YXJ0UHJldmlldygpO1xyXG4gICAgICAgIGlmICh3YWl0Rm9yUmVhZHkpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0RGF0YSA9IEpTT04ucGFyc2UocmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHREYXRhLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWR5ID0gYXdhaXQgdGhpcy53YWl0Rm9yR2FtZVJlYWR5KHdhaXRUaW1lb3V0IHx8IDE1MDAwKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdERhdGEuZ2FtZVJlYWR5ID0gcmVhZHk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXJlYWR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0RGF0YS5ub3RlID0gKHJlc3VsdERhdGEubm90ZSB8fCBcIlwiKSArIFwiIEdhbWVEZWJ1Z0NsaWVudCBkaWQgbm90IGNvbm5lY3Qgd2l0aGluIHRpbWVvdXQuXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2socmVzdWx0RGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHdhaXRGb3JHYW1lUmVhZHkodGltZW91dDogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gc3RhcnQgPCB0aW1lb3V0KSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGdhbWUgaGFzIHNlbnQgYW55IGxvZyBvciBjb21tYW5kIHJlc3VsdCByZWNlbnRseVxyXG4gICAgICAgICAgICBjb25zdCBnYW1lUmVzdWx0ID0gZ2V0R2FtZUxvZ3MoMSk7XHJcbiAgICAgICAgICAgIGlmIChnYW1lUmVzdWx0LnRvdGFsID4gMCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCA1MDApKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc3RhcnRQcmV2aWV3KCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5zdXJlTWFpblNjZW5lT3BlbigpO1xyXG5cclxuICAgICAgICAgICAgLy8g44OE44O844Or44OQ44O844GuVnVl44Kk44Oz44K544K/44Oz44K557WM55Sx44GncGxheSgp44KS5ZG844G277yIVUnnirbmhYvjgoLlkIzmnJ/jgZXjgozjgovvvIlcclxuICAgICAgICAgICAgY29uc3QgcGxheWVkID0gYXdhaXQgdGhpcy5leGVjdXRlT25Ub29sYmFyKFwic3RhcnRcIik7XHJcbiAgICAgICAgICAgIGlmIChwbGF5ZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogXCJzdGFydFwiLCBtb2RlOiBcImVkaXRvclwiIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyDjg5Xjgqnjg7zjg6vjg5Djg4Pjgq86IOebtOaOpUFQSVxyXG4gICAgICAgICAgICBjb25zdCBpc1BsYXlpbmcgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJlZGl0b3ItcHJldmlldy1zZXQtcGxheVwiLCB0cnVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaXNQbGF5aW5nLCBhY3Rpb246IFwic3RhcnRcIiwgbW9kZTogXCJlZGl0b3JcIiwgbm90ZTogXCJkaXJlY3QgQVBJICh0b29sYmFyIFVJIG1heSBub3Qgc3luYylcIiB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgZWxlY3Ryb24uc2hlbGwub3BlbkV4dGVybmFsKFwiaHR0cDovLzEyNy4wLjAuMTo3NDU2XCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYWN0aW9uOiBcInN0YXJ0XCIsIG1vZGU6IFwiYnJvd3NlclwiIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlMjogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGUyLm1lc3NhZ2UgfHwgU3RyaW5nKGUyKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzdG9wUHJldmlldygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyDjg4Tjg7zjg6vjg5Djg7zntYznlLHjgaflgZzmraLvvIhVSeWQjOacn++8iVxyXG4gICAgICAgICAgICBjb25zdCBzdG9wcGVkID0gYXdhaXQgdGhpcy5leGVjdXRlT25Ub29sYmFyKFwic3RvcFwiKTtcclxuICAgICAgICAgICAgaWYgKCFzdG9wcGVkKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDjg5Xjgqnjg7zjg6vjg5Djg4Pjgq86IOebtOaOpUFQSVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZWRpdG9yLXByZXZpZXctc2V0LXBsYXlcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHNjZW5lOnByZXZpZXctc3RvcCDjg5bjg63jg7zjg4njgq3jg6Pjgrnjg4jjgafjg4Tjg7zjg6vjg5Djg7xVSeeKtuaFi+OCkuODquOCu+ODg+ODiFxyXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoXCJzY2VuZTpwcmV2aWV3LXN0b3BcIik7XHJcbiAgICAgICAgICAgIC8vIOOCt+ODvOODs+ODk+ODpeODvOOBq+aIu+OBmVxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgNTAwKSk7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5zdXJlTWFpblNjZW5lT3BlbigpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IFwic3RvcFwiIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVPblRvb2xiYXIoYWN0aW9uOiBcInN0YXJ0XCIgfCBcInN0b3BcIik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBhbGxDb250ZW50cyA9IGVsZWN0cm9uLndlYkNvbnRlbnRzLmdldEFsbFdlYkNvbnRlbnRzKCk7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3Qgd2Mgb2YgYWxsQ29udGVudHMpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcGxheSgp44KSYXdhaXTjgZfjgarjgYQg4oCUIOODl+ODrOODk+ODpeODvOWujOS6huOCkuW+heOBpOOBqOOCv+OCpOODoOOCouOCpuODiOOBmeOCi+OBn+OCgVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwic3RhcnRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3Yy5leGVjdXRlSmF2YVNjcmlwdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAoZnVuY3Rpb24oKSB7IGlmICh3aW5kb3cueHh4ICYmIHdpbmRvdy54eHgucGxheSAmJiAhd2luZG93Lnh4eC5nYW1lVmlldy5pc1BsYXkpIHsgd2luZG93Lnh4eC5wbGF5KCk7IHJldHVybiB0cnVlOyB9IHJldHVybiBmYWxzZTsgfSkoKWBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd2MuZXhlY3V0ZUphdmFTY3JpcHQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgKGZ1bmN0aW9uKCkgeyBpZiAod2luZG93Lnh4eCAmJiB3aW5kb3cueHh4LmdhbWVWaWV3LmlzUGxheSkgeyB3aW5kb3cueHh4LnBsYXkoKTsgcmV0dXJuIHRydWU7IH0gcmV0dXJuIGZhbHNlOyB9KSgpYFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogbm90IHRoZSB0b29sYmFyIHdlYkNvbnRlbnRzICovIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggeyAvKiBlbGVjdHJvbiBBUEkgbm90IGF2YWlsYWJsZSAqLyB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZW5zdXJlTWFpblNjZW5lT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBoaWVyYXJjaHkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgbWV0aG9kOiBcImdldFNjZW5lSGllcmFyY2h5XCIsXHJcbiAgICAgICAgICAgIGFyZ3M6IFtmYWxzZV0sXHJcbiAgICAgICAgfSkuY2F0Y2goKCkgPT4gbnVsbCk7XHJcblxyXG4gICAgICAgIGlmICghaGllcmFyY2h5Py5zY2VuZU5hbWUgfHwgaGllcmFyY2h5LnNjZW5lTmFtZSA9PT0gXCJzY2VuZS0yZFwiKSB7XHJcbiAgICAgICAgICAgIC8vIOODl+ODreOCuOOCp+OCr+ODiOioreWumuOBrlN0YXJ0IFNjZW5l44KS5Y+C54WnXHJcbiAgICAgICAgICAgIGxldCBzY2VuZVV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgc2NlbmVVdWlkID0gYXdhaXQgKEVkaXRvciBhcyBhbnkpLlByb2ZpbGUuZ2V0Q29uZmlnKFwicHJldmlld1wiLCBcImdlbmVyYWwuc3RhcnRfc2NlbmVcIiwgXCJsb2NhbFwiKTtcclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcblxyXG4gICAgICAgICAgICAvLyBTdGFydCBTY2VuZeOBjOacquioreWumiBvciBcImN1cnJlbnRfc2NlbmVcIiDjga7loLTlkIjjgIHmnIDliJ3jga7jgrfjg7zjg7PjgpLkvb/jgYZcclxuICAgICAgICAgICAgaWYgKCFzY2VuZVV1aWQgfHwgc2NlbmVVdWlkID09PSBcImN1cnJlbnRfc2NlbmVcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICBjY1R5cGU6IFwiY2MuU2NlbmVBc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IFwiZGI6Ly9hc3NldHMvKiovKlwiLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2VuZXMpICYmIHNjZW5lcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NlbmVVdWlkID0gc2NlbmVzWzBdLnV1aWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzY2VuZVV1aWQpIHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcIm9wZW4tc2NlbmVcIiwgc2NlbmVVdWlkKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxNTAwKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjbGVhckNvZGVDYWNoZSgpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgY29uc3QgbWVudSA9IGVsZWN0cm9uLk1lbnUuZ2V0QXBwbGljYXRpb25NZW51KCk7XHJcbiAgICAgICAgICAgIGlmICghbWVudSkgcmV0dXJuIGVycihcIkFwcGxpY2F0aW9uIG1lbnUgbm90IGZvdW5kXCIpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgZmluZE1lbnVJdGVtID0gKGl0ZW1zOiBhbnlbXSwgcGF0aDogc3RyaW5nW10pOiBhbnkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0ubGFiZWwgPT09IHBhdGhbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSAxKSByZXR1cm4gaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uc3VibWVudT8uaXRlbXMpIHJldHVybiBmaW5kTWVudUl0ZW0oaXRlbS5zdWJtZW51Lml0ZW1zLCBwYXRoLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNhY2hlSXRlbSA9IGZpbmRNZW51SXRlbShtZW51Lml0ZW1zLCBbXCJEZXZlbG9wZXJcIiwgXCJDYWNoZVwiLCBcIkNsZWFyIGNvZGUgY2FjaGVcIl0pO1xyXG4gICAgICAgICAgICBpZiAoIWNhY2hlSXRlbSkgcmV0dXJuIGVycihcIk1lbnUgaXRlbSAnRGV2ZWxvcGVyID4gQ2FjaGUgPiBDbGVhciBjb2RlIGNhY2hlJyBub3QgZm91bmRcIik7XHJcblxyXG4gICAgICAgICAgICBjYWNoZUl0ZW0uY2xpY2soKTtcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm90ZTogXCJDb2RlIGNhY2hlIGNsZWFyZWQgdmlhIG1lbnVcIiB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnYW1lQ29tbWFuZCh0eXBlOiBzdHJpbmcsIGFyZ3M6IGFueSwgdGltZW91dDogbnVtYmVyLCBtYXhXaWR0aD86IG51bWJlcik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGNvbnN0IGNtZElkID0gcXVldWVHYW1lQ29tbWFuZCh0eXBlLCBhcmdzKTtcclxuXHJcbiAgICAgICAgLy8gUG9sbCBmb3IgcmVzdWx0XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gc3RhcnQgPCB0aW1lb3V0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGdldENvbW1hbmRSZXN1bHQoKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaWQgPT09IGNtZElkKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBzY3JlZW5zaG90LCBzYXZlIHRvIGZpbGUgYW5kIHJldHVybiBwYXRoXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJzY3JlZW5zaG90XCIgJiYgcmVzdWx0LnN1Y2Nlc3MgJiYgcmVzdWx0LmRhdGE/LmRhdGFVcmwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcInNjcmVlbnNob3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csIFwiLVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZTY0ID0gcmVzdWx0LmRhdGEuZGF0YVVybC5yZXBsYWNlKC9eZGF0YTppbWFnZVxcL3BuZztiYXNlNjQsLywgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBuZ0J1ZmZlciA9IEJ1ZmZlci5mcm9tKGJhc2U2NCwgXCJiYXNlNjRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVmZmVjdGl2ZU1heFdpZHRoID0gbWF4V2lkdGggIT09IHVuZGVmaW5lZCA/IG1heFdpZHRoIDogOTYwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3JpZ0ltYWdlID0gZWxlY3Ryb24ubmF0aXZlSW1hZ2UuY3JlYXRlRnJvbUJ1ZmZlcihwbmdCdWZmZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbFNpemUgPSBvcmlnSW1hZ2UuZ2V0U2l6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGJ1ZmZlciwgd2lkdGgsIGhlaWdodCwgZm9ybWF0IH0gPSBhd2FpdCB0aGlzLnByb2Nlc3NJbWFnZShwbmdCdWZmZXIsIGVmZmVjdGl2ZU1heFdpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXh0ID0gZm9ybWF0ID09PSBcIndlYnBcIiA/IFwid2VicFwiIDogZm9ybWF0ID09PSBcImpwZWdcIiA/IFwianBnXCIgOiBcInBuZ1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihkaXIsIGBnYW1lXyR7dGltZXN0YW1wfS4ke2V4dH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgYnVmZmVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIHBhdGg6IGZpbGVQYXRoLCBzaXplOiBidWZmZXIubGVuZ3RoLCBmb3JtYXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFNpemU6IGAke29yaWdpbmFsU2l6ZS53aWR0aH14JHtvcmlnaW5hbFNpemUuaGVpZ2h0fWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYXZlZFNpemU6IGAke3dpZHRofXgke2hlaWdodH1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm90ZTogXCJTY3JlZW5zaG90IGNhcHR1cmVkIGJ1dCBmaWxlIHNhdmUgZmFpbGVkXCIsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDIwMCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZXJyKGBHYW1lIGRpZCBub3QgcmVzcG9uZCB3aXRoaW4gJHt0aW1lb3V0fW1zLiBJcyBHYW1lRGVidWdDbGllbnQgcnVubmluZyBpbiB0aGUgcHJldmlldz9gKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHByb2Nlc3NJbWFnZShwbmdCdWZmZXI6IEJ1ZmZlciwgbWF4V2lkdGg6IG51bWJlcik6IFByb21pc2U8eyBidWZmZXI6IEJ1ZmZlcjsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXI7IGZvcm1hdDogc3RyaW5nIH0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBWaXBzID0gcmVxdWlyZShcIndhc20tdmlwc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgdmlwcyA9IGF3YWl0IFZpcHMoKTtcclxuICAgICAgICAgICAgbGV0IGltYWdlID0gdmlwcy5JbWFnZS5uZXdGcm9tQnVmZmVyKHBuZ0J1ZmZlcik7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdXID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdIID0gaW1hZ2UuaGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAobWF4V2lkdGggPiAwICYmIG9yaWdXID4gbWF4V2lkdGgpIHtcclxuICAgICAgICAgICAgICAgIGltYWdlID0gaW1hZ2UudGh1bWJuYWlsSW1hZ2UobWF4V2lkdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG91dEJ1ZiA9IGltYWdlLndlYnBzYXZlQnVmZmVyKHsgUTogODUgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgYnVmZmVyOiBCdWZmZXIuZnJvbShvdXRCdWYpLCB3aWR0aDogaW1hZ2Uud2lkdGgsIGhlaWdodDogaW1hZ2UuaGVpZ2h0LCBmb3JtYXQ6IFwid2VicFwiIH07XHJcbiAgICAgICAgICAgIGltYWdlLmRlbGV0ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICAvLyBGYWxsYmFjazogTmF0aXZlSW1hZ2UgcmVzaXplICsgSlBFR1xyXG4gICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgbGV0IGltYWdlID0gZWxlY3Ryb24ubmF0aXZlSW1hZ2UuY3JlYXRlRnJvbUJ1ZmZlcihwbmdCdWZmZXIpO1xyXG4gICAgICAgICAgICBpZiAobWF4V2lkdGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzaXplID0gaW1hZ2UuZ2V0U2l6ZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNpemUud2lkdGggPiBtYXhXaWR0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbWF4V2lkdGggLyBzaXplLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGltYWdlID0gaW1hZ2UucmVzaXplKHsgd2lkdGg6IE1hdGgucm91bmQoc2l6ZS53aWR0aCAqIHJhdGlvKSwgaGVpZ2h0OiBNYXRoLnJvdW5kKHNpemUuaGVpZ2h0ICogcmF0aW8pIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSBpbWFnZS5nZXRTaXplKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGltYWdlLnRvSlBFRyg4NSk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IGJ1ZmZlciwgd2lkdGg6IHNpemUud2lkdGgsIGhlaWdodDogc2l6ZS5oZWlnaHQsIGZvcm1hdDogXCJqcGVnXCIgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyB0YWtlU2NyZWVuc2hvdChzYXZlUGF0aD86IHN0cmluZywgbWF4V2lkdGg/OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgY29uc3Qgd2luZG93cyA9IGVsZWN0cm9uLkJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpO1xyXG4gICAgICAgICAgICBpZiAoIXdpbmRvd3MgfHwgd2luZG93cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXCJObyBlZGl0b3Igd2luZG93IGZvdW5kXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEZpbmQgdGhlIG1haW4gKGxhcmdlc3QpIHdpbmRvd1xyXG4gICAgICAgICAgICBsZXQgd2luID0gd2luZG93c1swXTtcclxuICAgICAgICAgICAgbGV0IG1heEFyZWEgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHcgb2Ygd2luZG93cykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYm91bmRzID0gdy5nZXRCb3VuZHMoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFyZWEgPSBib3VuZHMud2lkdGggKiBib3VuZHMuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyZWEgPiBtYXhBcmVhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF4QXJlYSA9IGFyZWE7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luID0gdztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBCcmluZyB0byBmcm9udCBhbmQgd2FpdCBmb3IgcmVuZGVyXHJcbiAgICAgICAgICAgIHdpbi5zaG93KCk7XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAzMDApKTtcclxuICAgICAgICAgICAgY29uc3QgbmF0aXZlSW1hZ2UgPSBhd2FpdCB3aW4ud2ViQ29udGVudHMuY2FwdHVyZVBhZ2UoKTtcclxuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxTaXplID0gbmF0aXZlSW1hZ2UuZ2V0U2l6ZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBwbmdCdWZmZXIgPSBuYXRpdmVJbWFnZS50b1BORygpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgZWZmZWN0aXZlTWF4V2lkdGggPSBtYXhXaWR0aCAhPT0gdW5kZWZpbmVkID8gbWF4V2lkdGggOiA5NjA7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgYnVmZmVyLCB3aWR0aCwgaGVpZ2h0LCBmb3JtYXQgfSA9IGF3YWl0IHRoaXMucHJvY2Vzc0ltYWdlKHBuZ0J1ZmZlciwgZWZmZWN0aXZlTWF4V2lkdGgpO1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHNhdmUgcGF0aFxyXG4gICAgICAgICAgICBjb25zdCBleHQgPSBmb3JtYXQgPT09IFwid2VicFwiID8gXCJ3ZWJwXCIgOiBmb3JtYXQgPT09IFwianBlZ1wiID8gXCJqcGdcIiA6IFwicG5nXCI7XHJcbiAgICAgICAgICAgIGlmICghc2F2ZVBhdGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsIFwic2NyZWVuc2hvdHNcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCBcIi1cIik7XHJcbiAgICAgICAgICAgICAgICBzYXZlUGF0aCA9IHBhdGguam9pbihkaXIsIGBzY3JlZW5zaG90XyR7dGltZXN0YW1wfS4ke2V4dH1gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhzYXZlUGF0aCwgYnVmZmVyKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIHBhdGg6IHNhdmVQYXRoLCBzaXplOiBidWZmZXIubGVuZ3RoLCBmb3JtYXQsXHJcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFNpemU6IGAke29yaWdpbmFsU2l6ZS53aWR0aH14JHtvcmlnaW5hbFNpemUuaGVpZ2h0fWAsXHJcbiAgICAgICAgICAgICAgICBzYXZlZFNpemU6IGAke3dpZHRofXgke2hlaWdodH1gLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZWxvYWRFeHRlbnNpb24oKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgLy8gU2NoZWR1bGUgcmVsb2FkIGFmdGVyIHJlc3BvbnNlIGlzIHNlbnRcclxuICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJleHRlbnNpb25cIiwgXCJyZWxvYWRcIiwgXCJjb2Nvcy1jcmVhdG9yLW1jcFwiKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW01DUF0gRXh0ZW5zaW9uIHJlbG9hZCBmYWlsZWQ6XCIsIGUubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCA1MDApO1xyXG4gICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiRXh0ZW5zaW9uIHJlbG9hZCBzY2hlZHVsZWQuIE1DUCBzZXJ2ZXIgd2lsbCByZXN0YXJ0IGluIH4xcy4gTk9URTogQWRkaW5nIG5ldyB0b29sIGRlZmluaXRpb25zIG9yIG1vZGlmeWluZyBzY2VuZS50cyByZXF1aXJlcyBhIGZ1bGwgQ29jb3NDcmVhdG9yIHJlc3RhcnQgKHJlbG9hZCBpcyBub3Qgc3VmZmljaWVudCkuXCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBiYXRjaFNjcmVlbnNob3QocGFnZXM6IHN0cmluZ1tdLCBkZWxheTogbnVtYmVyLCBtYXhXaWR0aD86IG51bWJlcik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XHJcbiAgICAgICAgY29uc3QgdGltZW91dCA9IDEwMDAwO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHBhZ2Ugb2YgcGFnZXMpIHtcclxuICAgICAgICAgICAgLy8gTmF2aWdhdGVcclxuICAgICAgICAgICAgY29uc3QgbmF2UmVzdWx0ID0gYXdhaXQgdGhpcy5nYW1lQ29tbWFuZChcIm5hdmlnYXRlXCIsIHsgcGFnZSB9LCB0aW1lb3V0LCBtYXhXaWR0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hdkRhdGEgPSBKU09OLnBhcnNlKG5hdlJlc3VsdC5jb250ZW50WzBdLnRleHQpO1xyXG4gICAgICAgICAgICBpZiAoIW5hdkRhdGEuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHsgcGFnZSwgc3VjY2VzczogZmFsc2UsIGVycm9yOiBcIm5hdmlnYXRlIGZhaWxlZFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFdhaXQgZm9yIHBhZ2UgdG8gcmVuZGVyXHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCBkZWxheSkpO1xyXG5cclxuICAgICAgICAgICAgLy8gU2NyZWVuc2hvdFxyXG4gICAgICAgICAgICBjb25zdCBzc1Jlc3VsdCA9IGF3YWl0IHRoaXMuZ2FtZUNvbW1hbmQoXCJzY3JlZW5zaG90XCIsIHt9LCB0aW1lb3V0LCBtYXhXaWR0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNzRGF0YSA9IEpTT04ucGFyc2Uoc3NSZXN1bHQuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHBhZ2UsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBzc0RhdGEuc3VjY2VzcyB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHBhdGg6IHNzRGF0YS5wYXRoLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IHNzRGF0YS5zdWNjZXNzID8gdW5kZWZpbmVkIDogKHNzRGF0YS5lcnJvciB8fCBzc0RhdGEubWVzc2FnZSksXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3VjY2VlZGVkID0gcmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aDtcclxuICAgICAgICByZXR1cm4gb2soe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICB0b3RhbDogcGFnZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBzdWNjZWVkZWQsXHJcbiAgICAgICAgICAgIGZhaWxlZDogcGFnZXMubGVuZ3RoIC0gc3VjY2VlZGVkLFxyXG4gICAgICAgICAgICByZXN1bHRzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdmFsaWRhdGVTY2VuZSgpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB0cmVlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwicXVlcnktbm9kZS10cmVlXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBpc3N1ZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrTm9kZXMgPSAobm9kZXM6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVzKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW5vZGUubmFtZSkgaXNzdWVzLnB1c2goYE5vZGUgJHtub2RlLnV1aWR9IGhhcyBubyBuYW1lYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIGNoZWNrTm9kZXMobm9kZS5jaGlsZHJlbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRyZWUpKSBjaGVja05vZGVzKHRyZWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBpc3N1ZUNvdW50OiBpc3N1ZXMubGVuZ3RoLCBpc3N1ZXMgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiJdfQ==