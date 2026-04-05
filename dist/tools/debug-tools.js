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
                description: "Start recording the game preview canvas to a video file. Uses MediaRecorder on the game side (requires GameDebugClient with record_start handler). Returns recording id. Format defaults to webm (most compatible); mp4 is attempted if supported, falling back to webm.",
                inputSchema: {
                    type: "object",
                    properties: {
                        fps: { type: "number", description: "Frames per second (default: 30)" },
                        videoBitsPerSecond: { type: "number", description: "Bitrate in bps (default: 4000000)" },
                        format: { type: "string", description: "'webm' (default) or 'mp4'. mp4 falls back to webm if not supported." },
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
                    return this.gameCommand("record_start", { fps: args.fps, videoBitsPerSecond: args.videoBitsPerSecond, format: args.format }, 5000);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWctdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvZGVidWctdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBQ3ZDLDhDQUErRjtBQUUvRixNQUFhLFVBQVU7SUFBdkI7UUFDYSxpQkFBWSxHQUFHLE9BQU8sQ0FBQztJQTR2QnBDLENBQUM7SUExdkJHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLHVCQUF1QjtnQkFDN0IsV0FBVyxFQUFFLHFFQUFxRTtnQkFDbEYsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHFCQUFxQjtnQkFDM0IsV0FBVyxFQUFFLDBFQUEwRTtnQkFDdkYsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx3REFBd0QsRUFBRTtxQkFDcEc7b0JBQ0QsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUN2QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsV0FBVyxFQUFFLGtGQUFrRjtnQkFDL0YsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSwyQkFBMkIsRUFBRTt3QkFDcEUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtxQkFDdkU7b0JBQ0QsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUN2QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHdC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bFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5pbXBvcnQgeyBnZXRHYW1lTG9ncywgY2xlYXJHYW1lTG9ncywgcXVldWVHYW1lQ29tbWFuZCwgZ2V0Q29tbWFuZFJlc3VsdCB9IGZyb20gXCIuLi9tY3Atc2VydmVyXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGVidWdUb29scyBpbXBsZW1lbnRzIFRvb2xDYXRlZ29yeSB7XHJcbiAgICByZWFkb25seSBjYXRlZ29yeU5hbWUgPSBcImRlYnVnXCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfZWRpdG9yX2luZm9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBDb2NvcyBDcmVhdG9yIGVkaXRvciBpbmZvcm1hdGlvbiAodmVyc2lvbiwgcGxhdGZvcm0sIGxhbmd1YWdlKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfbGlzdF9tZXNzYWdlc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhdmFpbGFibGUgRWRpdG9yIG1lc3NhZ2VzIGZvciBhIGdpdmVuIGV4dGVuc2lvbiBvciBidWlsdC1pbiBtb2R1bGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTWVzc2FnZSB0YXJnZXQgKGUuZy4gJ3NjZW5lJywgJ2Fzc2V0LWRiJywgJ2V4dGVuc2lvbicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ0YXJnZXRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2V4ZWN1dGVfc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFeGVjdXRlIGEgY3VzdG9tIHNjZW5lIHNjcmlwdCBtZXRob2QuIFRoZSBtZXRob2QgbXVzdCBiZSByZWdpc3RlcmVkIGluIHNjZW5lLnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk1ldGhvZCBuYW1lIGZyb20gc2NlbmUudHNcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7IHR5cGU6IFwiYXJyYXlcIiwgZGVzY3JpcHRpb246IFwiQXJndW1lbnRzIHRvIHBhc3NcIiwgaXRlbXM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibWV0aG9kXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfY29uc29sZV9sb2dzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgcmVjZW50IGNvbnNvbGUgbG9nIGVudHJpZXMuIEF1dG9tYXRpY2FsbHkgY2FwdHVyZXMgc2NlbmUgcHJvY2VzcyBsb2dzIChjb25zb2xlLmxvZy93YXJuL2Vycm9yIGluIHNjZW5lIHNjcmlwdHMpLiBHYW1lIHByZXZpZXcgbG9ncyBjYW4gYWxzbyBiZSBjYXB0dXJlZCBieSBzZW5kaW5nIFBPU1QgcmVxdWVzdHMgdG8gL2xvZyBlbmRwb2ludCDigJQgc2VlIFJFQURNRSBmb3Igc2V0dXAuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggbnVtYmVyIG9mIGVudHJpZXMgKGRlZmF1bHQgNTApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiRmlsdGVyIGJ5IGxldmVsOiAnbG9nJywgJ3dhcm4nLCBvciAnZXJyb3InXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkZpbHRlciBieSBzb3VyY2U6ICdzY2VuZScgb3IgJ2dhbWUnLiBSZXR1cm5zIGJvdGggaWYgb21pdHRlZC5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2NsZWFyX2NvbnNvbGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNsZWFyIHRoZSBlZGl0b3IgY29uc29sZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfbGlzdF9leHRlbnNpb25zXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGFsbCBpbnN0YWxsZWQgZXh0ZW5zaW9ucy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X3Byb2plY3RfbG9nc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVhZCByZWNlbnQgcHJvamVjdCBsb2cgZW50cmllcyBmcm9tIHRoZSBsb2cgZmlsZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk51bWJlciBvZiBsaW5lcyB0byByZWFkIChkZWZhdWx0IDEwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3NlYXJjaF9wcm9qZWN0X2xvZ3NcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNlYXJjaCBmb3IgYSBwYXR0ZXJuIGluIHByb2plY3QgbG9ncy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2VhcmNoIHBhdHRlcm4gKHJlZ2V4IHN1cHBvcnRlZClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhdHRlcm5cIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dldF9sb2dfZmlsZV9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHByb2plY3QgbG9nIGZpbGUgKHNpemUsIHBhdGgsIGxhc3QgbW9kaWZpZWQpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8g4pSA4pSAIOS7peS4i+OAgeaXouWtmE1DUOacquWvvuW/nOOBrkVkaXRvciBBUEkg4pSA4pSAXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcXVlcnlfZGV2aWNlc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBjb25uZWN0ZWQgZGV2aWNlcyAoZm9yIG5hdGl2ZSBkZWJ1Z2dpbmcpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19vcGVuX3VybFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiT3BlbiBhIFVSTCBpbiB0aGUgc3lzdGVtIGJyb3dzZXIgZnJvbSB0aGUgZWRpdG9yLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdXJsOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlVSTCB0byBvcGVuXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1cmxcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3ZhbGlkYXRlX3NjZW5lXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJWYWxpZGF0ZSB0aGUgY3VycmVudCBzY2VuZSBmb3IgY29tbW9uIGlzc3Vlcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2FtZV9jb21tYW5kXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZW5kIGEgY29tbWFuZCB0byB0aGUgcnVubmluZyBnYW1lIHByZXZpZXcuIFJlcXVpcmVzIEdhbWVEZWJ1Z0NsaWVudCBpbiB0aGUgZ2FtZS4gQ29tbWFuZHM6ICdzY3JlZW5zaG90JyAoY2FwdHVyZSBnYW1lIGNhbnZhcyksICdzdGF0ZScgKGR1bXAgR2FtZURiKSwgJ25hdmlnYXRlJyAoZ28gdG8gYSBwYWdlKSwgJ2NsaWNrJyAoY2xpY2sgYSBub2RlIGJ5IG5hbWUpLCAnaW5zcGVjdCcgKGdldCBydW50aW1lIG5vZGUgaW5mbzogVUlUcmFuc2Zvcm0gc2l6ZXMsIFdpZGdldCwgTGF5b3V0LCBwb3NpdGlvbikuIFJldHVybnMgdGhlIHJlc3VsdCBmcm9tIHRoZSBnYW1lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21tYW5kIHR5cGU6ICdzY3JlZW5zaG90JywgJ3N0YXRlJywgJ25hdmlnYXRlJywgJ2NsaWNrJywgJ2luc3BlY3QnXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogeyBkZXNjcmlwdGlvbjogXCJDb21tYW5kIGFyZ3VtZW50cyAoZS5nLiB7cGFnZTogJ0hvbWVQYWdlVmlldyd9IGZvciBuYXZpZ2F0ZSwge25hbWU6ICdCdXR0b25OYW1lJ30gZm9yIGNsaWNrKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdhaXQgdGltZSBpbiBtcyAoZGVmYXVsdCA1MDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3aWR0aCBmb3Igc2NyZWVuc2hvdCByZXNpemUgKGRlZmF1bHQ6IDk2MCwgMCA9IG5vIHJlc2l6ZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInR5cGVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3NjcmVlbnNob3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRha2UgYSBzY3JlZW5zaG90IG9mIHRoZSBlZGl0b3Igd2luZG93IGFuZCBzYXZlIHRvIGEgZmlsZS4gUmV0dXJucyB0aGUgZmlsZSBwYXRoIG9mIHRoZSBzYXZlZCBQTkcuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlUGF0aDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJGaWxlIHBhdGggdG8gc2F2ZSB0aGUgUE5HIChkZWZhdWx0OiB0ZW1wL3NjcmVlbnNob3RzL3NjcmVlbnNob3RfPHRpbWVzdGFtcD4ucG5nKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3aWR0aCBpbiBwaXhlbHMgZm9yIHJlc2l6ZSAoZGVmYXVsdDogOTYwLCAwID0gbm8gcmVzaXplKS4gQXNwZWN0IHJhdGlvIGlzIHByZXNlcnZlZC5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3ByZXZpZXdcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlN0YXJ0IG9yIHN0b3AgdGhlIGdhbWUgcHJldmlldy4gVXNlcyBQcmV2aWV3IGluIEVkaXRvciAoYXV0by1vcGVucyBNYWluU2NlbmUgaWYgbmVlZGVkKS4gRmFsbHMgYmFjayB0byBicm93c2VyIHByZXZpZXcgaWYgZWRpdG9yIHByZXZpZXcgZmFpbHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiJ3N0YXJ0JyAoZGVmYXVsdCkgb3IgJ3N0b3AnXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2FpdEZvclJlYWR5OiB7IHR5cGU6IFwiYm9vbGVhblwiLCBkZXNjcmlwdGlvbjogXCJJZiB0cnVlLCB3YWl0IHVudGlsIEdhbWVEZWJ1Z0NsaWVudCBjb25uZWN0cyBhZnRlciBzdGFydCAoZGVmYXVsdDogZmFsc2UpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2FpdFRpbWVvdXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdhaXQgdGltZSBpbiBtcyBmb3Igd2FpdEZvclJlYWR5IChkZWZhdWx0OiAxNTAwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2NsZWFyX2NvZGVfY2FjaGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNsZWFyIHRoZSBjb2RlIGNhY2hlIChlcXVpdmFsZW50IHRvIERldmVsb3BlciA+IENhY2hlID4gQ2xlYXIgY29kZSBjYWNoZSkgYW5kIHNvZnQtcmVsb2FkIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcmVsb2FkX2V4dGVuc2lvblwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVsb2FkIHRoZSBNQ1AgZXh0ZW5zaW9uIGl0c2VsZi4gVXNlIGFmdGVyIG5wbSBydW4gYnVpbGQgdG8gYXBwbHkgY29kZSBjaGFuZ2VzIHdpdGhvdXQgcmVzdGFydGluZyBDb2Nvc0NyZWF0b3IuIFJlc3BvbnNlIGlzIHNlbnQgYmVmb3JlIHJlbG9hZCBzdGFydHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dldF9leHRlbnNpb25faW5mb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGRldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IGEgc3BlY2lmaWMgZXh0ZW5zaW9uLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJFeHRlbnNpb24gbmFtZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibmFtZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcmVjb3JkX3N0YXJ0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTdGFydCByZWNvcmRpbmcgdGhlIGdhbWUgcHJldmlldyBjYW52YXMgdG8gYSB2aWRlbyBmaWxlLiBVc2VzIE1lZGlhUmVjb3JkZXIgb24gdGhlIGdhbWUgc2lkZSAocmVxdWlyZXMgR2FtZURlYnVnQ2xpZW50IHdpdGggcmVjb3JkX3N0YXJ0IGhhbmRsZXIpLiBSZXR1cm5zIHJlY29yZGluZyBpZC4gRm9ybWF0IGRlZmF1bHRzIHRvIHdlYm0gKG1vc3QgY29tcGF0aWJsZSk7IG1wNCBpcyBhdHRlbXB0ZWQgaWYgc3VwcG9ydGVkLCBmYWxsaW5nIGJhY2sgdG8gd2VibS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZwczogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJGcmFtZXMgcGVyIHNlY29uZCAoZGVmYXVsdDogMzApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9CaXRzUGVyU2Vjb25kOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkJpdHJhdGUgaW4gYnBzIChkZWZhdWx0OiA0MDAwMDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCInd2VibScgKGRlZmF1bHQpIG9yICdtcDQnLiBtcDQgZmFsbHMgYmFjayB0byB3ZWJtIGlmIG5vdCBzdXBwb3J0ZWQuXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWNvcmRfc3RvcFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU3RvcCByZWNvcmRpbmcgc3RhcnRlZCBieSBkZWJ1Z19yZWNvcmRfc3RhcnQuIFJldHVybnMgdGhlIHNhdmVkIFdlYk0gZmlsZSBwYXRoIGFuZCBzaXplLiBWaWRlbyBpcyBzYXZlZCB0byBwcm9qZWN0J3MgdGVtcC9yZWNvcmRpbmdzL3JlY188ZGF0ZXRpbWU+LndlYm0uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3YWl0IHRpbWUgaW4gbXMgZm9yIGZpbGUgdXBsb2FkIChkZWZhdWx0OiAzMDAwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2JhdGNoX3NjcmVlbnNob3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk5hdmlnYXRlIHRvIG11bHRpcGxlIHBhZ2VzIGFuZCB0YWtlIGEgc2NyZWVuc2hvdCBvZiBlYWNoLiBSZXF1aXJlcyBnYW1lIHByZXZpZXcgcnVubmluZyB3aXRoIEdhbWVEZWJ1Z0NsaWVudC4gUmV0dXJucyBhbiBhcnJheSBvZiBzY3JlZW5zaG90IGZpbGUgcGF0aHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBvZiBwYWdlIG5hbWVzIHRvIHNjcmVlbnNob3QgKGUuZy4gWydIb21lUGFnZVZpZXcnLCAnU2hvcFBhZ2VWaWV3J10pXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGF5OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkRlbGF5IGluIG1zIGJldHdlZW4gbmF2aWdhdGUgYW5kIHNjcmVlbnNob3QgKGRlZmF1bHQ6IDEwMDApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdpZHRoIGZvciBzY3JlZW5zaG90IHJlc2l6ZSAoZGVmYXVsdDogOTYwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicGFnZXNcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9lZGl0b3JfaW5mb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEVkaXRvckluZm8oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19saXN0X21lc3NhZ2VzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdE1lc3NhZ2VzKGFyZ3MudGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19leGVjdXRlX3NjcmlwdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWN1dGVTY3JpcHQoYXJncy5tZXRob2QsIGFyZ3MuYXJncyB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZ2V0X2NvbnNvbGVfbG9nc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldENvbnNvbGVMb2dzKGFyZ3MuY291bnQgfHwgNTAsIGFyZ3MubGV2ZWwsIGFyZ3Muc291cmNlKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19jbGVhcl9jb25zb2xlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZChcImNvbnNvbGVcIiwgXCJjbGVhclwiKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciBzY2VuZSBwcm9jZXNzIGxvZyBidWZmZXJcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcImNsZWFyQ29uc29sZUxvZ3NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIGdhbWUgcHJldmlldyBsb2cgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJHYW1lTG9ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfbGlzdF9leHRlbnNpb25zXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdEV4dGVuc2lvbnMoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfcHJvamVjdF9sb2dzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdExvZ3MoYXJncy5saW5lcyB8fCAxMDApO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3NlYXJjaF9wcm9qZWN0X2xvZ3NcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZWFyY2hQcm9qZWN0TG9ncyhhcmdzLnBhdHRlcm4pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9sb2dfZmlsZV9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TG9nRmlsZUluZm8oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19xdWVyeV9kZXZpY2VzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImRldmljZVwiLCBcInF1ZXJ5XCIpLmNhdGNoKCgpID0+IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBkZXZpY2VzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX29wZW5fdXJsXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInByb2dyYW1cIiwgXCJvcGVuLXVybFwiLCBhcmdzLnVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXJsOiBhcmdzLnVybCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nYW1lX2NvbW1hbmRcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nYW1lQ29tbWFuZChhcmdzLnR5cGUgfHwgYXJncy5jb21tYW5kLCBhcmdzLmFyZ3MsIGFyZ3MudGltZW91dCB8fCA1MDAwLCBhcmdzLm1heFdpZHRoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19zY3JlZW5zaG90XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGFrZVNjcmVlbnNob3QoYXJncy5zYXZlUGF0aCwgYXJncy5tYXhXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfcHJldmlld1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVByZXZpZXcoYXJncy5hY3Rpb24gfHwgXCJzdGFydFwiLCBhcmdzLndhaXRGb3JSZWFkeSwgYXJncy53YWl0VGltZW91dCB8fCAxNTAwMCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfY2xlYXJfY29kZV9jYWNoZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsZWFyQ29kZUNhY2hlKCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfcmVsb2FkX2V4dGVuc2lvblwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbG9hZEV4dGVuc2lvbigpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3ZhbGlkYXRlX3NjZW5lXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVTY2VuZSgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9leHRlbnNpb25faW5mb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEV4dGVuc2lvbkluZm8oYXJncy5uYW1lKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19iYXRjaF9zY3JlZW5zaG90XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmF0Y2hTY3JlZW5zaG90KGFyZ3MucGFnZXMsIGFyZ3MuZGVsYXkgfHwgMTAwMCwgYXJncy5tYXhXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfcmVjb3JkX3N0YXJ0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2FtZUNvbW1hbmQoXCJyZWNvcmRfc3RhcnRcIiwgeyBmcHM6IGFyZ3MuZnBzLCB2aWRlb0JpdHNQZXJTZWNvbmQ6IGFyZ3MudmlkZW9CaXRzUGVyU2Vjb25kLCBmb3JtYXQ6IGFyZ3MuZm9ybWF0IH0sIDUwMDApO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3JlY29yZF9zdG9wXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2FtZUNvbW1hbmQoXCJyZWNvcmRfc3RvcFwiLCB1bmRlZmluZWQsIGFyZ3MudGltZW91dCB8fCAzMDAwMCk7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEVkaXRvckluZm8oKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdmVyc2lvbjogRWRpdG9yLkFwcC52ZXJzaW9uLFxyXG4gICAgICAgICAgICBwYXRoOiBFZGl0b3IuQXBwLnBhdGgsXHJcbiAgICAgICAgICAgIGhvbWU6IEVkaXRvci5BcHAuaG9tZSxcclxuICAgICAgICAgICAgbGFuZ3VhZ2U6IEVkaXRvci5JMThuPy5nZXRMYW5ndWFnZT8uKCkgfHwgXCJ1bmtub3duXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBsaXN0TWVzc2FnZXModGFyZ2V0OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImV4dGVuc2lvblwiLCBcInF1ZXJ5LWluZm9cIiwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdGFyZ2V0LCBpbmZvIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICBjb25zdCBrbm93bk1lc3NhZ2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7XHJcbiAgICAgICAgICAgICAgICBcInNjZW5lXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcInF1ZXJ5LW5vZGUtdHJlZVwiLCBcImNyZWF0ZS1ub2RlXCIsIFwicmVtb3ZlLW5vZGVcIiwgXCJkdXBsaWNhdGUtbm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic2V0LXByb3BlcnR5XCIsIFwiY3JlYXRlLXByZWZhYlwiLCBcInNhdmUtc2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicXVlcnktaXMtZGlydHlcIiwgXCJxdWVyeS1jbGFzc2VzXCIsIFwic29mdC1yZWxvYWRcIiwgXCJzbmFwc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2hhbmdlLWdpem1vLXRvb2xcIiwgXCJxdWVyeS1naXptby10b29sLW5hbWVcIiwgXCJmb2N1cy1jYW1lcmEtb24tbm9kZXNcIixcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcImFzc2V0LWRiXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcInF1ZXJ5LWFzc2V0c1wiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgXCJxdWVyeS1hc3NldC1tZXRhXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZyZXNoLWFzc2V0XCIsIFwic2F2ZS1hc3NldFwiLCBcImNyZWF0ZS1hc3NldFwiLCBcImRlbGV0ZS1hc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibW92ZS1hc3NldFwiLCBcImNvcHktYXNzZXRcIiwgXCJvcGVuLWFzc2V0XCIsIFwicmVpbXBvcnQtYXNzZXRcIixcclxuICAgICAgICAgICAgICAgICAgICBcInF1ZXJ5LXBhdGhcIiwgXCJxdWVyeS11dWlkXCIsIFwicXVlcnktdXJsXCIsIFwicXVlcnktYXNzZXQtZGVwZW5kc1wiLFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBrbm93bk1lc3NhZ2VzW3RhcmdldF07XHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdGFyZ2V0LCBtZXNzYWdlcywgbm90ZTogXCJTdGF0aWMgbGlzdCAocXVlcnkgZmFpbGVkKVwiIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgbWV0aG9kLFxyXG4gICAgICAgICAgICBhcmdzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Q29uc29sZUxvZ3MoY291bnQ6IG51bWJlciwgbGV2ZWw/OiBzdHJpbmcsIHNvdXJjZT86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIDEuIFRyeSBFZGl0b3IncyBuYXRpdmUgY29uc29sZSBBUEkgZmlyc3QgKG1heSBiZSBzdXBwb3J0ZWQgaW4gZnV0dXJlIENvY29zQ3JlYXRvciB2ZXJzaW9ucylcclxuICAgICAgICBpZiAoIXNvdXJjZSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9ncyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJjb25zb2xlXCIsIFwicXVlcnktbGFzdC1sb2dzXCIsIGNvdW50KTtcclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGxvZ3MpICYmIGxvZ3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGxvZ3MsIHNvdXJjZTogXCJlZGl0b3ItYXBpXCIsIG5vdGU6IFwiVXNpbmcgbmF0aXZlIEVkaXRvciBjb25zb2xlIEFQSVwiIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogTm90IHN1cHBvcnRlZCBpbiB0aGlzIHZlcnNpb24g4oCUIHVzZSBmYWxsYmFjayAqLyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAyLiBGYWxsYmFjazogY29sbGVjdCBmcm9tIHNjZW5lIHByb2Nlc3MgYnVmZmVyICsgZ2FtZSBwcmV2aWV3IGJ1ZmZlclxyXG4gICAgICAgIGxldCBzY2VuZUxvZ3M6IGFueVtdID0gW107XHJcbiAgICAgICAgbGV0IGdhbWVMb2dzOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgICAgICAvLyAyYS4gU2NlbmUgcHJvY2VzcyBsb2dzIChjb25zb2xlIHdyYXBwZXIgaW4gc2NlbmUudHMpXHJcbiAgICAgICAgaWYgKCFzb3VyY2UgfHwgc291cmNlID09PSBcInNjZW5lXCIpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcImdldENvbnNvbGVMb2dzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW2NvdW50ICogMiwgbGV2ZWxdLCAvLyByZXF1ZXN0IG1vcmUsIHdpbGwgdHJpbSBhZnRlciBtZXJnZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Py5sb2dzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NlbmVMb2dzID0gcmVzdWx0LmxvZ3MubWFwKChsOiBhbnkpID0+ICh7IC4uLmwsIHNvdXJjZTogXCJzY2VuZVwiIH0pKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIHNjZW5lIG5vdCBhdmFpbGFibGUgKi8gfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMmIuIEdhbWUgcHJldmlldyBsb2dzIChyZWNlaXZlZCB2aWEgUE9TVCAvbG9nIGVuZHBvaW50KVxyXG4gICAgICAgIGlmICghc291cmNlIHx8IHNvdXJjZSA9PT0gXCJnYW1lXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgZ2FtZVJlc3VsdCA9IGdldEdhbWVMb2dzKGNvdW50ICogMiwgbGV2ZWwpO1xyXG4gICAgICAgICAgICBnYW1lTG9ncyA9IGdhbWVSZXN1bHQubG9ncy5tYXAoKGw6IGFueSkgPT4gKHsgLi4ubCwgc291cmNlOiBcImdhbWVcIiB9KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNZXJnZSBhbmQgc29ydCBieSB0aW1lc3RhbXAsIHRha2UgbGFzdCBgY291bnRgXHJcbiAgICAgICAgY29uc3QgbWVyZ2VkID0gWy4uLnNjZW5lTG9ncywgLi4uZ2FtZUxvZ3NdXHJcbiAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnRpbWVzdGFtcC5sb2NhbGVDb21wYXJlKGIudGltZXN0YW1wKSlcclxuICAgICAgICAgICAgLnNsaWNlKC1jb3VudCk7XHJcblxyXG4gICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIGxvZ3M6IG1lcmdlZCxcclxuICAgICAgICAgICAgdG90YWw6IHsgc2NlbmU6IHNjZW5lTG9ncy5sZW5ndGgsIGdhbWU6IChzb3VyY2UgPT09IFwic2NlbmVcIiA/IDAgOiBnYW1lTG9ncy5sZW5ndGgpIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBsaXN0RXh0ZW5zaW9ucygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImV4dGVuc2lvblwiLCBcInF1ZXJ5LWFsbFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZXh0ZW5zaW9uczogbGlzdCB9KTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZXh0ZW5zaW9uczogW10sIG5vdGU6IFwiRXh0ZW5zaW9uIHF1ZXJ5IG5vdCBzdXBwb3J0ZWRcIiB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRFeHRlbnNpb25JbmZvKG5hbWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicXVlcnktaW5mb1wiLCBuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbmFtZSwgaW5mbyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRQcm9qZWN0TG9ncyhsaW5lczogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgY29uc3QgbG9nUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsIFwibG9nc1wiLCBcInByb2plY3QubG9nXCIpO1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nUGF0aCkpIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGxvZ3M6IFtdLCBub3RlOiBcIkxvZyBmaWxlIG5vdCBmb3VuZFwiIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGxvZ1BhdGgsIFwidXRmLThcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbExpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcclxuICAgICAgICAgICAgY29uc3QgcmVjZW50ID0gYWxsTGluZXMuc2xpY2UoLWxpbmVzKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbGluZXM6IHJlY2VudC5sZW5ndGgsIGxvZ3M6IHJlY2VudCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzZWFyY2hQcm9qZWN0TG9ncyhwYXR0ZXJuOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBsb2dQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJsb2dzXCIsIFwicHJvamVjdC5sb2dcIik7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhsb2dQYXRoKSkgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbWF0Y2hlczogW10gfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobG9nUGF0aCwgXCJ1dGYtOFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHBhdHRlcm4sIFwiZ2lcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpLmZpbHRlcigobGluZTogc3RyaW5nKSA9PiByZWdleC50ZXN0KGxpbmUpKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcGF0dGVybiwgY291bnQ6IG1hdGNoZXMubGVuZ3RoLCBtYXRjaGVzOiBtYXRjaGVzLnNsaWNlKDAsIDEwMCkgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0TG9nRmlsZUluZm8oKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgY29uc3QgbG9nUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsIFwibG9nc1wiLCBcInByb2plY3QubG9nXCIpO1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nUGF0aCkpIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGV4aXN0czogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhsb2dQYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZXhpc3RzOiB0cnVlLCBwYXRoOiBsb2dQYXRoLCBzaXplOiBzdGF0LnNpemUsIG1vZGlmaWVkOiBzdGF0Lm10aW1lIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVByZXZpZXcoYWN0aW9uOiBzdHJpbmcsIHdhaXRGb3JSZWFkeT86IGJvb2xlYW4sIHdhaXRUaW1lb3V0PzogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJzdG9wXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RvcFByZXZpZXcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zdGFydFByZXZpZXcoKTtcclxuICAgICAgICBpZiAod2FpdEZvclJlYWR5KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdERhdGEgPSBKU09OLnBhcnNlKHJlc3VsdC5jb250ZW50WzBdLnRleHQpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0RGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWFkeSA9IGF3YWl0IHRoaXMud2FpdEZvckdhbWVSZWFkeSh3YWl0VGltZW91dCB8fCAxNTAwMCk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHREYXRhLmdhbWVSZWFkeSA9IHJlYWR5O1xyXG4gICAgICAgICAgICAgICAgaWYgKCFyZWFkeSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdERhdGEubm90ZSA9IChyZXN1bHREYXRhLm5vdGUgfHwgXCJcIikgKyBcIiBHYW1lRGVidWdDbGllbnQgZGlkIG5vdCBjb25uZWN0IHdpdGhpbiB0aW1lb3V0LlwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdERhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyB3YWl0Rm9yR2FtZVJlYWR5KHRpbWVvdXQ6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0IDwgdGltZW91dCkge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBnYW1lIGhhcyBzZW50IGFueSBsb2cgb3IgY29tbWFuZCByZXN1bHQgcmVjZW50bHlcclxuICAgICAgICAgICAgY29uc3QgZ2FtZVJlc3VsdCA9IGdldEdhbWVMb2dzKDEpO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZVJlc3VsdC50b3RhbCA+IDApIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgNTAwKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHN0YXJ0UHJldmlldygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuc3VyZU1haW5TY2VuZU9wZW4oKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOODhOODvOODq+ODkOODvOOBrlZ1ZeOCpOODs+OCueOCv+ODs+OCuee1jOeUseOBp3BsYXkoKeOCkuWRvOOBtu+8iFVJ54q25oWL44KC5ZCM5pyf44GV44KM44KL77yJXHJcbiAgICAgICAgICAgIGNvbnN0IHBsYXllZCA9IGF3YWl0IHRoaXMuZXhlY3V0ZU9uVG9vbGJhcihcInN0YXJ0XCIpO1xyXG4gICAgICAgICAgICBpZiAocGxheWVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IFwic3RhcnRcIiwgbW9kZTogXCJlZGl0b3JcIiB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8g44OV44Kp44O844Or44OQ44OD44KvOiDnm7TmjqVBUElcclxuICAgICAgICAgICAgY29uc3QgaXNQbGF5aW5nID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZWRpdG9yLXByZXZpZXctc2V0LXBsYXlcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGlzUGxheWluZywgYWN0aW9uOiBcInN0YXJ0XCIsIG1vZGU6IFwiZWRpdG9yXCIsIG5vdGU6IFwiZGlyZWN0IEFQSSAodG9vbGJhciBVSSBtYXkgbm90IHN5bmMpXCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IGVsZWN0cm9uLnNoZWxsLm9wZW5FeHRlcm5hbChcImh0dHA6Ly8xMjcuMC4wLjE6NzQ1NlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogXCJzdGFydFwiLCBtb2RlOiBcImJyb3dzZXJcIiB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZTI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihlMi5tZXNzYWdlIHx8IFN0cmluZyhlMikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc3RvcFByZXZpZXcoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8g44OE44O844Or44OQ44O857WM55Sx44Gn5YGc5q2i77yIVUnlkIzmnJ/vvIlcclxuICAgICAgICAgICAgY29uc3Qgc3RvcHBlZCA9IGF3YWl0IHRoaXMuZXhlY3V0ZU9uVG9vbGJhcihcInN0b3BcIik7XHJcbiAgICAgICAgICAgIGlmICghc3RvcHBlZCkge1xyXG4gICAgICAgICAgICAgICAgLy8g44OV44Kp44O844Or44OQ44OD44KvOiDnm7TmjqVBUElcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImVkaXRvci1wcmV2aWV3LXNldC1wbGF5XCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBzY2VuZTpwcmV2aWV3LXN0b3Ag44OW44Ot44O844OJ44Kt44Oj44K544OI44Gn44OE44O844Or44OQ44O8VUnnirbmhYvjgpLjg6rjgrvjg4Pjg4hcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KFwic2NlbmU6cHJldmlldy1zdG9wXCIpO1xyXG4gICAgICAgICAgICAvLyDjgrfjg7zjg7Pjg5Pjg6Xjg7zjgavmiLvjgZlcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDUwMCkpO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuc3VyZU1haW5TY2VuZU9wZW4oKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYWN0aW9uOiBcInN0b3BcIiB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBleGVjdXRlT25Ub29sYmFyKGFjdGlvbjogXCJzdGFydFwiIHwgXCJzdG9wXCIpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgY29uc3QgYWxsQ29udGVudHMgPSBlbGVjdHJvbi53ZWJDb250ZW50cy5nZXRBbGxXZWJDb250ZW50cygpO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHdjIG9mIGFsbENvbnRlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBsYXkoKeOCkmF3YWl044GX44Gq44GEIOKAlCDjg5fjg6zjg5Pjg6Xjg7zlrozkuobjgpLlvoXjgaTjgajjgr/jgqTjg6DjgqLjgqbjg4jjgZnjgovjgZ/jgoFcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uID09PSBcInN0YXJ0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd2MuZXhlY3V0ZUphdmFTY3JpcHQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgKGZ1bmN0aW9uKCkgeyBpZiAod2luZG93Lnh4eCAmJiB3aW5kb3cueHh4LnBsYXkgJiYgIXdpbmRvdy54eHguZ2FtZVZpZXcuaXNQbGF5KSB7IHdpbmRvdy54eHgucGxheSgpOyByZXR1cm4gdHJ1ZTsgfSByZXR1cm4gZmFsc2U7IH0pKClgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHdjLmV4ZWN1dGVKYXZhU2NyaXB0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYChmdW5jdGlvbigpIHsgaWYgKHdpbmRvdy54eHggJiYgd2luZG93Lnh4eC5nYW1lVmlldy5pc1BsYXkpIHsgd2luZG93Lnh4eC5wbGF5KCk7IHJldHVybiB0cnVlOyB9IHJldHVybiBmYWxzZTsgfSkoKWBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7IC8qIG5vdCB0aGUgdG9vbGJhciB3ZWJDb250ZW50cyAqLyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIHsgLyogZWxlY3Ryb24gQVBJIG5vdCBhdmFpbGFibGUgKi8gfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGVuc3VyZU1haW5TY2VuZU9wZW4oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgaGllcmFyY2h5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xyXG4gICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJnZXRTY2VuZUhpZXJhcmNoeVwiLFxyXG4gICAgICAgICAgICBhcmdzOiBbZmFsc2VdLFxyXG4gICAgICAgIH0pLmNhdGNoKCgpID0+IG51bGwpO1xyXG5cclxuICAgICAgICBpZiAoIWhpZXJhcmNoeT8uc2NlbmVOYW1lIHx8IGhpZXJhcmNoeS5zY2VuZU5hbWUgPT09IFwic2NlbmUtMmRcIikge1xyXG4gICAgICAgICAgICAvLyDjg5fjg63jgrjjgqfjgq/jg4joqK3lrprjga5TdGFydCBTY2VuZeOCkuWPgueFp1xyXG4gICAgICAgICAgICBsZXQgc2NlbmVVdWlkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHNjZW5lVXVpZCA9IGF3YWl0IChFZGl0b3IgYXMgYW55KS5Qcm9maWxlLmdldENvbmZpZyhcInByZXZpZXdcIiwgXCJnZW5lcmFsLnN0YXJ0X3NjZW5lXCIsIFwibG9jYWxcIik7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxyXG5cclxuICAgICAgICAgICAgLy8gU3RhcnQgU2NlbmXjgYzmnKroqK3lrpogb3IgXCJjdXJyZW50X3NjZW5lXCIg44Gu5aC05ZCI44CB5pyA5Yid44Gu44K344O844Oz44KS5L2/44GGXHJcbiAgICAgICAgICAgIGlmICghc2NlbmVVdWlkIHx8IHNjZW5lVXVpZCA9PT0gXCJjdXJyZW50X3NjZW5lXCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjZW5lcyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0c1wiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2NUeXBlOiBcImNjLlNjZW5lQXNzZXRcIixcclxuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBcImRiOi8vYXNzZXRzLyoqLypcIixcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NlbmVzKSAmJiBzY2VuZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjZW5lVXVpZCA9IHNjZW5lc1swXS51dWlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2NlbmVVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJvcGVuLXNjZW5lXCIsIHNjZW5lVXVpZCk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTUwMCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY2xlYXJDb2RlQ2FjaGUoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lbnUgPSBlbGVjdHJvbi5NZW51LmdldEFwcGxpY2F0aW9uTWVudSgpO1xyXG4gICAgICAgICAgICBpZiAoIW1lbnUpIHJldHVybiBlcnIoXCJBcHBsaWNhdGlvbiBtZW51IG5vdCBmb3VuZFwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbmRNZW51SXRlbSA9IChpdGVtczogYW55W10sIHBhdGg6IHN0cmluZ1tdKTogYW55ID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmxhYmVsID09PSBwYXRoWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLnN1Ym1lbnU/Lml0ZW1zKSByZXR1cm4gZmluZE1lbnVJdGVtKGl0ZW0uc3VibWVudS5pdGVtcywgcGF0aC5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjYWNoZUl0ZW0gPSBmaW5kTWVudUl0ZW0obWVudS5pdGVtcywgW1wiRGV2ZWxvcGVyXCIsIFwiQ2FjaGVcIiwgXCJDbGVhciBjb2RlIGNhY2hlXCJdKTtcclxuICAgICAgICAgICAgaWYgKCFjYWNoZUl0ZW0pIHJldHVybiBlcnIoXCJNZW51IGl0ZW0gJ0RldmVsb3BlciA+IENhY2hlID4gQ2xlYXIgY29kZSBjYWNoZScgbm90IGZvdW5kXCIpO1xyXG5cclxuICAgICAgICAgICAgY2FjaGVJdGVtLmNsaWNrKCk7XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiQ29kZSBjYWNoZSBjbGVhcmVkIHZpYSBtZW51XCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2FtZUNvbW1hbmQodHlwZTogc3RyaW5nLCBhcmdzOiBhbnksIHRpbWVvdXQ6IG51bWJlciwgbWF4V2lkdGg/OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBjb25zdCBjbWRJZCA9IHF1ZXVlR2FtZUNvbW1hbmQodHlwZSwgYXJncyk7XHJcblxyXG4gICAgICAgIC8vIFBvbGwgZm9yIHJlc3VsdFxyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0IDwgdGltZW91dCkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBnZXRDb21tYW5kUmVzdWx0KCk7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmlkID09PSBjbWRJZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgc2NyZWVuc2hvdCwgc2F2ZSB0byBmaWxlIGFuZCByZXR1cm4gcGF0aFxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwic2NyZWVuc2hvdFwiICYmIHJlc3VsdC5zdWNjZXNzICYmIHJlc3VsdC5kYXRhPy5kYXRhVXJsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJzY3JlZW5zaG90c1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCBcIi1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NCA9IHJlc3VsdC5kYXRhLmRhdGFVcmwucmVwbGFjZSgvXmRhdGE6aW1hZ2VcXC9wbmc7YmFzZTY0LC8sIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbmdCdWZmZXIgPSBCdWZmZXIuZnJvbShiYXNlNjQsIFwiYmFzZTY0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlZmZlY3RpdmVNYXhXaWR0aCA9IG1heFdpZHRoICE9PSB1bmRlZmluZWQgPyBtYXhXaWR0aCA6IDk2MDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdJbWFnZSA9IGVsZWN0cm9uLm5hdGl2ZUltYWdlLmNyZWF0ZUZyb21CdWZmZXIocG5nQnVmZmVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxTaXplID0gb3JpZ0ltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBidWZmZXIsIHdpZHRoLCBoZWlnaHQsIGZvcm1hdCB9ID0gYXdhaXQgdGhpcy5wcm9jZXNzSW1hZ2UocG5nQnVmZmVyLCBlZmZlY3RpdmVNYXhXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dCA9IGZvcm1hdCA9PT0gXCJ3ZWJwXCIgPyBcIndlYnBcIiA6IGZvcm1hdCA9PT0gXCJqcGVnXCIgPyBcImpwZ1wiIDogXCJwbmdcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBgZ2FtZV8ke3RpbWVzdGFtcH0uJHtleHR9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBwYXRoOiBmaWxlUGF0aCwgc2l6ZTogYnVmZmVyLmxlbmd0aCwgZm9ybWF0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxTaXplOiBgJHtvcmlnaW5hbFNpemUud2lkdGh9eCR7b3JpZ2luYWxTaXplLmhlaWdodH1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZWRTaXplOiBgJHt3aWR0aH14JHtoZWlnaHR9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiU2NyZWVuc2hvdCBjYXB0dXJlZCBidXQgZmlsZSBzYXZlIGZhaWxlZFwiLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAyMDApKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVycihgR2FtZSBkaWQgbm90IHJlc3BvbmQgd2l0aGluICR7dGltZW91dH1tcy4gSXMgR2FtZURlYnVnQ2xpZW50IHJ1bm5pbmcgaW4gdGhlIHByZXZpZXc/YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzSW1hZ2UocG5nQnVmZmVyOiBCdWZmZXIsIG1heFdpZHRoOiBudW1iZXIpOiBQcm9taXNlPHsgYnVmZmVyOiBCdWZmZXI7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyOyBmb3JtYXQ6IHN0cmluZyB9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgVmlwcyA9IHJlcXVpcmUoXCJ3YXNtLXZpcHNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHZpcHMgPSBhd2FpdCBWaXBzKCk7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZSA9IHZpcHMuSW1hZ2UubmV3RnJvbUJ1ZmZlcihwbmdCdWZmZXIpO1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnVyA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnSCA9IGltYWdlLmhlaWdodDtcclxuICAgICAgICAgICAgaWYgKG1heFdpZHRoID4gMCAmJiBvcmlnVyA+IG1heFdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICBpbWFnZSA9IGltYWdlLnRodW1ibmFpbEltYWdlKG1heFdpZHRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBvdXRCdWYgPSBpbWFnZS53ZWJwc2F2ZUJ1ZmZlcih7IFE6IDg1IH0pO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGJ1ZmZlcjogQnVmZmVyLmZyb20ob3V0QnVmKSwgd2lkdGg6IGltYWdlLndpZHRoLCBoZWlnaHQ6IGltYWdlLmhlaWdodCwgZm9ybWF0OiBcIndlYnBcIiB9O1xyXG4gICAgICAgICAgICBpbWFnZS5kZWxldGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IE5hdGl2ZUltYWdlIHJlc2l6ZSArIEpQRUdcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZSA9IGVsZWN0cm9uLm5hdGl2ZUltYWdlLmNyZWF0ZUZyb21CdWZmZXIocG5nQnVmZmVyKTtcclxuICAgICAgICAgICAgaWYgKG1heFdpZHRoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzaXplLndpZHRoID4gbWF4V2lkdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG1heFdpZHRoIC8gc2l6ZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZSA9IGltYWdlLnJlc2l6ZSh7IHdpZHRoOiBNYXRoLnJvdW5kKHNpemUud2lkdGggKiByYXRpbyksIGhlaWdodDogTWF0aC5yb3VuZChzaXplLmhlaWdodCAqIHJhdGlvKSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBzaXplID0gaW1hZ2UuZ2V0U2l6ZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBpbWFnZS50b0pQRUcoODUpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBidWZmZXIsIHdpZHRoOiBzaXplLndpZHRoLCBoZWlnaHQ6IHNpemUuaGVpZ2h0LCBmb3JtYXQ6IFwianBlZ1wiIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdGFrZVNjcmVlbnNob3Qoc2F2ZVBhdGg/OiBzdHJpbmcsIG1heFdpZHRoPzogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd3MgPSBlbGVjdHJvbi5Ccm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKTtcclxuICAgICAgICAgICAgaWYgKCF3aW5kb3dzIHx8IHdpbmRvd3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFwiTm8gZWRpdG9yIHdpbmRvdyBmb3VuZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBtYWluIChsYXJnZXN0KSB3aW5kb3dcclxuICAgICAgICAgICAgbGV0IHdpbiA9IHdpbmRvd3NbMF07XHJcbiAgICAgICAgICAgIGxldCBtYXhBcmVhID0gMDtcclxuICAgICAgICAgICAgZm9yIChjb25zdCB3IG9mIHdpbmRvd3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJvdW5kcyA9IHcuZ2V0Qm91bmRzKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhcmVhID0gYm91bmRzLndpZHRoICogYm91bmRzLmhlaWdodDtcclxuICAgICAgICAgICAgICAgIGlmIChhcmVhID4gbWF4QXJlYSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heEFyZWEgPSBhcmVhO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbiA9IHc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQnJpbmcgdG8gZnJvbnQgYW5kIHdhaXQgZm9yIHJlbmRlclxyXG4gICAgICAgICAgICB3aW4uc2hvdygpO1xyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMzAwKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZUltYWdlID0gYXdhaXQgd2luLndlYkNvbnRlbnRzLmNhcHR1cmVQYWdlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsU2l6ZSA9IG5hdGl2ZUltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgY29uc3QgcG5nQnVmZmVyID0gbmF0aXZlSW1hZ2UudG9QTkcoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGVmZmVjdGl2ZU1heFdpZHRoID0gbWF4V2lkdGggIT09IHVuZGVmaW5lZCA/IG1heFdpZHRoIDogOTYwO1xyXG4gICAgICAgICAgICBjb25zdCB7IGJ1ZmZlciwgd2lkdGgsIGhlaWdodCwgZm9ybWF0IH0gPSBhd2FpdCB0aGlzLnByb2Nlc3NJbWFnZShwbmdCdWZmZXIsIGVmZmVjdGl2ZU1heFdpZHRoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSBzYXZlIHBhdGhcclxuICAgICAgICAgICAgY29uc3QgZXh0ID0gZm9ybWF0ID09PSBcIndlYnBcIiA/IFwid2VicFwiIDogZm9ybWF0ID09PSBcImpwZWdcIiA/IFwianBnXCIgOiBcInBuZ1wiO1xyXG4gICAgICAgICAgICBpZiAoIXNhdmVQYXRoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcInNjcmVlbnNob3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgXCItXCIpO1xyXG4gICAgICAgICAgICAgICAgc2F2ZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBgc2NyZWVuc2hvdF8ke3RpbWVzdGFtcH0uJHtleHR9YCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2F2ZVBhdGgsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBwYXRoOiBzYXZlUGF0aCwgc2l6ZTogYnVmZmVyLmxlbmd0aCwgZm9ybWF0LFxyXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxTaXplOiBgJHtvcmlnaW5hbFNpemUud2lkdGh9eCR7b3JpZ2luYWxTaXplLmhlaWdodH1gLFxyXG4gICAgICAgICAgICAgICAgc2F2ZWRTaXplOiBgJHt3aWR0aH14JHtoZWlnaHR9YCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVsb2FkRXh0ZW5zaW9uKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIFNjaGVkdWxlIHJlbG9hZCBhZnRlciByZXNwb25zZSBpcyBzZW50XHJcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicmVsb2FkXCIsIFwiY29jb3MtY3JlYXRvci1tY3BcIik7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltNQ1BdIEV4dGVuc2lvbiByZWxvYWQgZmFpbGVkOlwiLCBlLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgNTAwKTtcclxuICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub3RlOiBcIkV4dGVuc2lvbiByZWxvYWQgc2NoZWR1bGVkLiBNQ1Agc2VydmVyIHdpbGwgcmVzdGFydCBpbiB+MXMuIE5PVEU6IEFkZGluZyBuZXcgdG9vbCBkZWZpbml0aW9ucyBvciBtb2RpZnlpbmcgc2NlbmUudHMgcmVxdWlyZXMgYSBmdWxsIENvY29zQ3JlYXRvciByZXN0YXJ0IChyZWxvYWQgaXMgbm90IHN1ZmZpY2llbnQpLlwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hTY3JlZW5zaG90KHBhZ2VzOiBzdHJpbmdbXSwgZGVsYXk6IG51bWJlciwgbWF4V2lkdGg/OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAxMDAwMDtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XHJcbiAgICAgICAgICAgIC8vIE5hdmlnYXRlXHJcbiAgICAgICAgICAgIGNvbnN0IG5hdlJlc3VsdCA9IGF3YWl0IHRoaXMuZ2FtZUNvbW1hbmQoXCJuYXZpZ2F0ZVwiLCB7IHBhZ2UgfSwgdGltZW91dCwgbWF4V2lkdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBuYXZEYXRhID0gSlNPTi5wYXJzZShuYXZSZXN1bHQuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgaWYgKCFuYXZEYXRhLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHBhZ2UsIHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJuYXZpZ2F0ZSBmYWlsZWRcIiB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBXYWl0IGZvciBwYWdlIHRvIHJlbmRlclxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgZGVsYXkpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNjcmVlbnNob3RcclxuICAgICAgICAgICAgY29uc3Qgc3NSZXN1bHQgPSBhd2FpdCB0aGlzLmdhbWVDb21tYW5kKFwic2NyZWVuc2hvdFwiLCB7fSwgdGltZW91dCwgbWF4V2lkdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBzc0RhdGEgPSBKU09OLnBhcnNlKHNzUmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBwYWdlLFxyXG4gICAgICAgICAgICAgICAgc3VjY2Vzczogc3NEYXRhLnN1Y2Nlc3MgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBzc0RhdGEucGF0aCxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBzc0RhdGEuc3VjY2VzcyA/IHVuZGVmaW5lZCA6IChzc0RhdGEuZXJyb3IgfHwgc3NEYXRhLm1lc3NhZ2UpLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1Y2NlZWRlZCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XHJcbiAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdG90YWw6IHBhZ2VzLmxlbmd0aCxcclxuICAgICAgICAgICAgc3VjY2VlZGVkLFxyXG4gICAgICAgICAgICBmYWlsZWQ6IHBhZ2VzLmxlbmd0aCAtIHN1Y2NlZWRlZCxcclxuICAgICAgICAgICAgcmVzdWx0cyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlU2NlbmUoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgdHJlZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGUtdHJlZVwiKTtcclxuICAgICAgICAgICAgY29uc3QgaXNzdWVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBjaGVja05vZGVzID0gKG5vZGVzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlcykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlLm5hbWUpIGlzc3Vlcy5wdXNoKGBOb2RlICR7bm9kZS51dWlkfSBoYXMgbm8gbmFtZWApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSBjaGVja05vZGVzKG5vZGUuY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0cmVlKSkgY2hlY2tOb2Rlcyh0cmVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaXNzdWVDb3VudDogaXNzdWVzLmxlbmd0aCwgaXNzdWVzIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=