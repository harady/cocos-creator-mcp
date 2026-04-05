/**
 * McpDebugClient — MCPサーバーとCocosCreatorプレビューの双方向通信
 *
 * MCPサーバーのコマンドキューをポーリングし、コマンドを実行して結果を返す。
 * MCPサーバー未起動時は黙って無視（本番影響なし）。
 *
 * ビルトインコマンド:
 *   - screenshot: RenderTexture経由でゲーム画面キャプチャ
 *   - click: ノード名指定でクリックイベント発火
 *
 * カスタムコマンドを追加可能（プロジェクト固有の機能）:
 *   initMcpDebugClient({
 *     customCommands: {
 *       state: () => ({ success: true, data: myDb.dump() }),
 *       navigate: async (args) => { await myRouter.go(args.page); return { success: true }; },
 *     },
 *   });
 */

import { director, Node, Button, Camera, RenderTexture, gfx } from "cc";

export interface McpDebugClientConfig {
    /** MCPサーバーのベースURL (default: "http://127.0.0.1:3000") */
    mcpBaseUrl?: string;
    /** ポーリング間隔ms (default: 500) */
    pollInterval?: number;
    /** プロジェクト固有のコマンドハンドラー */
    customCommands?: Record<string, (args: any) => any | Promise<any>>;
}

interface McpCommand {
    id: string;
    type: string;
    args?: any;
}

let _polling = false;
let _timer: any = null;
let _config: Required<Pick<McpDebugClientConfig, "mcpBaseUrl" | "pollInterval">> & { customCommands: Record<string, (args: any) => any | Promise<any>> };

async function pollCommand(): Promise<void> {
    if (_polling) return;
    _polling = true;
    try {
        const res = await fetch(`${_config.mcpBaseUrl}/game/command`);
        if (!res.ok) return;
        const cmd: McpCommand | null = await res.json();
        if (!cmd) return;

        console.log(`[McpDebugClient] command: ${cmd.type}`, cmd.args || "");
        const result = await executeCommand(cmd);

        await fetch(`${_config.mcpBaseUrl}/game/result`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        }).catch(() => {});
    } catch {
        // MCP server not running
    } finally {
        _polling = false;
    }
}

async function executeCommand(cmd: McpCommand): Promise<any> {
    try {
        // ビルトインコマンド
        switch (cmd.type) {
            case "screenshot":
                return { id: cmd.id, ...takeScreenshot() };
            case "click":
                return { id: cmd.id, ...clickNode(cmd.args?.name) };
            case "record_start":
                return { id: cmd.id, ...startRecording(cmd.args) };
            case "record_stop":
                return { id: cmd.id, ...(await stopRecording()) };
        }
        // カスタムコマンド
        const handler = _config.customCommands[cmd.type];
        if (handler) {
            const result = await handler(cmd.args);
            return { id: cmd.id, ...result };
        }
        return { id: cmd.id, success: false, error: `Unknown command: ${cmd.type}` };
    } catch (e: any) {
        return { id: cmd.id, success: false, error: e.message || String(e) };
    }
}

// ─── ビルトインコマンド ───

