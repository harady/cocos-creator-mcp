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
                description: "Start recording the game preview canvas to a video file. Uses MediaRecorder on the game side. Bitrate is auto-calculated from canvas resolution × fps × quality coefficient unless videoBitsPerSecond is set explicitly.",
                inputSchema: {
                    type: "object",
                    properties: {
                        fps: { type: "number", description: "Frames per second (default: 30)" },
                        quality: { type: "string", description: "'low'/'medium'/'high'/'ultra' (default: medium). Coefficients: 0.05/0.10/0.15/0.25" },
                        videoBitsPerSecond: { type: "number", description: "Explicit bitrate in bps. Overrides quality-based calculation." },
                        format: { type: "string", description: "'mp4' (default) or 'webm'. mp4 falls back to webm if not supported." },
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
                    return this.gameCommand("record_start", { fps: args.fps, quality: args.quality, videoBitsPerSecond: args.videoBitsPerSecond, format: args.format }, 5000);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWctdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvZGVidWctdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBQ3ZDLDhDQUErRjtBQUUvRixNQUFhLFVBQVU7SUFBdkI7UUFDYSxpQkFBWSxHQUFHLE9BQU8sQ0FBQztJQTZ2QnBDLENBQUM7SUEzdkJHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLHVCQUF1QjtnQkFDN0IsV0FBVyxFQUFFLHFFQUFxRTtnQkFDbEYsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO2FBQ2xEO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHFCQUFxQjtnQkFDM0IsV0FBVyxFQUFFLDBFQUEwRTtnQkFDdkYsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx3REFBd0QsRUFBRTtxQkFDcEc7b0JBQ0QsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUN2QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsV0FBVyxFQUFFLGtGQUFrRjtnQkFDL0YsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSwyQkFBMkIsRUFBRTt3QkFDcEUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtxQkFDdkU7b0JBQ0QsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUN2QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHdC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QztJQUNMLENBQUM7Q0FDSjtBQTl2QkQsZ0NBOHZCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuaW1wb3J0IHsgZ2V0R2FtZUxvZ3MsIGNsZWFyR2FtZUxvZ3MsIHF1ZXVlR2FtZUNvbW1hbmQsIGdldENvbW1hbmRSZXN1bHQgfSBmcm9tIFwiLi4vbWNwLXNlcnZlclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERlYnVnVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJkZWJ1Z1wiO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X2VkaXRvcl9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgQ29jb3MgQ3JlYXRvciBlZGl0b3IgaW5mb3JtYXRpb24gKHZlcnNpb24sIHBsYXRmb3JtLCBsYW5ndWFnZSkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2xpc3RfbWVzc2FnZXNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkxpc3QgYXZhaWxhYmxlIEVkaXRvciBtZXNzYWdlcyBmb3IgYSBnaXZlbiBleHRlbnNpb24gb3IgYnVpbHQtaW4gbW9kdWxlLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk1lc3NhZ2UgdGFyZ2V0IChlLmcuICdzY2VuZScsICdhc3NldC1kYicsICdleHRlbnNpb24nKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widGFyZ2V0XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19leGVjdXRlX3NjcmlwdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRXhlY3V0ZSBhIGN1c3RvbSBzY2VuZSBzY3JpcHQgbWV0aG9kLiBUaGUgbWV0aG9kIG11c3QgYmUgcmVnaXN0ZXJlZCBpbiBzY2VuZS50cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJNZXRob2QgbmFtZSBmcm9tIHNjZW5lLnRzXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogeyB0eXBlOiBcImFycmF5XCIsIGRlc2NyaXB0aW9uOiBcIkFyZ3VtZW50cyB0byBwYXNzXCIsIGl0ZW1zOiB7fSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcIm1ldGhvZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X2NvbnNvbGVfbG9nc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IHJlY2VudCBjb25zb2xlIGxvZyBlbnRyaWVzLiBBdXRvbWF0aWNhbGx5IGNhcHR1cmVzIHNjZW5lIHByb2Nlc3MgbG9ncyAoY29uc29sZS5sb2cvd2Fybi9lcnJvciBpbiBzY2VuZSBzY3JpcHRzKS4gR2FtZSBwcmV2aWV3IGxvZ3MgY2FuIGFsc28gYmUgY2FwdHVyZWQgYnkgc2VuZGluZyBQT1NUIHJlcXVlc3RzIHRvIC9sb2cgZW5kcG9pbnQg4oCUIHNlZSBSRUFETUUgZm9yIHNldHVwLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IG51bWJlciBvZiBlbnRyaWVzIChkZWZhdWx0IDUwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkZpbHRlciBieSBsZXZlbDogJ2xvZycsICd3YXJuJywgb3IgJ2Vycm9yJ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJGaWx0ZXIgYnkgc291cmNlOiAnc2NlbmUnIG9yICdnYW1lJy4gUmV0dXJucyBib3RoIGlmIG9taXR0ZWQuXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19jbGVhcl9jb25zb2xlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDbGVhciB0aGUgZWRpdG9yIGNvbnNvbGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2xpc3RfZXh0ZW5zaW9uc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhbGwgaW5zdGFsbGVkIGV4dGVuc2lvbnMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dldF9wcm9qZWN0X2xvZ3NcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlYWQgcmVjZW50IHByb2plY3QgbG9nIGVudHJpZXMgZnJvbSB0aGUgbG9nIGZpbGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lczogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJOdW1iZXIgb2YgbGluZXMgdG8gcmVhZCAoZGVmYXVsdCAxMDApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19zZWFyY2hfcHJvamVjdF9sb2dzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZWFyY2ggZm9yIGEgcGF0dGVybiBpbiBwcm9qZWN0IGxvZ3MuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlNlYXJjaCBwYXR0ZXJuIChyZWdleCBzdXBwb3J0ZWQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXR0ZXJuXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfbG9nX2ZpbGVfaW5mb1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBwcm9qZWN0IGxvZyBmaWxlIChzaXplLCBwYXRoLCBsYXN0IG1vZGlmaWVkKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIOKUgOKUgCDku6XkuIvjgIHml6LlrZhNQ1DmnKrlr77lv5zjga5FZGl0b3IgQVBJIOKUgOKUgFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3F1ZXJ5X2RldmljZXNcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkxpc3QgY29ubmVjdGVkIGRldmljZXMgKGZvciBuYXRpdmUgZGVidWdnaW5nKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfb3Blbl91cmxcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk9wZW4gYSBVUkwgaW4gdGhlIHN5c3RlbSBicm93c2VyIGZyb20gdGhlIGVkaXRvci5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7IHVybDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJVUkwgdG8gb3BlblwiIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXJsXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z192YWxpZGF0ZV9zY2VuZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVmFsaWRhdGUgdGhlIGN1cnJlbnQgc2NlbmUgZm9yIGNvbW1vbiBpc3N1ZXMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dhbWVfY29tbWFuZFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2VuZCBhIGNvbW1hbmQgdG8gdGhlIHJ1bm5pbmcgZ2FtZSBwcmV2aWV3LiBSZXF1aXJlcyBHYW1lRGVidWdDbGllbnQgaW4gdGhlIGdhbWUuIENvbW1hbmRzOiAnc2NyZWVuc2hvdCcgKGNhcHR1cmUgZ2FtZSBjYW52YXMpLCAnc3RhdGUnIChkdW1wIEdhbWVEYiksICduYXZpZ2F0ZScgKGdvIHRvIGEgcGFnZSksICdjbGljaycgKGNsaWNrIGEgbm9kZSBieSBuYW1lKSwgJ2luc3BlY3QnIChnZXQgcnVudGltZSBub2RlIGluZm86IFVJVHJhbnNmb3JtIHNpemVzLCBXaWRnZXQsIExheW91dCwgcG9zaXRpb24pLiBSZXR1cm5zIHRoZSByZXN1bHQgZnJvbSB0aGUgZ2FtZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiQ29tbWFuZCB0eXBlOiAnc2NyZWVuc2hvdCcsICdzdGF0ZScsICduYXZpZ2F0ZScsICdjbGljaycsICdpbnNwZWN0J1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IHsgZGVzY3JpcHRpb246IFwiQ29tbWFuZCBhcmd1bWVudHMgKGUuZy4ge3BhZ2U6ICdIb21lUGFnZVZpZXcnfSBmb3IgbmF2aWdhdGUsIHtuYW1lOiAnQnV0dG9uTmFtZSd9IGZvciBjbGljaylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3YWl0IHRpbWUgaW4gbXMgKGRlZmF1bHQgNTAwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggd2lkdGggZm9yIHNjcmVlbnNob3QgcmVzaXplIChkZWZhdWx0OiA5NjAsIDAgPSBubyByZXNpemUpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ0eXBlXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19zY3JlZW5zaG90XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJUYWtlIGEgc2NyZWVuc2hvdCBvZiB0aGUgZWRpdG9yIHdpbmRvdyBhbmQgc2F2ZSB0byBhIGZpbGUuIFJldHVybnMgdGhlIGZpbGUgcGF0aCBvZiB0aGUgc2F2ZWQgUE5HLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZVBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiRmlsZSBwYXRoIHRvIHNhdmUgdGhlIFBORyAoZGVmYXVsdDogdGVtcC9zY3JlZW5zaG90cy9zY3JlZW5zaG90Xzx0aW1lc3RhbXA+LnBuZylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggd2lkdGggaW4gcGl4ZWxzIGZvciByZXNpemUgKGRlZmF1bHQ6IDk2MCwgMCA9IG5vIHJlc2l6ZSkuIEFzcGVjdCByYXRpbyBpcyBwcmVzZXJ2ZWQuXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19wcmV2aWV3XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTdGFydCBvciBzdG9wIHRoZSBnYW1lIHByZXZpZXcuIFVzZXMgUHJldmlldyBpbiBFZGl0b3IgKGF1dG8tb3BlbnMgTWFpblNjZW5lIGlmIG5lZWRlZCkuIEZhbGxzIGJhY2sgdG8gYnJvd3NlciBwcmV2aWV3IGlmIGVkaXRvciBwcmV2aWV3IGZhaWxzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIidzdGFydCcgKGRlZmF1bHQpIG9yICdzdG9wJ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhaXRGb3JSZWFkeTogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiSWYgdHJ1ZSwgd2FpdCB1bnRpbCBHYW1lRGVidWdDbGllbnQgY29ubmVjdHMgYWZ0ZXIgc3RhcnQgKGRlZmF1bHQ6IGZhbHNlKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhaXRUaW1lb3V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3YWl0IHRpbWUgaW4gbXMgZm9yIHdhaXRGb3JSZWFkeSAoZGVmYXVsdDogMTUwMDApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19jbGVhcl9jb2RlX2NhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDbGVhciB0aGUgY29kZSBjYWNoZSAoZXF1aXZhbGVudCB0byBEZXZlbG9wZXIgPiBDYWNoZSA+IENsZWFyIGNvZGUgY2FjaGUpIGFuZCBzb2Z0LXJlbG9hZCB0aGUgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3JlbG9hZF9leHRlbnNpb25cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlbG9hZCB0aGUgTUNQIGV4dGVuc2lvbiBpdHNlbGYuIFVzZSBhZnRlciBucG0gcnVuIGJ1aWxkIHRvIGFwcGx5IGNvZGUgY2hhbmdlcyB3aXRob3V0IHJlc3RhcnRpbmcgQ29jb3NDcmVhdG9yLiBSZXNwb25zZSBpcyBzZW50IGJlZm9yZSByZWxvYWQgc3RhcnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfZXh0ZW5zaW9uX2luZm9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBkZXRhaWxlZCBpbmZvcm1hdGlvbiBhYm91dCBhIHNwZWNpZmljIGV4dGVuc2lvbi5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiRXh0ZW5zaW9uIG5hbWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcIm5hbWVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3JlY29yZF9zdGFydFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU3RhcnQgcmVjb3JkaW5nIHRoZSBnYW1lIHByZXZpZXcgY2FudmFzIHRvIGEgdmlkZW8gZmlsZS4gVXNlcyBNZWRpYVJlY29yZGVyIG9uIHRoZSBnYW1lIHNpZGUuIEJpdHJhdGUgaXMgYXV0by1jYWxjdWxhdGVkIGZyb20gY2FudmFzIHJlc29sdXRpb24gw5cgZnBzIMOXIHF1YWxpdHkgY29lZmZpY2llbnQgdW5sZXNzIHZpZGVvQml0c1BlclNlY29uZCBpcyBzZXQgZXhwbGljaXRseS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZwczogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJGcmFtZXMgcGVyIHNlY29uZCAoZGVmYXVsdDogMzApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCInbG93Jy8nbWVkaXVtJy8naGlnaCcvJ3VsdHJhJyAoZGVmYXVsdDogbWVkaXVtKS4gQ29lZmZpY2llbnRzOiAwLjA1LzAuMTAvMC4xNS8wLjI1XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9CaXRzUGVyU2Vjb25kOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkV4cGxpY2l0IGJpdHJhdGUgaW4gYnBzLiBPdmVycmlkZXMgcXVhbGl0eS1iYXNlZCBjYWxjdWxhdGlvbi5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiJ21wNCcgKGRlZmF1bHQpIG9yICd3ZWJtJy4gbXA0IGZhbGxzIGJhY2sgdG8gd2VibSBpZiBub3Qgc3VwcG9ydGVkLlwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcmVjb3JkX3N0b3BcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlN0b3AgcmVjb3JkaW5nIHN0YXJ0ZWQgYnkgZGVidWdfcmVjb3JkX3N0YXJ0LiBSZXR1cm5zIHRoZSBzYXZlZCBXZWJNIGZpbGUgcGF0aCBhbmQgc2l6ZS4gVmlkZW8gaXMgc2F2ZWQgdG8gcHJvamVjdCdzIHRlbXAvcmVjb3JkaW5ncy9yZWNfPGRhdGV0aW1lPi53ZWJtLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggd2FpdCB0aW1lIGluIG1zIGZvciBmaWxlIHVwbG9hZCAoZGVmYXVsdDogMzAwMDApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19iYXRjaF9zY3JlZW5zaG90XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJOYXZpZ2F0ZSB0byBtdWx0aXBsZSBwYWdlcyBhbmQgdGFrZSBhIHNjcmVlbnNob3Qgb2YgZWFjaC4gUmVxdWlyZXMgZ2FtZSBwcmV2aWV3IHJ1bm5pbmcgd2l0aCBHYW1lRGVidWdDbGllbnQuIFJldHVybnMgYW4gYXJyYXkgb2Ygc2NyZWVuc2hvdCBmaWxlIHBhdGhzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkxpc3Qgb2YgcGFnZSBuYW1lcyB0byBzY3JlZW5zaG90IChlLmcuIFsnSG9tZVBhZ2VWaWV3JywgJ1Nob3BQYWdlVmlldyddKVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxheTogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJEZWxheSBpbiBtcyBiZXR3ZWVuIG5hdmlnYXRlIGFuZCBzY3JlZW5zaG90IChkZWZhdWx0OiAxMDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3aWR0aCBmb3Igc2NyZWVuc2hvdCByZXNpemUgKGRlZmF1bHQ6IDk2MClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhZ2VzXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfZWRpdG9yX2luZm9cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRFZGl0b3JJbmZvKCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfbGlzdF9tZXNzYWdlc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpc3RNZXNzYWdlcyhhcmdzLnRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZXhlY3V0ZV9zY3JpcHRcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGVjdXRlU2NyaXB0KGFyZ3MubWV0aG9kLCBhcmdzLmFyZ3MgfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9jb25zb2xlX2xvZ3NcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb25zb2xlTG9ncyhhcmdzLmNvdW50IHx8IDUwLCBhcmdzLmxldmVsLCBhcmdzLnNvdXJjZSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfY2xlYXJfY29uc29sZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoXCJjb25zb2xlXCIsIFwiY2xlYXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgc2NlbmUgcHJvY2VzcyBsb2cgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJjbGVhckNvbnNvbGVMb2dzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHt9KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciBnYW1lIHByZXZpZXcgbG9nIGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyR2FtZUxvZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2xpc3RfZXh0ZW5zaW9uc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpc3RFeHRlbnNpb25zKCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZ2V0X3Byb2plY3RfbG9nc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFByb2plY3RMb2dzKGFyZ3MubGluZXMgfHwgMTAwKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19zZWFyY2hfcHJvamVjdF9sb2dzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VhcmNoUHJvamVjdExvZ3MoYXJncy5wYXR0ZXJuKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfbG9nX2ZpbGVfaW5mb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldExvZ0ZpbGVJbmZvKCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfcXVlcnlfZGV2aWNlc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGV2aWNlcyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJkZXZpY2VcIiwgXCJxdWVyeVwiKS5jYXRjaCgoKSA9PiBbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZGV2aWNlcyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19vcGVuX3VybFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJwcm9ncmFtXCIsIFwib3Blbi11cmxcIiwgYXJncy51cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHVybDogYXJncy51cmwgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZ2FtZV9jb21tYW5kXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2FtZUNvbW1hbmQoYXJncy50eXBlIHx8IGFyZ3MuY29tbWFuZCwgYXJncy5hcmdzLCBhcmdzLnRpbWVvdXQgfHwgNTAwMCwgYXJncy5tYXhXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfc2NyZWVuc2hvdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRha2VTY3JlZW5zaG90KGFyZ3Muc2F2ZVBhdGgsIGFyZ3MubWF4V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3ByZXZpZXdcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVQcmV2aWV3KGFyZ3MuYWN0aW9uIHx8IFwic3RhcnRcIiwgYXJncy53YWl0Rm9yUmVhZHksIGFyZ3Mud2FpdFRpbWVvdXQgfHwgMTUwMDApO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2NsZWFyX2NvZGVfY2FjaGVcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGVhckNvZGVDYWNoZSgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3JlbG9hZF9leHRlbnNpb25cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWxvYWRFeHRlbnNpb24oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z192YWxpZGF0ZV9zY2VuZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlU2NlbmUoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfZXh0ZW5zaW9uX2luZm9cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRFeHRlbnNpb25JbmZvKGFyZ3MubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfYmF0Y2hfc2NyZWVuc2hvdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJhdGNoU2NyZWVuc2hvdChhcmdzLnBhZ2VzLCBhcmdzLmRlbGF5IHx8IDEwMDAsIGFyZ3MubWF4V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3JlY29yZF9zdGFydFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdhbWVDb21tYW5kKFwicmVjb3JkX3N0YXJ0XCIsIHsgZnBzOiBhcmdzLmZwcywgcXVhbGl0eTogYXJncy5xdWFsaXR5LCB2aWRlb0JpdHNQZXJTZWNvbmQ6IGFyZ3MudmlkZW9CaXRzUGVyU2Vjb25kLCBmb3JtYXQ6IGFyZ3MuZm9ybWF0IH0sIDUwMDApO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3JlY29yZF9zdG9wXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2FtZUNvbW1hbmQoXCJyZWNvcmRfc3RvcFwiLCB1bmRlZmluZWQsIGFyZ3MudGltZW91dCB8fCAzMDAwMCk7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEVkaXRvckluZm8oKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdmVyc2lvbjogRWRpdG9yLkFwcC52ZXJzaW9uLFxyXG4gICAgICAgICAgICBwYXRoOiBFZGl0b3IuQXBwLnBhdGgsXHJcbiAgICAgICAgICAgIGhvbWU6IEVkaXRvci5BcHAuaG9tZSxcclxuICAgICAgICAgICAgbGFuZ3VhZ2U6IEVkaXRvci5JMThuPy5nZXRMYW5ndWFnZT8uKCkgfHwgXCJ1bmtub3duXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBsaXN0TWVzc2FnZXModGFyZ2V0OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImV4dGVuc2lvblwiLCBcInF1ZXJ5LWluZm9cIiwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdGFyZ2V0LCBpbmZvIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICBjb25zdCBrbm93bk1lc3NhZ2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7XHJcbiAgICAgICAgICAgICAgICBcInNjZW5lXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcInF1ZXJ5LW5vZGUtdHJlZVwiLCBcImNyZWF0ZS1ub2RlXCIsIFwicmVtb3ZlLW5vZGVcIiwgXCJkdXBsaWNhdGUtbm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic2V0LXByb3BlcnR5XCIsIFwiY3JlYXRlLXByZWZhYlwiLCBcInNhdmUtc2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicXVlcnktaXMtZGlydHlcIiwgXCJxdWVyeS1jbGFzc2VzXCIsIFwic29mdC1yZWxvYWRcIiwgXCJzbmFwc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2hhbmdlLWdpem1vLXRvb2xcIiwgXCJxdWVyeS1naXptby10b29sLW5hbWVcIiwgXCJmb2N1cy1jYW1lcmEtb24tbm9kZXNcIixcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcImFzc2V0LWRiXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcInF1ZXJ5LWFzc2V0c1wiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgXCJxdWVyeS1hc3NldC1tZXRhXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWZyZXNoLWFzc2V0XCIsIFwic2F2ZS1hc3NldFwiLCBcImNyZWF0ZS1hc3NldFwiLCBcImRlbGV0ZS1hc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibW92ZS1hc3NldFwiLCBcImNvcHktYXNzZXRcIiwgXCJvcGVuLWFzc2V0XCIsIFwicmVpbXBvcnQtYXNzZXRcIixcclxuICAgICAgICAgICAgICAgICAgICBcInF1ZXJ5LXBhdGhcIiwgXCJxdWVyeS11dWlkXCIsIFwicXVlcnktdXJsXCIsIFwicXVlcnktYXNzZXQtZGVwZW5kc1wiLFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBrbm93bk1lc3NhZ2VzW3RhcmdldF07XHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdGFyZ2V0LCBtZXNzYWdlcywgbm90ZTogXCJTdGF0aWMgbGlzdCAocXVlcnkgZmFpbGVkKVwiIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgbWV0aG9kLFxyXG4gICAgICAgICAgICBhcmdzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Q29uc29sZUxvZ3MoY291bnQ6IG51bWJlciwgbGV2ZWw/OiBzdHJpbmcsIHNvdXJjZT86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIDEuIFRyeSBFZGl0b3IncyBuYXRpdmUgY29uc29sZSBBUEkgZmlyc3QgKG1heSBiZSBzdXBwb3J0ZWQgaW4gZnV0dXJlIENvY29zQ3JlYXRvciB2ZXJzaW9ucylcclxuICAgICAgICBpZiAoIXNvdXJjZSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9ncyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJjb25zb2xlXCIsIFwicXVlcnktbGFzdC1sb2dzXCIsIGNvdW50KTtcclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGxvZ3MpICYmIGxvZ3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGxvZ3MsIHNvdXJjZTogXCJlZGl0b3ItYXBpXCIsIG5vdGU6IFwiVXNpbmcgbmF0aXZlIEVkaXRvciBjb25zb2xlIEFQSVwiIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogTm90IHN1cHBvcnRlZCBpbiB0aGlzIHZlcnNpb24g4oCUIHVzZSBmYWxsYmFjayAqLyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAyLiBGYWxsYmFjazogY29sbGVjdCBmcm9tIHNjZW5lIHByb2Nlc3MgYnVmZmVyICsgZ2FtZSBwcmV2aWV3IGJ1ZmZlclxyXG4gICAgICAgIGxldCBzY2VuZUxvZ3M6IGFueVtdID0gW107XHJcbiAgICAgICAgbGV0IGdhbWVMb2dzOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgICAgICAvLyAyYS4gU2NlbmUgcHJvY2VzcyBsb2dzIChjb25zb2xlIHdyYXBwZXIgaW4gc2NlbmUudHMpXHJcbiAgICAgICAgaWYgKCFzb3VyY2UgfHwgc291cmNlID09PSBcInNjZW5lXCIpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcImdldENvbnNvbGVMb2dzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW2NvdW50ICogMiwgbGV2ZWxdLCAvLyByZXF1ZXN0IG1vcmUsIHdpbGwgdHJpbSBhZnRlciBtZXJnZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Py5sb2dzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NlbmVMb2dzID0gcmVzdWx0LmxvZ3MubWFwKChsOiBhbnkpID0+ICh7IC4uLmwsIHNvdXJjZTogXCJzY2VuZVwiIH0pKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIHNjZW5lIG5vdCBhdmFpbGFibGUgKi8gfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMmIuIEdhbWUgcHJldmlldyBsb2dzIChyZWNlaXZlZCB2aWEgUE9TVCAvbG9nIGVuZHBvaW50KVxyXG4gICAgICAgIGlmICghc291cmNlIHx8IHNvdXJjZSA9PT0gXCJnYW1lXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgZ2FtZVJlc3VsdCA9IGdldEdhbWVMb2dzKGNvdW50ICogMiwgbGV2ZWwpO1xyXG4gICAgICAgICAgICBnYW1lTG9ncyA9IGdhbWVSZXN1bHQubG9ncy5tYXAoKGw6IGFueSkgPT4gKHsgLi4ubCwgc291cmNlOiBcImdhbWVcIiB9KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNZXJnZSBhbmQgc29ydCBieSB0aW1lc3RhbXAsIHRha2UgbGFzdCBgY291bnRgXHJcbiAgICAgICAgY29uc3QgbWVyZ2VkID0gWy4uLnNjZW5lTG9ncywgLi4uZ2FtZUxvZ3NdXHJcbiAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnRpbWVzdGFtcC5sb2NhbGVDb21wYXJlKGIudGltZXN0YW1wKSlcclxuICAgICAgICAgICAgLnNsaWNlKC1jb3VudCk7XHJcblxyXG4gICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIGxvZ3M6IG1lcmdlZCxcclxuICAgICAgICAgICAgdG90YWw6IHsgc2NlbmU6IHNjZW5lTG9ncy5sZW5ndGgsIGdhbWU6IChzb3VyY2UgPT09IFwic2NlbmVcIiA/IDAgOiBnYW1lTG9ncy5sZW5ndGgpIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBsaXN0RXh0ZW5zaW9ucygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImV4dGVuc2lvblwiLCBcInF1ZXJ5LWFsbFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZXh0ZW5zaW9uczogbGlzdCB9KTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZXh0ZW5zaW9uczogW10sIG5vdGU6IFwiRXh0ZW5zaW9uIHF1ZXJ5IG5vdCBzdXBwb3J0ZWRcIiB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRFeHRlbnNpb25JbmZvKG5hbWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicXVlcnktaW5mb1wiLCBuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbmFtZSwgaW5mbyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRQcm9qZWN0TG9ncyhsaW5lczogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgY29uc3QgbG9nUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsIFwibG9nc1wiLCBcInByb2plY3QubG9nXCIpO1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nUGF0aCkpIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGxvZ3M6IFtdLCBub3RlOiBcIkxvZyBmaWxlIG5vdCBmb3VuZFwiIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGxvZ1BhdGgsIFwidXRmLThcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbExpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcclxuICAgICAgICAgICAgY29uc3QgcmVjZW50ID0gYWxsTGluZXMuc2xpY2UoLWxpbmVzKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbGluZXM6IHJlY2VudC5sZW5ndGgsIGxvZ3M6IHJlY2VudCB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzZWFyY2hQcm9qZWN0TG9ncyhwYXR0ZXJuOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBsb2dQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJsb2dzXCIsIFwicHJvamVjdC5sb2dcIik7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhsb2dQYXRoKSkgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbWF0Y2hlczogW10gfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobG9nUGF0aCwgXCJ1dGYtOFwiKTtcclxuICAgICAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHBhdHRlcm4sIFwiZ2lcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpLmZpbHRlcigobGluZTogc3RyaW5nKSA9PiByZWdleC50ZXN0KGxpbmUpKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcGF0dGVybiwgY291bnQ6IG1hdGNoZXMubGVuZ3RoLCBtYXRjaGVzOiBtYXRjaGVzLnNsaWNlKDAsIDEwMCkgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0TG9nRmlsZUluZm8oKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgY29uc3QgbG9nUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsIFwibG9nc1wiLCBcInByb2plY3QubG9nXCIpO1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nUGF0aCkpIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGV4aXN0czogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhsb2dQYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZXhpc3RzOiB0cnVlLCBwYXRoOiBsb2dQYXRoLCBzaXplOiBzdGF0LnNpemUsIG1vZGlmaWVkOiBzdGF0Lm10aW1lIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVByZXZpZXcoYWN0aW9uOiBzdHJpbmcsIHdhaXRGb3JSZWFkeT86IGJvb2xlYW4sIHdhaXRUaW1lb3V0PzogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJzdG9wXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RvcFByZXZpZXcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zdGFydFByZXZpZXcoKTtcclxuICAgICAgICBpZiAod2FpdEZvclJlYWR5KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdERhdGEgPSBKU09OLnBhcnNlKHJlc3VsdC5jb250ZW50WzBdLnRleHQpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0RGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWFkeSA9IGF3YWl0IHRoaXMud2FpdEZvckdhbWVSZWFkeSh3YWl0VGltZW91dCB8fCAxNTAwMCk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHREYXRhLmdhbWVSZWFkeSA9IHJlYWR5O1xyXG4gICAgICAgICAgICAgICAgaWYgKCFyZWFkeSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdERhdGEubm90ZSA9IChyZXN1bHREYXRhLm5vdGUgfHwgXCJcIikgKyBcIiBHYW1lRGVidWdDbGllbnQgZGlkIG5vdCBjb25uZWN0IHdpdGhpbiB0aW1lb3V0LlwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdERhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyB3YWl0Rm9yR2FtZVJlYWR5KHRpbWVvdXQ6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0IDwgdGltZW91dCkge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBnYW1lIGhhcyBzZW50IGFueSBsb2cgb3IgY29tbWFuZCByZXN1bHQgcmVjZW50bHlcclxuICAgICAgICAgICAgY29uc3QgZ2FtZVJlc3VsdCA9IGdldEdhbWVMb2dzKDEpO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZVJlc3VsdC50b3RhbCA+IDApIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgNTAwKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHN0YXJ0UHJldmlldygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuc3VyZU1haW5TY2VuZU9wZW4oKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOODhOODvOODq+ODkOODvOOBrlZ1ZeOCpOODs+OCueOCv+ODs+OCuee1jOeUseOBp3BsYXkoKeOCkuWRvOOBtu+8iFVJ54q25oWL44KC5ZCM5pyf44GV44KM44KL77yJXHJcbiAgICAgICAgICAgIGNvbnN0IHBsYXllZCA9IGF3YWl0IHRoaXMuZXhlY3V0ZU9uVG9vbGJhcihcInN0YXJ0XCIpO1xyXG4gICAgICAgICAgICBpZiAocGxheWVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IFwic3RhcnRcIiwgbW9kZTogXCJlZGl0b3JcIiB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8g44OV44Kp44O844Or44OQ44OD44KvOiDnm7TmjqVBUElcclxuICAgICAgICAgICAgY29uc3QgaXNQbGF5aW5nID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZWRpdG9yLXByZXZpZXctc2V0LXBsYXlcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGlzUGxheWluZywgYWN0aW9uOiBcInN0YXJ0XCIsIG1vZGU6IFwiZWRpdG9yXCIsIG5vdGU6IFwiZGlyZWN0IEFQSSAodG9vbGJhciBVSSBtYXkgbm90IHN5bmMpXCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IGVsZWN0cm9uLnNoZWxsLm9wZW5FeHRlcm5hbChcImh0dHA6Ly8xMjcuMC4wLjE6NzQ1NlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogXCJzdGFydFwiLCBtb2RlOiBcImJyb3dzZXJcIiB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZTI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihlMi5tZXNzYWdlIHx8IFN0cmluZyhlMikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc3RvcFByZXZpZXcoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8g44OE44O844Or44OQ44O857WM55Sx44Gn5YGc5q2i77yIVUnlkIzmnJ/vvIlcclxuICAgICAgICAgICAgY29uc3Qgc3RvcHBlZCA9IGF3YWl0IHRoaXMuZXhlY3V0ZU9uVG9vbGJhcihcInN0b3BcIik7XHJcbiAgICAgICAgICAgIGlmICghc3RvcHBlZCkge1xyXG4gICAgICAgICAgICAgICAgLy8g44OV44Kp44O844Or44OQ44OD44KvOiDnm7TmjqVBUElcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImVkaXRvci1wcmV2aWV3LXNldC1wbGF5XCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBzY2VuZTpwcmV2aWV3LXN0b3Ag44OW44Ot44O844OJ44Kt44Oj44K544OI44Gn44OE44O844Or44OQ44O8VUnnirbmhYvjgpLjg6rjgrvjg4Pjg4hcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYnJvYWRjYXN0KFwic2NlbmU6cHJldmlldy1zdG9wXCIpO1xyXG4gICAgICAgICAgICAvLyDjgrfjg7zjg7Pjg5Pjg6Xjg7zjgavmiLvjgZlcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDUwMCkpO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuc3VyZU1haW5TY2VuZU9wZW4oKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYWN0aW9uOiBcInN0b3BcIiB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBleGVjdXRlT25Ub29sYmFyKGFjdGlvbjogXCJzdGFydFwiIHwgXCJzdG9wXCIpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgY29uc3QgYWxsQ29udGVudHMgPSBlbGVjdHJvbi53ZWJDb250ZW50cy5nZXRBbGxXZWJDb250ZW50cygpO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHdjIG9mIGFsbENvbnRlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBsYXkoKeOCkmF3YWl044GX44Gq44GEIOKAlCDjg5fjg6zjg5Pjg6Xjg7zlrozkuobjgpLlvoXjgaTjgajjgr/jgqTjg6DjgqLjgqbjg4jjgZnjgovjgZ/jgoFcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uID09PSBcInN0YXJ0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd2MuZXhlY3V0ZUphdmFTY3JpcHQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgKGZ1bmN0aW9uKCkgeyBpZiAod2luZG93Lnh4eCAmJiB3aW5kb3cueHh4LnBsYXkgJiYgIXdpbmRvdy54eHguZ2FtZVZpZXcuaXNQbGF5KSB7IHdpbmRvdy54eHgucGxheSgpOyByZXR1cm4gdHJ1ZTsgfSByZXR1cm4gZmFsc2U7IH0pKClgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHdjLmV4ZWN1dGVKYXZhU2NyaXB0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYChmdW5jdGlvbigpIHsgaWYgKHdpbmRvdy54eHggJiYgd2luZG93Lnh4eC5nYW1lVmlldy5pc1BsYXkpIHsgd2luZG93Lnh4eC5wbGF5KCk7IHJldHVybiB0cnVlOyB9IHJldHVybiBmYWxzZTsgfSkoKWBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7IC8qIG5vdCB0aGUgdG9vbGJhciB3ZWJDb250ZW50cyAqLyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIHsgLyogZWxlY3Ryb24gQVBJIG5vdCBhdmFpbGFibGUgKi8gfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGVuc3VyZU1haW5TY2VuZU9wZW4oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgaGllcmFyY2h5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xyXG4gICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJnZXRTY2VuZUhpZXJhcmNoeVwiLFxyXG4gICAgICAgICAgICBhcmdzOiBbZmFsc2VdLFxyXG4gICAgICAgIH0pLmNhdGNoKCgpID0+IG51bGwpO1xyXG5cclxuICAgICAgICBpZiAoIWhpZXJhcmNoeT8uc2NlbmVOYW1lIHx8IGhpZXJhcmNoeS5zY2VuZU5hbWUgPT09IFwic2NlbmUtMmRcIikge1xyXG4gICAgICAgICAgICAvLyDjg5fjg63jgrjjgqfjgq/jg4joqK3lrprjga5TdGFydCBTY2VuZeOCkuWPgueFp1xyXG4gICAgICAgICAgICBsZXQgc2NlbmVVdWlkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHNjZW5lVXVpZCA9IGF3YWl0IChFZGl0b3IgYXMgYW55KS5Qcm9maWxlLmdldENvbmZpZyhcInByZXZpZXdcIiwgXCJnZW5lcmFsLnN0YXJ0X3NjZW5lXCIsIFwibG9jYWxcIik7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxyXG5cclxuICAgICAgICAgICAgLy8gU3RhcnQgU2NlbmXjgYzmnKroqK3lrpogb3IgXCJjdXJyZW50X3NjZW5lXCIg44Gu5aC05ZCI44CB5pyA5Yid44Gu44K344O844Oz44KS5L2/44GGXHJcbiAgICAgICAgICAgIGlmICghc2NlbmVVdWlkIHx8IHNjZW5lVXVpZCA9PT0gXCJjdXJyZW50X3NjZW5lXCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjZW5lcyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0c1wiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2NUeXBlOiBcImNjLlNjZW5lQXNzZXRcIixcclxuICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBcImRiOi8vYXNzZXRzLyoqLypcIixcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NlbmVzKSAmJiBzY2VuZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjZW5lVXVpZCA9IHNjZW5lc1swXS51dWlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2NlbmVVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJvcGVuLXNjZW5lXCIsIHNjZW5lVXVpZCk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTUwMCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY2xlYXJDb2RlQ2FjaGUoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lbnUgPSBlbGVjdHJvbi5NZW51LmdldEFwcGxpY2F0aW9uTWVudSgpO1xyXG4gICAgICAgICAgICBpZiAoIW1lbnUpIHJldHVybiBlcnIoXCJBcHBsaWNhdGlvbiBtZW51IG5vdCBmb3VuZFwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbmRNZW51SXRlbSA9IChpdGVtczogYW55W10sIHBhdGg6IHN0cmluZ1tdKTogYW55ID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmxhYmVsID09PSBwYXRoWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLnN1Ym1lbnU/Lml0ZW1zKSByZXR1cm4gZmluZE1lbnVJdGVtKGl0ZW0uc3VibWVudS5pdGVtcywgcGF0aC5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjYWNoZUl0ZW0gPSBmaW5kTWVudUl0ZW0obWVudS5pdGVtcywgW1wiRGV2ZWxvcGVyXCIsIFwiQ2FjaGVcIiwgXCJDbGVhciBjb2RlIGNhY2hlXCJdKTtcclxuICAgICAgICAgICAgaWYgKCFjYWNoZUl0ZW0pIHJldHVybiBlcnIoXCJNZW51IGl0ZW0gJ0RldmVsb3BlciA+IENhY2hlID4gQ2xlYXIgY29kZSBjYWNoZScgbm90IGZvdW5kXCIpO1xyXG5cclxuICAgICAgICAgICAgY2FjaGVJdGVtLmNsaWNrKCk7XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiQ29kZSBjYWNoZSBjbGVhcmVkIHZpYSBtZW51XCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2FtZUNvbW1hbmQodHlwZTogc3RyaW5nLCBhcmdzOiBhbnksIHRpbWVvdXQ6IG51bWJlciwgbWF4V2lkdGg/OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBjb25zdCBjbWRJZCA9IHF1ZXVlR2FtZUNvbW1hbmQodHlwZSwgYXJncyk7XHJcblxyXG4gICAgICAgIC8vIFBvbGwgZm9yIHJlc3VsdFxyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0IDwgdGltZW91dCkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBnZXRDb21tYW5kUmVzdWx0KCk7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmlkID09PSBjbWRJZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgc2NyZWVuc2hvdCwgc2F2ZSB0byBmaWxlIGFuZCByZXR1cm4gcGF0aFxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwic2NyZWVuc2hvdFwiICYmIHJlc3VsdC5zdWNjZXNzICYmIHJlc3VsdC5kYXRhPy5kYXRhVXJsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJzY3JlZW5zaG90c1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCBcIi1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NCA9IHJlc3VsdC5kYXRhLmRhdGFVcmwucmVwbGFjZSgvXmRhdGE6aW1hZ2VcXC9wbmc7YmFzZTY0LC8sIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbmdCdWZmZXIgPSBCdWZmZXIuZnJvbShiYXNlNjQsIFwiYmFzZTY0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlZmZlY3RpdmVNYXhXaWR0aCA9IG1heFdpZHRoICE9PSB1bmRlZmluZWQgPyBtYXhXaWR0aCA6IDk2MDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdJbWFnZSA9IGVsZWN0cm9uLm5hdGl2ZUltYWdlLmNyZWF0ZUZyb21CdWZmZXIocG5nQnVmZmVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxTaXplID0gb3JpZ0ltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBidWZmZXIsIHdpZHRoLCBoZWlnaHQsIGZvcm1hdCB9ID0gYXdhaXQgdGhpcy5wcm9jZXNzSW1hZ2UocG5nQnVmZmVyLCBlZmZlY3RpdmVNYXhXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dCA9IGZvcm1hdCA9PT0gXCJ3ZWJwXCIgPyBcIndlYnBcIiA6IGZvcm1hdCA9PT0gXCJqcGVnXCIgPyBcImpwZ1wiIDogXCJwbmdcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBgZ2FtZV8ke3RpbWVzdGFtcH0uJHtleHR9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBwYXRoOiBmaWxlUGF0aCwgc2l6ZTogYnVmZmVyLmxlbmd0aCwgZm9ybWF0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxTaXplOiBgJHtvcmlnaW5hbFNpemUud2lkdGh9eCR7b3JpZ2luYWxTaXplLmhlaWdodH1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZWRTaXplOiBgJHt3aWR0aH14JHtoZWlnaHR9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiU2NyZWVuc2hvdCBjYXB0dXJlZCBidXQgZmlsZSBzYXZlIGZhaWxlZFwiLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAyMDApKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVycihgR2FtZSBkaWQgbm90IHJlc3BvbmQgd2l0aGluICR7dGltZW91dH1tcy4gSXMgR2FtZURlYnVnQ2xpZW50IHJ1bm5pbmcgaW4gdGhlIHByZXZpZXc/YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzSW1hZ2UocG5nQnVmZmVyOiBCdWZmZXIsIG1heFdpZHRoOiBudW1iZXIpOiBQcm9taXNlPHsgYnVmZmVyOiBCdWZmZXI7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyOyBmb3JtYXQ6IHN0cmluZyB9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgVmlwcyA9IHJlcXVpcmUoXCJ3YXNtLXZpcHNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHZpcHMgPSBhd2FpdCBWaXBzKCk7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZSA9IHZpcHMuSW1hZ2UubmV3RnJvbUJ1ZmZlcihwbmdCdWZmZXIpO1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnVyA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnSCA9IGltYWdlLmhlaWdodDtcclxuICAgICAgICAgICAgaWYgKG1heFdpZHRoID4gMCAmJiBvcmlnVyA+IG1heFdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICBpbWFnZSA9IGltYWdlLnRodW1ibmFpbEltYWdlKG1heFdpZHRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBvdXRCdWYgPSBpbWFnZS53ZWJwc2F2ZUJ1ZmZlcih7IFE6IDg1IH0pO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGJ1ZmZlcjogQnVmZmVyLmZyb20ob3V0QnVmKSwgd2lkdGg6IGltYWdlLndpZHRoLCBoZWlnaHQ6IGltYWdlLmhlaWdodCwgZm9ybWF0OiBcIndlYnBcIiB9O1xyXG4gICAgICAgICAgICBpbWFnZS5kZWxldGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IE5hdGl2ZUltYWdlIHJlc2l6ZSArIEpQRUdcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZSA9IGVsZWN0cm9uLm5hdGl2ZUltYWdlLmNyZWF0ZUZyb21CdWZmZXIocG5nQnVmZmVyKTtcclxuICAgICAgICAgICAgaWYgKG1heFdpZHRoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzaXplLndpZHRoID4gbWF4V2lkdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG1heFdpZHRoIC8gc2l6ZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZSA9IGltYWdlLnJlc2l6ZSh7IHdpZHRoOiBNYXRoLnJvdW5kKHNpemUud2lkdGggKiByYXRpbyksIGhlaWdodDogTWF0aC5yb3VuZChzaXplLmhlaWdodCAqIHJhdGlvKSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBzaXplID0gaW1hZ2UuZ2V0U2l6ZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBpbWFnZS50b0pQRUcoODUpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBidWZmZXIsIHdpZHRoOiBzaXplLndpZHRoLCBoZWlnaHQ6IHNpemUuaGVpZ2h0LCBmb3JtYXQ6IFwianBlZ1wiIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdGFrZVNjcmVlbnNob3Qoc2F2ZVBhdGg/OiBzdHJpbmcsIG1heFdpZHRoPzogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd3MgPSBlbGVjdHJvbi5Ccm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKTtcclxuICAgICAgICAgICAgaWYgKCF3aW5kb3dzIHx8IHdpbmRvd3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFwiTm8gZWRpdG9yIHdpbmRvdyBmb3VuZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBtYWluIChsYXJnZXN0KSB3aW5kb3dcclxuICAgICAgICAgICAgbGV0IHdpbiA9IHdpbmRvd3NbMF07XHJcbiAgICAgICAgICAgIGxldCBtYXhBcmVhID0gMDtcclxuICAgICAgICAgICAgZm9yIChjb25zdCB3IG9mIHdpbmRvd3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJvdW5kcyA9IHcuZ2V0Qm91bmRzKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhcmVhID0gYm91bmRzLndpZHRoICogYm91bmRzLmhlaWdodDtcclxuICAgICAgICAgICAgICAgIGlmIChhcmVhID4gbWF4QXJlYSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heEFyZWEgPSBhcmVhO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbiA9IHc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQnJpbmcgdG8gZnJvbnQgYW5kIHdhaXQgZm9yIHJlbmRlclxyXG4gICAgICAgICAgICB3aW4uc2hvdygpO1xyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMzAwKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZUltYWdlID0gYXdhaXQgd2luLndlYkNvbnRlbnRzLmNhcHR1cmVQYWdlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsU2l6ZSA9IG5hdGl2ZUltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgY29uc3QgcG5nQnVmZmVyID0gbmF0aXZlSW1hZ2UudG9QTkcoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGVmZmVjdGl2ZU1heFdpZHRoID0gbWF4V2lkdGggIT09IHVuZGVmaW5lZCA/IG1heFdpZHRoIDogOTYwO1xyXG4gICAgICAgICAgICBjb25zdCB7IGJ1ZmZlciwgd2lkdGgsIGhlaWdodCwgZm9ybWF0IH0gPSBhd2FpdCB0aGlzLnByb2Nlc3NJbWFnZShwbmdCdWZmZXIsIGVmZmVjdGl2ZU1heFdpZHRoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSBzYXZlIHBhdGhcclxuICAgICAgICAgICAgY29uc3QgZXh0ID0gZm9ybWF0ID09PSBcIndlYnBcIiA/IFwid2VicFwiIDogZm9ybWF0ID09PSBcImpwZWdcIiA/IFwianBnXCIgOiBcInBuZ1wiO1xyXG4gICAgICAgICAgICBpZiAoIXNhdmVQYXRoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcInNjcmVlbnNob3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgXCItXCIpO1xyXG4gICAgICAgICAgICAgICAgc2F2ZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBgc2NyZWVuc2hvdF8ke3RpbWVzdGFtcH0uJHtleHR9YCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2F2ZVBhdGgsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBwYXRoOiBzYXZlUGF0aCwgc2l6ZTogYnVmZmVyLmxlbmd0aCwgZm9ybWF0LFxyXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxTaXplOiBgJHtvcmlnaW5hbFNpemUud2lkdGh9eCR7b3JpZ2luYWxTaXplLmhlaWdodH1gLFxyXG4gICAgICAgICAgICAgICAgc2F2ZWRTaXplOiBgJHt3aWR0aH14JHtoZWlnaHR9YCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVsb2FkRXh0ZW5zaW9uKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIFNjaGVkdWxlIHJlbG9hZCBhZnRlciByZXNwb25zZSBpcyBzZW50XHJcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicmVsb2FkXCIsIFwiY29jb3MtY3JlYXRvci1tY3BcIik7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltNQ1BdIEV4dGVuc2lvbiByZWxvYWQgZmFpbGVkOlwiLCBlLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgNTAwKTtcclxuICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub3RlOiBcIkV4dGVuc2lvbiByZWxvYWQgc2NoZWR1bGVkLiBNQ1Agc2VydmVyIHdpbGwgcmVzdGFydCBpbiB+MXMuIE5PVEU6IEFkZGluZyBuZXcgdG9vbCBkZWZpbml0aW9ucyBvciBtb2RpZnlpbmcgc2NlbmUudHMgcmVxdWlyZXMgYSBmdWxsIENvY29zQ3JlYXRvciByZXN0YXJ0IChyZWxvYWQgaXMgbm90IHN1ZmZpY2llbnQpLlwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hTY3JlZW5zaG90KHBhZ2VzOiBzdHJpbmdbXSwgZGVsYXk6IG51bWJlciwgbWF4V2lkdGg/OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAxMDAwMDtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XHJcbiAgICAgICAgICAgIC8vIE5hdmlnYXRlXHJcbiAgICAgICAgICAgIGNvbnN0IG5hdlJlc3VsdCA9IGF3YWl0IHRoaXMuZ2FtZUNvbW1hbmQoXCJuYXZpZ2F0ZVwiLCB7IHBhZ2UgfSwgdGltZW91dCwgbWF4V2lkdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBuYXZEYXRhID0gSlNPTi5wYXJzZShuYXZSZXN1bHQuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgaWYgKCFuYXZEYXRhLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHBhZ2UsIHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJuYXZpZ2F0ZSBmYWlsZWRcIiB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBXYWl0IGZvciBwYWdlIHRvIHJlbmRlclxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgZGVsYXkpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNjcmVlbnNob3RcclxuICAgICAgICAgICAgY29uc3Qgc3NSZXN1bHQgPSBhd2FpdCB0aGlzLmdhbWVDb21tYW5kKFwic2NyZWVuc2hvdFwiLCB7fSwgdGltZW91dCwgbWF4V2lkdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBzc0RhdGEgPSBKU09OLnBhcnNlKHNzUmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBwYWdlLFxyXG4gICAgICAgICAgICAgICAgc3VjY2Vzczogc3NEYXRhLnN1Y2Nlc3MgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBzc0RhdGEucGF0aCxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBzc0RhdGEuc3VjY2VzcyA/IHVuZGVmaW5lZCA6IChzc0RhdGEuZXJyb3IgfHwgc3NEYXRhLm1lc3NhZ2UpLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1Y2NlZWRlZCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XHJcbiAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdG90YWw6IHBhZ2VzLmxlbmd0aCxcclxuICAgICAgICAgICAgc3VjY2VlZGVkLFxyXG4gICAgICAgICAgICBmYWlsZWQ6IHBhZ2VzLmxlbmd0aCAtIHN1Y2NlZWRlZCxcclxuICAgICAgICAgICAgcmVzdWx0cyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlU2NlbmUoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgdHJlZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGUtdHJlZVwiKTtcclxuICAgICAgICAgICAgY29uc3QgaXNzdWVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBjaGVja05vZGVzID0gKG5vZGVzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlcykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlLm5hbWUpIGlzc3Vlcy5wdXNoKGBOb2RlICR7bm9kZS51dWlkfSBoYXMgbm8gbmFtZWApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSBjaGVja05vZGVzKG5vZGUuY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0cmVlKSkgY2hlY2tOb2Rlcyh0cmVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaXNzdWVDb3VudDogaXNzdWVzLmxlbmd0aCwgaXNzdWVzIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=