const { createApp: createAppRec } = require("vue");

const panelDataMapRec = new WeakMap<any, any>();

interface CanvasInfo {
    location: string;
    width: number;
    height: number;
    id: string;
    className: string;
}

module.exports = Editor.Panel.define({
    template: `
<div id="app">
    <h2>Preview Recorder</h2>

    <div class="section">
        <h3>1. Canvas探索</h3>
        <button @click="searchCanvases" class="btn">プレビューCanvas検索</button>
        <div v-if="canvases.length > 0" class="canvas-list">
            <div v-for="(c, i) in canvases" :key="i" class="canvas-item">
                <strong>{{ i }}:</strong> {{ c.location }}<br>
                サイズ: {{ c.width }}x{{ c.height }} / id="{{ c.id }}" class="{{ c.className }}"
            </div>
        </div>
        <div v-if="searchResult" class="result">{{ searchResult }}</div>
    </div>

    <div class="section">
        <h3>2. captureStream テスト</h3>
        <label>対象 Canvas Index:</label>
        <input type="number" v-model.number="selectedCanvasIndex" min="0" :max="canvases.length - 1" />
        <button @click="testCaptureStream" class="btn" :disabled="canvases.length === 0">Stream取得テスト</button>
        <div v-if="streamResult" class="result" :class="streamError ? 'error' : 'success'">{{ streamResult }}</div>
    </div>

    <div class="section">
        <h3>3. 録画テスト</h3>
        <button @click="startRecording" class="btn" :disabled="!canRecord || recording">録画開始</button>
        <button @click="stopRecording" class="btn" :disabled="!recording">録画停止</button>
        <div v-if="recording" class="recording">● REC {{ elapsed }}s</div>
        <div v-if="recordResult" class="result" :class="recordError ? 'error' : 'success'">{{ recordResult }}</div>
    </div>
</div>
    `,
    style: `
#app { padding: 12px; font-family: sans-serif; color: #ccc; font-size: 12px; }
h2 { margin: 0 0 8px 0; font-size: 16px; }
h3 { margin: 4px 0; font-size: 13px; color: #8cf; }
.section { margin: 12px 0; padding: 8px; border: 1px solid #333; border-radius: 4px; }
.btn {
    margin: 4px 4px 4px 0;
    padding: 6px 12px;
    background: #4a8;
    color: #fff;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
}
.btn:hover { background: #5b9; }
.btn:disabled { background: #555; color: #999; cursor: not-allowed; }
.canvas-list { margin: 8px 0; max-height: 200px; overflow-y: auto; }
.canvas-item { padding: 6px; margin: 4px 0; background: #222; border-radius: 3px; font-size: 11px; }
.result { margin: 8px 0; padding: 8px; background: #1a1a1a; border-radius: 3px; font-size: 11px; white-space: pre-wrap; }
.success { color: #4f4; }
.error { color: #f66; }
.recording { color: #f44; font-weight: bold; margin: 8px 0; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.5; } }
input { width: 60px; padding: 3px 6px; background: #222; color: #ccc; border: 1px solid #444; border-radius: 3px; }
label { margin-right: 6px; }
    `,
    $: { app: "#app" },
    ready() {
        console.log("[PreviewRecorder] ready() called, $.app:", this.$.app);
        if (!this.$.app) {
            console.error("[PreviewRecorder] #app element not found!");
            return;
        }
        const app = createAppRec({
            data() {
                return {
                    canvases: [] as CanvasInfo[],
                    searchResult: "",
                    selectedCanvasIndex: 0,
                    streamResult: "",
                    streamError: false,
                    canRecord: false,
                    recording: false,
                    elapsed: 0,
                    recordResult: "",
                    recordError: false,
                    _recorder: null as MediaRecorder | null,
                    _chunks: [] as Blob[],
                    _stream: null as MediaStream | null,
                    _elapsedTimer: null as any,
                    _startTime: 0,
                };
            },
            methods: {
                searchCanvases(this: any) {
                    const found: CanvasInfo[] = [];

                    // 1. パネル自身のdocument
                    this._collectCanvases(document, "panel.document", found);

                    // 2. 上位ウィンドウ（エディタ全体）
                    try {
                        if (window.top && window.top !== window) {
                            this._collectCanvases(window.top.document, "window.top.document", found);
                        }
                    } catch (e: any) {
                        console.warn("[Recorder] window.top アクセス失敗:", e.message);
                    }

                    // 3. 上位のiframe全走査
                    try {
                        if (window.top) {
                            const iframes = window.top.document.querySelectorAll("iframe, webview");
                            iframes.forEach((f: any, i) => {
                                try {
                                    if (f.contentDocument) {
                                        this._collectCanvases(f.contentDocument, `iframe[${i}] src=${f.src?.substring(0, 60)}`, found);
                                    }
                                } catch (e: any) {
                                    console.warn(`[Recorder] iframe[${i}] アクセス失敗:`, e.message);
                                }
                            });
                        }
                    } catch (e: any) {
                        console.warn("[Recorder] iframe走査失敗:", e.message);
                    }

                    this.canvases = found;
                    this.searchResult = found.length > 0
                        ? `${found.length}個のcanvas発見`
                        : "canvasが見つかりませんでした";
                },
                _collectCanvases(this: any, doc: Document, location: string, result: CanvasInfo[]) {
                    const canvases = doc.querySelectorAll("canvas");
                    canvases.forEach((c: HTMLCanvasElement) => {
                        result.push({
                            location,
                            width: c.width,
                            height: c.height,
                            id: c.id || "(no id)",
                            className: c.className || "(no class)",
                        });
                        // canvas要素への参照を保持（後で使う）
                        (result[result.length - 1] as any)._canvas = c;
                    });
                },
                testCaptureStream(this: any) {
                    const info = this.canvases[this.selectedCanvasIndex];
                    if (!info) {
                        this.streamResult = "canvasが選択されていません";
                        this.streamError = true;
                        return;
                    }
                    const canvas: HTMLCanvasElement = (info as any)._canvas;
                    if (!canvas) {
                        this.streamResult = "canvas参照が失われています";
                        this.streamError = true;
                        return;
                    }

                    try {
                        const stream = canvas.captureStream(30);
                        const tracks = stream.getVideoTracks();
                        this.streamResult = `✓ captureStream成功\n`
                            + `  tracks: ${tracks.length}\n`
                            + `  track[0].label: ${tracks[0]?.label || "(none)"}\n`
                            + `  canvas: ${canvas.width}x${canvas.height}`;
                        this.streamError = false;
                        this.canRecord = true;
                        // 停止
                        stream.getTracks().forEach(t => t.stop());
                    } catch (e: any) {
                        this.streamResult = `✗ captureStream失敗: ${e.message}`;
                        this.streamError = true;
                        this.canRecord = false;
                    }
                },
                startRecording(this: any) {
                    const info = this.canvases[this.selectedCanvasIndex];
                    const canvas: HTMLCanvasElement = (info as any)?._canvas;
                    if (!canvas) {
                        this.recordResult = "canvasが無効です";
                        this.recordError = true;
                        return;
                    }

                    try {
                        this._stream = canvas.captureStream(30);
                        this._chunks = [];
                        this._recorder = new MediaRecorder(this._stream, {
                            mimeType: "video/webm;codecs=vp9",
                            videoBitsPerSecond: 4_000_000,
                        });
                        this._recorder.ondataavailable = (e: BlobEvent) => {
                            if (e.data.size > 0) this._chunks.push(e.data);
                        };
                        this._recorder.onstop = async () => {
                            const blob = new Blob(this._chunks, { type: "video/webm" });
                            await this._saveRecording(blob);
                        };
                        this._recorder.start();
                        this.recording = true;
                        this._startTime = Date.now();
                        this.elapsed = 0;
                        this._elapsedTimer = setInterval(() => {
                            this.elapsed = ((Date.now() - this._startTime) / 1000).toFixed(1) as any;
                        }, 100);
                        this.recordResult = "";
                    } catch (e: any) {
                        this.recordResult = `録画開始失敗: ${e.message}`;
                        this.recordError = true;
                    }
                },
                stopRecording(this: any) {
                    if (!this._recorder) return;
                    this._recorder.stop();
                    this.recording = false;
                    clearInterval(this._elapsedTimer);
                    this._stream?.getTracks().forEach((t: any) => t.stop());
                },
                async _saveRecording(this: any, blob: Blob) {
                    try {
                        const fs = require("fs");
                        const path = require("path");
                        const projectPath = Editor.Project.path;
                        const dir = path.join(projectPath, "temp", "recordings");
                        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                        const fileName = `rec_${Date.now()}.webm`;
                        const filePath = path.join(dir, fileName);
                        const arrayBuf = await blob.arrayBuffer();
                        fs.writeFileSync(filePath, Buffer.from(arrayBuf));
                        this.recordResult = `✓ 保存: ${filePath}\n  サイズ: ${(blob.size / 1024).toFixed(1)} KB`;
                        this.recordError = false;
                    } catch (e: any) {
                        this.recordResult = `✗ 保存失敗: ${e.message}`;
                        this.recordError = true;
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