function takeScreenshot(): { success: boolean; data?: any; error?: string } {
    try {
        const scene = director.getScene();
        if (!scene) return { success: false, error: "No active scene" };

        let camera: Camera | null = null;
        const findCamera = (node: Node) => {
            const cam = node.getComponent(Camera);
            if (cam && cam.enabled) { camera = cam; return; }
            for (const child of node.children) {
                if (camera) return;
                findCamera(child);
            }
        };
        findCamera(scene);
        if (!camera) return { success: false, error: "No camera found" };

        const cam = camera as Camera;
        const width = Math.floor(cam.camera.width);
        const height = Math.floor(cam.camera.height);

        const rt = new RenderTexture();
        rt.reset({ width, height });

        const prevTarget = cam.targetTexture;
        cam.targetTexture = rt;
        director.root!.frameMove(0);
        cam.targetTexture = prevTarget;

        const region = new gfx.BufferTextureCopy();
        region.texOffset.x = 0;
        region.texOffset.y = 0;
        region.texExtent.width = width;
        region.texExtent.height = height;

        const buffer = new Uint8Array(width * height * 4);
        const gfxTex = rt.getGFXTexture()!;
        director.root!.device.copyTextureToBuffers(gfxTex, [buffer], [region]);

        const cvs = document.createElement("canvas");
        cvs.width = width;
        cvs.height = height;
        const ctx = cvs.getContext("2d")!;
        const imageData = ctx.createImageData(width, height);

        for (let y = 0; y < height; y++) {
            const srcRow = (height - 1 - y) * width * 4;
            const dstRow = y * width * 4;
            for (let x = 0; x < width * 4; x++) {
                imageData.data[dstRow + x] = buffer[srcRow + x];
            }
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = cvs.toDataURL("image/png");
        rt.destroy();

        return { success: true, data: { dataUrl, width, height } };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

function clickNode(name?: string): { success: boolean; error?: string } {
    if (!name) return { success: false, error: "name argument required" };
    const scene = director.getScene();
    if (!scene) return { success: false, error: "No active scene" };

    const found = findNodeByName(scene, name);
    if (!found) return { success: false, error: `Node '${name}' not found` };

    found.emit(Button.EventType.CLICK, found);
    return { success: true };
}

// ─── 録画（MediaRecorder経由） ───

let _mediaRecorder: MediaRecorder | null = null;
let _recordChunks: Blob[] = [];
let _recordStream: MediaStream | null = null;
let _recordId: string | null = null;

function startRecording(args?: { fps?: number; videoBitsPerSecond?: number; format?: "webm" | "mp4" }): { success: boolean; error?: string; data?: any } {
    if (_mediaRecorder) return { success: false, error: "already recording" };
    try {
        // GameView canvas取得
        const canvas = document.getElementById("GameCanvas") as HTMLCanvasElement
            || document.querySelector("canvas") as HTMLCanvasElement;
        if (!canvas) return { success: false, error: "canvas not found" };

        const fps = args?.fps ?? 30;
        const bps = args?.videoBitsPerSecond ?? 4_000_000;
        const format = args?.format ?? "webm";
        _recordStream = canvas.captureStream(fps);
        _recordChunks = [];
        _recordId = `rec_${new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").substring(0, 19)}`;

        // 指定フォーマット優先、非対応ならwebmにfallback
        const mp4Candidates = [
            "video/mp4;codecs=h264",
            "video/mp4;codecs=avc1.42E01E",
            "video/mp4",
        ];
        const webmCandidates = [
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8",
            "video/webm",
        ];
        const candidates = format === "mp4"
            ? [...mp4Candidates, ...webmCandidates]
            : webmCandidates;
        let mimeType = "";
        for (const c of candidates) {
            if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
                mimeType = c;
                break;
            }
        }
        if (!mimeType) return { success: false, error: "No supported MediaRecorder mimeType" };

        _mediaRecorder = new MediaRecorder(_recordStream, { mimeType, videoBitsPerSecond: bps });
        _mediaRecorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) _recordChunks.push(e.data);
        };
        _mediaRecorder.start();
        return { success: true, data: { id: _recordId, mimeType, fps, canvasWidth: canvas.width, canvasHeight: canvas.height } };
    } catch (e: any) {
        _mediaRecorder = null;
        _recordStream = null;
        return { success: false, error: e.message || String(e) };
    }
}

async function stopRecording(): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!_mediaRecorder || !_recordId) return { success: false, error: "not recording" };
    const id = _recordId;
    const mimeType = _mediaRecorder.mimeType;
    return new Promise((resolve) => {
        _mediaRecorder!.onstop = async () => {
            try {
                const blob = new Blob(_recordChunks, { type: mimeType });
                _recordStream?.getTracks().forEach(t => t.stop());
                _mediaRecorder = null;
                _recordStream = null;
                _recordChunks = [];
                _recordId = null;

                // Blob → base64 → POST /game/recording
                const base64 = await blobToBase64(blob);
                const uploadRes = await fetch(`${_config.mcpBaseUrl}/game/recording`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, base64, mimeType }),
                });
                const uploadData = await uploadRes.json();
                resolve({ success: true, data: { id, size: blob.size, ...uploadData } });
            } catch (e: any) {
                resolve({ success: false, error: e.message || String(e) });
            }
        };
        _mediaRecorder!.stop();
    });
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // "data:video/webm;base64,XXX" → XXX だけ抽出
            const commaIdx = result.indexOf(",");
            resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function findNodeByName(root: Node, name: string): Node | null {
    if (root.name === name) return root;
    for (const child of root.children) {
        const found = findNodeByName(child, name);
        if (found) return found;
    }
    return null;
}

// ─── 初期化・停止 ───

export function initMcpDebugClient(config?: McpDebugClientConfig): void {
    if (_timer) return;
    _config = {
        mcpBaseUrl: config?.mcpBaseUrl ?? "http://127.0.0.1:3000",
        pollInterval: config?.pollInterval ?? 500,
        customCommands: config?.customCommands ?? {},
    };
    _timer = setInterval(pollCommand, _config.pollInterval);
    console.log("[McpDebugClient] initialized");
}

export function stopMcpDebugClient(): void {
    if (_timer) {
        clearInterval(_timer);
        _timer = null;
    }
}
