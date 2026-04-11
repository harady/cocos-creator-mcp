"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugTools = void 0;
const tool_base_1 = require("../tool-base");
const mcp_server_1 = require("../mcp-server");
const utils_1 = require("../utils");
const scene_tools_1 = require("./scene-tools");
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
                        args: { type: "object", description: "Command arguments (e.g. {page: 'HomePageView'} for navigate, {name: 'ButtonName'} for click)" },
                        timeout: { type: "number", description: "Max wait time in ms (default 5000)" },
                        maxWidth: { type: "number", description: "Max width for screenshot resize (default: 960, 0 = no resize)" },
                        imageFormat: { type: "string", description: "Screenshot output format: 'webp' (default, Q=85) or 'png' (lossless)" },
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
                        quality: { type: "string", description: "'low'/'medium'/'high'/'ultra' (default: medium). Coefficients: 0.15/0.25/0.40/0.60" },
                        coefficient: { type: "number", description: "Custom bitrate coefficient (width × height × fps × coefficient). Overrides quality." },
                        videoBitsPerSecond: { type: "number", description: "Explicit bitrate in bps. Overrides quality-based calculation." },
                        format: { type: "string", description: "'mp4' (default) or 'webm'. mp4 falls back to webm if not supported." },
                        savePath: { type: "string", description: "Save directory (project-relative or absolute). Default: temp/recordings" },
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
                    return this.gameCommand(args.type || args.command, (0, utils_1.parseMaybeJson)(args.args), args.timeout || 5000, args.maxWidth, args.imageFormat);
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
                    return this.gameCommand("record_start", { fps: args.fps, quality: args.quality, coefficient: args.coefficient, videoBitsPerSecond: args.videoBitsPerSecond, format: args.format, savePath: args.savePath }, 5000);
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
                // debug_preview 内部の自動遷移は preview を優先して force=true
                // （dialog 出るより preview 開始を優先する運用）
                await (0, scene_tools_1.ensureSceneSafeToSwitch)(true);
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
    async gameCommand(type, args, timeout, maxWidth, imageFormat) {
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
                        const { buffer, width, height, format } = await this.processImage(pngBuffer, effectiveMaxWidth, imageFormat);
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
    async processImage(pngBuffer, maxWidth, desiredFormat) {
        try {
            const Vips = require("wasm-vips");
            const vips = await Vips();
            let image = vips.Image.newFromBuffer(pngBuffer);
            const origW = image.width;
            const origH = image.height;
            if (maxWidth > 0 && origW > maxWidth) {
                image = image.thumbnailImage(maxWidth);
            }
            // png 明示指定時は pngsave (lossless)、それ以外は webp(Q=85)
            if (desiredFormat === "png") {
                const pngOut = image.pngsaveBuffer();
                const result = { buffer: Buffer.from(pngOut), width: image.width, height: image.height, format: "png" };
                image.delete();
                return result;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWctdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvZGVidWctdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBQ3ZDLDhDQUErRjtBQUMvRixvQ0FBMEM7QUFDMUMsK0NBQXdEO0FBRXhELE1BQWEsVUFBVTtJQUF2QjtRQUNhLGlCQUFZLEdBQUcsT0FBTyxDQUFDO0lBMHdCcEMsQ0FBQztJQXh3QkcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsdUJBQXVCO2dCQUM3QixXQUFXLEVBQUUscUVBQXFFO2dCQUNsRixXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7YUFDbEQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixXQUFXLEVBQUUsMEVBQTBFO2dCQUN2RixXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHdEQUF3RCxFQUFFO3FCQUNwRztvQkFDRCxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ3ZCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsc0JBQXNCO2dCQUM1QixXQUFXLEVBQUUsa0ZBQWtGO2dCQUMvRixXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLDJCQUEyQixFQUFFO3dCQUNwRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3FCQUN2RTtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ3ZCO2FB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QUFDO0lBQ1AsQ0FBQztJQUVPLEtBQUssQ0FBQyxhQUFhO1FBQ3ZCLElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDdEUsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBQzVCLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxLQUFLO29CQUFFLE9BQU87Z0JBQ25CLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSTt3QkFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksY0FBYyxDQUFDLENBQUM7b0JBQzdELElBQUksSUFBSSxDQUFDLFFBQVE7d0JBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDakQsQ0FBQztZQUNMLENBQUMsQ0FBQztZQUNGLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLE9BQU8sSUFBQSxjQUFFLEVBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQTN3QkQsZ0NBMndCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuaW1wb3J0IHsgZ2V0R2FtZUxvZ3MsIGNsZWFyR2FtZUxvZ3MsIHF1ZXVlR2FtZUNvbW1hbmQsIGdldENvbW1hbmRSZXN1bHQgfSBmcm9tIFwiLi4vbWNwLXNlcnZlclwiO1xyXG5pbXBvcnQgeyBwYXJzZU1heWJlSnNvbiB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaCB9IGZyb20gXCIuL3NjZW5lLXRvb2xzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGVidWdUb29scyBpbXBsZW1lbnRzIFRvb2xDYXRlZ29yeSB7XHJcbiAgICByZWFkb25seSBjYXRlZ29yeU5hbWUgPSBcImRlYnVnXCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfZWRpdG9yX2luZm9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBDb2NvcyBDcmVhdG9yIGVkaXRvciBpbmZvcm1hdGlvbiAodmVyc2lvbiwgcGxhdGZvcm0sIGxhbmd1YWdlKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfbGlzdF9tZXNzYWdlc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhdmFpbGFibGUgRWRpdG9yIG1lc3NhZ2VzIGZvciBhIGdpdmVuIGV4dGVuc2lvbiBvciBidWlsdC1pbiBtb2R1bGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTWVzc2FnZSB0YXJnZXQgKGUuZy4gJ3NjZW5lJywgJ2Fzc2V0LWRiJywgJ2V4dGVuc2lvbicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ0YXJnZXRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2V4ZWN1dGVfc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFeGVjdXRlIGEgY3VzdG9tIHNjZW5lIHNjcmlwdCBtZXRob2QuIFRoZSBtZXRob2QgbXVzdCBiZSByZWdpc3RlcmVkIGluIHNjZW5lLnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk1ldGhvZCBuYW1lIGZyb20gc2NlbmUudHNcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7IHR5cGU6IFwiYXJyYXlcIiwgZGVzY3JpcHRpb246IFwiQXJndW1lbnRzIHRvIHBhc3NcIiwgaXRlbXM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibWV0aG9kXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfY29uc29sZV9sb2dzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgcmVjZW50IGNvbnNvbGUgbG9nIGVudHJpZXMuIEF1dG9tYXRpY2FsbHkgY2FwdHVyZXMgc2NlbmUgcHJvY2VzcyBsb2dzIChjb25zb2xlLmxvZy93YXJuL2Vycm9yIGluIHNjZW5lIHNjcmlwdHMpLiBHYW1lIHByZXZpZXcgbG9ncyBjYW4gYWxzbyBiZSBjYXB0dXJlZCBieSBzZW5kaW5nIFBPU1QgcmVxdWVzdHMgdG8gL2xvZyBlbmRwb2ludCDigJQgc2VlIFJFQURNRSBmb3Igc2V0dXAuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggbnVtYmVyIG9mIGVudHJpZXMgKGRlZmF1bHQgNTApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiRmlsdGVyIGJ5IGxldmVsOiAnbG9nJywgJ3dhcm4nLCBvciAnZXJyb3InXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkZpbHRlciBieSBzb3VyY2U6ICdzY2VuZScgb3IgJ2dhbWUnLiBSZXR1cm5zIGJvdGggaWYgb21pdHRlZC5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2NsZWFyX2NvbnNvbGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNsZWFyIHRoZSBlZGl0b3IgY29uc29sZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfbGlzdF9leHRlbnNpb25zXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGFsbCBpbnN0YWxsZWQgZXh0ZW5zaW9ucy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X3Byb2plY3RfbG9nc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVhZCByZWNlbnQgcHJvamVjdCBsb2cgZW50cmllcyBmcm9tIHRoZSBsb2cgZmlsZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk51bWJlciBvZiBsaW5lcyB0byByZWFkIChkZWZhdWx0IDEwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3NlYXJjaF9wcm9qZWN0X2xvZ3NcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNlYXJjaCBmb3IgYSBwYXR0ZXJuIGluIHByb2plY3QgbG9ncy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2VhcmNoIHBhdHRlcm4gKHJlZ2V4IHN1cHBvcnRlZClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhdHRlcm5cIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dldF9sb2dfZmlsZV9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHByb2plY3QgbG9nIGZpbGUgKHNpemUsIHBhdGgsIGxhc3QgbW9kaWZpZWQpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8g4pSA4pSAIOS7peS4i+OAgeaXouWtmE1DUOacquWvvuW/nOOBrkVkaXRvciBBUEkg4pSA4pSAXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcXVlcnlfZGV2aWNlc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBjb25uZWN0ZWQgZGV2aWNlcyAoZm9yIG5hdGl2ZSBkZWJ1Z2dpbmcpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19vcGVuX3VybFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiT3BlbiBhIFVSTCBpbiB0aGUgc3lzdGVtIGJyb3dzZXIgZnJvbSB0aGUgZWRpdG9yLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdXJsOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlVSTCB0byBvcGVuXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1cmxcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3ZhbGlkYXRlX3NjZW5lXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJWYWxpZGF0ZSB0aGUgY3VycmVudCBzY2VuZSBmb3IgY29tbW9uIGlzc3Vlcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2FtZV9jb21tYW5kXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZW5kIGEgY29tbWFuZCB0byB0aGUgcnVubmluZyBnYW1lIHByZXZpZXcuIFJlcXVpcmVzIEdhbWVEZWJ1Z0NsaWVudCBpbiB0aGUgZ2FtZS4gQ29tbWFuZHM6ICdzY3JlZW5zaG90JyAoY2FwdHVyZSBnYW1lIGNhbnZhcyksICdzdGF0ZScgKGR1bXAgR2FtZURiKSwgJ25hdmlnYXRlJyAoZ28gdG8gYSBwYWdlKSwgJ2NsaWNrJyAoY2xpY2sgYSBub2RlIGJ5IG5hbWUpLCAnaW5zcGVjdCcgKGdldCBydW50aW1lIG5vZGUgaW5mbzogVUlUcmFuc2Zvcm0gc2l6ZXMsIFdpZGdldCwgTGF5b3V0LCBwb3NpdGlvbikuIFJldHVybnMgdGhlIHJlc3VsdCBmcm9tIHRoZSBnYW1lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21tYW5kIHR5cGU6ICdzY3JlZW5zaG90JywgJ3N0YXRlJywgJ25hdmlnYXRlJywgJ2NsaWNrJywgJ2luc3BlY3QnXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogeyB0eXBlOiBcIm9iamVjdFwiLCBkZXNjcmlwdGlvbjogXCJDb21tYW5kIGFyZ3VtZW50cyAoZS5nLiB7cGFnZTogJ0hvbWVQYWdlVmlldyd9IGZvciBuYXZpZ2F0ZSwge25hbWU6ICdCdXR0b25OYW1lJ30gZm9yIGNsaWNrKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdhaXQgdGltZSBpbiBtcyAoZGVmYXVsdCA1MDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3aWR0aCBmb3Igc2NyZWVuc2hvdCByZXNpemUgKGRlZmF1bHQ6IDk2MCwgMCA9IG5vIHJlc2l6ZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZUZvcm1hdDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTY3JlZW5zaG90IG91dHB1dCBmb3JtYXQ6ICd3ZWJwJyAoZGVmYXVsdCwgUT04NSkgb3IgJ3BuZycgKGxvc3NsZXNzKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfc2NyZWVuc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGFrZSBhIHNjcmVlbnNob3Qgb2YgdGhlIGVkaXRvciB3aW5kb3cgYW5kIHNhdmUgdG8gYSBmaWxlLiBSZXR1cm5zIHRoZSBmaWxlIHBhdGggb2YgdGhlIHNhdmVkIFBORy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkZpbGUgcGF0aCB0byBzYXZlIHRoZSBQTkcgKGRlZmF1bHQ6IHRlbXAvc2NyZWVuc2hvdHMvc2NyZWVuc2hvdF88dGltZXN0YW1wPi5wbmcpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdpZHRoIGluIHBpeGVscyBmb3IgcmVzaXplIChkZWZhdWx0OiA5NjAsIDAgPSBubyByZXNpemUpLiBBc3BlY3QgcmF0aW8gaXMgcHJlc2VydmVkLlwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcHJldmlld1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU3RhcnQgb3Igc3RvcCB0aGUgZ2FtZSBwcmV2aWV3LiBVc2VzIFByZXZpZXcgaW4gRWRpdG9yIChhdXRvLW9wZW5zIE1haW5TY2VuZSBpZiBuZWVkZWQpLiBGYWxscyBiYWNrIHRvIGJyb3dzZXIgcHJldmlldyBpZiBlZGl0b3IgcHJldmlldyBmYWlscy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCInc3RhcnQnIChkZWZhdWx0KSBvciAnc3RvcCdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yUmVhZHk6IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIklmIHRydWUsIHdhaXQgdW50aWwgR2FtZURlYnVnQ2xpZW50IGNvbm5lY3RzIGFmdGVyIHN0YXJ0IChkZWZhdWx0OiBmYWxzZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0VGltZW91dDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggd2FpdCB0aW1lIGluIG1zIGZvciB3YWl0Rm9yUmVhZHkgKGRlZmF1bHQ6IDE1MDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfY2xlYXJfY29kZV9jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2xlYXIgdGhlIGNvZGUgY2FjaGUgKGVxdWl2YWxlbnQgdG8gRGV2ZWxvcGVyID4gQ2FjaGUgPiBDbGVhciBjb2RlIGNhY2hlKSBhbmQgc29mdC1yZWxvYWQgdGhlIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWxvYWRfZXh0ZW5zaW9uXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZWxvYWQgdGhlIE1DUCBleHRlbnNpb24gaXRzZWxmLiBVc2UgYWZ0ZXIgbnBtIHJ1biBidWlsZCB0byBhcHBseSBjb2RlIGNoYW5nZXMgd2l0aG91dCByZXN0YXJ0aW5nIENvY29zQ3JlYXRvci4gUmVzcG9uc2UgaXMgc2VudCBiZWZvcmUgcmVsb2FkIHN0YXJ0cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X2V4dGVuc2lvbl9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgYSBzcGVjaWZpYyBleHRlbnNpb24uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkV4dGVuc2lvbiBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJuYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWNvcmRfc3RhcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlN0YXJ0IHJlY29yZGluZyB0aGUgZ2FtZSBwcmV2aWV3IGNhbnZhcyB0byBhIHZpZGVvIGZpbGUuIFVzZXMgTWVkaWFSZWNvcmRlciBvbiB0aGUgZ2FtZSBzaWRlLiBCaXRyYXRlIGlzIGF1dG8tY2FsY3VsYXRlZCBmcm9tIGNhbnZhcyByZXNvbHV0aW9uIMOXIGZwcyDDlyBxdWFsaXR5IGNvZWZmaWNpZW50IHVubGVzcyB2aWRlb0JpdHNQZXJTZWNvbmQgaXMgc2V0IGV4cGxpY2l0bHkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcHM6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiRnJhbWVzIHBlciBzZWNvbmQgKGRlZmF1bHQ6IDMwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiJ2xvdycvJ21lZGl1bScvJ2hpZ2gnLyd1bHRyYScgKGRlZmF1bHQ6IG1lZGl1bSkuIENvZWZmaWNpZW50czogMC4xNS8wLjI1LzAuNDAvMC42MFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZWZmaWNpZW50OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkN1c3RvbSBiaXRyYXRlIGNvZWZmaWNpZW50ICh3aWR0aCDDlyBoZWlnaHQgw5cgZnBzIMOXIGNvZWZmaWNpZW50KS4gT3ZlcnJpZGVzIHF1YWxpdHkuXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9CaXRzUGVyU2Vjb25kOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkV4cGxpY2l0IGJpdHJhdGUgaW4gYnBzLiBPdmVycmlkZXMgcXVhbGl0eS1iYXNlZCBjYWxjdWxhdGlvbi5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiJ21wNCcgKGRlZmF1bHQpIG9yICd3ZWJtJy4gbXA0IGZhbGxzIGJhY2sgdG8gd2VibSBpZiBub3Qgc3VwcG9ydGVkLlwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlNhdmUgZGlyZWN0b3J5IChwcm9qZWN0LXJlbGF0aXZlIG9yIGFic29sdXRlKS4gRGVmYXVsdDogdGVtcC9yZWNvcmRpbmdzXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWNvcmRfc3RvcFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU3RvcCByZWNvcmRpbmcgc3RhcnRlZCBieSBkZWJ1Z19yZWNvcmRfc3RhcnQuIFJldHVybnMgdGhlIHNhdmVkIFdlYk0gZmlsZSBwYXRoIGFuZCBzaXplLiBWaWRlbyBpcyBzYXZlZCB0byBwcm9qZWN0J3MgdGVtcC9yZWNvcmRpbmdzL3JlY188ZGF0ZXRpbWU+LndlYm0uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3YWl0IHRpbWUgaW4gbXMgZm9yIGZpbGUgdXBsb2FkIChkZWZhdWx0OiAzMDAwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2JhdGNoX3NjcmVlbnNob3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk5hdmlnYXRlIHRvIG11bHRpcGxlIHBhZ2VzIGFuZCB0YWtlIGEgc2NyZWVuc2hvdCBvZiBlYWNoLiBSZXF1aXJlcyBnYW1lIHByZXZpZXcgcnVubmluZyB3aXRoIEdhbWVEZWJ1Z0NsaWVudC4gUmV0dXJucyBhbiBhcnJheSBvZiBzY3JlZW5zaG90IGZpbGUgcGF0aHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBvZiBwYWdlIG5hbWVzIHRvIHNjcmVlbnNob3QgKGUuZy4gWydIb21lUGFnZVZpZXcnLCAnU2hvcFBhZ2VWaWV3J10pXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGF5OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkRlbGF5IGluIG1zIGJldHdlZW4gbmF2aWdhdGUgYW5kIHNjcmVlbnNob3QgKGRlZmF1bHQ6IDEwMDApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdpZHRoIGZvciBzY3JlZW5zaG90IHJlc2l6ZSAoZGVmYXVsdDogOTYwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicGFnZXNcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9lZGl0b3JfaW5mb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEVkaXRvckluZm8oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19saXN0X21lc3NhZ2VzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdE1lc3NhZ2VzKGFyZ3MudGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19leGVjdXRlX3NjcmlwdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWN1dGVTY3JpcHQoYXJncy5tZXRob2QsIGFyZ3MuYXJncyB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZ2V0X2NvbnNvbGVfbG9nc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldENvbnNvbGVMb2dzKGFyZ3MuY291bnQgfHwgNTAsIGFyZ3MubGV2ZWwsIGFyZ3Muc291cmNlKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19jbGVhcl9jb25zb2xlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZChcImNvbnNvbGVcIiwgXCJjbGVhclwiKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciBzY2VuZSBwcm9jZXNzIGxvZyBidWZmZXJcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcImNsZWFyQ29uc29sZUxvZ3NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIGdhbWUgcHJldmlldyBsb2cgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJHYW1lTG9ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfbGlzdF9leHRlbnNpb25zXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdEV4dGVuc2lvbnMoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfcHJvamVjdF9sb2dzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdExvZ3MoYXJncy5saW5lcyB8fCAxMDApO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3NlYXJjaF9wcm9qZWN0X2xvZ3NcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZWFyY2hQcm9qZWN0TG9ncyhhcmdzLnBhdHRlcm4pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9sb2dfZmlsZV9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TG9nRmlsZUluZm8oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19xdWVyeV9kZXZpY2VzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImRldmljZVwiLCBcInF1ZXJ5XCIpLmNhdGNoKCgpID0+IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBkZXZpY2VzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX29wZW5fdXJsXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInByb2dyYW1cIiwgXCJvcGVuLXVybFwiLCBhcmdzLnVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXJsOiBhcmdzLnVybCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nYW1lX2NvbW1hbmRcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nYW1lQ29tbWFuZChhcmdzLnR5cGUgfHwgYXJncy5jb21tYW5kLCBwYXJzZU1heWJlSnNvbihhcmdzLmFyZ3MpLCBhcmdzLnRpbWVvdXQgfHwgNTAwMCwgYXJncy5tYXhXaWR0aCwgYXJncy5pbWFnZUZvcm1hdCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfc2NyZWVuc2hvdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRha2VTY3JlZW5zaG90KGFyZ3Muc2F2ZVBhdGgsIGFyZ3MubWF4V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3ByZXZpZXdcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVQcmV2aWV3KGFyZ3MuYWN0aW9uIHx8IFwic3RhcnRcIiwgYXJncy53YWl0Rm9yUmVhZHksIGFyZ3Mud2FpdFRpbWVvdXQgfHwgMTUwMDApO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2NsZWFyX2NvZGVfY2FjaGVcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGVhckNvZGVDYWNoZSgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3JlbG9hZF9leHRlbnNpb25cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWxvYWRFeHRlbnNpb24oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z192YWxpZGF0ZV9zY2VuZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlU2NlbmUoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfZXh0ZW5zaW9uX2luZm9cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRFeHRlbnNpb25JbmZvKGFyZ3MubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfYmF0Y2hfc2NyZWVuc2hvdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJhdGNoU2NyZWVuc2hvdChhcmdzLnBhZ2VzLCBhcmdzLmRlbGF5IHx8IDEwMDAsIGFyZ3MubWF4V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3JlY29yZF9zdGFydFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdhbWVDb21tYW5kKFwicmVjb3JkX3N0YXJ0XCIsIHsgZnBzOiBhcmdzLmZwcywgcXVhbGl0eTogYXJncy5xdWFsaXR5LCBjb2VmZmljaWVudDogYXJncy5jb2VmZmljaWVudCwgdmlkZW9CaXRzUGVyU2Vjb25kOiBhcmdzLnZpZGVvQml0c1BlclNlY29uZCwgZm9ybWF0OiBhcmdzLmZvcm1hdCwgc2F2ZVBhdGg6IGFyZ3Muc2F2ZVBhdGggfSwgNTAwMCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfcmVjb3JkX3N0b3BcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nYW1lQ29tbWFuZChcInJlY29yZF9zdG9wXCIsIHVuZGVmaW5lZCwgYXJncy50aW1lb3V0IHx8IDMwMDAwKTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0RWRpdG9ySW5mbygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICByZXR1cm4gb2soe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICB2ZXJzaW9uOiBFZGl0b3IuQXBwLnZlcnNpb24sXHJcbiAgICAgICAgICAgIHBhdGg6IEVkaXRvci5BcHAucGF0aCxcclxuICAgICAgICAgICAgaG9tZTogRWRpdG9yLkFwcC5ob21lLFxyXG4gICAgICAgICAgICBsYW5ndWFnZTogRWRpdG9yLkkxOG4/LmdldExhbmd1YWdlPy4oKSB8fCBcInVua25vd25cIixcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGxpc3RNZXNzYWdlcyh0YXJnZXQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicXVlcnktaW5mb1wiLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB0YXJnZXQsIGluZm8gfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGtub3duTWVzc2FnZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHtcclxuICAgICAgICAgICAgICAgIFwic2NlbmVcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwicXVlcnktbm9kZS10cmVlXCIsIFwiY3JlYXRlLW5vZGVcIiwgXCJyZW1vdmUtbm9kZVwiLCBcImR1cGxpY2F0ZS1ub2RlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzZXQtcHJvcGVydHlcIiwgXCJjcmVhdGUtcHJlZmFiXCIsIFwic2F2ZS1zY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJxdWVyeS1pcy1kaXJ0eVwiLCBcInF1ZXJ5LWNsYXNzZXNcIiwgXCJzb2Z0LXJlbG9hZFwiLCBcInNuYXBzaG90XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjaGFuZ2UtZ2l6bW8tdG9vbFwiLCBcInF1ZXJ5LWdpem1vLXRvb2wtbmFtZVwiLCBcImZvY3VzLWNhbWVyYS1vbi1ub2Rlc1wiLFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiYXNzZXQtZGJcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwicXVlcnktYXNzZXRzXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCBcInF1ZXJ5LWFzc2V0LW1ldGFcIixcclxuICAgICAgICAgICAgICAgICAgICBcInJlZnJlc2gtYXNzZXRcIiwgXCJzYXZlLWFzc2V0XCIsIFwiY3JlYXRlLWFzc2V0XCIsIFwiZGVsZXRlLWFzc2V0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJtb3ZlLWFzc2V0XCIsIFwiY29weS1hc3NldFwiLCBcIm9wZW4tYXNzZXRcIiwgXCJyZWltcG9ydC1hc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicXVlcnktcGF0aFwiLCBcInF1ZXJ5LXV1aWRcIiwgXCJxdWVyeS11cmxcIiwgXCJxdWVyeS1hc3NldC1kZXBlbmRzXCIsXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IGtub3duTWVzc2FnZXNbdGFyZ2V0XTtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCB0YXJnZXQsIG1lc3NhZ2VzLCBub3RlOiBcIlN0YXRpYyBsaXN0IChxdWVyeSBmYWlsZWQpXCIgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBleGVjdXRlU2NyaXB0KG1ldGhvZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogXCJjb2Nvcy1jcmVhdG9yLW1jcFwiLFxyXG4gICAgICAgICAgICBtZXRob2QsXHJcbiAgICAgICAgICAgIGFyZ3MsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRDb25zb2xlTG9ncyhjb3VudDogbnVtYmVyLCBsZXZlbD86IHN0cmluZywgc291cmNlPzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgLy8gMS4gVHJ5IEVkaXRvcidzIG5hdGl2ZSBjb25zb2xlIEFQSSBmaXJzdCAobWF5IGJlIHN1cHBvcnRlZCBpbiBmdXR1cmUgQ29jb3NDcmVhdG9yIHZlcnNpb25zKVxyXG4gICAgICAgIGlmICghc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2dzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImNvbnNvbGVcIiwgXCJxdWVyeS1sYXN0LWxvZ3NcIiwgY291bnQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobG9ncykgJiYgbG9ncy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbG9ncywgc291cmNlOiBcImVkaXRvci1hcGlcIiwgbm90ZTogXCJVc2luZyBuYXRpdmUgRWRpdG9yIGNvbnNvbGUgQVBJXCIgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBOb3Qgc3VwcG9ydGVkIGluIHRoaXMgdmVyc2lvbiDigJQgdXNlIGZhbGxiYWNrICovIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDIuIEZhbGxiYWNrOiBjb2xsZWN0IGZyb20gc2NlbmUgcHJvY2VzcyBidWZmZXIgKyBnYW1lIHByZXZpZXcgYnVmZmVyXHJcbiAgICAgICAgbGV0IHNjZW5lTG9nczogYW55W10gPSBbXTtcclxuICAgICAgICBsZXQgZ2FtZUxvZ3M6IGFueVtdID0gW107XHJcblxyXG4gICAgICAgIC8vIDJhLiBTY2VuZSBwcm9jZXNzIGxvZ3MgKGNvbnNvbGUgd3JhcHBlciBpbiBzY2VuZS50cylcclxuICAgICAgICBpZiAoIXNvdXJjZSB8fCBzb3VyY2UgPT09IFwic2NlbmVcIikge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiZ2V0Q29uc29sZUxvZ3NcIixcclxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbY291bnQgKiAyLCBsZXZlbF0sIC8vIHJlcXVlc3QgbW9yZSwgd2lsbCB0cmltIGFmdGVyIG1lcmdlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQ/LmxvZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY2VuZUxvZ3MgPSByZXN1bHQubG9ncy5tYXAoKGw6IGFueSkgPT4gKHsgLi4ubCwgc291cmNlOiBcInNjZW5lXCIgfSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogc2NlbmUgbm90IGF2YWlsYWJsZSAqLyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAyYi4gR2FtZSBwcmV2aWV3IGxvZ3MgKHJlY2VpdmVkIHZpYSBQT1NUIC9sb2cgZW5kcG9pbnQpXHJcbiAgICAgICAgaWYgKCFzb3VyY2UgfHwgc291cmNlID09PSBcImdhbWVcIikge1xyXG4gICAgICAgICAgICBjb25zdCBnYW1lUmVzdWx0ID0gZ2V0R2FtZUxvZ3MoY291bnQgKiAyLCBsZXZlbCk7XHJcbiAgICAgICAgICAgIGdhbWVMb2dzID0gZ2FtZVJlc3VsdC5sb2dzLm1hcCgobDogYW55KSA9PiAoeyAuLi5sLCBzb3VyY2U6IFwiZ2FtZVwiIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1lcmdlIGFuZCBzb3J0IGJ5IHRpbWVzdGFtcCwgdGFrZSBsYXN0IGBjb3VudGBcclxuICAgICAgICBjb25zdCBtZXJnZWQgPSBbLi4uc2NlbmVMb2dzLCAuLi5nYW1lTG9nc11cclxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEudGltZXN0YW1wLmxvY2FsZUNvbXBhcmUoYi50aW1lc3RhbXApKVxyXG4gICAgICAgICAgICAuc2xpY2UoLWNvdW50KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgbG9nczogbWVyZ2VkLFxyXG4gICAgICAgICAgICB0b3RhbDogeyBzY2VuZTogc2NlbmVMb2dzLmxlbmd0aCwgZ2FtZTogKHNvdXJjZSA9PT0gXCJzY2VuZVwiID8gMCA6IGdhbWVMb2dzLmxlbmd0aCkgfSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGxpc3RFeHRlbnNpb25zKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicXVlcnktYWxsXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBleHRlbnNpb25zOiBsaXN0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBleHRlbnNpb25zOiBbXSwgbm90ZTogXCJFeHRlbnNpb24gcXVlcnkgbm90IHN1cHBvcnRlZFwiIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEV4dGVuc2lvbkluZm8obmFtZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJleHRlbnNpb25cIiwgXCJxdWVyeS1pbmZvXCIsIG5hbWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBuYW1lLCBpbmZvIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFByb2plY3RMb2dzKGxpbmVzOiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBsb2dQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJsb2dzXCIsIFwicHJvamVjdC5sb2dcIik7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhsb2dQYXRoKSkgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbG9nczogW10sIG5vdGU6IFwiTG9nIGZpbGUgbm90IGZvdW5kXCIgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobG9nUGF0aCwgXCJ1dGYtOFwiKTtcclxuICAgICAgICAgICAgY29uc3QgYWxsTGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xyXG4gICAgICAgICAgICBjb25zdCByZWNlbnQgPSBhbGxMaW5lcy5zbGljZSgtbGluZXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBsaW5lczogcmVjZW50Lmxlbmd0aCwgbG9nczogcmVjZW50IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNlYXJjaFByb2plY3RMb2dzKHBhdHRlcm46IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvZ1BhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcImxvZ3NcIiwgXCJwcm9qZWN0LmxvZ1wiKTtcclxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGxvZ1BhdGgpKSByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBtYXRjaGVzOiBbXSB9KTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsb2dQYXRoLCBcInV0Zi04XCIpO1xyXG4gICAgICAgICAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAocGF0dGVybiwgXCJnaVwiKTtcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKChsaW5lOiBzdHJpbmcpID0+IHJlZ2V4LnRlc3QobGluZSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwYXR0ZXJuLCBjb3VudDogbWF0Y2hlcy5sZW5ndGgsIG1hdGNoZXM6IG1hdGNoZXMuc2xpY2UoMCwgMTAwKSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRMb2dGaWxlSW5mbygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBsb2dQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJsb2dzXCIsIFwicHJvamVjdC5sb2dcIik7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhsb2dQYXRoKSkgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgZXhpc3RzOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGxvZ1BhdGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBleGlzdHM6IHRydWUsIHBhdGg6IGxvZ1BhdGgsIHNpemU6IHN0YXQuc2l6ZSwgbW9kaWZpZWQ6IHN0YXQubXRpbWUgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlUHJldmlldyhhY3Rpb246IHN0cmluZywgd2FpdEZvclJlYWR5PzogYm9vbGVhbiwgd2FpdFRpbWVvdXQ/OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBpZiAoYWN0aW9uID09PSBcInN0b3BcIikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdG9wUHJldmlldygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnN0YXJ0UHJldmlldygpO1xyXG4gICAgICAgIGlmICh3YWl0Rm9yUmVhZHkpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0RGF0YSA9IEpTT04ucGFyc2UocmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHREYXRhLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWR5ID0gYXdhaXQgdGhpcy53YWl0Rm9yR2FtZVJlYWR5KHdhaXRUaW1lb3V0IHx8IDE1MDAwKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdERhdGEuZ2FtZVJlYWR5ID0gcmVhZHk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXJlYWR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0RGF0YS5ub3RlID0gKHJlc3VsdERhdGEubm90ZSB8fCBcIlwiKSArIFwiIEdhbWVEZWJ1Z0NsaWVudCBkaWQgbm90IGNvbm5lY3Qgd2l0aGluIHRpbWVvdXQuXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2socmVzdWx0RGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHdhaXRGb3JHYW1lUmVhZHkodGltZW91dDogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gc3RhcnQgPCB0aW1lb3V0KSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGdhbWUgaGFzIHNlbnQgYW55IGxvZyBvciBjb21tYW5kIHJlc3VsdCByZWNlbnRseVxyXG4gICAgICAgICAgICBjb25zdCBnYW1lUmVzdWx0ID0gZ2V0R2FtZUxvZ3MoMSk7XHJcbiAgICAgICAgICAgIGlmIChnYW1lUmVzdWx0LnRvdGFsID4gMCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCA1MDApKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc3RhcnRQcmV2aWV3KCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5zdXJlTWFpblNjZW5lT3BlbigpO1xyXG5cclxuICAgICAgICAgICAgLy8g44OE44O844Or44OQ44O844GuVnVl44Kk44Oz44K544K/44Oz44K557WM55Sx44GncGxheSgp44KS5ZG844G277yIVUnnirbmhYvjgoLlkIzmnJ/jgZXjgozjgovvvIlcclxuICAgICAgICAgICAgY29uc3QgcGxheWVkID0gYXdhaXQgdGhpcy5leGVjdXRlT25Ub29sYmFyKFwic3RhcnRcIik7XHJcbiAgICAgICAgICAgIGlmIChwbGF5ZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogXCJzdGFydFwiLCBtb2RlOiBcImVkaXRvclwiIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyDjg5Xjgqnjg7zjg6vjg5Djg4Pjgq86IOebtOaOpUFQSVxyXG4gICAgICAgICAgICBjb25zdCBpc1BsYXlpbmcgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJlZGl0b3ItcHJldmlldy1zZXQtcGxheVwiLCB0cnVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaXNQbGF5aW5nLCBhY3Rpb246IFwic3RhcnRcIiwgbW9kZTogXCJlZGl0b3JcIiwgbm90ZTogXCJkaXJlY3QgQVBJICh0b29sYmFyIFVJIG1heSBub3Qgc3luYylcIiB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgZWxlY3Ryb24uc2hlbGwub3BlbkV4dGVybmFsKFwiaHR0cDovLzEyNy4wLjAuMTo3NDU2XCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYWN0aW9uOiBcInN0YXJ0XCIsIG1vZGU6IFwiYnJvd3NlclwiIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlMjogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGUyLm1lc3NhZ2UgfHwgU3RyaW5nKGUyKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzdG9wUHJldmlldygpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyDjg4Tjg7zjg6vjg5Djg7zntYznlLHjgaflgZzmraLvvIhVSeWQjOacn++8iVxyXG4gICAgICAgICAgICBjb25zdCBzdG9wcGVkID0gYXdhaXQgdGhpcy5leGVjdXRlT25Ub29sYmFyKFwic3RvcFwiKTtcclxuICAgICAgICAgICAgaWYgKCFzdG9wcGVkKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDjg5Xjgqnjg7zjg6vjg5Djg4Pjgq86IOebtOaOpUFQSVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiZWRpdG9yLXByZXZpZXctc2V0LXBsYXlcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHNjZW5lOnByZXZpZXctc3RvcCDjg5bjg63jg7zjg4njgq3jg6Pjgrnjg4jjgafjg4Tjg7zjg6vjg5Djg7xVSeeKtuaFi+OCkuODquOCu+ODg+ODiFxyXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5icm9hZGNhc3QoXCJzY2VuZTpwcmV2aWV3LXN0b3BcIik7XHJcbiAgICAgICAgICAgIC8vIOOCt+ODvOODs+ODk+ODpeODvOOBq+aIu+OBmVxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgNTAwKSk7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5zdXJlTWFpblNjZW5lT3BlbigpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IFwic3RvcFwiIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVPblRvb2xiYXIoYWN0aW9uOiBcInN0YXJ0XCIgfCBcInN0b3BcIik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBhbGxDb250ZW50cyA9IGVsZWN0cm9uLndlYkNvbnRlbnRzLmdldEFsbFdlYkNvbnRlbnRzKCk7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3Qgd2Mgb2YgYWxsQ29udGVudHMpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcGxheSgp44KSYXdhaXTjgZfjgarjgYQg4oCUIOODl+ODrOODk+ODpeODvOWujOS6huOCkuW+heOBpOOBqOOCv+OCpOODoOOCouOCpuODiOOBmeOCi+OBn+OCgVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwic3RhcnRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3Yy5leGVjdXRlSmF2YVNjcmlwdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAoZnVuY3Rpb24oKSB7IGlmICh3aW5kb3cueHh4ICYmIHdpbmRvdy54eHgucGxheSAmJiAhd2luZG93Lnh4eC5nYW1lVmlldy5pc1BsYXkpIHsgd2luZG93Lnh4eC5wbGF5KCk7IHJldHVybiB0cnVlOyB9IHJldHVybiBmYWxzZTsgfSkoKWBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgd2MuZXhlY3V0ZUphdmFTY3JpcHQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgKGZ1bmN0aW9uKCkgeyBpZiAod2luZG93Lnh4eCAmJiB3aW5kb3cueHh4LmdhbWVWaWV3LmlzUGxheSkgeyB3aW5kb3cueHh4LnBsYXkoKTsgcmV0dXJuIHRydWU7IH0gcmV0dXJuIGZhbHNlOyB9KSgpYFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogbm90IHRoZSB0b29sYmFyIHdlYkNvbnRlbnRzICovIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggeyAvKiBlbGVjdHJvbiBBUEkgbm90IGF2YWlsYWJsZSAqLyB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZW5zdXJlTWFpblNjZW5lT3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBoaWVyYXJjaHkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgbWV0aG9kOiBcImdldFNjZW5lSGllcmFyY2h5XCIsXHJcbiAgICAgICAgICAgIGFyZ3M6IFtmYWxzZV0sXHJcbiAgICAgICAgfSkuY2F0Y2goKCkgPT4gbnVsbCk7XHJcblxyXG4gICAgICAgIGlmICghaGllcmFyY2h5Py5zY2VuZU5hbWUgfHwgaGllcmFyY2h5LnNjZW5lTmFtZSA9PT0gXCJzY2VuZS0yZFwiKSB7XHJcbiAgICAgICAgICAgIC8vIOODl+ODreOCuOOCp+OCr+ODiOioreWumuOBrlN0YXJ0IFNjZW5l44KS5Y+C54WnXHJcbiAgICAgICAgICAgIGxldCBzY2VuZVV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgc2NlbmVVdWlkID0gYXdhaXQgKEVkaXRvciBhcyBhbnkpLlByb2ZpbGUuZ2V0Q29uZmlnKFwicHJldmlld1wiLCBcImdlbmVyYWwuc3RhcnRfc2NlbmVcIiwgXCJsb2NhbFwiKTtcclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcblxyXG4gICAgICAgICAgICAvLyBTdGFydCBTY2VuZeOBjOacquioreWumiBvciBcImN1cnJlbnRfc2NlbmVcIiDjga7loLTlkIjjgIHmnIDliJ3jga7jgrfjg7zjg7PjgpLkvb/jgYZcclxuICAgICAgICAgICAgaWYgKCFzY2VuZVV1aWQgfHwgc2NlbmVVdWlkID09PSBcImN1cnJlbnRfc2NlbmVcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICBjY1R5cGU6IFwiY2MuU2NlbmVBc3NldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IFwiZGI6Ly9hc3NldHMvKiovKlwiLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2VuZXMpICYmIHNjZW5lcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NlbmVVdWlkID0gc2NlbmVzWzBdLnV1aWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzY2VuZVV1aWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGRlYnVnX3ByZXZpZXcg5YaF6YOo44Gu6Ieq5YuV6YG356e744GvIHByZXZpZXcg44KS5YSq5YWI44GX44GmIGZvcmNlPXRydWVcclxuICAgICAgICAgICAgICAgIC8vIO+8iGRpYWxvZyDlh7rjgovjgojjgoogcHJldmlldyDplovlp4vjgpLlhKrlhYjjgZnjgovpgYvnlKjvvIlcclxuICAgICAgICAgICAgICAgIGF3YWl0IGVuc3VyZVNjZW5lU2FmZVRvU3dpdGNoKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwib3Blbi1zY2VuZVwiLCBzY2VuZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDE1MDApKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNsZWFyQ29kZUNhY2hlKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBtZW51ID0gZWxlY3Ryb24uTWVudS5nZXRBcHBsaWNhdGlvbk1lbnUoKTtcclxuICAgICAgICAgICAgaWYgKCFtZW51KSByZXR1cm4gZXJyKFwiQXBwbGljYXRpb24gbWVudSBub3QgZm91bmRcIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmaW5kTWVudUl0ZW0gPSAoaXRlbXM6IGFueVtdLCBwYXRoOiBzdHJpbmdbXSk6IGFueSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5sYWJlbCA9PT0gcGF0aFswXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPT09IDEpIHJldHVybiBpdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5zdWJtZW51Py5pdGVtcykgcmV0dXJuIGZpbmRNZW51SXRlbShpdGVtLnN1Ym1lbnUuaXRlbXMsIHBhdGguc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY2FjaGVJdGVtID0gZmluZE1lbnVJdGVtKG1lbnUuaXRlbXMsIFtcIkRldmVsb3BlclwiLCBcIkNhY2hlXCIsIFwiQ2xlYXIgY29kZSBjYWNoZVwiXSk7XHJcbiAgICAgICAgICAgIGlmICghY2FjaGVJdGVtKSByZXR1cm4gZXJyKFwiTWVudSBpdGVtICdEZXZlbG9wZXIgPiBDYWNoZSA+IENsZWFyIGNvZGUgY2FjaGUnIG5vdCBmb3VuZFwiKTtcclxuXHJcbiAgICAgICAgICAgIGNhY2hlSXRlbS5jbGljaygpO1xyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMCkpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub3RlOiBcIkNvZGUgY2FjaGUgY2xlYXJlZCB2aWEgbWVudVwiIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdhbWVDb21tYW5kKHR5cGU6IHN0cmluZywgYXJnczogYW55LCB0aW1lb3V0OiBudW1iZXIsIG1heFdpZHRoPzogbnVtYmVyLCBpbWFnZUZvcm1hdD86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGNvbnN0IGNtZElkID0gcXVldWVHYW1lQ29tbWFuZCh0eXBlLCBhcmdzKTtcclxuXHJcbiAgICAgICAgLy8gUG9sbCBmb3IgcmVzdWx0XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gc3RhcnQgPCB0aW1lb3V0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGdldENvbW1hbmRSZXN1bHQoKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaWQgPT09IGNtZElkKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBzY3JlZW5zaG90LCBzYXZlIHRvIGZpbGUgYW5kIHJldHVybiBwYXRoXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJzY3JlZW5zaG90XCIgJiYgcmVzdWx0LnN1Y2Nlc3MgJiYgcmVzdWx0LmRhdGE/LmRhdGFVcmwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcInNjcmVlbnNob3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csIFwiLVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZTY0ID0gcmVzdWx0LmRhdGEuZGF0YVVybC5yZXBsYWNlKC9eZGF0YTppbWFnZVxcL3BuZztiYXNlNjQsLywgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBuZ0J1ZmZlciA9IEJ1ZmZlci5mcm9tKGJhc2U2NCwgXCJiYXNlNjRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVmZmVjdGl2ZU1heFdpZHRoID0gbWF4V2lkdGggIT09IHVuZGVmaW5lZCA/IG1heFdpZHRoIDogOTYwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3JpZ0ltYWdlID0gZWxlY3Ryb24ubmF0aXZlSW1hZ2UuY3JlYXRlRnJvbUJ1ZmZlcihwbmdCdWZmZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5hbFNpemUgPSBvcmlnSW1hZ2UuZ2V0U2l6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGJ1ZmZlciwgd2lkdGgsIGhlaWdodCwgZm9ybWF0IH0gPSBhd2FpdCB0aGlzLnByb2Nlc3NJbWFnZShwbmdCdWZmZXIsIGVmZmVjdGl2ZU1heFdpZHRoLCBpbWFnZUZvcm1hdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dCA9IGZvcm1hdCA9PT0gXCJ3ZWJwXCIgPyBcIndlYnBcIiA6IGZvcm1hdCA9PT0gXCJqcGVnXCIgPyBcImpwZ1wiIDogXCJwbmdcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBgZ2FtZV8ke3RpbWVzdGFtcH0uJHtleHR9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBwYXRoOiBmaWxlUGF0aCwgc2l6ZTogYnVmZmVyLmxlbmd0aCwgZm9ybWF0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxTaXplOiBgJHtvcmlnaW5hbFNpemUud2lkdGh9eCR7b3JpZ2luYWxTaXplLmhlaWdodH1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZWRTaXplOiBgJHt3aWR0aH14JHtoZWlnaHR9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiU2NyZWVuc2hvdCBjYXB0dXJlZCBidXQgZmlsZSBzYXZlIGZhaWxlZFwiLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAyMDApKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVycihgR2FtZSBkaWQgbm90IHJlc3BvbmQgd2l0aGluICR7dGltZW91dH1tcy4gSXMgR2FtZURlYnVnQ2xpZW50IHJ1bm5pbmcgaW4gdGhlIHByZXZpZXc/YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzSW1hZ2UocG5nQnVmZmVyOiBCdWZmZXIsIG1heFdpZHRoOiBudW1iZXIsIGRlc2lyZWRGb3JtYXQ/OiBzdHJpbmcpOiBQcm9taXNlPHsgYnVmZmVyOiBCdWZmZXI7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyOyBmb3JtYXQ6IHN0cmluZyB9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgVmlwcyA9IHJlcXVpcmUoXCJ3YXNtLXZpcHNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHZpcHMgPSBhd2FpdCBWaXBzKCk7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZSA9IHZpcHMuSW1hZ2UubmV3RnJvbUJ1ZmZlcihwbmdCdWZmZXIpO1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnVyA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnSCA9IGltYWdlLmhlaWdodDtcclxuICAgICAgICAgICAgaWYgKG1heFdpZHRoID4gMCAmJiBvcmlnVyA+IG1heFdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICBpbWFnZSA9IGltYWdlLnRodW1ibmFpbEltYWdlKG1heFdpZHRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBwbmcg5piO56S65oyH5a6a5pmC44GvIHBuZ3NhdmUgKGxvc3NsZXNzKeOAgeOBneOCjOS7peWkluOBryB3ZWJwKFE9ODUpXHJcbiAgICAgICAgICAgIGlmIChkZXNpcmVkRm9ybWF0ID09PSBcInBuZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwbmdPdXQgPSBpbWFnZS5wbmdzYXZlQnVmZmVyKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGJ1ZmZlcjogQnVmZmVyLmZyb20ocG5nT3V0KSwgd2lkdGg6IGltYWdlLndpZHRoLCBoZWlnaHQ6IGltYWdlLmhlaWdodCwgZm9ybWF0OiBcInBuZ1wiIH07XHJcbiAgICAgICAgICAgICAgICBpbWFnZS5kZWxldGUoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3Qgb3V0QnVmID0gaW1hZ2Uud2VicHNhdmVCdWZmZXIoeyBROiA4NSB9KTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBidWZmZXI6IEJ1ZmZlci5mcm9tKG91dEJ1ZiksIHdpZHRoOiBpbWFnZS53aWR0aCwgaGVpZ2h0OiBpbWFnZS5oZWlnaHQsIGZvcm1hdDogXCJ3ZWJwXCIgfTtcclxuICAgICAgICAgICAgaW1hZ2UuZGVsZXRlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBOYXRpdmVJbWFnZSByZXNpemUgKyBKUEVHXHJcbiAgICAgICAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICBsZXQgaW1hZ2UgPSBlbGVjdHJvbi5uYXRpdmVJbWFnZS5jcmVhdGVGcm9tQnVmZmVyKHBuZ0J1ZmZlcik7XHJcbiAgICAgICAgICAgIGlmIChtYXhXaWR0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSBpbWFnZS5nZXRTaXplKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZS53aWR0aCA+IG1heFdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBtYXhXaWR0aCAvIHNpemUud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UgPSBpbWFnZS5yZXNpemUoeyB3aWR0aDogTWF0aC5yb3VuZChzaXplLndpZHRoICogcmF0aW8pLCBoZWlnaHQ6IE1hdGgucm91bmQoc2l6ZS5oZWlnaHQgKiByYXRpbykgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gaW1hZ2UudG9KUEVHKDg1KTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgYnVmZmVyLCB3aWR0aDogc2l6ZS53aWR0aCwgaGVpZ2h0OiBzaXplLmhlaWdodCwgZm9ybWF0OiBcImpwZWdcIiB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHRha2VTY3JlZW5zaG90KHNhdmVQYXRoPzogc3RyaW5nLCBtYXhXaWR0aD86IG51bWJlcik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dzID0gZWxlY3Ryb24uQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCk7XHJcbiAgICAgICAgICAgIGlmICghd2luZG93cyB8fCB3aW5kb3dzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcIk5vIGVkaXRvciB3aW5kb3cgZm91bmRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRmluZCB0aGUgbWFpbiAobGFyZ2VzdCkgd2luZG93XHJcbiAgICAgICAgICAgIGxldCB3aW4gPSB3aW5kb3dzWzBdO1xyXG4gICAgICAgICAgICBsZXQgbWF4QXJlYSA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgdyBvZiB3aW5kb3dzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBib3VuZHMgPSB3LmdldEJvdW5kcygpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXJlYSA9IGJvdW5kcy53aWR0aCAqIGJvdW5kcy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJlYSA+IG1heEFyZWEpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXhBcmVhID0gYXJlYTtcclxuICAgICAgICAgICAgICAgICAgICB3aW4gPSB3O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEJyaW5nIHRvIGZyb250IGFuZCB3YWl0IGZvciByZW5kZXJcclxuICAgICAgICAgICAgd2luLnNob3coKTtcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDMwMCkpO1xyXG4gICAgICAgICAgICBjb25zdCBuYXRpdmVJbWFnZSA9IGF3YWl0IHdpbi53ZWJDb250ZW50cy5jYXB0dXJlUGFnZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbFNpemUgPSBuYXRpdmVJbWFnZS5nZXRTaXplKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBuZ0J1ZmZlciA9IG5hdGl2ZUltYWdlLnRvUE5HKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBlZmZlY3RpdmVNYXhXaWR0aCA9IG1heFdpZHRoICE9PSB1bmRlZmluZWQgPyBtYXhXaWR0aCA6IDk2MDtcclxuICAgICAgICAgICAgY29uc3QgeyBidWZmZXIsIHdpZHRoLCBoZWlnaHQsIGZvcm1hdCB9ID0gYXdhaXQgdGhpcy5wcm9jZXNzSW1hZ2UocG5nQnVmZmVyLCBlZmZlY3RpdmVNYXhXaWR0aCk7XHJcblxyXG4gICAgICAgICAgICAvLyBEZXRlcm1pbmUgc2F2ZSBwYXRoXHJcbiAgICAgICAgICAgIGNvbnN0IGV4dCA9IGZvcm1hdCA9PT0gXCJ3ZWJwXCIgPyBcIndlYnBcIiA6IGZvcm1hdCA9PT0gXCJqcGVnXCIgPyBcImpwZ1wiIDogXCJwbmdcIjtcclxuICAgICAgICAgICAgaWYgKCFzYXZlUGF0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnRtcERpciwgXCJzY3JlZW5zaG90c1wiKTtcclxuICAgICAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5yZXBsYWNlKC9bOi5dL2csIFwiLVwiKTtcclxuICAgICAgICAgICAgICAgIHNhdmVQYXRoID0gcGF0aC5qb2luKGRpciwgYHNjcmVlbnNob3RfJHt0aW1lc3RhbXB9LiR7ZXh0fWApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHNhdmVQYXRoLCBidWZmZXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgcGF0aDogc2F2ZVBhdGgsIHNpemU6IGJ1ZmZlci5sZW5ndGgsIGZvcm1hdCxcclxuICAgICAgICAgICAgICAgIG9yaWdpbmFsU2l6ZTogYCR7b3JpZ2luYWxTaXplLndpZHRofXgke29yaWdpbmFsU2l6ZS5oZWlnaHR9YCxcclxuICAgICAgICAgICAgICAgIHNhdmVkU2l6ZTogYCR7d2lkdGh9eCR7aGVpZ2h0fWAsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJlbG9hZEV4dGVuc2lvbigpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICAvLyBTY2hlZHVsZSByZWxvYWQgYWZ0ZXIgcmVzcG9uc2UgaXMgc2VudFxyXG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImV4dGVuc2lvblwiLCBcInJlbG9hZFwiLCBcImNvY29zLWNyZWF0b3ItbWNwXCIpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbTUNQXSBFeHRlbnNpb24gcmVsb2FkIGZhaWxlZDpcIiwgZS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDUwMCk7XHJcbiAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm90ZTogXCJFeHRlbnNpb24gcmVsb2FkIHNjaGVkdWxlZC4gTUNQIHNlcnZlciB3aWxsIHJlc3RhcnQgaW4gfjFzLiBOT1RFOiBBZGRpbmcgbmV3IHRvb2wgZGVmaW5pdGlvbnMgb3IgbW9kaWZ5aW5nIHNjZW5lLnRzIHJlcXVpcmVzIGEgZnVsbCBDb2Nvc0NyZWF0b3IgcmVzdGFydCAocmVsb2FkIGlzIG5vdCBzdWZmaWNpZW50KS5cIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGJhdGNoU2NyZWVuc2hvdChwYWdlczogc3RyaW5nW10sIGRlbGF5OiBudW1iZXIsIG1heFdpZHRoPzogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcclxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gMTAwMDA7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xyXG4gICAgICAgICAgICAvLyBOYXZpZ2F0ZVxyXG4gICAgICAgICAgICBjb25zdCBuYXZSZXN1bHQgPSBhd2FpdCB0aGlzLmdhbWVDb21tYW5kKFwibmF2aWdhdGVcIiwgeyBwYWdlIH0sIHRpbWVvdXQsIG1heFdpZHRoKTtcclxuICAgICAgICAgICAgY29uc3QgbmF2RGF0YSA9IEpTT04ucGFyc2UobmF2UmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XHJcbiAgICAgICAgICAgIGlmICghbmF2RGF0YS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goeyBwYWdlLCBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFwibmF2aWdhdGUgZmFpbGVkXCIgfSk7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gV2FpdCBmb3IgcGFnZSB0byByZW5kZXJcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIGRlbGF5KSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTY3JlZW5zaG90XHJcbiAgICAgICAgICAgIGNvbnN0IHNzUmVzdWx0ID0gYXdhaXQgdGhpcy5nYW1lQ29tbWFuZChcInNjcmVlbnNob3RcIiwge30sIHRpbWVvdXQsIG1heFdpZHRoKTtcclxuICAgICAgICAgICAgY29uc3Qgc3NEYXRhID0gSlNPTi5wYXJzZShzc1Jlc3VsdC5jb250ZW50WzBdLnRleHQpO1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgcGFnZSxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHNzRGF0YS5zdWNjZXNzIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogc3NEYXRhLnBhdGgsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogc3NEYXRhLnN1Y2Nlc3MgPyB1bmRlZmluZWQgOiAoc3NEYXRhLmVycm9yIHx8IHNzRGF0YS5tZXNzYWdlKSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzdWNjZWVkZWQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xyXG4gICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIHRvdGFsOiBwYWdlcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHN1Y2NlZWRlZCxcclxuICAgICAgICAgICAgZmFpbGVkOiBwYWdlcy5sZW5ndGggLSBzdWNjZWVkZWQsXHJcbiAgICAgICAgICAgIHJlc3VsdHMsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZVNjZW5lKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlLXRyZWVcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICAgICAgY29uc3QgY2hlY2tOb2RlcyA9IChub2RlczogYW55W10pID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghbm9kZXMpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbm9kZS5uYW1lKSBpc3N1ZXMucHVzaChgTm9kZSAke25vZGUudXVpZH0gaGFzIG5vIG5hbWVgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikgY2hlY2tOb2Rlcyhub2RlLmNoaWxkcmVuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodHJlZSkpIGNoZWNrTm9kZXModHJlZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGlzc3VlQ291bnQ6IGlzc3Vlcy5sZW5ndGgsIGlzc3VlcyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19