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
            {
                name: "debug_wait_compile",
                description: "Wait for TypeScript compilation to complete. Monitors the packer-driver debug log for 'Target(editor) ends' message. Use after modifying .ts files to ensure changes are compiled before operating on Prefabs. With clean=true, deletes compiled output first to force a fresh recompile (slower but guaranteed).",
                inputSchema: {
                    type: "object",
                    properties: {
                        timeout: { type: "number", description: "Max wait time in ms (default: 15000)" },
                        clean: { type: "boolean", description: "If true, delete compiled output first to force fresh recompile (default: false)" },
                    },
                },
            },
        ];
    }
    async execute(toolName, args) {
        var _a;
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
                case "debug_wait_compile":
                    return this.waitCompile(args.timeout || 15000, (_a = args.clean) !== null && _a !== void 0 ? _a : false);
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
    /**
     * TypeScript コンパイル完了を待つ。
     * packer-driver の debug.log に "Target(editor) ends" が現れるのを監視する。
     * 既にコンパイル済み（直近数秒以内に完了ログあり）なら即座に返す。
     */
    async waitCompile(timeout, clean) {
        try {
            const fs = require("fs");
            const path = require("path");
            const logPath = path.join(Editor.Project.path, "temp", "programming", "packer-driver", "logs", "debug.log");
            const chunksDir = path.join(Editor.Project.path, "temp", "programming", "packer-driver", "targets", "editor", "chunks");
            if (!fs.existsSync(logPath)) {
                return (0, tool_base_1.err)(`Compile log not found: ${logPath}`);
            }
            const MARKER = "Target(editor) ends";
            // clean モード: コードキャッシュクリア + soft-reload で再コンパイルを強制
            if (clean) {
                // Developer > Cache > Clear code cache をクリック
                try {
                    const electron = require("electron");
                    const menu = electron.Menu.getApplicationMenu();
                    const findMenuItem = (items, labels) => {
                        var _a;
                        for (const item of items) {
                            if (item.label === labels[0]) {
                                if (labels.length === 1)
                                    return item;
                                if ((_a = item.submenu) === null || _a === void 0 ? void 0 : _a.items)
                                    return findMenuItem(item.submenu.items, labels.slice(1));
                            }
                        }
                        return null;
                    };
                    const cacheItem = menu ? findMenuItem(menu.items, ["Developer", "Cache", "Clear code cache"]) : null;
                    if (cacheItem)
                        cacheItem.click();
                }
                catch (_e) { /* ignore */ }
                await new Promise(r => setTimeout(r, 500));
                // soft-reload でシーンを再読み込み → コンパイルトリガー
                await Editor.Message.request("scene", "soft-reload").catch(() => { });
            }
            // refresh-asset でファイル変更を CC に通知してコンパイルをトリガー
            await Editor.Message.request("asset-db", "refresh-asset", "db://assets").catch(() => { });
            const initialSize = fs.statSync(logPath).size;
            const startTime = Date.now();
            const POLL_INTERVAL = 200;
            const DETECT_GRACE_MS = 2000; // CC がファイル変更を検知するまでの猶予
            while (Date.now() - startTime < timeout) {
                await new Promise(r => setTimeout(r, POLL_INTERVAL));
                const currentSize = fs.statSync(logPath).size;
                // ログが成長していない
                if (currentSize <= initialSize) {
                    // clean モードでは必ずコンパイルが走るので猶予判定しない
                    if (clean)
                        continue;
                    // 猶予期間内はまだ待つ (CC の検知が遅い可能性)
                    if (Date.now() - startTime < DETECT_GRACE_MS)
                        continue;
                    // 猶予期間を過ぎてもログが成長しない → コンパイル不要
                    return (0, tool_base_1.ok)({ success: true, compiled: true, waitedMs: Date.now() - startTime, note: "No compilation triggered (no changes detected)" });
                }
                // ログが成長した → 新しい部分にマーカーがあるか確認
                const fd = fs.openSync(logPath, "r");
                const newBytes = currentSize - initialSize;
                const buffer = Buffer.alloc(newBytes);
                fs.readSync(fd, buffer, 0, newBytes, initialSize);
                fs.closeSync(fd);
                const newContent = buffer.toString("utf8");
                if (newContent.includes(MARKER)) {
                    return (0, tool_base_1.ok)({ success: true, compiled: true, waitedMs: Date.now() - startTime });
                }
            }
            return (0, tool_base_1.ok)({ success: true, compiled: false, timeout: true, waitedMs: timeout });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
}
exports.DebugTools = DebugTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWctdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvZGVidWctdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBQ3ZDLDhDQUErRjtBQUMvRixvQ0FBMEM7QUFDMUMsK0NBQXdEO0FBRXhELE1BQWEsVUFBVTtJQUF2QjtRQUNhLGlCQUFZLEdBQUcsT0FBTyxDQUFDO0lBMDJCcEMsQ0FBQztJQXgyQkcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsdUJBQXVCO2dCQUM3QixXQUFXLEVBQUUscUVBQXFFO2dCQUNsRixXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7YUFDbEQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixXQUFXLEVBQUUsMEVBQTBFO2dCQUN2RixXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHdEQUF3RCxFQUFFO3FCQUNwRztvQkFDRCxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ3ZCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsc0JBQXNCO2dCQUM1QixXQUFXLEVBQUUsa0ZBQWtGO2dCQUMvRixXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLDJCQUEyQixFQUFFO3dCQUNwRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3FCQUN2RTtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ3ZCO2FB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IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuaW1wb3J0IHsgZ2V0R2FtZUxvZ3MsIGNsZWFyR2FtZUxvZ3MsIHF1ZXVlR2FtZUNvbW1hbmQsIGdldENvbW1hbmRSZXN1bHQgfSBmcm9tIFwiLi4vbWNwLXNlcnZlclwiO1xyXG5pbXBvcnQgeyBwYXJzZU1heWJlSnNvbiB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaCB9IGZyb20gXCIuL3NjZW5lLXRvb2xzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGVidWdUb29scyBpbXBsZW1lbnRzIFRvb2xDYXRlZ29yeSB7XHJcbiAgICByZWFkb25seSBjYXRlZ29yeU5hbWUgPSBcImRlYnVnXCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfZWRpdG9yX2luZm9cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBDb2NvcyBDcmVhdG9yIGVkaXRvciBpbmZvcm1hdGlvbiAodmVyc2lvbiwgcGxhdGZvcm0sIGxhbmd1YWdlKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfbGlzdF9tZXNzYWdlc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhdmFpbGFibGUgRWRpdG9yIG1lc3NhZ2VzIGZvciBhIGdpdmVuIGV4dGVuc2lvbiBvciBidWlsdC1pbiBtb2R1bGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTWVzc2FnZSB0YXJnZXQgKGUuZy4gJ3NjZW5lJywgJ2Fzc2V0LWRiJywgJ2V4dGVuc2lvbicpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ0YXJnZXRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2V4ZWN1dGVfc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFeGVjdXRlIGEgY3VzdG9tIHNjZW5lIHNjcmlwdCBtZXRob2QuIFRoZSBtZXRob2QgbXVzdCBiZSByZWdpc3RlcmVkIGluIHNjZW5lLnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk1ldGhvZCBuYW1lIGZyb20gc2NlbmUudHNcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7IHR5cGU6IFwiYXJyYXlcIiwgZGVzY3JpcHRpb246IFwiQXJndW1lbnRzIHRvIHBhc3NcIiwgaXRlbXM6IHt9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wibWV0aG9kXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19nZXRfY29uc29sZV9sb2dzXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgcmVjZW50IGNvbnNvbGUgbG9nIGVudHJpZXMuIEF1dG9tYXRpY2FsbHkgY2FwdHVyZXMgc2NlbmUgcHJvY2VzcyBsb2dzIChjb25zb2xlLmxvZy93YXJuL2Vycm9yIGluIHNjZW5lIHNjcmlwdHMpLiBHYW1lIHByZXZpZXcgbG9ncyBjYW4gYWxzbyBiZSBjYXB0dXJlZCBieSBzZW5kaW5nIFBPU1QgcmVxdWVzdHMgdG8gL2xvZyBlbmRwb2ludCDigJQgc2VlIFJFQURNRSBmb3Igc2V0dXAuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggbnVtYmVyIG9mIGVudHJpZXMgKGRlZmF1bHQgNTApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiRmlsdGVyIGJ5IGxldmVsOiAnbG9nJywgJ3dhcm4nLCBvciAnZXJyb3InXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkZpbHRlciBieSBzb3VyY2U6ICdzY2VuZScgb3IgJ2dhbWUnLiBSZXR1cm5zIGJvdGggaWYgb21pdHRlZC5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2NsZWFyX2NvbnNvbGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNsZWFyIHRoZSBlZGl0b3IgY29uc29sZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfbGlzdF9leHRlbnNpb25zXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGFsbCBpbnN0YWxsZWQgZXh0ZW5zaW9ucy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X3Byb2plY3RfbG9nc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVhZCByZWNlbnQgcHJvamVjdCBsb2cgZW50cmllcyBmcm9tIHRoZSBsb2cgZmlsZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk51bWJlciBvZiBsaW5lcyB0byByZWFkIChkZWZhdWx0IDEwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3NlYXJjaF9wcm9qZWN0X2xvZ3NcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNlYXJjaCBmb3IgYSBwYXR0ZXJuIGluIHByb2plY3QgbG9ncy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2VhcmNoIHBhdHRlcm4gKHJlZ2V4IHN1cHBvcnRlZClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBhdHRlcm5cIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dldF9sb2dfZmlsZV9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHByb2plY3QgbG9nIGZpbGUgKHNpemUsIHBhdGgsIGxhc3QgbW9kaWZpZWQpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8g4pSA4pSAIOS7peS4i+OAgeaXouWtmE1DUOacquWvvuW/nOOBrkVkaXRvciBBUEkg4pSA4pSAXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcXVlcnlfZGV2aWNlc1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBjb25uZWN0ZWQgZGV2aWNlcyAoZm9yIG5hdGl2ZSBkZWJ1Z2dpbmcpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19vcGVuX3VybFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiT3BlbiBhIFVSTCBpbiB0aGUgc3lzdGVtIGJyb3dzZXIgZnJvbSB0aGUgZWRpdG9yLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHsgdXJsOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlVSTCB0byBvcGVuXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1cmxcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3ZhbGlkYXRlX3NjZW5lXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJWYWxpZGF0ZSB0aGUgY3VycmVudCBzY2VuZSBmb3IgY29tbW9uIGlzc3Vlcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2FtZV9jb21tYW5kXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZW5kIGEgY29tbWFuZCB0byB0aGUgcnVubmluZyBnYW1lIHByZXZpZXcuIFJlcXVpcmVzIEdhbWVEZWJ1Z0NsaWVudCBpbiB0aGUgZ2FtZS4gQ29tbWFuZHM6ICdzY3JlZW5zaG90JyAoY2FwdHVyZSBnYW1lIGNhbnZhcyksICdzdGF0ZScgKGR1bXAgR2FtZURiKSwgJ25hdmlnYXRlJyAoZ28gdG8gYSBwYWdlKSwgJ2NsaWNrJyAoY2xpY2sgYSBub2RlIGJ5IG5hbWUpLCAnaW5zcGVjdCcgKGdldCBydW50aW1lIG5vZGUgaW5mbzogVUlUcmFuc2Zvcm0gc2l6ZXMsIFdpZGdldCwgTGF5b3V0LCBwb3NpdGlvbikuIFJldHVybnMgdGhlIHJlc3VsdCBmcm9tIHRoZSBnYW1lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJDb21tYW5kIHR5cGU6ICdzY3JlZW5zaG90JywgJ3N0YXRlJywgJ25hdmlnYXRlJywgJ2NsaWNrJywgJ2luc3BlY3QnXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogeyB0eXBlOiBcIm9iamVjdFwiLCBkZXNjcmlwdGlvbjogXCJDb21tYW5kIGFyZ3VtZW50cyAoZS5nLiB7cGFnZTogJ0hvbWVQYWdlVmlldyd9IGZvciBuYXZpZ2F0ZSwge25hbWU6ICdCdXR0b25OYW1lJ30gZm9yIGNsaWNrKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdhaXQgdGltZSBpbiBtcyAoZGVmYXVsdCA1MDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3aWR0aCBmb3Igc2NyZWVuc2hvdCByZXNpemUgKGRlZmF1bHQ6IDk2MCwgMCA9IG5vIHJlc2l6ZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZUZvcm1hdDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTY3JlZW5zaG90IG91dHB1dCBmb3JtYXQ6ICd3ZWJwJyAoZGVmYXVsdCwgUT04NSkgb3IgJ3BuZycgKGxvc3NsZXNzKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widHlwZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfc2NyZWVuc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGFrZSBhIHNjcmVlbnNob3Qgb2YgdGhlIGVkaXRvciB3aW5kb3cgYW5kIHNhdmUgdG8gYSBmaWxlLiBSZXR1cm5zIHRoZSBmaWxlIHBhdGggb2YgdGhlIHNhdmVkIFBORy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkZpbGUgcGF0aCB0byBzYXZlIHRoZSBQTkcgKGRlZmF1bHQ6IHRlbXAvc2NyZWVuc2hvdHMvc2NyZWVuc2hvdF88dGltZXN0YW1wPi5wbmcpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdpZHRoIGluIHBpeGVscyBmb3IgcmVzaXplIChkZWZhdWx0OiA5NjAsIDAgPSBubyByZXNpemUpLiBBc3BlY3QgcmF0aW8gaXMgcHJlc2VydmVkLlwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfcHJldmlld1wiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU3RhcnQgb3Igc3RvcCB0aGUgZ2FtZSBwcmV2aWV3LiBVc2VzIFByZXZpZXcgaW4gRWRpdG9yIChhdXRvLW9wZW5zIE1haW5TY2VuZSBpZiBuZWVkZWQpLiBGYWxscyBiYWNrIHRvIGJyb3dzZXIgcHJldmlldyBpZiBlZGl0b3IgcHJldmlldyBmYWlscy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCInc3RhcnQnIChkZWZhdWx0KSBvciAnc3RvcCdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yUmVhZHk6IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIklmIHRydWUsIHdhaXQgdW50aWwgR2FtZURlYnVnQ2xpZW50IGNvbm5lY3RzIGFmdGVyIHN0YXJ0IChkZWZhdWx0OiBmYWxzZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0VGltZW91dDogeyB0eXBlOiBcIm51bWJlclwiLCBkZXNjcmlwdGlvbjogXCJNYXggd2FpdCB0aW1lIGluIG1zIGZvciB3YWl0Rm9yUmVhZHkgKGRlZmF1bHQ6IDE1MDAwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfY2xlYXJfY29kZV9jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2xlYXIgdGhlIGNvZGUgY2FjaGUgKGVxdWl2YWxlbnQgdG8gRGV2ZWxvcGVyID4gQ2FjaGUgPiBDbGVhciBjb2RlIGNhY2hlKSBhbmQgc29mdC1yZWxvYWQgdGhlIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHsgdHlwZTogXCJvYmplY3RcIiwgcHJvcGVydGllczoge30gfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWxvYWRfZXh0ZW5zaW9uXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJSZWxvYWQgdGhlIE1DUCBleHRlbnNpb24gaXRzZWxmLiBVc2UgYWZ0ZXIgbnBtIHJ1biBidWlsZCB0byBhcHBseSBjb2RlIGNoYW5nZXMgd2l0aG91dCByZXN0YXJ0aW5nIENvY29zQ3JlYXRvci4gUmVzcG9uc2UgaXMgc2VudCBiZWZvcmUgcmVsb2FkIHN0YXJ0cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2V0X2V4dGVuc2lvbl9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgYSBzcGVjaWZpYyBleHRlbnNpb24uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIkV4dGVuc2lvbiBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJuYW1lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWNvcmRfc3RhcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlN0YXJ0IHJlY29yZGluZyB0aGUgZ2FtZSBwcmV2aWV3IGNhbnZhcyB0byBhIHZpZGVvIGZpbGUuIFVzZXMgTWVkaWFSZWNvcmRlciBvbiB0aGUgZ2FtZSBzaWRlLiBCaXRyYXRlIGlzIGF1dG8tY2FsY3VsYXRlZCBmcm9tIGNhbnZhcyByZXNvbHV0aW9uIMOXIGZwcyDDlyBxdWFsaXR5IGNvZWZmaWNpZW50IHVubGVzcyB2aWRlb0JpdHNQZXJTZWNvbmQgaXMgc2V0IGV4cGxpY2l0bHkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcHM6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiRnJhbWVzIHBlciBzZWNvbmQgKGRlZmF1bHQ6IDMwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiJ2xvdycvJ21lZGl1bScvJ2hpZ2gnLyd1bHRyYScgKGRlZmF1bHQ6IG1lZGl1bSkuIENvZWZmaWNpZW50czogMC4xNS8wLjI1LzAuNDAvMC42MFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZWZmaWNpZW50OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkN1c3RvbSBiaXRyYXRlIGNvZWZmaWNpZW50ICh3aWR0aCDDlyBoZWlnaHQgw5cgZnBzIMOXIGNvZWZmaWNpZW50KS4gT3ZlcnJpZGVzIHF1YWxpdHkuXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9CaXRzUGVyU2Vjb25kOiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkV4cGxpY2l0IGJpdHJhdGUgaW4gYnBzLiBPdmVycmlkZXMgcXVhbGl0eS1iYXNlZCBjYWxjdWxhdGlvbi5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiJ21wNCcgKGRlZmF1bHQpIG9yICd3ZWJtJy4gbXA0IGZhbGxzIGJhY2sgdG8gd2VibSBpZiBub3Qgc3VwcG9ydGVkLlwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlNhdmUgZGlyZWN0b3J5IChwcm9qZWN0LXJlbGF0aXZlIG9yIGFic29sdXRlKS4gRGVmYXVsdDogdGVtcC9yZWNvcmRpbmdzXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWJ1Z19yZWNvcmRfc3RvcFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU3RvcCByZWNvcmRpbmcgc3RhcnRlZCBieSBkZWJ1Z19yZWNvcmRfc3RhcnQuIFJldHVybnMgdGhlIHNhdmVkIFdlYk0gZmlsZSBwYXRoIGFuZCBzaXplLiBWaWRlbyBpcyBzYXZlZCB0byBwcm9qZWN0J3MgdGVtcC9yZWNvcmRpbmdzL3JlY188ZGF0ZXRpbWU+LndlYm0uXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIk1heCB3YWl0IHRpbWUgaW4gbXMgZm9yIGZpbGUgdXBsb2FkIChkZWZhdWx0OiAzMDAwMClcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2JhdGNoX3NjcmVlbnNob3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk5hdmlnYXRlIHRvIG11bHRpcGxlIHBhZ2VzIGFuZCB0YWtlIGEgc2NyZWVuc2hvdCBvZiBlYWNoLiBSZXF1aXJlcyBnYW1lIHByZXZpZXcgcnVubmluZyB3aXRoIEdhbWVEZWJ1Z0NsaWVudC4gUmV0dXJucyBhbiBhcnJheSBvZiBzY3JlZW5zaG90IGZpbGUgcGF0aHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJhcnJheVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBvZiBwYWdlIG5hbWVzIHRvIHNjcmVlbnNob3QgKGUuZy4gWydIb21lUGFnZVZpZXcnLCAnU2hvcFBhZ2VWaWV3J10pXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGF5OiB7IHR5cGU6IFwibnVtYmVyXCIsIGRlc2NyaXB0aW9uOiBcIkRlbGF5IGluIG1zIGJldHdlZW4gbmF2aWdhdGUgYW5kIHNjcmVlbnNob3QgKGRlZmF1bHQ6IDEwMDApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdpZHRoIGZvciBzY3JlZW5zaG90IHJlc2l6ZSAoZGVmYXVsdDogOTYwKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicGFnZXNcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3dhaXRfY29tcGlsZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiV2FpdCBmb3IgVHlwZVNjcmlwdCBjb21waWxhdGlvbiB0byBjb21wbGV0ZS4gTW9uaXRvcnMgdGhlIHBhY2tlci1kcml2ZXIgZGVidWcgbG9nIGZvciAnVGFyZ2V0KGVkaXRvcikgZW5kcycgbWVzc2FnZS4gVXNlIGFmdGVyIG1vZGlmeWluZyAudHMgZmlsZXMgdG8gZW5zdXJlIGNoYW5nZXMgYXJlIGNvbXBpbGVkIGJlZm9yZSBvcGVyYXRpbmcgb24gUHJlZmFicy4gV2l0aCBjbGVhbj10cnVlLCBkZWxldGVzIGNvbXBpbGVkIG91dHB1dCBmaXJzdCB0byBmb3JjZSBhIGZyZXNoIHJlY29tcGlsZSAoc2xvd2VyIGJ1dCBndWFyYW50ZWVkKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHsgdHlwZTogXCJudW1iZXJcIiwgZGVzY3JpcHRpb246IFwiTWF4IHdhaXQgdGltZSBpbiBtcyAoZGVmYXVsdDogMTUwMDApXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYW46IHsgdHlwZTogXCJib29sZWFuXCIsIGRlc2NyaXB0aW9uOiBcIklmIHRydWUsIGRlbGV0ZSBjb21waWxlZCBvdXRwdXQgZmlyc3QgdG8gZm9yY2UgZnJlc2ggcmVjb21waWxlIChkZWZhdWx0OiBmYWxzZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9lZGl0b3JfaW5mb1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEVkaXRvckluZm8oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19saXN0X21lc3NhZ2VzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdE1lc3NhZ2VzKGFyZ3MudGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19leGVjdXRlX3NjcmlwdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4ZWN1dGVTY3JpcHQoYXJncy5tZXRob2QsIGFyZ3MuYXJncyB8fCBbXSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfZ2V0X2NvbnNvbGVfbG9nc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldENvbnNvbGVMb2dzKGFyZ3MuY291bnQgfHwgNTAsIGFyZ3MubGV2ZWwsIGFyZ3Muc291cmNlKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19jbGVhcl9jb25zb2xlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZChcImNvbnNvbGVcIiwgXCJjbGVhclwiKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciBzY2VuZSBwcm9jZXNzIGxvZyBidWZmZXJcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY29jb3MtY3JlYXRvci1tY3BcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcImNsZWFyQ29uc29sZUxvZ3NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge30pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIGdhbWUgcHJldmlldyBsb2cgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJHYW1lTG9ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfbGlzdF9leHRlbnNpb25zXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdEV4dGVuc2lvbnMoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfcHJvamVjdF9sb2dzXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdExvZ3MoYXJncy5saW5lcyB8fCAxMDApO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3NlYXJjaF9wcm9qZWN0X2xvZ3NcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZWFyY2hQcm9qZWN0TG9ncyhhcmdzLnBhdHRlcm4pO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2dldF9sb2dfZmlsZV9pbmZvXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TG9nRmlsZUluZm8oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19xdWVyeV9kZXZpY2VzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImRldmljZVwiLCBcInF1ZXJ5XCIpLmNhdGNoKCgpID0+IFtdKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBkZXZpY2VzIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX29wZW5fdXJsXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInByb2dyYW1cIiwgXCJvcGVuLXVybFwiLCBhcmdzLnVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgdXJsOiBhcmdzLnVybCB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nYW1lX2NvbW1hbmRcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nYW1lQ29tbWFuZChhcmdzLnR5cGUgfHwgYXJncy5jb21tYW5kLCBwYXJzZU1heWJlSnNvbihhcmdzLmFyZ3MpLCBhcmdzLnRpbWVvdXQgfHwgNTAwMCwgYXJncy5tYXhXaWR0aCwgYXJncy5pbWFnZUZvcm1hdCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfc2NyZWVuc2hvdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRha2VTY3JlZW5zaG90KGFyZ3Muc2F2ZVBhdGgsIGFyZ3MubWF4V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3ByZXZpZXdcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVQcmV2aWV3KGFyZ3MuYWN0aW9uIHx8IFwic3RhcnRcIiwgYXJncy53YWl0Rm9yUmVhZHksIGFyZ3Mud2FpdFRpbWVvdXQgfHwgMTUwMDApO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX2NsZWFyX2NvZGVfY2FjaGVcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGVhckNvZGVDYWNoZSgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3JlbG9hZF9leHRlbnNpb25cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWxvYWRFeHRlbnNpb24oKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z192YWxpZGF0ZV9zY2VuZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlU2NlbmUoKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z19nZXRfZXh0ZW5zaW9uX2luZm9cIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRFeHRlbnNpb25JbmZvKGFyZ3MubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfYmF0Y2hfc2NyZWVuc2hvdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJhdGNoU2NyZWVuc2hvdChhcmdzLnBhZ2VzLCBhcmdzLmRlbGF5IHx8IDEwMDAsIGFyZ3MubWF4V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImRlYnVnX3JlY29yZF9zdGFydFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdhbWVDb21tYW5kKFwicmVjb3JkX3N0YXJ0XCIsIHsgZnBzOiBhcmdzLmZwcywgcXVhbGl0eTogYXJncy5xdWFsaXR5LCBjb2VmZmljaWVudDogYXJncy5jb2VmZmljaWVudCwgdmlkZW9CaXRzUGVyU2Vjb25kOiBhcmdzLnZpZGVvQml0c1BlclNlY29uZCwgZm9ybWF0OiBhcmdzLmZvcm1hdCwgc2F2ZVBhdGg6IGFyZ3Muc2F2ZVBhdGggfSwgNTAwMCk7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGVidWdfcmVjb3JkX3N0b3BcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nYW1lQ29tbWFuZChcInJlY29yZF9zdG9wXCIsIHVuZGVmaW5lZCwgYXJncy50aW1lb3V0IHx8IDMwMDAwKTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z193YWl0X2NvbXBpbGVcIjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53YWl0Q29tcGlsZShhcmdzLnRpbWVvdXQgfHwgMTUwMDAsIGFyZ3MuY2xlYW4gPz8gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRFZGl0b3JJbmZvKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIHZlcnNpb246IEVkaXRvci5BcHAudmVyc2lvbixcclxuICAgICAgICAgICAgcGF0aDogRWRpdG9yLkFwcC5wYXRoLFxyXG4gICAgICAgICAgICBob21lOiBFZGl0b3IuQXBwLmhvbWUsXHJcbiAgICAgICAgICAgIGxhbmd1YWdlOiBFZGl0b3IuSTE4bj8uZ2V0TGFuZ3VhZ2U/LigpIHx8IFwidW5rbm93blwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgbGlzdE1lc3NhZ2VzKHRhcmdldDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJleHRlbnNpb25cIiwgXCJxdWVyeS1pbmZvXCIsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHRhcmdldCwgaW5mbyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgY29uc3Qga25vd25NZXNzYWdlczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xyXG4gICAgICAgICAgICAgICAgXCJzY2VuZVwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJxdWVyeS1ub2RlLXRyZWVcIiwgXCJjcmVhdGUtbm9kZVwiLCBcInJlbW92ZS1ub2RlXCIsIFwiZHVwbGljYXRlLW5vZGVcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNldC1wcm9wZXJ0eVwiLCBcImNyZWF0ZS1wcmVmYWJcIiwgXCJzYXZlLXNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIixcclxuICAgICAgICAgICAgICAgICAgICBcInF1ZXJ5LWlzLWRpcnR5XCIsIFwicXVlcnktY2xhc3Nlc1wiLCBcInNvZnQtcmVsb2FkXCIsIFwic25hcHNob3RcIixcclxuICAgICAgICAgICAgICAgICAgICBcImNoYW5nZS1naXptby10b29sXCIsIFwicXVlcnktZ2l6bW8tdG9vbC1uYW1lXCIsIFwiZm9jdXMtY2FtZXJhLW9uLW5vZGVzXCIsXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJhc3NldC1kYlwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJxdWVyeS1hc3NldHNcIiwgXCJxdWVyeS1hc3NldC1pbmZvXCIsIFwicXVlcnktYXNzZXQtbWV0YVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicmVmcmVzaC1hc3NldFwiLCBcInNhdmUtYXNzZXRcIiwgXCJjcmVhdGUtYXNzZXRcIiwgXCJkZWxldGUtYXNzZXRcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm1vdmUtYXNzZXRcIiwgXCJjb3B5LWFzc2V0XCIsIFwib3Blbi1hc3NldFwiLCBcInJlaW1wb3J0LWFzc2V0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJxdWVyeS1wYXRoXCIsIFwicXVlcnktdXVpZFwiLCBcInF1ZXJ5LXVybFwiLCBcInF1ZXJ5LWFzc2V0LWRlcGVuZHNcIixcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VzID0ga25vd25NZXNzYWdlc1t0YXJnZXRdO1xyXG4gICAgICAgICAgICBpZiAobWVzc2FnZXMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHRhcmdldCwgbWVzc2FnZXMsIG5vdGU6IFwiU3RhdGljIGxpc3QgKHF1ZXJ5IGZhaWxlZClcIiB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVTY3JpcHQobWV0aG9kOiBzdHJpbmcsIGFyZ3M6IGFueVtdKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xyXG4gICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldENvbnNvbGVMb2dzKGNvdW50OiBudW1iZXIsIGxldmVsPzogc3RyaW5nLCBzb3VyY2U/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICAvLyAxLiBUcnkgRWRpdG9yJ3MgbmF0aXZlIGNvbnNvbGUgQVBJIGZpcnN0IChtYXkgYmUgc3VwcG9ydGVkIGluIGZ1dHVyZSBDb2Nvc0NyZWF0b3IgdmVyc2lvbnMpXHJcbiAgICAgICAgaWYgKCFzb3VyY2UpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvZ3MgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiY29uc29sZVwiLCBcInF1ZXJ5LWxhc3QtbG9nc1wiLCBjb3VudCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShsb2dzKSAmJiBsb2dzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBsb2dzLCBzb3VyY2U6IFwiZWRpdG9yLWFwaVwiLCBub3RlOiBcIlVzaW5nIG5hdGl2ZSBFZGl0b3IgY29uc29sZSBBUElcIiB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIE5vdCBzdXBwb3J0ZWQgaW4gdGhpcyB2ZXJzaW9uIOKAlCB1c2UgZmFsbGJhY2sgKi8gfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMi4gRmFsbGJhY2s6IGNvbGxlY3QgZnJvbSBzY2VuZSBwcm9jZXNzIGJ1ZmZlciArIGdhbWUgcHJldmlldyBidWZmZXJcclxuICAgICAgICBsZXQgc2NlbmVMb2dzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgIGxldCBnYW1lTG9nczogYW55W10gPSBbXTtcclxuXHJcbiAgICAgICAgLy8gMmEuIFNjZW5lIHByb2Nlc3MgbG9ncyAoY29uc29sZSB3cmFwcGVyIGluIHNjZW5lLnRzKVxyXG4gICAgICAgIGlmICghc291cmNlIHx8IHNvdXJjZSA9PT0gXCJzY2VuZVwiKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJjb2Nvcy1jcmVhdG9yLW1jcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJnZXRDb25zb2xlTG9nc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IFtjb3VudCAqIDIsIGxldmVsXSwgLy8gcmVxdWVzdCBtb3JlLCB3aWxsIHRyaW0gYWZ0ZXIgbWVyZ2VcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdD8ubG9ncykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjZW5lTG9ncyA9IHJlc3VsdC5sb2dzLm1hcCgobDogYW55KSA9PiAoeyAuLi5sLCBzb3VyY2U6IFwic2NlbmVcIiB9KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBzY2VuZSBub3QgYXZhaWxhYmxlICovIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDJiLiBHYW1lIHByZXZpZXcgbG9ncyAocmVjZWl2ZWQgdmlhIFBPU1QgL2xvZyBlbmRwb2ludClcclxuICAgICAgICBpZiAoIXNvdXJjZSB8fCBzb3VyY2UgPT09IFwiZ2FtZVwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGdhbWVSZXN1bHQgPSBnZXRHYW1lTG9ncyhjb3VudCAqIDIsIGxldmVsKTtcclxuICAgICAgICAgICAgZ2FtZUxvZ3MgPSBnYW1lUmVzdWx0LmxvZ3MubWFwKChsOiBhbnkpID0+ICh7IC4uLmwsIHNvdXJjZTogXCJnYW1lXCIgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTWVyZ2UgYW5kIHNvcnQgYnkgdGltZXN0YW1wLCB0YWtlIGxhc3QgYGNvdW50YFxyXG4gICAgICAgIGNvbnN0IG1lcmdlZCA9IFsuLi5zY2VuZUxvZ3MsIC4uLmdhbWVMb2dzXVxyXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYS50aW1lc3RhbXAubG9jYWxlQ29tcGFyZShiLnRpbWVzdGFtcCkpXHJcbiAgICAgICAgICAgIC5zbGljZSgtY291bnQpO1xyXG5cclxuICAgICAgICByZXR1cm4gb2soe1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBsb2dzOiBtZXJnZWQsXHJcbiAgICAgICAgICAgIHRvdGFsOiB7IHNjZW5lOiBzY2VuZUxvZ3MubGVuZ3RoLCBnYW1lOiAoc291cmNlID09PSBcInNjZW5lXCIgPyAwIDogZ2FtZUxvZ3MubGVuZ3RoKSB9LFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgbGlzdEV4dGVuc2lvbnMoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgbGlzdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJleHRlbnNpb25cIiwgXCJxdWVyeS1hbGxcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGV4dGVuc2lvbnM6IGxpc3QgfSk7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGV4dGVuc2lvbnM6IFtdLCBub3RlOiBcIkV4dGVuc2lvbiBxdWVyeSBub3Qgc3VwcG9ydGVkXCIgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0RXh0ZW5zaW9uSW5mbyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImV4dGVuc2lvblwiLCBcInF1ZXJ5LWluZm9cIiwgbmFtZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5hbWUsIGluZm8gfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0UHJvamVjdExvZ3MobGluZXM6IG51bWJlcik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvZ1BhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcImxvZ3NcIiwgXCJwcm9qZWN0LmxvZ1wiKTtcclxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGxvZ1BhdGgpKSByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBsb2dzOiBbXSwgbm90ZTogXCJMb2cgZmlsZSBub3QgZm91bmRcIiB9KTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsb2dQYXRoLCBcInV0Zi04XCIpO1xyXG4gICAgICAgICAgICBjb25zdCBhbGxMaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlY2VudCA9IGFsbExpbmVzLnNsaWNlKC1saW5lcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGxpbmVzOiByZWNlbnQubGVuZ3RoLCBsb2dzOiByZWNlbnQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2VhcmNoUHJvamVjdExvZ3MocGF0dGVybjogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgY29uc3QgbG9nUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsIFwibG9nc1wiLCBcInByb2plY3QubG9nXCIpO1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nUGF0aCkpIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG1hdGNoZXM6IFtdIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGxvZ1BhdGgsIFwidXRmLThcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChwYXR0ZXJuLCBcImdpXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gY29udGVudC5zcGxpdChcIlxcblwiKS5maWx0ZXIoKGxpbmU6IHN0cmluZykgPT4gcmVnZXgudGVzdChsaW5lKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHBhdHRlcm4sIGNvdW50OiBtYXRjaGVzLmxlbmd0aCwgbWF0Y2hlczogbWF0Y2hlcy5zbGljZSgwLCAxMDApIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldExvZ0ZpbGVJbmZvKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvZ1BhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcImxvZ3NcIiwgXCJwcm9qZWN0LmxvZ1wiKTtcclxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGxvZ1BhdGgpKSByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBleGlzdHM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMobG9nUGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGV4aXN0czogdHJ1ZSwgcGF0aDogbG9nUGF0aCwgc2l6ZTogc3RhdC5zaXplLCBtb2RpZmllZDogc3RhdC5tdGltZSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVQcmV2aWV3KGFjdGlvbjogc3RyaW5nLCB3YWl0Rm9yUmVhZHk/OiBib29sZWFuLCB3YWl0VGltZW91dD86IG51bWJlcik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIGlmIChhY3Rpb24gPT09IFwic3RvcFwiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0b3BQcmV2aWV3KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3RhcnRQcmV2aWV3KCk7XHJcbiAgICAgICAgaWYgKHdhaXRGb3JSZWFkeSkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHREYXRhID0gSlNPTi5wYXJzZShyZXN1bHQuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdERhdGEuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZHkgPSBhd2FpdCB0aGlzLndhaXRGb3JHYW1lUmVhZHkod2FpdFRpbWVvdXQgfHwgMTUwMDApO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0RGF0YS5nYW1lUmVhZHkgPSByZWFkeTtcclxuICAgICAgICAgICAgICAgIGlmICghcmVhZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHREYXRhLm5vdGUgPSAocmVzdWx0RGF0YS5ub3RlIHx8IFwiXCIpICsgXCIgR2FtZURlYnVnQ2xpZW50IGRpZCBub3QgY29ubmVjdCB3aXRoaW4gdGltZW91dC5cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBvayhyZXN1bHREYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgd2FpdEZvckdhbWVSZWFkeSh0aW1lb3V0OiBudW1iZXIpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydCA8IHRpbWVvdXQpIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgZ2FtZSBoYXMgc2VudCBhbnkgbG9nIG9yIGNvbW1hbmQgcmVzdWx0IHJlY2VudGx5XHJcbiAgICAgICAgICAgIGNvbnN0IGdhbWVSZXN1bHQgPSBnZXRHYW1lTG9ncygxKTtcclxuICAgICAgICAgICAgaWYgKGdhbWVSZXN1bHQudG90YWwgPiAwKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDUwMCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzdGFydFByZXZpZXcoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbnN1cmVNYWluU2NlbmVPcGVuKCk7XHJcblxyXG4gICAgICAgICAgICAvLyDjg4Tjg7zjg6vjg5Djg7zjga5WdWXjgqTjg7Pjgrnjgr/jg7PjgrnntYznlLHjgadwbGF5KCnjgpLlkbzjgbbvvIhVSeeKtuaFi+OCguWQjOacn+OBleOCjOOCi++8iVxyXG4gICAgICAgICAgICBjb25zdCBwbGF5ZWQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVPblRvb2xiYXIoXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgaWYgKHBsYXllZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgYWN0aW9uOiBcInN0YXJ0XCIsIG1vZGU6IFwiZWRpdG9yXCIgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIOODleOCqeODvOODq+ODkOODg+OCrzog55u05o6lQVBJXHJcbiAgICAgICAgICAgIGNvbnN0IGlzUGxheWluZyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImVkaXRvci1wcmV2aWV3LXNldC1wbGF5XCIsIHRydWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBpc1BsYXlpbmcsIGFjdGlvbjogXCJzdGFydFwiLCBtb2RlOiBcImVkaXRvclwiLCBub3RlOiBcImRpcmVjdCBBUEkgKHRvb2xiYXIgVUkgbWF5IG5vdCBzeW5jKVwiIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBlbGVjdHJvbi5zaGVsbC5vcGVuRXh0ZXJuYWwoXCJodHRwOi8vMTI3LjAuMC4xOjc0NTZcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246IFwic3RhcnRcIiwgbW9kZTogXCJicm93c2VyXCIgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoZTIubWVzc2FnZSB8fCBTdHJpbmcoZTIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHN0b3BQcmV2aWV3KCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIOODhOODvOODq+ODkOODvOe1jOeUseOBp+WBnOatou+8iFVJ5ZCM5pyf77yJXHJcbiAgICAgICAgICAgIGNvbnN0IHN0b3BwZWQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVPblRvb2xiYXIoXCJzdG9wXCIpO1xyXG4gICAgICAgICAgICBpZiAoIXN0b3BwZWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIOODleOCqeODvOODq+ODkOODg+OCrzog55u05o6lQVBJXHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJlZGl0b3ItcHJldmlldy1zZXQtcGxheVwiLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gc2NlbmU6cHJldmlldy1zdG9wIOODluODreODvOODieOCreODo+OCueODiOOBp+ODhOODvOODq+ODkOODvFVJ54q25oWL44KS44Oq44K744OD44OIXHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLmJyb2FkY2FzdChcInNjZW5lOnByZXZpZXctc3RvcFwiKTtcclxuICAgICAgICAgICAgLy8g44K344O844Oz44OT44Ol44O844Gr5oi744GZXHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCA1MDApKTtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbnN1cmVNYWluU2NlbmVPcGVuKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogXCJzdG9wXCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZXhlY3V0ZU9uVG9vbGJhcihhY3Rpb246IFwic3RhcnRcIiB8IFwic3RvcFwiKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbENvbnRlbnRzID0gZWxlY3Ryb24ud2ViQ29udGVudHMuZ2V0QWxsV2ViQ29udGVudHMoKTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCB3YyBvZiBhbGxDb250ZW50cykge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBwbGF5KCnjgpJhd2FpdOOBl+OBquOBhCDigJQg44OX44Os44OT44Ol44O85a6M5LqG44KS5b6F44Gk44Go44K/44Kk44Og44Ki44Km44OI44GZ44KL44Gf44KBXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJzdGFydFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHdjLmV4ZWN1dGVKYXZhU2NyaXB0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYChmdW5jdGlvbigpIHsgaWYgKHdpbmRvdy54eHggJiYgd2luZG93Lnh4eC5wbGF5ICYmICF3aW5kb3cueHh4LmdhbWVWaWV3LmlzUGxheSkgeyB3aW5kb3cueHh4LnBsYXkoKTsgcmV0dXJuIHRydWU7IH0gcmV0dXJuIGZhbHNlOyB9KSgpYFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB3Yy5leGVjdXRlSmF2YVNjcmlwdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAoZnVuY3Rpb24oKSB7IGlmICh3aW5kb3cueHh4ICYmIHdpbmRvdy54eHguZ2FtZVZpZXcuaXNQbGF5KSB7IHdpbmRvdy54eHgucGxheSgpOyByZXR1cm4gdHJ1ZTsgfSByZXR1cm4gZmFsc2U7IH0pKClgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBub3QgdGhlIHRvb2xiYXIgd2ViQ29udGVudHMgKi8gfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCB7IC8qIGVsZWN0cm9uIEFQSSBub3QgYXZhaWxhYmxlICovIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBlbnN1cmVNYWluU2NlbmVPcGVuKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGhpZXJhcmNoeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICAgICAgbmFtZTogXCJjb2Nvcy1jcmVhdG9yLW1jcFwiLFxyXG4gICAgICAgICAgICBtZXRob2Q6IFwiZ2V0U2NlbmVIaWVyYXJjaHlcIixcclxuICAgICAgICAgICAgYXJnczogW2ZhbHNlXSxcclxuICAgICAgICB9KS5jYXRjaCgoKSA9PiBudWxsKTtcclxuXHJcbiAgICAgICAgaWYgKCFoaWVyYXJjaHk/LnNjZW5lTmFtZSB8fCBoaWVyYXJjaHkuc2NlbmVOYW1lID09PSBcInNjZW5lLTJkXCIpIHtcclxuICAgICAgICAgICAgLy8g44OX44Ot44K444Kn44Kv44OI6Kit5a6a44GuU3RhcnQgU2NlbmXjgpLlj4LnhadcclxuICAgICAgICAgICAgbGV0IHNjZW5lVXVpZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBzY2VuZVV1aWQgPSBhd2FpdCAoRWRpdG9yIGFzIGFueSkuUHJvZmlsZS5nZXRDb25maWcoXCJwcmV2aWV3XCIsIFwiZ2VuZXJhbC5zdGFydF9zY2VuZVwiLCBcImxvY2FsXCIpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogaWdub3JlICovIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFN0YXJ0IFNjZW5l44GM5pyq6Kit5a6aIG9yIFwiY3VycmVudF9zY2VuZVwiIOOBruWgtOWQiOOAgeacgOWIneOBruOCt+ODvOODs+OCkuS9v+OBhlxyXG4gICAgICAgICAgICBpZiAoIXNjZW5lVXVpZCB8fCBzY2VuZVV1aWQgPT09IFwiY3VycmVudF9zY2VuZVwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2VuZXMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNjVHlwZTogXCJjYy5TY2VuZUFzc2V0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogXCJkYjovL2Fzc2V0cy8qKi8qXCIsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjZW5lcykgJiYgc2NlbmVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBzY2VuZVV1aWQgPSBzY2VuZXNbMF0udXVpZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNjZW5lVXVpZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gZGVidWdfcHJldmlldyDlhoXpg6jjga7oh6rli5Xpgbfnp7vjga8gcHJldmlldyDjgpLlhKrlhYjjgZfjgaYgZm9yY2U9dHJ1ZVxyXG4gICAgICAgICAgICAgICAgLy8g77yIZGlhbG9nIOWHuuOCi+OCiOOCiiBwcmV2aWV3IOmWi+Wni+OCkuWEquWFiOOBmeOCi+mBi+eUqO+8iVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2godHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJvcGVuLXNjZW5lXCIsIHNjZW5lVXVpZCk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTUwMCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY2xlYXJDb2RlQ2FjaGUoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lbnUgPSBlbGVjdHJvbi5NZW51LmdldEFwcGxpY2F0aW9uTWVudSgpO1xyXG4gICAgICAgICAgICBpZiAoIW1lbnUpIHJldHVybiBlcnIoXCJBcHBsaWNhdGlvbiBtZW51IG5vdCBmb3VuZFwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbmRNZW51SXRlbSA9IChpdGVtczogYW55W10sIHBhdGg6IHN0cmluZ1tdKTogYW55ID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmxhYmVsID09PSBwYXRoWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLnN1Ym1lbnU/Lml0ZW1zKSByZXR1cm4gZmluZE1lbnVJdGVtKGl0ZW0uc3VibWVudS5pdGVtcywgcGF0aC5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjYWNoZUl0ZW0gPSBmaW5kTWVudUl0ZW0obWVudS5pdGVtcywgW1wiRGV2ZWxvcGVyXCIsIFwiQ2FjaGVcIiwgXCJDbGVhciBjb2RlIGNhY2hlXCJdKTtcclxuICAgICAgICAgICAgaWYgKCFjYWNoZUl0ZW0pIHJldHVybiBlcnIoXCJNZW51IGl0ZW0gJ0RldmVsb3BlciA+IENhY2hlID4gQ2xlYXIgY29kZSBjYWNoZScgbm90IGZvdW5kXCIpO1xyXG5cclxuICAgICAgICAgICAgY2FjaGVJdGVtLmNsaWNrKCk7XHJcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiQ29kZSBjYWNoZSBjbGVhcmVkIHZpYSBtZW51XCIgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2FtZUNvbW1hbmQodHlwZTogc3RyaW5nLCBhcmdzOiBhbnksIHRpbWVvdXQ6IG51bWJlciwgbWF4V2lkdGg/OiBudW1iZXIsIGltYWdlRm9ybWF0Pzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgY29uc3QgY21kSWQgPSBxdWV1ZUdhbWVDb21tYW5kKHR5cGUsIGFyZ3MpO1xyXG5cclxuICAgICAgICAvLyBQb2xsIGZvciByZXN1bHRcclxuICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydCA8IHRpbWVvdXQpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZ2V0Q29tbWFuZFJlc3VsdCgpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5pZCA9PT0gY21kSWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHNjcmVlbnNob3QsIHNhdmUgdG8gZmlsZSBhbmQgcmV0dXJuIHBhdGhcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSBcInNjcmVlbnNob3RcIiAmJiByZXN1bHQuc3VjY2VzcyAmJiByZXN1bHQuZGF0YT8uZGF0YVVybCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsIFwic2NyZWVuc2hvdHNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgXCItXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBiYXNlNjQgPSByZXN1bHQuZGF0YS5kYXRhVXJsLnJlcGxhY2UoL15kYXRhOmltYWdlXFwvcG5nO2Jhc2U2NCwvLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcG5nQnVmZmVyID0gQnVmZmVyLmZyb20oYmFzZTY0LCBcImJhc2U2NFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWZmZWN0aXZlTWF4V2lkdGggPSBtYXhXaWR0aCAhPT0gdW5kZWZpbmVkID8gbWF4V2lkdGggOiA5NjA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZWN0cm9uID0gcmVxdWlyZShcImVsZWN0cm9uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcmlnSW1hZ2UgPSBlbGVjdHJvbi5uYXRpdmVJbWFnZS5jcmVhdGVGcm9tQnVmZmVyKHBuZ0J1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsU2l6ZSA9IG9yaWdJbWFnZS5nZXRTaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgYnVmZmVyLCB3aWR0aCwgaGVpZ2h0LCBmb3JtYXQgfSA9IGF3YWl0IHRoaXMucHJvY2Vzc0ltYWdlKHBuZ0J1ZmZlciwgZWZmZWN0aXZlTWF4V2lkdGgsIGltYWdlRm9ybWF0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXh0ID0gZm9ybWF0ID09PSBcIndlYnBcIiA/IFwid2VicFwiIDogZm9ybWF0ID09PSBcImpwZWdcIiA/IFwianBnXCIgOiBcInBuZ1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihkaXIsIGBnYW1lXyR7dGltZXN0YW1wfS4ke2V4dH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgYnVmZmVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIHBhdGg6IGZpbGVQYXRoLCBzaXplOiBidWZmZXIubGVuZ3RoLCBmb3JtYXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFNpemU6IGAke29yaWdpbmFsU2l6ZS53aWR0aH14JHtvcmlnaW5hbFNpemUuaGVpZ2h0fWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYXZlZFNpemU6IGAke3dpZHRofXgke2hlaWdodH1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm90ZTogXCJTY3JlZW5zaG90IGNhcHR1cmVkIGJ1dCBmaWxlIHNhdmUgZmFpbGVkXCIsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDIwMCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZXJyKGBHYW1lIGRpZCBub3QgcmVzcG9uZCB3aXRoaW4gJHt0aW1lb3V0fW1zLiBJcyBHYW1lRGVidWdDbGllbnQgcnVubmluZyBpbiB0aGUgcHJldmlldz9gKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHByb2Nlc3NJbWFnZShwbmdCdWZmZXI6IEJ1ZmZlciwgbWF4V2lkdGg6IG51bWJlciwgZGVzaXJlZEZvcm1hdD86IHN0cmluZyk6IFByb21pc2U8eyBidWZmZXI6IEJ1ZmZlcjsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXI7IGZvcm1hdDogc3RyaW5nIH0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBWaXBzID0gcmVxdWlyZShcIndhc20tdmlwc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgdmlwcyA9IGF3YWl0IFZpcHMoKTtcclxuICAgICAgICAgICAgbGV0IGltYWdlID0gdmlwcy5JbWFnZS5uZXdGcm9tQnVmZmVyKHBuZ0J1ZmZlcik7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdXID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdIID0gaW1hZ2UuaGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAobWF4V2lkdGggPiAwICYmIG9yaWdXID4gbWF4V2lkdGgpIHtcclxuICAgICAgICAgICAgICAgIGltYWdlID0gaW1hZ2UudGh1bWJuYWlsSW1hZ2UobWF4V2lkdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHBuZyDmmI7npLrmjIflrprmmYLjga8gcG5nc2F2ZSAobG9zc2xlc3Mp44CB44Gd44KM5Lul5aSW44GvIHdlYnAoUT04NSlcclxuICAgICAgICAgICAgaWYgKGRlc2lyZWRGb3JtYXQgPT09IFwicG5nXCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBuZ091dCA9IGltYWdlLnBuZ3NhdmVCdWZmZXIoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgYnVmZmVyOiBCdWZmZXIuZnJvbShwbmdPdXQpLCB3aWR0aDogaW1hZ2Uud2lkdGgsIGhlaWdodDogaW1hZ2UuaGVpZ2h0LCBmb3JtYXQ6IFwicG5nXCIgfTtcclxuICAgICAgICAgICAgICAgIGltYWdlLmRlbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBvdXRCdWYgPSBpbWFnZS53ZWJwc2F2ZUJ1ZmZlcih7IFE6IDg1IH0pO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGJ1ZmZlcjogQnVmZmVyLmZyb20ob3V0QnVmKSwgd2lkdGg6IGltYWdlLndpZHRoLCBoZWlnaHQ6IGltYWdlLmhlaWdodCwgZm9ybWF0OiBcIndlYnBcIiB9O1xyXG4gICAgICAgICAgICBpbWFnZS5kZWxldGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IE5hdGl2ZUltYWdlIHJlc2l6ZSArIEpQRUdcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZSA9IGVsZWN0cm9uLm5hdGl2ZUltYWdlLmNyZWF0ZUZyb21CdWZmZXIocG5nQnVmZmVyKTtcclxuICAgICAgICAgICAgaWYgKG1heFdpZHRoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzaXplLndpZHRoID4gbWF4V2lkdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG1heFdpZHRoIC8gc2l6ZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZSA9IGltYWdlLnJlc2l6ZSh7IHdpZHRoOiBNYXRoLnJvdW5kKHNpemUud2lkdGggKiByYXRpbyksIGhlaWdodDogTWF0aC5yb3VuZChzaXplLmhlaWdodCAqIHJhdGlvKSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBzaXplID0gaW1hZ2UuZ2V0U2l6ZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBpbWFnZS50b0pQRUcoODUpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBidWZmZXIsIHdpZHRoOiBzaXplLndpZHRoLCBoZWlnaHQ6IHNpemUuaGVpZ2h0LCBmb3JtYXQ6IFwianBlZ1wiIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdGFrZVNjcmVlbnNob3Qoc2F2ZVBhdGg/OiBzdHJpbmcsIG1heFdpZHRoPzogbnVtYmVyKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd3MgPSBlbGVjdHJvbi5Ccm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKTtcclxuICAgICAgICAgICAgaWYgKCF3aW5kb3dzIHx8IHdpbmRvd3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFwiTm8gZWRpdG9yIHdpbmRvdyBmb3VuZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBtYWluIChsYXJnZXN0KSB3aW5kb3dcclxuICAgICAgICAgICAgbGV0IHdpbiA9IHdpbmRvd3NbMF07XHJcbiAgICAgICAgICAgIGxldCBtYXhBcmVhID0gMDtcclxuICAgICAgICAgICAgZm9yIChjb25zdCB3IG9mIHdpbmRvd3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJvdW5kcyA9IHcuZ2V0Qm91bmRzKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhcmVhID0gYm91bmRzLndpZHRoICogYm91bmRzLmhlaWdodDtcclxuICAgICAgICAgICAgICAgIGlmIChhcmVhID4gbWF4QXJlYSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heEFyZWEgPSBhcmVhO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbiA9IHc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQnJpbmcgdG8gZnJvbnQgYW5kIHdhaXQgZm9yIHJlbmRlclxyXG4gICAgICAgICAgICB3aW4uc2hvdygpO1xyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMzAwKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZUltYWdlID0gYXdhaXQgd2luLndlYkNvbnRlbnRzLmNhcHR1cmVQYWdlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsU2l6ZSA9IG5hdGl2ZUltYWdlLmdldFNpemUoKTtcclxuICAgICAgICAgICAgY29uc3QgcG5nQnVmZmVyID0gbmF0aXZlSW1hZ2UudG9QTkcoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGVmZmVjdGl2ZU1heFdpZHRoID0gbWF4V2lkdGggIT09IHVuZGVmaW5lZCA/IG1heFdpZHRoIDogOTYwO1xyXG4gICAgICAgICAgICBjb25zdCB7IGJ1ZmZlciwgd2lkdGgsIGhlaWdodCwgZm9ybWF0IH0gPSBhd2FpdCB0aGlzLnByb2Nlc3NJbWFnZShwbmdCdWZmZXIsIGVmZmVjdGl2ZU1heFdpZHRoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSBzYXZlIHBhdGhcclxuICAgICAgICAgICAgY29uc3QgZXh0ID0gZm9ybWF0ID09PSBcIndlYnBcIiA/IFwid2VicFwiIDogZm9ybWF0ID09PSBcImpwZWdcIiA/IFwianBnXCIgOiBcInBuZ1wiO1xyXG4gICAgICAgICAgICBpZiAoIXNhdmVQYXRoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCBcInNjcmVlbnNob3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL1s6Ll0vZywgXCItXCIpO1xyXG4gICAgICAgICAgICAgICAgc2F2ZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBgc2NyZWVuc2hvdF8ke3RpbWVzdGFtcH0uJHtleHR9YCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2F2ZVBhdGgsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBwYXRoOiBzYXZlUGF0aCwgc2l6ZTogYnVmZmVyLmxlbmd0aCwgZm9ybWF0LFxyXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxTaXplOiBgJHtvcmlnaW5hbFNpemUud2lkdGh9eCR7b3JpZ2luYWxTaXplLmhlaWdodH1gLFxyXG4gICAgICAgICAgICAgICAgc2F2ZWRTaXplOiBgJHt3aWR0aH14JHtoZWlnaHR9YCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcmVsb2FkRXh0ZW5zaW9uKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIC8vIFNjaGVkdWxlIHJlbG9hZCBhZnRlciByZXNwb25zZSBpcyBzZW50XHJcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiZXh0ZW5zaW9uXCIsIFwicmVsb2FkXCIsIFwiY29jb3MtY3JlYXRvci1tY3BcIik7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltNQ1BdIEV4dGVuc2lvbiByZWxvYWQgZmFpbGVkOlwiLCBlLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgNTAwKTtcclxuICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub3RlOiBcIkV4dGVuc2lvbiByZWxvYWQgc2NoZWR1bGVkLiBNQ1Agc2VydmVyIHdpbGwgcmVzdGFydCBpbiB+MXMuIE5PVEU6IEFkZGluZyBuZXcgdG9vbCBkZWZpbml0aW9ucyBvciBtb2RpZnlpbmcgc2NlbmUudHMgcmVxdWlyZXMgYSBmdWxsIENvY29zQ3JlYXRvciByZXN0YXJ0IChyZWxvYWQgaXMgbm90IHN1ZmZpY2llbnQpLlwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hTY3JlZW5zaG90KHBhZ2VzOiBzdHJpbmdbXSwgZGVsYXk6IG51bWJlciwgbWF4V2lkdGg/OiBudW1iZXIpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAxMDAwMDtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XHJcbiAgICAgICAgICAgIC8vIE5hdmlnYXRlXHJcbiAgICAgICAgICAgIGNvbnN0IG5hdlJlc3VsdCA9IGF3YWl0IHRoaXMuZ2FtZUNvbW1hbmQoXCJuYXZpZ2F0ZVwiLCB7IHBhZ2UgfSwgdGltZW91dCwgbWF4V2lkdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBuYXZEYXRhID0gSlNPTi5wYXJzZShuYXZSZXN1bHQuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgaWYgKCFuYXZEYXRhLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHBhZ2UsIHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogXCJuYXZpZ2F0ZSBmYWlsZWRcIiB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBXYWl0IGZvciBwYWdlIHRvIHJlbmRlclxyXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgZGVsYXkpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNjcmVlbnNob3RcclxuICAgICAgICAgICAgY29uc3Qgc3NSZXN1bHQgPSBhd2FpdCB0aGlzLmdhbWVDb21tYW5kKFwic2NyZWVuc2hvdFwiLCB7fSwgdGltZW91dCwgbWF4V2lkdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBzc0RhdGEgPSBKU09OLnBhcnNlKHNzUmVzdWx0LmNvbnRlbnRbMF0udGV4dCk7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBwYWdlLFxyXG4gICAgICAgICAgICAgICAgc3VjY2Vzczogc3NEYXRhLnN1Y2Nlc3MgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBzc0RhdGEucGF0aCxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBzc0RhdGEuc3VjY2VzcyA/IHVuZGVmaW5lZCA6IChzc0RhdGEuZXJyb3IgfHwgc3NEYXRhLm1lc3NhZ2UpLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1Y2NlZWRlZCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XHJcbiAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgdG90YWw6IHBhZ2VzLmxlbmd0aCxcclxuICAgICAgICAgICAgc3VjY2VlZGVkLFxyXG4gICAgICAgICAgICBmYWlsZWQ6IHBhZ2VzLmxlbmd0aCAtIHN1Y2NlZWRlZCxcclxuICAgICAgICAgICAgcmVzdWx0cyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlU2NlbmUoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgdHJlZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGUtdHJlZVwiKTtcclxuICAgICAgICAgICAgY29uc3QgaXNzdWVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBjaGVja05vZGVzID0gKG5vZGVzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlcykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlLm5hbWUpIGlzc3Vlcy5wdXNoKGBOb2RlICR7bm9kZS51dWlkfSBoYXMgbm8gbmFtZWApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSBjaGVja05vZGVzKG5vZGUuY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0cmVlKSkgY2hlY2tOb2Rlcyh0cmVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaXNzdWVDb3VudDogaXNzdWVzLmxlbmd0aCwgaXNzdWVzIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFR5cGVTY3JpcHQg44Kz44Oz44OR44Kk44Or5a6M5LqG44KS5b6F44Gk44CCXHJcbiAgICAgKiBwYWNrZXItZHJpdmVyIOOBriBkZWJ1Zy5sb2cg44GrIFwiVGFyZ2V0KGVkaXRvcikgZW5kc1wiIOOBjOePvuOCjOOCi+OBruOCkuebo+imluOBmeOCi+OAglxyXG4gICAgICog5pei44Gr44Kz44Oz44OR44Kk44Or5riI44G/77yI55u06L+R5pWw56eS5Lul5YaF44Gr5a6M5LqG44Ot44Kw44GC44KK77yJ44Gq44KJ5Y2z5bqn44Gr6L+U44GZ44CCXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgd2FpdENvbXBpbGUodGltZW91dDogbnVtYmVyLCBjbGVhbjogYm9vbGVhbik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvZ1BhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJ0ZW1wXCIsIFwicHJvZ3JhbW1pbmdcIiwgXCJwYWNrZXItZHJpdmVyXCIsIFwibG9nc1wiLCBcImRlYnVnLmxvZ1wiKTtcclxuICAgICAgICAgICAgY29uc3QgY2h1bmtzRGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwidGVtcFwiLCBcInByb2dyYW1taW5nXCIsIFwicGFja2VyLWRyaXZlclwiLCBcInRhcmdldHNcIiwgXCJlZGl0b3JcIiwgXCJjaHVua3NcIik7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nUGF0aCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYENvbXBpbGUgbG9nIG5vdCBmb3VuZDogJHtsb2dQYXRofWApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBNQVJLRVIgPSBcIlRhcmdldChlZGl0b3IpIGVuZHNcIjtcclxuXHJcbiAgICAgICAgICAgIC8vIGNsZWFuIOODouODvOODiTog44Kz44O844OJ44Kt44Oj44OD44K344Ol44Kv44Oq44KiICsgc29mdC1yZWxvYWQg44Gn5YaN44Kz44Oz44OR44Kk44Or44KS5by35Yi2XHJcbiAgICAgICAgICAgIGlmIChjbGVhbikge1xyXG4gICAgICAgICAgICAgICAgLy8gRGV2ZWxvcGVyID4gQ2FjaGUgPiBDbGVhciBjb2RlIGNhY2hlIOOCkuOCr+ODquODg+OCr1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZW51ID0gZWxlY3Ryb24uTWVudS5nZXRBcHBsaWNhdGlvbk1lbnUoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaW5kTWVudUl0ZW0gPSAoaXRlbXM6IGFueVtdLCBsYWJlbHM6IHN0cmluZ1tdKTogYW55ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5sYWJlbCA9PT0gbGFiZWxzWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhYmVscy5sZW5ndGggPT09IDEpIHJldHVybiBpdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLnN1Ym1lbnU/Lml0ZW1zKSByZXR1cm4gZmluZE1lbnVJdGVtKGl0ZW0uc3VibWVudS5pdGVtcywgbGFiZWxzLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhY2hlSXRlbSA9IG1lbnUgPyBmaW5kTWVudUl0ZW0obWVudS5pdGVtcywgW1wiRGV2ZWxvcGVyXCIsIFwiQ2FjaGVcIiwgXCJDbGVhciBjb2RlIGNhY2hlXCJdKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlSXRlbSkgY2FjaGVJdGVtLmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChfZSkgeyAvKiBpZ25vcmUgKi8gfVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDUwMCkpO1xyXG4gICAgICAgICAgICAgICAgLy8gc29mdC1yZWxvYWQg44Gn44K344O844Oz44KS5YaN6Kqt44G/6L6844G/IOKGkiDjgrPjg7Pjg5HjgqTjg6vjg4jjg6rjgqzjg7xcclxuICAgICAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNvZnQtcmVsb2FkXCIpLmNhdGNoKCgpID0+IHt9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gcmVmcmVzaC1hc3NldCDjgafjg5XjgqHjgqTjg6vlpInmm7TjgpIgQ0Mg44Gr6YCa55+l44GX44Gm44Kz44Oz44OR44Kk44Or44KS44OI44Oq44Ks44O8XHJcbiAgICAgICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInJlZnJlc2gtYXNzZXRcIiwgXCJkYjovL2Fzc2V0c1wiKS5jYXRjaCgoKSA9PiB7fSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBpbml0aWFsU2l6ZSA9IGZzLnN0YXRTeW5jKGxvZ1BhdGgpLnNpemU7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIGNvbnN0IFBPTExfSU5URVJWQUwgPSAyMDA7XHJcbiAgICAgICAgICAgIGNvbnN0IERFVEVDVF9HUkFDRV9NUyA9IDIwMDA7IC8vIENDIOOBjOODleOCoeOCpOODq+WkieabtOOCkuaknOefpeOBmeOCi+OBvuOBp+OBrueMtuS6iFxyXG5cclxuICAgICAgICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydFRpbWUgPCB0aW1lb3V0KSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgUE9MTF9JTlRFUlZBTCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTaXplID0gZnMuc3RhdFN5bmMobG9nUGF0aCkuc2l6ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDjg63jgrDjgYzmiJDplbfjgZfjgabjgYTjgarjgYRcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2l6ZSA8PSBpbml0aWFsU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsZWFuIOODouODvOODieOBp+OBr+W/heOBmuOCs+ODs+ODkeOCpOODq+OBjOi1sOOCi+OBruOBp+eMtuS6iOWIpOWumuOBl+OBquOBhFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGVhbikgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g54y25LqI5pyf6ZaT5YaF44Gv44G+44Gg5b6F44GkIChDQyDjga7mpJznn6XjgYzpgYXjgYTlj6/og73mgKcpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydFRpbWUgPCBERVRFQ1RfR1JBQ0VfTVMpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOeMtuS6iOacn+mWk+OCkumBjuOBjuOBpuOCguODreOCsOOBjOaIkOmVt+OBl+OBquOBhCDihpIg44Kz44Oz44OR44Kk44Or5LiN6KaBXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY29tcGlsZWQ6IHRydWUsIHdhaXRlZE1zOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLCBub3RlOiBcIk5vIGNvbXBpbGF0aW9uIHRyaWdnZXJlZCAobm8gY2hhbmdlcyBkZXRlY3RlZClcIiB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyDjg63jgrDjgYzmiJDplbfjgZfjgZ8g4oaSIOaWsOOBl+OBhOmDqOWIhuOBq+ODnuODvOOCq+ODvOOBjOOBguOCi+OBi+eiuuiqjVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZmQgPSBmcy5vcGVuU3luYyhsb2dQYXRoLCBcInJcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdCeXRlcyA9IGN1cnJlbnRTaXplIC0gaW5pdGlhbFNpemU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuYWxsb2MobmV3Qnl0ZXMpO1xyXG4gICAgICAgICAgICAgICAgZnMucmVhZFN5bmMoZmQsIGJ1ZmZlciwgMCwgbmV3Qnl0ZXMsIGluaXRpYWxTaXplKTtcclxuICAgICAgICAgICAgICAgIGZzLmNsb3NlU3luYyhmZCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdDb250ZW50ID0gYnVmZmVyLnRvU3RyaW5nKFwidXRmOFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobmV3Q29udGVudC5pbmNsdWRlcyhNQVJLRVIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgY29tcGlsZWQ6IHRydWUsIHdhaXRlZE1zOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBjb21waWxlZDogZmFsc2UsIHRpbWVvdXQ6IHRydWUsIHdhaXRlZE1zOiB0aW1lb3V0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=