const { createApp: createAppRec } = require("vue");

const panelDataMapRec = new WeakMap<any, any>();

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
.note { margin-top: 16px; padding-top: 8px; border-top: 1px solid #333; font-size: 10px; color: #888; }
    `,
    $: { app: "#app" },
    ready() {
        if (!this.$.app) return;
        const MCP_BASE = "http://127.0.0.1:3000";
        const STORAGE_KEY = "cocos-mcp-recorder-settings";
        const PERSISTED_KEYS = ["fps", "quality", "coefficient", "format", "savePath", "shotFormat"];
        // localStorage から設定を読み込み
        const loadSettings = () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : {};
            } catch { return {}; }
        };
        const saved = loadSettings();
        const app = createAppRec({
            data() {
                return {
                    recording: false,
                    stopping: false,
                    shooting: false,
                    elapsed: "0.0",
                    recordingInfo: "",
                    fps: saved.fps ?? 30,
                    quality: saved.quality ?? "medium",
                    coefficient: saved.coefficient ?? 0.25,
                    format: saved.format ?? "mp4",
                    savePath: saved.savePath ?? "temp/recordings",
                    shotFormat: saved.shotFormat ?? "png",
                    lastResult: null as any,
                    lastError: false,
                    _startTime: 0,
                    _timer: null as any,
                    _aliveCheckTimer: null as any,
                };
            },
            watch: {
                fps(this: any) { this.saveSettings(); },
                quality(this: any) { this.saveSettings(); },
                coefficient(this: any) { this.saveSettings(); },
                format(this: any) { this.saveSettings(); },
                savePath(this: any) { this.saveSettings(); },
                shotFormat(this: any) { this.saveSettings(); },
            },
            methods: {
                saveSettings(this: any) {
                    const data: any = {};
                    for (const key of PERSISTED_KEYS) data[key] = this[key];
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
                },
                async start(this: any) {
                    this.lastResult = null;
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
                        const content = json.result?.content?.[0]?.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if (parsed?.success && parsed.data?.id) {
                            this.recording = true;
                            const d = parsed.data;
                            const mbps = d?.videoBitsPerSecond ? (d.videoBitsPerSecond / 1_000_000).toFixed(2) : "?";
                            this.recordingInfo = `${d?.canvasWidth || "?"}x${d?.canvasHeight || "?"} @ ${d?.fps || "?"}fps / ${mbps}Mbps / ${d?.mimeType || ""}`;
                            this._startTime = Date.now();
                            this._timer = setInterval(() => {
                                this.elapsed = ((Date.now() - this._startTime) / 1000).toFixed(1);
                            }, 100);
                            // プレビュー停止検知用ポーリング（2秒毎）
                            this._aliveCheckTimer = setInterval(() => {
                                this.checkPreviewAlive();
                            }, 2000);
                        } else {
                            // 可能な限り詳細なエラー情報を表示
                            const errDetail = parsed?.data?.error
                                || parsed?.error
                                || (parsed?.data ? JSON.stringify(parsed.data) : null)
                                || (parsed ? JSON.stringify(parsed).substring(0, 200) : "no response")
                                || "録画開始失敗";
                            this.lastResult = { error: errDetail };
                            this.lastError = true;
                        }
                    } catch (e: any) {
                        this.lastResult = { error: `通信エラー: ${e.message}` };
                        this.lastError = true;
                    }
                },
                async stop(this: any) {
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
                        const content = json.result?.content?.[0]?.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if (parsed?.success && parsed.data?.path) {
                            this.lastResult = { path: parsed.data.path, size: parsed.data.size };
                            this.lastError = false;
                        } else {
                            const errDetail = parsed?.data?.error
                                || parsed?.error
                                || (parsed?.data ? JSON.stringify(parsed.data) : null)
                                || "録画停止失敗";
                            this.lastResult = { error: errDetail };
                            this.lastError = true;
                        }
                    } catch (e: any) {
                        this.lastResult = { error: `通信エラー: ${e.message}` };
                        this.lastError = true;
                    } finally {
                        this.recording = false;
                        this.stopping = false;
                        if (this._timer) { clearInterval(this._timer); this._timer = null; }
                        if (this._aliveCheckTimer) { clearInterval(this._aliveCheckTimer); this._aliveCheckTimer = null; }
                    }
                },
                onQualityChange(this: any) {
                    const map: Record<string, number> = { low: 0.15, medium: 0.25, high: 0.40, ultra: 0.60 };
                    if (this.quality !== "custom") this.coefficient = map[this.quality];
                },
                onCoefChange(this: any) {
                    const map: Record<number, string> = { 0.15: "low", 0.25: "medium", 0.40: "high", 0.60: "ultra" };
                    this.quality = map[this.coefficient] || "custom";
                },
                resetQuality(this: any) {
                    this.fps = 30;
                    this.quality = "medium";
                    this.coefficient = 0.25;
                    this.format = "mp4";
                },
                resetSavePath(this: any) {
                    this.savePath = "temp/recordings";
                },
                async screenshot(this: any) {
                    this.shooting = true;
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
                        const content = json.result?.content?.[0]?.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if (parsed?.success && parsed.path) {
                            // savePath 配下にコピー
                            const fs = require("fs");
                            const path = require("path");
                            const projectPath = Editor.Project.path;
                            let destDir = this.savePath || "temp/recordings";
                            if (!path.isAbsolute(destDir)) destDir = path.join(projectPath, destDir);
                            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                            const ts = new Date().toISOString().replace(/[:.]/g, "-");
                            const ext = path.extname(parsed.path) || ".png";
                            const destPath = path.join(destDir, `screenshot_${ts}${ext}`);
                            fs.copyFileSync(parsed.path, destPath);
                            this.lastResult = { kind: "shot", path: destPath, size: parsed.size };
                            this.lastError = false;
                        } else {
                            const errDetail = parsed?.error || parsed?.message || "スクショ失敗";
                            this.lastResult = { error: errDetail };
                            this.lastError = true;
                        }
                    } catch (e: any) {
                        this.lastResult = { error: `通信エラー: ${e.message}` };
                        this.lastError = true;
                    } finally {
                        this.shooting = false;
                    }
                },
                async checkPreviewAlive(this: any) {
                    if (!this.recording) return;
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
                        const content = json.result?.content?.[0]?.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if (parsed?.success) {
                            // プレビュー生存
                            return;
                        }
                        // 応答なし → プレビュー停止とみなして録画停止状態に
                        console.warn("[PreviewRecorder] preview not responding, stopping recording state");
                        this.recording = false;
                        if (this._timer) { clearInterval(this._timer); this._timer = null; }
                        if (this._aliveCheckTimer) { clearInterval(this._aliveCheckTimer); this._aliveCheckTimer = null; }
                        this.lastResult = { error: "プレビューが停止したため録画を中断しました（動画は保存されません）" };
                        this.lastError = true;
                    } catch (e) {
                        // ネットワークエラーは通信エラーとして無視（一時的かもしれない）
                    }
                },
                async selectSaveFolder(this: any) {
                    try {
                        const result = await (Editor.Dialog as any).select({
                            title: "保存先フォルダを選択",
                            type: "directory",
                            multi: false,
                        });
                        if (result?.filePaths?.length) {
                            const path = require("path");
                            const projectPath = Editor.Project.path;
                            const absPath = result.filePaths[0];
                            // プロジェクト配下なら相対パスで保持
                            const relPath = path.relative(projectPath, absPath);
                            if (!relPath.startsWith("..") && !path.isAbsolute(relPath)) {
                                this.savePath = relPath.replace(/\\/g, "/");
                            } else {
                                this.savePath = absPath;
                            }
                        }
                    } catch (e: any) {
                        console.error("[PreviewRecorder] selectSaveFolder failed:", e);
                    }
                },
                openSaveFolder(this: any) {
                    const path = require("path");
                    const fs = require("fs");
                    const projectPath = Editor.Project.path;
                    let dir = this.savePath || "temp/recordings";
                    if (!path.isAbsolute(dir)) dir = path.join(projectPath, dir);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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
                    } catch (e: any) {
                        console.error("[PreviewRecorder] openSaveFolder failed:", e);
                        this.lastResult = { error: `フォルダを開けませんでした: ${e.message}` };
                        this.lastError = true;
                    }
                },
                openFolder(this: any) {
                    if (!this.lastResult?.path) return;
                    const filePath = this.lastResult.path;
                    try {
                        const { shell } = require("electron");
                        if (shell?.showItemInFolder) {
                            shell.showItemInFolder(filePath);
                            return;
                        }
                    } catch (e) { /* fallback */ }
                    // フォールバック: OS別コマンド
                    try {
                        const { exec } = require("child_process");
                        const platform = process.platform;
                        if (platform === "win32") {
                            exec(`explorer.exe /select,"${filePath.replace(/\//g, "\\")}"`);
                        } else if (platform === "darwin") {
                            exec(`open -R "${filePath}"`);
                        } else {
                            const dir = require("path").dirname(filePath);
                            exec(`xdg-open "${dir}"`);
                        }
                    } catch (e: any) {
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
        if (app) app.unmount();
        panelDataMapRec.delete(this);
    },
});
