const { createApp: createAppRec } = require("vue");

const panelDataMapRec = new WeakMap<any, any>();

module.exports = Editor.Panel.define({
    template: `
<div id="app">
    <h2>Preview Recorder</h2>

    <div class="controls">
        <button v-if="!recording" @click="start" class="btn btn-start">● 録画開始</button>
        <button v-else @click="stop" class="btn btn-stop" :disabled="stopping">■ 録画停止{{ stopping ? '中...' : '' }}</button>
    </div>

    <div v-if="recording" class="status-row">
        <span class="rec-dot">●</span> REC <strong>{{ elapsed }}s</strong>
        <span class="info">{{ recordingInfo }}</span>
    </div>

    <div class="row">
        <label>FPS:</label>
        <input type="number" v-model.number="fps" :disabled="recording" min="10" max="60" />
        <label>ビットレート(Mbps):</label>
        <input type="number" v-model.number="bitrateMbps" :disabled="recording" min="1" max="20" step="0.5" />
    </div>

    <div v-if="lastResult" class="result" :class="lastError ? 'error' : 'success'">
        <div v-if="!lastError">
            <strong>✓ 録画完了</strong><br>
            <code>{{ lastResult.path }}</code><br>
            {{ (lastResult.size / 1024 / 1024).toFixed(2) }} MB
            <button @click="openFolder" class="btn btn-small">📂 フォルダを開く</button>
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
.row { margin: 10px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.row label { font-size: 12px; }
.row input { width: 60px; padding: 4px 8px; background: #222; color: #ccc; border: 1px solid #444; border-radius: 3px; }
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
        const app = createAppRec({
            data() {
                return {
                    recording: false,
                    stopping: false,
                    elapsed: "0.0",
                    recordingInfo: "",
                    fps: 30,
                    bitrateMbps: 4,
                    lastResult: null as any,
                    lastError: false,
                    _startTime: 0,
                    _timer: null as any,
                };
            },
            methods: {
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
                                        videoBitsPerSecond: Math.round(this.bitrateMbps * 1_000_000),
                                    },
                                },
                            }),
                        });
                        const json = await res.json();
                        const content = json.result?.content?.[0]?.text;
                        const parsed = content ? JSON.parse(content) : null;
                        if (parsed?.success && parsed.data?.success) {
                            this.recording = true;
                            this.recordingInfo = `${parsed.data.data?.canvasWidth || "?"}x${parsed.data.data?.canvasHeight || "?"} / ${parsed.data.data?.mimeType || ""}`;
                            this._startTime = Date.now();
                            this._timer = setInterval(() => {
                                this.elapsed = ((Date.now() - this._startTime) / 1000).toFixed(1);
                            }, 100);
                        } else {
                            this.lastResult = { error: parsed?.data?.error || parsed?.error || "録画開始失敗" };
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
                        if (parsed?.success && parsed.data?.success) {
                            this.lastResult = { path: parsed.data.data?.path, size: parsed.data.data?.size };
                            this.lastError = false;
                        } else {
                            this.lastResult = { error: parsed?.data?.error || parsed?.error || "録画停止失敗" };
                            this.lastError = true;
                        }
                    } catch (e: any) {
                        this.lastResult = { error: `通信エラー: ${e.message}` };
                        this.lastError = true;
                    } finally {
                        this.recording = false;
                        this.stopping = false;
                        if (this._timer) { clearInterval(this._timer); this._timer = null; }
                    }
                },
                openFolder(this: any) {
                    if (!this.lastResult?.path) return;
                    const path = require("path");
                    const { shell } = require("electron");
                    shell.showItemInFolder(this.lastResult.path);
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
