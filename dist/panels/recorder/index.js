"use strict";
const { createApp: createAppRec } = require("vue");
const panelDataMapRec = new WeakMap();
module.exports = Editor.Panel.define({
    template: `
<div id="app">
    <h2>Preview Recorder</h2>

    <div class="controls">
        <button v-if="!recording" @click="start" class="btn btn-start">● 録画開始</button>
        <button v-else @click="stop" class="btn btn-stop" :disabled="stopping">■ 録画停止{{ stopping ? '中...' : '' }}</button>
        <button @click="screenshot" class="btn btn-shot" :disabled="shooting">📸 スクショ{{ shooting ? '中...' : '' }}</button>
    </div>

    <div v-if="recording" class="status-row">
        <span class="rec-dot">●</span> REC <strong>{{ elapsed }}s</strong>
        <span class="info">{{ recordingInfo }}</span>
    </div>

    <div class="section-title">録画設定</div>
    <div class="row">
        <label>FPS:</label>
        <input type="number" v-model.number="fps" :disabled="recording" min="10" max="60" />
        <label>形式:</label>
        <select v-model="format" :disabled="recording">
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
        </select>
    </div>
    <div class="row">
        <label>品質:</label>
        <select v-model="quality" @change="onQualityChange" :disabled="recording">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="ultra">最高</option>
            <option value="custom">カスタム</option>
        </select>
        <label title="ビットレート = 幅 × 高さ × FPS × 品質係数">品質係数:</label>
        <input type="number" v-model.number="coefficient" @input="onCoefChange"
               :disabled="recording" min="0.01" max="2" step="0.01" class="custom-bitrate"
               title="ビットレート = 幅 × 高さ × FPS × 品質係数" />
        <button @click="resetQuality" class="btn btn-small" :disabled="recording" title="録画設定を初期値に戻す">↺</button>
    </div>

    <div class="section-title">スクショ設定</div>
    <div class="row">
        <label>形式:</label>
        <select v-model="shotFormat" :disabled="shooting">
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
        </select>
    </div>

    <div class="section-title">保存先</div>
    <div class="row">
        <input type="text" v-model="savePath" :disabled="recording" class="path-input" placeholder="temp/recordings" />
        <button @click="selectSaveFolder" class="btn btn-small" :disabled="recording">📁 選択</button>
        <button @click="resetSavePath" class="btn btn-small" :disabled="recording" title="保存先を初期値に戻す">↺</button>
    </div>
    <div class="row">
        <button @click="openSaveFolder" class="btn btn-small">📂 保存フォルダを開く</button>
        <label class="checkbox-label" title="ONにすると、録画/スクショ保存時に24時間以上前のファイルを OLD_yyyyMM フォルダに自動移動します"><input type="checkbox" v-model="autoArchive" @change="onAutoArchiveChange" /> 古いファイルを自動整理</label>
        <button class="btn btn-help" @click="showArchiveHelp = !showArchiveHelp" title="自動整理の説明">?</button>
    </div>
    <div v-if="showArchiveHelp" class="help-box">
        <strong>自動整理について</strong><br>
        ONにすると、録画やスクショを保存するたびに、24時間以上前の古いファイルを<br>
        <code>OLD_yyyyMM/</code> フォルダ（例: OLD_202604/）に自動で移動します。<br>
        保存フォルダ直下には直近のファイルだけが残り、整理された状態を保てます。
    </div>

    <div v-if="lastResult" class="result" :class="lastError ? 'error' : 'success'">
        <div v-if="!lastError">
            <strong>✓ {{ lastResult.kind === 'shot' ? 'スクショ保存' : '録画完了' }}</strong><br>
            <code>{{ lastResult.path }}</code><br>
            {{ (lastResult.size / 1024).toFixed(1) }} KB
        </div>
        <div v-else>
            <strong>✗ エラー:</strong> {{ lastResult.error || lastResult.message || 'unknown' }}
        </div>
    </div>

    <div class="note">
        ※ ゲームプレビュー実行中に使ってください（GameDebugClientが必要）
    </div>
</div>
    `,
    style: `
#app { padding: 16px; font-family: sans-serif; color: #ccc; font-size: 12px; }
h2 { margin: 0 0 12px 0; font-size: 18px; }
.controls { margin: 12px 0; }
.btn {
    padding: 10px 20px;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
}
.btn:disabled { background: #555; color: #999; cursor: not-allowed; }
.btn-start { background: #d44; }
.btn-start:hover { background: #e55; }
.btn-stop { background: #888; }
.btn-stop:hover { background: #999; }
.btn-shot { background: #468; margin-left: 8px; }
.btn-shot:hover { background: #579; }
.section-title {
    margin-top: 14px;
    margin-bottom: 4px;
    padding: 4px 0 3px 0;
    font-size: 11px;
    font-weight: bold;
    color: #8af;
    border-bottom: 1px solid #333;
}
.btn-small {
    padding: 4px 10px;
    background: #4a8;
    font-size: 11px;
    margin-left: 8px;
    font-weight: normal;
}
.btn-small:hover { background: #5b9; }
.status-row { margin: 10px 0; font-size: 14px; }
.rec-dot { color: #f44; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.3; } }
.info { color: #888; font-size: 11px; margin-left: 8px; }
.row { margin: 10px 0; display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
.row label { font-size: 12px; }
.row input { width: 60px; padding: 4px 8px; background: #222; color: #ccc; border: 1px solid #444; border-radius: 3px; }
.row select { padding: 4px 8px; background: #222; color: #ccc; border: 1px solid #444; border-radius: 3px; }
.path-input { flex: 1; min-width: 200px; width: auto !important; font-family: monospace; }
.custom-bitrate { width: 70px !important; }
.unit { font-size: 11px; color: #888; }
.result { margin: 12px 0; padding: 10px; border-radius: 4px; font-size: 12px; line-height: 1.5; }
.result.success { background: #1a3a1a; color: #afa; }
.result.error { background: #3a1a1a; color: #faa; }
.result code { font-size: 10px; word-break: break-all; background: #000; padding: 2px 4px; border-radius: 2px; }
.checkbox-label { font-size: 12px; display: flex; align-items: center; gap: 4px; margin-left: auto; cursor: pointer; }
.checkbox-label input[type="checkbox"] { cursor: pointer; }
.btn-help { padding: 2px 7px; background: #555; font-size: 11px; font-weight: bold; border-radius: 50%; min-width: 20px; margin-left: 4px; }
.btn-help:hover { background: #777; }
.help-box { margin: 8px 0; padding: 10px; background: #1a2a3a; border: 1px solid #345; border-radius: 4px; font-size: 11px; line-height: 1.6; color: #bcd; }
.help-box code { background: #000; padding: 1px 4px; border-radius: 2px; font-size: 10px; }
.note { margin-top: 16px; padding-top: 8px; border-top: 1px solid #333; font-size: 10px; color: #888; }
    `,
    $: { app: "#app" },
    ready() {
        if (!this.$.app)
            return;
        const MCP_BASE = "http://127.0.0.1:3000";
        const STORAGE_KEY = "cocos-mcp-recorder-settings";
        const PERSISTED_KEYS = ["fps", "quality", "coefficient", "format", "savePath", "shotFormat"];
        // localStorage から設定を読み込み
        const loadSettings = () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : {};
            }
            catch (_a) {
                return {};
            }
        };
        const saved = loadSettings();
        // プロジェクト設定から autoArchiveRecordings を読み込み
        const loadProjectConfig = () => {
            try {
                const fs = require("fs");
                const path = require("path");
                const p = path.join(Editor.Project.path, "settings", "cocos-creator-mcp.json");
                if (fs.existsSync(p))
                    return JSON.parse(fs.readFileSync(p, "utf-8"));
            }
            catch ( /* ignore */_a) { /* ignore */ }
            return {};
        };
        const projectCfg = loadProjectConfig();
        const app = createAppRec({
            data() {
                var _a, _b, _c, _d, _e, _f, _g;
                return {
                    recording: false,
                    stopping: false,
                    shooting: false,
                    elapsed: "0.0",
                    recordingInfo: "",
                    fps: (_a = saved.fps) !== null && _a !== void 0 ? _a : 30,
                    quality: (_b = saved.quality) !== null && _b !== void 0 ? _b : "medium",
                    coefficient: (_c = saved.coefficient) !== null && _c !== void 0 ? _c : 0.25,
                    format: (_d = saved.format) !== null && _d !== void 0 ? _d : "mp4",
                    savePath: (_e = saved.savePath) !== null && _e !== void 0 ? _e : "temp/recordings",
                    shotFormat: (_f = saved.shotFormat) !== null && _f !== void 0 ? _f : "png",
                    autoArchive: (_g = projectCfg.autoArchiveRecordings) !== null && _g !== void 0 ? _g : false,
                    showArchiveHelp: false,
                    lastResult: null,
                    lastError: false,
                    _startTime: 0,
                    _timer: null,
                    _aliveCheckTimer: null,
                };
            },
            watch: {
                fps() { this.saveSettings(); },
                quality() { this.saveSettings(); },
                coefficient() { this.saveSettings(); },
                format() { this.saveSettings(); },
                savePath() { this.saveSettings(); },
                shotFormat() { this.saveSettings(); },
            },
            methods: {
                saveSettings() {
                    const data = {};
                    for (const key of PERSISTED_KEYS)
                        data[key] = this[key];
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    }
                    catch ( /* ignore */_a) { /* ignore */ }
                },
                async isPreviewRunning() {
                    var _a, _b, _c;
                    try {
                        const res = await fetch(`${MCP_BASE}/mcp`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                jsonrpc: "2.0", id: 98, method: "tools/call",
                                params: {
                                    name: "debug_game_command",
                                    arguments: { type: "inspect", args: { name: "Canvas" }, timeout: 1500 },
                                },
                            }),
                        });
                        const json = await res.json();
                        const content = (_c = (_b = (_a = json.result) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text;
                        const parsed = content ? JSON.parse(content) : null;
                        return !!(parsed === null || parsed === void 0 ? void 0 : parsed.success);
                    }
                    catch (_d) {
                        return false;
                    }
                },
                async start() {
                    var _a, _b, _c, _d, _e;
                    this.lastResult = null;
                    if (!await this.isPreviewRunning()) {
                        this.lastResult = { error: "ゲームプレビューが実行されていません。プレビューを開始してから録画してください。" };
                        this.lastError = true;
                        return;
                    }
                    try {
                        const res = await fetch(`${MCP_BASE}/mcp`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                jsonrpc: "2.0",
                                id: 1,
                                method: "tools/call",
                                params: {
                                    name: "debug_record_start",
                                    arguments: {
                                        fps: this.fps,
                                        coefficient: this.coefficient,
                                        format: this.format,
                                        savePath: this.savePath,
                                    },
                                },
                            }),
                        });
                        const json = await res.json();
                        const content = (_c = (_b = (_a = json.result) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if ((parsed === null || parsed === void 0 ? void 0 : parsed.success) && ((_d = parsed.data) === null || _d === void 0 ? void 0 : _d.id)) {
                            this.recording = true;
                            const d = parsed.data;
                            const mbps = (d === null || d === void 0 ? void 0 : d.videoBitsPerSecond) ? (d.videoBitsPerSecond / 1000000).toFixed(2) : "?";
                            this.recordingInfo = `${(d === null || d === void 0 ? void 0 : d.canvasWidth) || "?"}x${(d === null || d === void 0 ? void 0 : d.canvasHeight) || "?"} @ ${(d === null || d === void 0 ? void 0 : d.fps) || "?"}fps / ${mbps}Mbps / ${(d === null || d === void 0 ? void 0 : d.mimeType) || ""}`;
                            this._startTime = Date.now();
                            this._timer = setInterval(() => {
                                this.elapsed = ((Date.now() - this._startTime) / 1000).toFixed(1);
                            }, 100);
                            // プレビュー停止検知用ポーリング（2秒毎）
                            this._aliveCheckTimer = setInterval(() => {
                                this.checkPreviewAlive();
                            }, 2000);
                        }
                        else {
                            // 可能な限り詳細なエラー情報を表示
                            const errDetail = ((_e = parsed === null || parsed === void 0 ? void 0 : parsed.data) === null || _e === void 0 ? void 0 : _e.error)
                                || (parsed === null || parsed === void 0 ? void 0 : parsed.error)
                                || ((parsed === null || parsed === void 0 ? void 0 : parsed.data) ? JSON.stringify(parsed.data) : null)
                                || (parsed ? JSON.stringify(parsed).substring(0, 200) : "no response")
                                || "録画開始失敗";
                            this.lastResult = { error: errDetail };
                            this.lastError = true;
                        }
                    }
                    catch (e) {
                        this.lastResult = { error: `通信エラー: ${e.message}` };
                        this.lastError = true;
                    }
                },
                async stop() {
                    var _a, _b, _c, _d, _e;
                    this.stopping = true;
                    try {
                        const res = await fetch(`${MCP_BASE}/mcp`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                jsonrpc: "2.0",
                                id: 2,
                                method: "tools/call",
                                params: {
                                    name: "debug_record_stop",
                                    arguments: { timeout: 60000 },
                                },
                            }),
                        });
                        const json = await res.json();
                        const content = (_c = (_b = (_a = json.result) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if ((parsed === null || parsed === void 0 ? void 0 : parsed.success) && ((_d = parsed.data) === null || _d === void 0 ? void 0 : _d.path)) {
                            this.lastResult = { path: parsed.data.path, size: parsed.data.size };
                            this.lastError = false;
                        }
                        else {
                            const errDetail = ((_e = parsed === null || parsed === void 0 ? void 0 : parsed.data) === null || _e === void 0 ? void 0 : _e.error)
                                || (parsed === null || parsed === void 0 ? void 0 : parsed.error)
                                || ((parsed === null || parsed === void 0 ? void 0 : parsed.data) ? JSON.stringify(parsed.data) : null)
                                || "録画停止失敗";
                            this.lastResult = { error: errDetail };
                            this.lastError = true;
                        }
                    }
                    catch (e) {
                        this.lastResult = { error: `通信エラー: ${e.message}` };
                        this.lastError = true;
                    }
                    finally {
                        this.recording = false;
                        this.stopping = false;
                        if (this._timer) {
                            clearInterval(this._timer);
                            this._timer = null;
                        }
                        if (this._aliveCheckTimer) {
                            clearInterval(this._aliveCheckTimer);
                            this._aliveCheckTimer = null;
                        }
                    }
                },
                onQualityChange() {
                    const map = { low: 0.15, medium: 0.25, high: 0.40, ultra: 0.60 };
                    if (this.quality !== "custom")
                        this.coefficient = map[this.quality];
                },
                onCoefChange() {
                    const map = { 0.15: "low", 0.25: "medium", 0.40: "high", 0.60: "ultra" };
                    this.quality = map[this.coefficient] || "custom";
                },
                resetQuality() {
                    this.fps = 30;
                    this.quality = "medium";
                    this.coefficient = 0.25;
                    this.format = "mp4";
                },
                resetSavePath() {
                    this.savePath = "temp/recordings";
                },
                onAutoArchiveChange() {
                    try {
                        const fs = require("fs");
                        const path = require("path");
                        const p = path.join(Editor.Project.path, "settings", "cocos-creator-mcp.json");
                        let cfg = {};
                        if (fs.existsSync(p))
                            cfg = JSON.parse(fs.readFileSync(p, "utf-8"));
                        cfg.autoArchiveRecordings = this.autoArchive;
                        const dir = path.dirname(p);
                        if (!fs.existsSync(dir))
                            fs.mkdirSync(dir, { recursive: true });
                        fs.writeFileSync(p, JSON.stringify(cfg, null, 2), "utf-8");
                    }
                    catch (e) {
                        console.warn("[recorder] 設定保存失敗:", e);
                    }
                },
                async screenshot() {
                    var _a, _b, _c;
                    this.shooting = true;
                    if (!await this.isPreviewRunning()) {
                        this.lastResult = { error: "ゲームプレビューが実行されていません。プレビューを開始してからスクショしてください。" };
                        this.lastError = true;
                        this.shooting = false;
                        return;
                    }
                    try {
                        const res = await fetch(`${MCP_BASE}/mcp`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                jsonrpc: "2.0",
                                id: 3,
                                method: "tools/call",
                                params: {
                                    name: "debug_game_command",
                                    arguments: { type: "screenshot", args: {}, timeout: 5000, maxWidth: 0, imageFormat: this.shotFormat },
                                },
                            }),
                        });
                        const json = await res.json();
                        const content = (_c = (_b = (_a = json.result) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if ((parsed === null || parsed === void 0 ? void 0 : parsed.success) && parsed.path) {
                            // savePath 配下にコピー
                            const fs = require("fs");
                            const path = require("path");
                            const projectPath = Editor.Project.path;
                            let destDir = this.savePath || "temp/recordings";
                            if (!path.isAbsolute(destDir))
                                destDir = path.join(projectPath, destDir);
                            if (!fs.existsSync(destDir))
                                fs.mkdirSync(destDir, { recursive: true });
                            const ts = new Date().toISOString().replace(/[:.]/g, "-");
                            const ext = path.extname(parsed.path) || ".png";
                            const destPath = path.join(destDir, `screenshot_${ts}${ext}`);
                            fs.copyFileSync(parsed.path, destPath);
                            // 設定に応じて古いファイルをアーカイブ
                            try {
                                const settingsPath = path.join(projectPath, "settings", "cocos-creator-mcp.json");
                                if (fs.existsSync(settingsPath)) {
                                    const cfg = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
                                    if (cfg.autoArchiveRecordings) {
                                        const { archiveOldFiles } = require("../../archive");
                                        archiveOldFiles(destDir);
                                    }
                                }
                            }
                            catch ( /* ignore */_d) { /* ignore */ }
                            this.lastResult = { kind: "shot", path: destPath, size: parsed.size };
                            this.lastError = false;
                        }
                        else {
                            const errDetail = (parsed === null || parsed === void 0 ? void 0 : parsed.error) || (parsed === null || parsed === void 0 ? void 0 : parsed.message) || "スクショ失敗";
                            this.lastResult = { error: errDetail };
                            this.lastError = true;
                        }
                    }
                    catch (e) {
                        this.lastResult = { error: `通信エラー: ${e.message}` };
                        this.lastError = true;
                    }
                    finally {
                        this.shooting = false;
                    }
                },
                async checkPreviewAlive() {
                    var _a, _b, _c;
                    if (!this.recording)
                        return;
                    try {
                        // MCP経由で軽量なinspectコマンドを送る
                        const res = await fetch(`${MCP_BASE}/mcp`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                jsonrpc: "2.0", id: 99, method: "tools/call",
                                params: {
                                    name: "debug_game_command",
                                    arguments: { type: "inspect", args: { name: "Canvas" }, timeout: 1500 },
                                },
                            }),
                        });
                        const json = await res.json();
                        const content = (_c = (_b = (_a = json.result) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if (parsed === null || parsed === void 0 ? void 0 : parsed.success) {
                            // プレビュー生存
                            return;
                        }
                        // 応答なし → プレビュー停止とみなして録画停止状態に
                        console.warn("[PreviewRecorder] preview not responding, stopping recording state");
                        this.recording = false;
                        if (this._timer) {
                            clearInterval(this._timer);
                            this._timer = null;
                        }
                        if (this._aliveCheckTimer) {
                            clearInterval(this._aliveCheckTimer);
                            this._aliveCheckTimer = null;
                        }
                        this.lastResult = { error: "プレビューが停止したため録画を中断しました（動画は保存されません）" };
                        this.lastError = true;
                    }
                    catch (e) {
                        // ネットワークエラーは通信エラーとして無視（一時的かもしれない）
                    }
                },
                async selectSaveFolder() {
                    var _a;
                    try {
                        const result = await Editor.Dialog.select({
                            title: "保存先フォルダを選択",
                            type: "directory",
                            multi: false,
                        });
                        if ((_a = result === null || result === void 0 ? void 0 : result.filePaths) === null || _a === void 0 ? void 0 : _a.length) {
                            const path = require("path");
                            const projectPath = Editor.Project.path;
                            const absPath = result.filePaths[0];
                            // プロジェクト配下なら相対パスで保持
                            const relPath = path.relative(projectPath, absPath);
                            if (!relPath.startsWith("..") && !path.isAbsolute(relPath)) {
                                this.savePath = relPath.replace(/\\/g, "/");
                            }
                            else {
                                this.savePath = absPath;
                            }
                        }
                    }
                    catch (e) {
                        console.error("[PreviewRecorder] selectSaveFolder failed:", e);
                    }
                },
                openSaveFolder() {
                    const path = require("path");
                    const fs = require("fs");
                    const projectPath = Editor.Project.path;
                    let dir = this.savePath || "temp/recordings";
                    if (!path.isAbsolute(dir))
                        dir = path.join(projectPath, dir);
                    if (!fs.existsSync(dir))
                        fs.mkdirSync(dir, { recursive: true });
                    try {
                        const { spawn } = require("child_process");
                        const platform = process.platform;
                        const [cmd, ...args] = platform === "win32"
                            ? ["explorer.exe", dir.replace(/\//g, "\\")]
                            : platform === "darwin"
                                ? ["open", dir]
                                : ["xdg-open", dir];
                        const p = spawn(cmd, args, { detached: true, stdio: "ignore" });
                        p.unref();
                    }
                    catch (e) {
                        console.error("[PreviewRecorder] openSaveFolder failed:", e);
                        this.lastResult = { error: `フォルダを開けませんでした: ${e.message}` };
                        this.lastError = true;
                    }
                },
                openFolder() {
                    var _a;
                    if (!((_a = this.lastResult) === null || _a === void 0 ? void 0 : _a.path))
                        return;
                    const filePath = this.lastResult.path;
                    try {
                        const { shell } = require("electron");
                        if (shell === null || shell === void 0 ? void 0 : shell.showItemInFolder) {
                            shell.showItemInFolder(filePath);
                            return;
                        }
                    }
                    catch (e) { /* fallback */ }
                    // フォールバック: OS別コマンド
                    try {
                        const { exec } = require("child_process");
                        const platform = process.platform;
                        if (platform === "win32") {
                            exec(`explorer.exe /select,"${filePath.replace(/\//g, "\\")}"`);
                        }
                        else if (platform === "darwin") {
                            exec(`open -R "${filePath}"`);
                        }
                        else {
                            const dir = require("path").dirname(filePath);
                            exec(`xdg-open "${dir}"`);
                        }
                    }
                    catch (e) {
                        console.error("[PreviewRecorder] openFolder failed:", e);
                    }
                },
            },
        });
        app.mount(this.$.app);
        panelDataMapRec.set(this, app);
    },
    beforeClose() { },
    close() {
        const app = panelDataMapRec.get(this);
        if (app)
            app.unmount();
        panelDataMapRec.delete(this);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL3JlY29yZGVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxNQUFNLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUVuRCxNQUFNLGVBQWUsR0FBRyxJQUFJLE9BQU8sRUFBWSxDQUFDO0FBRWhELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDakMsUUFBUSxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQW1GVDtJQUNELEtBQUssRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7S0EyRE47SUFDRCxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFO0lBQ2xCLEtBQUs7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO1lBQUUsT0FBTztRQUN4QixNQUFNLFFBQVEsR0FBRyx1QkFBdUIsQ0FBQztRQUN6QyxNQUFNLFdBQVcsR0FBRyw2QkFBNkIsQ0FBQztRQUNsRCxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDN0YseUJBQXlCO1FBQ3pCLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtZQUN0QixJQUFJLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDOUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FB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LGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsSUFBSSxHQUFHO1lBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgY3JlYXRlQXBwOiBjcmVhdGVBcHBSZWMgfSA9IHJlcXVpcmUoXCJ2dWVcIik7XHJcblxyXG5jb25zdCBwYW5lbERhdGFNYXBSZWMgPSBuZXcgV2Vha01hcDxhbnksIGFueT4oKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmRlZmluZSh7XHJcbiAgICB0ZW1wbGF0ZTogYFxyXG48ZGl2IGlkPVwiYXBwXCI+XHJcbiAgICA8aDI+UHJldmlldyBSZWNvcmRlcjwvaDI+XHJcblxyXG4gICAgPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+XHJcbiAgICAgICAgPGJ1dHRvbiB2LWlmPVwiIXJlY29yZGluZ1wiIEBjbGljaz1cInN0YXJ0XCIgY2xhc3M9XCJidG4gYnRuLXN0YXJ0XCI+4pePIOmMsueUu+mWi+WnizwvYnV0dG9uPlxyXG4gICAgICAgIDxidXR0b24gdi1lbHNlIEBjbGljaz1cInN0b3BcIiBjbGFzcz1cImJ0biBidG4tc3RvcFwiIDpkaXNhYmxlZD1cInN0b3BwaW5nXCI+4pagIOmMsueUu+WBnOatont7IHN0b3BwaW5nID8gJ+S4rS4uLicgOiAnJyB9fTwvYnV0dG9uPlxyXG4gICAgICAgIDxidXR0b24gQGNsaWNrPVwic2NyZWVuc2hvdFwiIGNsYXNzPVwiYnRuIGJ0bi1zaG90XCIgOmRpc2FibGVkPVwic2hvb3RpbmdcIj7wn5O4IOOCueOCr+OCt+ODp3t7IHNob290aW5nID8gJ+S4rS4uLicgOiAnJyB9fTwvYnV0dG9uPlxyXG4gICAgPC9kaXY+XHJcblxyXG4gICAgPGRpdiB2LWlmPVwicmVjb3JkaW5nXCIgY2xhc3M9XCJzdGF0dXMtcm93XCI+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJyZWMtZG90XCI+4pePPC9zcGFuPiBSRUMgPHN0cm9uZz57eyBlbGFwc2VkIH19czwvc3Ryb25nPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPVwiaW5mb1wiPnt7IHJlY29yZGluZ0luZm8gfX08L3NwYW4+XHJcbiAgICA8L2Rpdj5cclxuXHJcbiAgICA8ZGl2IGNsYXNzPVwic2VjdGlvbi10aXRsZVwiPumMsueUu+ioreWumjwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cInJvd1wiPlxyXG4gICAgICAgIDxsYWJlbD5GUFM6PC9sYWJlbD5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cIm51bWJlclwiIHYtbW9kZWwubnVtYmVyPVwiZnBzXCIgOmRpc2FibGVkPVwicmVjb3JkaW5nXCIgbWluPVwiMTBcIiBtYXg9XCI2MFwiIC8+XHJcbiAgICAgICAgPGxhYmVsPuW9ouW8jzo8L2xhYmVsPlxyXG4gICAgICAgIDxzZWxlY3Qgdi1tb2RlbD1cImZvcm1hdFwiIDpkaXNhYmxlZD1cInJlY29yZGluZ1wiPlxyXG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibXA0XCI+TVA0PC9vcHRpb24+XHJcbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJ3ZWJtXCI+V2ViTTwvb3B0aW9uPlxyXG4gICAgICAgIDwvc2VsZWN0PlxyXG4gICAgPC9kaXY+XHJcbiAgICA8ZGl2IGNsYXNzPVwicm93XCI+XHJcbiAgICAgICAgPGxhYmVsPuWTgeizqjo8L2xhYmVsPlxyXG4gICAgICAgIDxzZWxlY3Qgdi1tb2RlbD1cInF1YWxpdHlcIiBAY2hhbmdlPVwib25RdWFsaXR5Q2hhbmdlXCIgOmRpc2FibGVkPVwicmVjb3JkaW5nXCI+XHJcbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJsb3dcIj7kvY48L29wdGlvbj5cclxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIm1lZGl1bVwiPuS4rTwvb3B0aW9uPlxyXG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiaGlnaFwiPumrmDwvb3B0aW9uPlxyXG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwidWx0cmFcIj7mnIDpq5g8L29wdGlvbj5cclxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImN1c3RvbVwiPuOCq+OCueOCv+ODoDwvb3B0aW9uPlxyXG4gICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgIDxsYWJlbCB0aXRsZT1cIuODk+ODg+ODiOODrOODvOODiCA9IOW5hSDDlyDpq5jjgZUgw5cgRlBTIMOXIOWTgeizquS/guaVsFwiPuWTgeizquS/guaVsDo8L2xhYmVsPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwibnVtYmVyXCIgdi1tb2RlbC5udW1iZXI9XCJjb2VmZmljaWVudFwiIEBpbnB1dD1cIm9uQ29lZkNoYW5nZVwiXHJcbiAgICAgICAgICAgICAgIDpkaXNhYmxlZD1cInJlY29yZGluZ1wiIG1pbj1cIjAuMDFcIiBtYXg9XCIyXCIgc3RlcD1cIjAuMDFcIiBjbGFzcz1cImN1c3RvbS1iaXRyYXRlXCJcclxuICAgICAgICAgICAgICAgdGl0bGU9XCLjg5Pjg4Pjg4jjg6zjg7zjg4ggPSDluYUgw5cg6auY44GVIMOXIEZQUyDDlyDlk4Hos6rkv4LmlbBcIiAvPlxyXG4gICAgICAgIDxidXR0b24gQGNsaWNrPVwicmVzZXRRdWFsaXR5XCIgY2xhc3M9XCJidG4gYnRuLXNtYWxsXCIgOmRpc2FibGVkPVwicmVjb3JkaW5nXCIgdGl0bGU9XCLpjLLnlLvoqK3lrprjgpLliJ3mnJ/lgKTjgavmiLvjgZlcIj7ihro8L2J1dHRvbj5cclxuICAgIDwvZGl2PlxyXG5cclxuICAgIDxkaXYgY2xhc3M9XCJzZWN0aW9uLXRpdGxlXCI+44K544Kv44K344On6Kit5a6aPC9kaXY+XHJcbiAgICA8ZGl2IGNsYXNzPVwicm93XCI+XHJcbiAgICAgICAgPGxhYmVsPuW9ouW8jzo8L2xhYmVsPlxyXG4gICAgICAgIDxzZWxlY3Qgdi1tb2RlbD1cInNob3RGb3JtYXRcIiA6ZGlzYWJsZWQ9XCJzaG9vdGluZ1wiPlxyXG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicG5nXCI+UE5HPC9vcHRpb24+XHJcbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJ3ZWJwXCI+V2ViUDwvb3B0aW9uPlxyXG4gICAgICAgIDwvc2VsZWN0PlxyXG4gICAgPC9kaXY+XHJcblxyXG4gICAgPGRpdiBjbGFzcz1cInNlY3Rpb24tdGl0bGVcIj7kv53lrZjlhYg8L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJyb3dcIj5cclxuICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiB2LW1vZGVsPVwic2F2ZVBhdGhcIiA6ZGlzYWJsZWQ9XCJyZWNvcmRpbmdcIiBjbGFzcz1cInBhdGgtaW5wdXRcIiBwbGFjZWhvbGRlcj1cInRlbXAvcmVjb3JkaW5nc1wiIC8+XHJcbiAgICAgICAgPGJ1dHRvbiBAY2xpY2s9XCJzZWxlY3RTYXZlRm9sZGVyXCIgY2xhc3M9XCJidG4gYnRuLXNtYWxsXCIgOmRpc2FibGVkPVwicmVjb3JkaW5nXCI+8J+TgSDpgbjmip48L2J1dHRvbj5cclxuICAgICAgICA8YnV0dG9uIEBjbGljaz1cInJlc2V0U2F2ZVBhdGhcIiBjbGFzcz1cImJ0biBidG4tc21hbGxcIiA6ZGlzYWJsZWQ9XCJyZWNvcmRpbmdcIiB0aXRsZT1cIuS/neWtmOWFiOOCkuWIneacn+WApOOBq+aIu+OBmVwiPuKGujwvYnV0dG9uPlxyXG4gICAgPC9kaXY+XHJcbiAgICA8ZGl2IGNsYXNzPVwicm93XCI+XHJcbiAgICAgICAgPGJ1dHRvbiBAY2xpY2s9XCJvcGVuU2F2ZUZvbGRlclwiIGNsYXNzPVwiYnRuIGJ0bi1zbWFsbFwiPvCfk4Ig5L+d5a2Y44OV44Kp44Or44OA44KS6ZaL44GPPC9idXR0b24+XHJcbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3gtbGFiZWxcIiB0aXRsZT1cIk9O44Gr44GZ44KL44Go44CB6Yyy55S7L+OCueOCr+OCt+ODp+S/neWtmOaZguOBqzI05pmC6ZaT5Lul5LiK5YmN44Gu44OV44Kh44Kk44Or44KSIE9MRF95eXl5TU0g44OV44Kp44Or44OA44Gr6Ieq5YuV56e75YuV44GX44G+44GZXCI+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiIHYtbW9kZWw9XCJhdXRvQXJjaGl2ZVwiIEBjaGFuZ2U9XCJvbkF1dG9BcmNoaXZlQ2hhbmdlXCIgLz4g5Y+k44GE44OV44Kh44Kk44Or44KS6Ieq5YuV5pW055CGPC9sYWJlbD5cclxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1oZWxwXCIgQGNsaWNrPVwic2hvd0FyY2hpdmVIZWxwID0gIXNob3dBcmNoaXZlSGVscFwiIHRpdGxlPVwi6Ieq5YuV5pW055CG44Gu6Kqs5piOXCI+PzwvYnV0dG9uPlxyXG4gICAgPC9kaXY+XHJcbiAgICA8ZGl2IHYtaWY9XCJzaG93QXJjaGl2ZUhlbHBcIiBjbGFzcz1cImhlbHAtYm94XCI+XHJcbiAgICAgICAgPHN0cm9uZz7oh6rli5XmlbTnkIbjgavjgaTjgYTjgaY8L3N0cm9uZz48YnI+XHJcbiAgICAgICAgT07jgavjgZnjgovjgajjgIHpjLLnlLvjgoTjgrnjgq/jgrfjg6fjgpLkv53lrZjjgZnjgovjgZ/jgbPjgavjgIEyNOaZgumWk+S7peS4iuWJjeOBruWPpOOBhOODleOCoeOCpOODq+OCkjxicj5cclxuICAgICAgICA8Y29kZT5PTERfeXl5eU1NLzwvY29kZT4g44OV44Kp44Or44OA77yI5L6LOiBPTERfMjAyNjA0L++8ieOBq+iHquWLleOBp+enu+WLleOBl+OBvuOBmeOAgjxicj5cclxuICAgICAgICDkv53lrZjjg5Xjgqnjg6vjg4Dnm7TkuIvjgavjga/nm7Tov5Hjga7jg5XjgqHjgqTjg6vjgaDjgZHjgYzmrovjgorjgIHmlbTnkIbjgZXjgozjgZ/nirbmhYvjgpLkv53jgabjgb7jgZnjgIJcclxuICAgIDwvZGl2PlxyXG5cclxuICAgIDxkaXYgdi1pZj1cImxhc3RSZXN1bHRcIiBjbGFzcz1cInJlc3VsdFwiIDpjbGFzcz1cImxhc3RFcnJvciA/ICdlcnJvcicgOiAnc3VjY2VzcydcIj5cclxuICAgICAgICA8ZGl2IHYtaWY9XCIhbGFzdEVycm9yXCI+XHJcbiAgICAgICAgICAgIDxzdHJvbmc+4pyTIHt7IGxhc3RSZXN1bHQua2luZCA9PT0gJ3Nob3QnID8gJ+OCueOCr+OCt+ODp+S/neWtmCcgOiAn6Yyy55S75a6M5LqGJyB9fTwvc3Ryb25nPjxicj5cclxuICAgICAgICAgICAgPGNvZGU+e3sgbGFzdFJlc3VsdC5wYXRoIH19PC9jb2RlPjxicj5cclxuICAgICAgICAgICAge3sgKGxhc3RSZXN1bHQuc2l6ZSAvIDEwMjQpLnRvRml4ZWQoMSkgfX0gS0JcclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IHYtZWxzZT5cclxuICAgICAgICAgICAgPHN0cm9uZz7inJcg44Ko44Op44O8Ojwvc3Ryb25nPiB7eyBsYXN0UmVzdWx0LmVycm9yIHx8IGxhc3RSZXN1bHQubWVzc2FnZSB8fCAndW5rbm93bicgfX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG5cclxuICAgIDxkaXYgY2xhc3M9XCJub3RlXCI+XHJcbiAgICAgICAg4oC7IOOCsuODvOODoOODl+ODrOODk+ODpeODvOWun+ihjOS4reOBq+S9v+OBo+OBpuOBj+OBoOOBleOBhO+8iEdhbWVEZWJ1Z0NsaWVudOOBjOW/heimge+8iVxyXG4gICAgPC9kaXY+XHJcbjwvZGl2PlxyXG4gICAgYCxcclxuICAgIHN0eWxlOiBgXHJcbiNhcHAgeyBwYWRkaW5nOiAxNnB4OyBmb250LWZhbWlseTogc2Fucy1zZXJpZjsgY29sb3I6ICNjY2M7IGZvbnQtc2l6ZTogMTJweDsgfVxyXG5oMiB7IG1hcmdpbjogMCAwIDEycHggMDsgZm9udC1zaXplOiAxOHB4OyB9XHJcbi5jb250cm9scyB7IG1hcmdpbjogMTJweCAwOyB9XHJcbi5idG4ge1xyXG4gICAgcGFkZGluZzogMTBweCAyMHB4O1xyXG4gICAgY29sb3I6ICNmZmY7XHJcbiAgICBib3JkZXI6IG5vbmU7XHJcbiAgICBib3JkZXItcmFkaXVzOiA0cHg7XHJcbiAgICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgICBmb250LXNpemU6IDE0cHg7XHJcbiAgICBmb250LXdlaWdodDogYm9sZDtcclxufVxyXG4uYnRuOmRpc2FibGVkIHsgYmFja2dyb3VuZDogIzU1NTsgY29sb3I6ICM5OTk7IGN1cnNvcjogbm90LWFsbG93ZWQ7IH1cclxuLmJ0bi1zdGFydCB7IGJhY2tncm91bmQ6ICNkNDQ7IH1cclxuLmJ0bi1zdGFydDpob3ZlciB7IGJhY2tncm91bmQ6ICNlNTU7IH1cclxuLmJ0bi1zdG9wIHsgYmFja2dyb3VuZDogIzg4ODsgfVxyXG4uYnRuLXN0b3A6aG92ZXIgeyBiYWNrZ3JvdW5kOiAjOTk5OyB9XHJcbi5idG4tc2hvdCB7IGJhY2tncm91bmQ6ICM0Njg7IG1hcmdpbi1sZWZ0OiA4cHg7IH1cclxuLmJ0bi1zaG90OmhvdmVyIHsgYmFja2dyb3VuZDogIzU3OTsgfVxyXG4uc2VjdGlvbi10aXRsZSB7XHJcbiAgICBtYXJnaW4tdG9wOiAxNHB4O1xyXG4gICAgbWFyZ2luLWJvdHRvbTogNHB4O1xyXG4gICAgcGFkZGluZzogNHB4IDAgM3B4IDA7XHJcbiAgICBmb250LXNpemU6IDExcHg7XHJcbiAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgIGNvbG9yOiAjOGFmO1xyXG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICMzMzM7XHJcbn1cclxuLmJ0bi1zbWFsbCB7XHJcbiAgICBwYWRkaW5nOiA0cHggMTBweDtcclxuICAgIGJhY2tncm91bmQ6ICM0YTg7XHJcbiAgICBmb250LXNpemU6IDExcHg7XHJcbiAgICBtYXJnaW4tbGVmdDogOHB4O1xyXG4gICAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcclxufVxyXG4uYnRuLXNtYWxsOmhvdmVyIHsgYmFja2dyb3VuZDogIzViOTsgfVxyXG4uc3RhdHVzLXJvdyB7IG1hcmdpbjogMTBweCAwOyBmb250LXNpemU6IDE0cHg7IH1cclxuLnJlYy1kb3QgeyBjb2xvcjogI2Y0NDsgYW5pbWF0aW9uOiBibGluayAxcyBpbmZpbml0ZTsgfVxyXG5Aa2V5ZnJhbWVzIGJsaW5rIHsgNTAlIHsgb3BhY2l0eTogMC4zOyB9IH1cclxuLmluZm8geyBjb2xvcjogIzg4ODsgZm9udC1zaXplOiAxMXB4OyBtYXJnaW4tbGVmdDogOHB4OyB9XHJcbi5yb3cgeyBtYXJnaW46IDEwcHggMDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiA4cHg7IGZsZXgtd3JhcDogbm93cmFwOyB9XHJcbi5yb3cgbGFiZWwgeyBmb250LXNpemU6IDEycHg7IH1cclxuLnJvdyBpbnB1dCB7IHdpZHRoOiA2MHB4OyBwYWRkaW5nOiA0cHggOHB4OyBiYWNrZ3JvdW5kOiAjMjIyOyBjb2xvcjogI2NjYzsgYm9yZGVyOiAxcHggc29saWQgIzQ0NDsgYm9yZGVyLXJhZGl1czogM3B4OyB9XHJcbi5yb3cgc2VsZWN0IHsgcGFkZGluZzogNHB4IDhweDsgYmFja2dyb3VuZDogIzIyMjsgY29sb3I6ICNjY2M7IGJvcmRlcjogMXB4IHNvbGlkICM0NDQ7IGJvcmRlci1yYWRpdXM6IDNweDsgfVxyXG4ucGF0aC1pbnB1dCB7IGZsZXg6IDE7IG1pbi13aWR0aDogMjAwcHg7IHdpZHRoOiBhdXRvICFpbXBvcnRhbnQ7IGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7IH1cclxuLmN1c3RvbS1iaXRyYXRlIHsgd2lkdGg6IDcwcHggIWltcG9ydGFudDsgfVxyXG4udW5pdCB7IGZvbnQtc2l6ZTogMTFweDsgY29sb3I6ICM4ODg7IH1cclxuLnJlc3VsdCB7IG1hcmdpbjogMTJweCAwOyBwYWRkaW5nOiAxMHB4OyBib3JkZXItcmFkaXVzOiA0cHg7IGZvbnQtc2l6ZTogMTJweDsgbGluZS1oZWlnaHQ6IDEuNTsgfVxyXG4ucmVzdWx0LnN1Y2Nlc3MgeyBiYWNrZ3JvdW5kOiAjMWEzYTFhOyBjb2xvcjogI2FmYTsgfVxyXG4ucmVzdWx0LmVycm9yIHsgYmFja2dyb3VuZDogIzNhMWExYTsgY29sb3I6ICNmYWE7IH1cclxuLnJlc3VsdCBjb2RlIHsgZm9udC1zaXplOiAxMHB4OyB3b3JkLWJyZWFrOiBicmVhay1hbGw7IGJhY2tncm91bmQ6ICMwMDA7IHBhZGRpbmc6IDJweCA0cHg7IGJvcmRlci1yYWRpdXM6IDJweDsgfVxyXG4uY2hlY2tib3gtbGFiZWwgeyBmb250LXNpemU6IDEycHg7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGdhcDogNHB4OyBtYXJnaW4tbGVmdDogYXV0bzsgY3Vyc29yOiBwb2ludGVyOyB9XHJcbi5jaGVja2JveC1sYWJlbCBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0geyBjdXJzb3I6IHBvaW50ZXI7IH1cclxuLmJ0bi1oZWxwIHsgcGFkZGluZzogMnB4IDdweDsgYmFja2dyb3VuZDogIzU1NTsgZm9udC1zaXplOiAxMXB4OyBmb250LXdlaWdodDogYm9sZDsgYm9yZGVyLXJhZGl1czogNTAlOyBtaW4td2lkdGg6IDIwcHg7IG1hcmdpbi1sZWZ0OiA0cHg7IH1cclxuLmJ0bi1oZWxwOmhvdmVyIHsgYmFja2dyb3VuZDogIzc3NzsgfVxyXG4uaGVscC1ib3ggeyBtYXJnaW46IDhweCAwOyBwYWRkaW5nOiAxMHB4OyBiYWNrZ3JvdW5kOiAjMWEyYTNhOyBib3JkZXI6IDFweCBzb2xpZCAjMzQ1OyBib3JkZXItcmFkaXVzOiA0cHg7IGZvbnQtc2l6ZTogMTFweDsgbGluZS1oZWlnaHQ6IDEuNjsgY29sb3I6ICNiY2Q7IH1cclxuLmhlbHAtYm94IGNvZGUgeyBiYWNrZ3JvdW5kOiAjMDAwOyBwYWRkaW5nOiAxcHggNHB4OyBib3JkZXItcmFkaXVzOiAycHg7IGZvbnQtc2l6ZTogMTBweDsgfVxyXG4ubm90ZSB7IG1hcmdpbi10b3A6IDE2cHg7IHBhZGRpbmctdG9wOiA4cHg7IGJvcmRlci10b3A6IDFweCBzb2xpZCAjMzMzOyBmb250LXNpemU6IDEwcHg7IGNvbG9yOiAjODg4OyB9XHJcbiAgICBgLFxyXG4gICAgJDogeyBhcHA6IFwiI2FwcFwiIH0sXHJcbiAgICByZWFkeSgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuJC5hcHApIHJldHVybjtcclxuICAgICAgICBjb25zdCBNQ1BfQkFTRSA9IFwiaHR0cDovLzEyNy4wLjAuMTozMDAwXCI7XHJcbiAgICAgICAgY29uc3QgU1RPUkFHRV9LRVkgPSBcImNvY29zLW1jcC1yZWNvcmRlci1zZXR0aW5nc1wiO1xyXG4gICAgICAgIGNvbnN0IFBFUlNJU1RFRF9LRVlTID0gW1wiZnBzXCIsIFwicXVhbGl0eVwiLCBcImNvZWZmaWNpZW50XCIsIFwiZm9ybWF0XCIsIFwic2F2ZVBhdGhcIiwgXCJzaG90Rm9ybWF0XCJdO1xyXG4gICAgICAgIC8vIGxvY2FsU3RvcmFnZSDjgYvjgonoqK3lrprjgpLoqq3jgb/ovrzjgb9cclxuICAgICAgICBjb25zdCBsb2FkU2V0dGluZ3MgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByYXcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShTVE9SQUdFX0tFWSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3ID8gSlNPTi5wYXJzZShyYXcpIDoge307XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyByZXR1cm4ge307IH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IHNhdmVkID0gbG9hZFNldHRpbmdzKCk7XHJcbiAgICAgICAgLy8g44OX44Ot44K444Kn44Kv44OI6Kit5a6a44GL44KJIGF1dG9BcmNoaXZlUmVjb3JkaW5ncyDjgpLoqq3jgb/ovrzjgb9cclxuICAgICAgICBjb25zdCBsb2FkUHJvamVjdENvbmZpZyA9ICgpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcInNldHRpbmdzXCIsIFwiY29jb3MtY3JlYXRvci1tY3AuanNvblwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHApKSByZXR1cm4gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocCwgXCJ1dGYtOFwiKSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxyXG4gICAgICAgICAgICByZXR1cm4ge307XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCBwcm9qZWN0Q2ZnID0gbG9hZFByb2plY3RDb25maWcoKTtcclxuICAgICAgICBjb25zdCBhcHAgPSBjcmVhdGVBcHBSZWMoe1xyXG4gICAgICAgICAgICBkYXRhKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICByZWNvcmRpbmc6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0b3BwaW5nOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBzaG9vdGluZzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxhcHNlZDogXCIwLjBcIixcclxuICAgICAgICAgICAgICAgICAgICByZWNvcmRpbmdJbmZvOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZwczogc2F2ZWQuZnBzID8/IDMwLFxyXG4gICAgICAgICAgICAgICAgICAgIHF1YWxpdHk6IHNhdmVkLnF1YWxpdHkgPz8gXCJtZWRpdW1cIixcclxuICAgICAgICAgICAgICAgICAgICBjb2VmZmljaWVudDogc2F2ZWQuY29lZmZpY2llbnQgPz8gMC4yNSxcclxuICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHNhdmVkLmZvcm1hdCA/PyBcIm1wNFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiBzYXZlZC5zYXZlUGF0aCA/PyBcInRlbXAvcmVjb3JkaW5nc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIHNob3RGb3JtYXQ6IHNhdmVkLnNob3RGb3JtYXQgPz8gXCJwbmdcIixcclxuICAgICAgICAgICAgICAgICAgICBhdXRvQXJjaGl2ZTogcHJvamVjdENmZy5hdXRvQXJjaGl2ZVJlY29yZGluZ3MgPz8gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgc2hvd0FyY2hpdmVIZWxwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBsYXN0UmVzdWx0OiBudWxsIGFzIGFueSxcclxuICAgICAgICAgICAgICAgICAgICBsYXN0RXJyb3I6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIF9zdGFydFRpbWU6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgX3RpbWVyOiBudWxsIGFzIGFueSxcclxuICAgICAgICAgICAgICAgICAgICBfYWxpdmVDaGVja1RpbWVyOiBudWxsIGFzIGFueSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHdhdGNoOiB7XHJcbiAgICAgICAgICAgICAgICBmcHModGhpczogYW55KSB7IHRoaXMuc2F2ZVNldHRpbmdzKCk7IH0sXHJcbiAgICAgICAgICAgICAgICBxdWFsaXR5KHRoaXM6IGFueSkgeyB0aGlzLnNhdmVTZXR0aW5ncygpOyB9LFxyXG4gICAgICAgICAgICAgICAgY29lZmZpY2llbnQodGhpczogYW55KSB7IHRoaXMuc2F2ZVNldHRpbmdzKCk7IH0sXHJcbiAgICAgICAgICAgICAgICBmb3JtYXQodGhpczogYW55KSB7IHRoaXMuc2F2ZVNldHRpbmdzKCk7IH0sXHJcbiAgICAgICAgICAgICAgICBzYXZlUGF0aCh0aGlzOiBhbnkpIHsgdGhpcy5zYXZlU2V0dGluZ3MoKTsgfSxcclxuICAgICAgICAgICAgICAgIHNob3RGb3JtYXQodGhpczogYW55KSB7IHRoaXMuc2F2ZVNldHRpbmdzKCk7IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1ldGhvZHM6IHtcclxuICAgICAgICAgICAgICAgIHNhdmVTZXR0aW5ncyh0aGlzOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhOiBhbnkgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBQRVJTSVNURURfS0VZUykgZGF0YVtrZXldID0gdGhpc1trZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7IGxvY2FsU3RvcmFnZS5zZXRJdGVtKFNUT1JBR0VfS0VZLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7IH0gY2F0Y2ggeyAvKiBpZ25vcmUgKi8gfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGFzeW5jIGlzUHJldmlld1J1bm5pbmcodGhpczogYW55KTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7TUNQX0JBU0V9L21jcGAsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIiwgaWQ6IDk4LCBtZXRob2Q6IFwidG9vbHMvY2FsbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX2dhbWVfY29tbWFuZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IHsgdHlwZTogXCJpbnNwZWN0XCIsIGFyZ3M6IHsgbmFtZTogXCJDYW52YXNcIiB9LCB0aW1lb3V0OiAxNTAwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBqc29uLnJlc3VsdD8uY29udGVudD8uWzBdPy50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBjb250ZW50ID8gSlNPTi5wYXJzZShjb250ZW50KSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhIXBhcnNlZD8uc3VjY2VzcztcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhc3luYyBzdGFydCh0aGlzOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RSZXN1bHQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYXdhaXQgdGhpcy5pc1ByZXZpZXdSdW5uaW5nKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVzdWx0ID0geyBlcnJvcjogXCLjgrLjg7zjg6Djg5fjg6zjg5Pjg6Xjg7zjgYzlrp/ooYzjgZXjgozjgabjgYTjgb7jgZvjgpPjgILjg5fjg6zjg5Pjg6Xjg7zjgpLplovlp4vjgZfjgabjgYvjgonpjLLnlLvjgZfjgabjgY/jgaDjgZXjgYTjgIJcIiB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RFcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7TUNQX0JBU0V9L21jcGAsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwidG9vbHMvY2FsbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3JlY29yZF9zdGFydFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZwczogdGhpcy5mcHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2VmZmljaWVudDogdGhpcy5jb2VmZmljaWVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogdGhpcy5mb3JtYXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYXZlUGF0aDogdGhpcy5zYXZlUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGpzb24ucmVzdWx0Py5jb250ZW50Py5bMF0/LnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IGNvbnRlbnQgPyBKU09OLnBhcnNlKGNvbnRlbnQpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlZD8uc3VjY2VzcyAmJiBwYXJzZWQuZGF0YT8uaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVjb3JkaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBwYXJzZWQuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1icHMgPSBkPy52aWRlb0JpdHNQZXJTZWNvbmQgPyAoZC52aWRlb0JpdHNQZXJTZWNvbmQgLyAxXzAwMF8wMDApLnRvRml4ZWQoMikgOiBcIj9cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVjb3JkaW5nSW5mbyA9IGAke2Q/LmNhbnZhc1dpZHRoIHx8IFwiP1wifXgke2Q/LmNhbnZhc0hlaWdodCB8fCBcIj9cIn0gQCAke2Q/LmZwcyB8fCBcIj9cIn1mcHMgLyAke21icHN9TWJwcyAvICR7ZD8ubWltZVR5cGUgfHwgXCJcIn1gO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWxhcHNlZCA9ICgoRGF0ZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZSkgLyAxMDAwKS50b0ZpeGVkKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOODl+ODrOODk+ODpeODvOWBnOatouaknOefpeeUqOODneODvOODquODs+OCsO+8iDLnp5Lmr47vvIlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FsaXZlQ2hlY2tUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrUHJldmlld0FsaXZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWPr+iDveOBqumZkOOCiuips+e0sOOBquOCqOODqeODvOaDheWgseOCkuihqOekulxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyRGV0YWlsID0gcGFyc2VkPy5kYXRhPy5lcnJvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHBhcnNlZD8uZXJyb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCAocGFyc2VkPy5kYXRhID8gSlNPTi5zdHJpbmdpZnkocGFyc2VkLmRhdGEpIDogbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCAocGFyc2VkID8gSlNPTi5zdHJpbmdpZnkocGFyc2VkKS5zdWJzdHJpbmcoMCwgMjAwKSA6IFwibm8gcmVzcG9uc2VcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBcIumMsueUu+mWi+Wni+WkseaVl1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVzdWx0ID0geyBlcnJvcjogZXJyRGV0YWlsIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RFcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVzdWx0ID0geyBlcnJvcjogYOmAmuS/oeOCqOODqeODvDogJHtlLm1lc3NhZ2V9YCB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RFcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGFzeW5jIHN0b3AodGhpczogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9wcGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7TUNQX0JBU0V9L21jcGAsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogXCIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwidG9vbHMvY2FsbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImRlYnVnX3JlY29yZF9zdG9wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogeyB0aW1lb3V0OiA2MDAwMCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXMuanNvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0ganNvbi5yZXN1bHQ/LmNvbnRlbnQ/LlswXT8udGV4dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gY29udGVudCA/IEpTT04ucGFyc2UoY29udGVudCkgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VkPy5zdWNjZXNzICYmIHBhcnNlZC5kYXRhPy5wYXRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RSZXN1bHQgPSB7IHBhdGg6IHBhcnNlZC5kYXRhLnBhdGgsIHNpemU6IHBhcnNlZC5kYXRhLnNpemUgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdEVycm9yID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJEZXRhaWwgPSBwYXJzZWQ/LmRhdGE/LmVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgcGFyc2VkPy5lcnJvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IChwYXJzZWQ/LmRhdGEgPyBKU09OLnN0cmluZ2lmeShwYXJzZWQuZGF0YSkgOiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IFwi6Yyy55S75YGc5q2i5aSx5pWXXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RSZXN1bHQgPSB7IGVycm9yOiBlcnJEZXRhaWwgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdEVycm9yID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RSZXN1bHQgPSB7IGVycm9yOiBg6YCa5L+h44Ko44Op44O8OiAke2UubWVzc2FnZX1gIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdEVycm9yID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29yZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3BwaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl90aW1lcikgeyBjbGVhckludGVydmFsKHRoaXMuX3RpbWVyKTsgdGhpcy5fdGltZXIgPSBudWxsOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hbGl2ZUNoZWNrVGltZXIpIHsgY2xlYXJJbnRlcnZhbCh0aGlzLl9hbGl2ZUNoZWNrVGltZXIpOyB0aGlzLl9hbGl2ZUNoZWNrVGltZXIgPSBudWxsOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9uUXVhbGl0eUNoYW5nZSh0aGlzOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXA6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7IGxvdzogMC4xNSwgbWVkaXVtOiAwLjI1LCBoaWdoOiAwLjQwLCB1bHRyYTogMC42MCB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnF1YWxpdHkgIT09IFwiY3VzdG9tXCIpIHRoaXMuY29lZmZpY2llbnQgPSBtYXBbdGhpcy5xdWFsaXR5XTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBvbkNvZWZDaGFuZ2UodGhpczogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFwOiBSZWNvcmQ8bnVtYmVyLCBzdHJpbmc+ID0geyAwLjE1OiBcImxvd1wiLCAwLjI1OiBcIm1lZGl1bVwiLCAwLjQwOiBcImhpZ2hcIiwgMC42MDogXCJ1bHRyYVwiIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWFsaXR5ID0gbWFwW3RoaXMuY29lZmZpY2llbnRdIHx8IFwiY3VzdG9tXCI7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVzZXRRdWFsaXR5KHRoaXM6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZnBzID0gMzA7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWFsaXR5ID0gXCJtZWRpdW1cIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvZWZmaWNpZW50ID0gMC4yNTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdCA9IFwibXA0XCI7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVzZXRTYXZlUGF0aCh0aGlzOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVQYXRoID0gXCJ0ZW1wL3JlY29yZGluZ3NcIjtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBvbkF1dG9BcmNoaXZlQ2hhbmdlKHRoaXM6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJzZXR0aW5nc1wiLCBcImNvY29zLWNyZWF0b3ItbWNwLmpzb25cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjZmc6IGFueSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwKSkgY2ZnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocCwgXCJ1dGYtOFwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5hdXRvQXJjaGl2ZVJlY29yZGluZ3MgPSB0aGlzLmF1dG9BcmNoaXZlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUocCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwLCBKU09OLnN0cmluZ2lmeShjZmcsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiW3JlY29yZGVyXSDoqK3lrprkv53lrZjlpLHmlZc6XCIsIGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhc3luYyBzY3JlZW5zaG90KHRoaXM6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvb3RpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYXdhaXQgdGhpcy5pc1ByZXZpZXdSdW5uaW5nKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVzdWx0ID0geyBlcnJvcjogXCLjgrLjg7zjg6Djg5fjg6zjg5Pjg6Xjg7zjgYzlrp/ooYzjgZXjgozjgabjgYTjgb7jgZvjgpPjgILjg5fjg6zjg5Pjg6Xjg7zjgpLplovlp4vjgZfjgabjgYvjgonjgrnjgq/jgrfjg6fjgZfjgabjgY/jgaDjgZXjgYTjgIJcIiB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RFcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvb3RpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtNQ1BfQkFTRX0vbWNwYCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJ0b29scy9jYWxsXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2FtZV9jb21tYW5kXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogeyB0eXBlOiBcInNjcmVlbnNob3RcIiwgYXJnczoge30sIHRpbWVvdXQ6IDUwMDAsIG1heFdpZHRoOiAwLCBpbWFnZUZvcm1hdDogdGhpcy5zaG90Rm9ybWF0IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBqc29uLnJlc3VsdD8uY29udGVudD8uWzBdPy50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBjb250ZW50ID8gSlNPTi5wYXJzZShjb250ZW50KSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZWQ/LnN1Y2Nlc3MgJiYgcGFyc2VkLnBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNhdmVQYXRoIOmFjeS4i+OBq+OCs+ODlOODvFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IEVkaXRvci5Qcm9qZWN0LnBhdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVzdERpciA9IHRoaXMuc2F2ZVBhdGggfHwgXCJ0ZW1wL3JlY29yZGluZ3NcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRlc3REaXIpKSBkZXN0RGlyID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCBkZXN0RGlyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhkZXN0RGlyKSkgZnMubWtkaXJTeW5jKGRlc3REaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHMgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvWzouXS9nLCBcIi1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUocGFyc2VkLnBhdGgpIHx8IFwiLnBuZ1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzdFBhdGggPSBwYXRoLmpvaW4oZGVzdERpciwgYHNjcmVlbnNob3RfJHt0c30ke2V4dH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLmNvcHlGaWxlU3luYyhwYXJzZWQucGF0aCwgZGVzdFBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6Kit5a6a44Gr5b+c44GY44Gm5Y+k44GE44OV44Kh44Kk44Or44KS44Ki44O844Kr44Kk44OWXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgXCJzZXR0aW5nc1wiLCBcImNvY29zLWNyZWF0b3ItbWNwLmpzb25cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoc2V0dGluZ3NQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjZmcgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhzZXR0aW5nc1BhdGgsIFwidXRmLThcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ZnLmF1dG9BcmNoaXZlUmVjb3JkaW5ncykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBhcmNoaXZlT2xkRmlsZXMgfSA9IHJlcXVpcmUoXCIuLi8uLi9hcmNoaXZlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJjaGl2ZU9sZEZpbGVzKGRlc3REaXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RSZXN1bHQgPSB7IGtpbmQ6IFwic2hvdFwiLCBwYXRoOiBkZXN0UGF0aCwgc2l6ZTogcGFyc2VkLnNpemUgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdEVycm9yID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJEZXRhaWwgPSBwYXJzZWQ/LmVycm9yIHx8IHBhcnNlZD8ubWVzc2FnZSB8fCBcIuOCueOCr+OCt+ODp+WkseaVl1wiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVzdWx0ID0geyBlcnJvcjogZXJyRGV0YWlsIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RFcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVzdWx0ID0geyBlcnJvcjogYOmAmuS/oeOCqOODqeODvDogJHtlLm1lc3NhZ2V9YCB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RFcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG9vdGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhc3luYyBjaGVja1ByZXZpZXdBbGl2ZSh0aGlzOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucmVjb3JkaW5nKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTUNQ57WM55Sx44Gn6Lu96YeP44GqaW5zcGVjdOOCs+ODnuODs+ODieOCkumAgeOCi1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtNQ1BfQkFTRX0vbWNwYCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLCBpZDogOTksIG1ldGhvZDogXCJ0b29scy9jYWxsXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVidWdfZ2FtZV9jb21tYW5kXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogeyB0eXBlOiBcImluc3BlY3RcIiwgYXJnczogeyBuYW1lOiBcIkNhbnZhc1wiIH0sIHRpbWVvdXQ6IDE1MDAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGpzb24ucmVzdWx0Py5jb250ZW50Py5bMF0/LnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IGNvbnRlbnQgPyBKU09OLnBhcnNlKGNvbnRlbnQpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlZD8uc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g44OX44Os44OT44Ol44O855Sf5a2YXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5b+c562U44Gq44GXIOKGkiDjg5fjg6zjg5Pjg6Xjg7zlgZzmraLjgajjgb/jgarjgZfjgabpjLLnlLvlgZzmraLnirbmhYvjgatcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiW1ByZXZpZXdSZWNvcmRlcl0gcHJldmlldyBub3QgcmVzcG9uZGluZywgc3RvcHBpbmcgcmVjb3JkaW5nIHN0YXRlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29yZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdGltZXIpIHsgY2xlYXJJbnRlcnZhbCh0aGlzLl90aW1lcik7IHRoaXMuX3RpbWVyID0gbnVsbDsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYWxpdmVDaGVja1RpbWVyKSB7IGNsZWFySW50ZXJ2YWwodGhpcy5fYWxpdmVDaGVja1RpbWVyKTsgdGhpcy5fYWxpdmVDaGVja1RpbWVyID0gbnVsbDsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RSZXN1bHQgPSB7IGVycm9yOiBcIuODl+ODrOODk+ODpeODvOOBjOWBnOatouOBl+OBn+OBn+OCgemMsueUu+OCkuS4reaWreOBl+OBvuOBl+OBn++8iOWLleeUu+OBr+S/neWtmOOBleOCjOOBvuOBm+OCk++8iVwiIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdEVycm9yID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOODjeODg+ODiOODr+ODvOOCr+OCqOODqeODvOOBr+mAmuS/oeOCqOODqeODvOOBqOOBl+OBpueEoeimlu+8iOS4gOaZgueahOOBi+OCguOBl+OCjOOBquOBhO+8iVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhc3luYyBzZWxlY3RTYXZlRm9sZGVyKHRoaXM6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuRGlhbG9nIGFzIGFueSkuc2VsZWN0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIuS/neWtmOWFiOODleOCqeODq+ODgOOCkumBuOaKnlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJkaXJlY3RvcnlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQ/LmZpbGVQYXRocz8ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IEVkaXRvci5Qcm9qZWN0LnBhdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNQYXRoID0gcmVzdWx0LmZpbGVQYXRoc1swXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOODl+ODreOCuOOCp+OCr+ODiOmFjeS4i+OBquOCieebuOWvvuODkeOCueOBp+S/neaMgVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUocHJvamVjdFBhdGgsIGFic1BhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZWxQYXRoLnN0YXJ0c1dpdGgoXCIuLlwiKSAmJiAhcGF0aC5pc0Fic29sdXRlKHJlbFBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlUGF0aCA9IHJlbFBhdGgucmVwbGFjZSgvXFxcXC9nLCBcIi9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVBhdGggPSBhYnNQYXRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbUHJldmlld1JlY29yZGVyXSBzZWxlY3RTYXZlRm9sZGVyIGZhaWxlZDpcIiwgZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9wZW5TYXZlRm9sZGVyKHRoaXM6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IEVkaXRvci5Qcm9qZWN0LnBhdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRpciA9IHRoaXMuc2F2ZVBhdGggfHwgXCJ0ZW1wL3JlY29yZGluZ3NcIjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpKSBkaXIgPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIGRpcik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgc3Bhd24gfSA9IHJlcXVpcmUoXCJjaGlsZF9wcm9jZXNzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbGF0Zm9ybSA9IHByb2Nlc3MucGxhdGZvcm07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFtjbWQsIC4uLmFyZ3NdID0gcGxhdGZvcm0gPT09IFwid2luMzJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBbXCJleHBsb3Jlci5leGVcIiwgZGlyLnJlcGxhY2UoL1xcLy9nLCBcIlxcXFxcIildXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHBsYXRmb3JtID09PSBcImRhcndpblwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFtcIm9wZW5cIiwgZGlyXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbXCJ4ZGctb3BlblwiLCBkaXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwID0gc3Bhd24oY21kLCBhcmdzLCB7IGRldGFjaGVkOiB0cnVlLCBzdGRpbzogXCJpZ25vcmVcIiB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC51bnJlZigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW1ByZXZpZXdSZWNvcmRlcl0gb3BlblNhdmVGb2xkZXIgZmFpbGVkOlwiLCBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UmVzdWx0ID0geyBlcnJvcjogYOODleOCqeODq+ODgOOCkumWi+OBkeOBvuOBm+OCk+OBp+OBl+OBnzogJHtlLm1lc3NhZ2V9YCB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RFcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9wZW5Gb2xkZXIodGhpczogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxhc3RSZXN1bHQ/LnBhdGgpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMubGFzdFJlc3VsdC5wYXRoO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgc2hlbGwgfSA9IHJlcXVpcmUoXCJlbGVjdHJvblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNoZWxsPy5zaG93SXRlbUluRm9sZGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGVsbC5zaG93SXRlbUluRm9sZGVyKGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgLyogZmFsbGJhY2sgKi8gfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOODleOCqeODvOODq+ODkOODg+OCrzogT1PliKXjgrPjg57jg7Pjg4lcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGV4ZWMgfSA9IHJlcXVpcmUoXCJjaGlsZF9wcm9jZXNzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwbGF0Zm9ybSA9IHByb2Nlc3MucGxhdGZvcm07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjKGBleHBsb3Jlci5leGUgL3NlbGVjdCxcIiR7ZmlsZVBhdGgucmVwbGFjZSgvXFwvL2csIFwiXFxcXFwiKX1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBcImRhcndpblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjKGBvcGVuIC1SIFwiJHtmaWxlUGF0aH1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyID0gcmVxdWlyZShcInBhdGhcIikuZGlybmFtZShmaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjKGB4ZGctb3BlbiBcIiR7ZGlyfVwiYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltQcmV2aWV3UmVjb3JkZXJdIG9wZW5Gb2xkZXIgZmFpbGVkOlwiLCBlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGFwcC5tb3VudCh0aGlzLiQuYXBwKTtcclxuICAgICAgICBwYW5lbERhdGFNYXBSZWMuc2V0KHRoaXMsIGFwcCk7XHJcbiAgICB9LFxyXG4gICAgYmVmb3JlQ2xvc2UoKSB7IH0sXHJcbiAgICBjbG9zZSgpIHtcclxuICAgICAgICBjb25zdCBhcHAgPSBwYW5lbERhdGFNYXBSZWMuZ2V0KHRoaXMpO1xyXG4gICAgICAgIGlmIChhcHApIGFwcC51bm1vdW50KCk7XHJcbiAgICAgICAgcGFuZWxEYXRhTWFwUmVjLmRlbGV0ZSh0aGlzKTtcclxuICAgIH0sXHJcbn0pO1xyXG4iXX0=