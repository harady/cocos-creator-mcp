/**
 * McpConsoleCapture — ゲームプレビュー時のconsole.log/warn/errorをMCPサーバーに送信する。
 *
 * MCPサーバーの POST /log エンドポイントにバッチ送信する。
 * MCPサーバー未起動時は黙って無視（本番影響なし）。
 *
 * Usage:
 *   import { initMcpConsoleCapture } from "./McpConsoleCapture";
 *   initMcpConsoleCapture(); // or initMcpConsoleCapture({ mcpBaseUrl: "http://127.0.0.1:3001" });
 */

export interface McpConsoleCaptureConfig {
    /** MCPサーバーのベースURL (default: "http://127.0.0.1:3000") */
    mcpBaseUrl?: string;
    /** バッチ送信間隔ms (default: 500) */
    flushInterval?: number;
    /** 1回の送信最大件数 (default: 50) */
    maxBatchSize?: number;
}

interface LogEntry {
    timestamp: string;
    level: "log" | "warn" | "error";
    message: string;
}

let _buffer: LogEntry[] = [];
let _timer: any = null;
let _initialized = false;
let _config: Required<McpConsoleCaptureConfig>;

function formatArgs(args: any[]): string {
    return args.map(a => {
        if (typeof a === "string") return a;
        if (a instanceof Error) return `${a.message}\n${a.stack || ""}`;
        try { return JSON.stringify(a); } catch { return String(a); }
    }).join(" ");
}

function flush(): void {
    if (_buffer.length === 0) return;
    const entries = _buffer.splice(0, _config.maxBatchSize);
    fetch(`${_config.mcpBaseUrl}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
    }).catch(() => {});
}

/** ゲーム起動時に1回呼ぶ。console.log/warn/errorをフックしてMCPに送信開始 */
export function initMcpConsoleCapture(config?: McpConsoleCaptureConfig): void {
    if (_initialized) return;
    _initialized = true;
    _config = {
        mcpBaseUrl: config?.mcpBaseUrl ?? "http://127.0.0.1:3000",
        flushInterval: config?.flushInterval ?? 500,
        maxBatchSize: config?.maxBatchSize ?? 50,
    };

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    function hook(level: LogEntry["level"], original: (...args: any[]) => void) {
        return function (...args: any[]) {
            original.apply(console, args);
            _buffer.push({
                timestamp: new Date().toISOString(),
                level,
                message: formatArgs(args),
            });
        };
    }

    console.log = hook("log", originalLog);
    console.warn = hook("warn", originalWarn);
    console.error = hook("error", originalError);

    _timer = setInterval(flush, _config.flushInterval);
    console.log("[McpConsoleCapture] initialized");
}

/** 停止 */
export function stopMcpConsoleCapture(): void {
    if (_timer) {
        clearInterval(_timer);
        _timer = null;
    }
    flush();
    _initialized = false;
}
