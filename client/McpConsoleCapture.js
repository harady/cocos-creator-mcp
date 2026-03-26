"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMcpConsoleCapture = initMcpConsoleCapture;
exports.stopMcpConsoleCapture = stopMcpConsoleCapture;
let _buffer = [];
let _timer = null;
let _initialized = false;
let _config;
function formatArgs(args) {
    return args.map(a => {
        if (typeof a === "string")
            return a;
        if (a instanceof Error)
            return `${a.message}\n${a.stack || ""}`;
        try {
            return JSON.stringify(a);
        }
        catch (_a) {
            return String(a);
        }
    }).join(" ");
}
function flush() {
    if (_buffer.length === 0)
        return;
    const entries = _buffer.splice(0, _config.maxBatchSize);
    fetch(`${_config.mcpBaseUrl}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
    }).catch(() => { });
}
/** ゲーム起動時に1回呼ぶ。console.log/warn/errorをフックしてMCPに送信開始 */
function initMcpConsoleCapture(config) {
    var _a, _b, _c;
    if (_initialized)
        return;
    _initialized = true;
    _config = {
        mcpBaseUrl: (_a = config === null || config === void 0 ? void 0 : config.mcpBaseUrl) !== null && _a !== void 0 ? _a : "http://127.0.0.1:3000",
        flushInterval: (_b = config === null || config === void 0 ? void 0 : config.flushInterval) !== null && _b !== void 0 ? _b : 500,
        maxBatchSize: (_c = config === null || config === void 0 ? void 0 : config.maxBatchSize) !== null && _c !== void 0 ? _c : 50,
    };
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    function hook(level, original) {
        return function (...args) {
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
function stopMcpConsoleCapture() {
    if (_timer) {
        clearInterval(_timer);
        _timer = null;
    }
    flush();
    _initialized = false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWNwQ29uc29sZUNhcHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJNY3BDb25zb2xlQ2FwdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOztBQXlDSCxzREE4QkM7QUFHRCxzREFPQztBQWhFRCxJQUFJLE9BQU8sR0FBZSxFQUFFLENBQUM7QUFDN0IsSUFBSSxNQUFNLEdBQVEsSUFBSSxDQUFDO0FBQ3ZCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztBQUN6QixJQUFJLE9BQTBDLENBQUM7QUFFL0MsU0FBUyxVQUFVLENBQUMsSUFBVztJQUMzQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDaEIsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRO1lBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLFlBQVksS0FBSztZQUFFLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRSxFQUFFLENBQUM7UUFDaEUsSUFBSSxDQUFDO1lBQUMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUFDLFdBQU0sQ0FBQztZQUFDLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQztJQUNqRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakIsQ0FBQztBQUVELFNBQVMsS0FBSztJQUNWLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDO1FBQUUsT0FBTztJQUNqQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDeEQsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsTUFBTSxFQUFFO1FBQy9CLE1BQU0sRUFBRSxNQUFNO1FBQ2QsT0FBTyxFQUFFLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFO1FBQy9DLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztLQUNoQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7QUFFRCx1REFBdUQ7QUFDdkQsU0FBZ0IscUJBQXFCLENBQUMsTUFBZ0M7O0lBQ2xFLElBQUksWUFBWTtRQUFFLE9BQU87SUFDekIsWUFBWSxHQUFHLElBQUksQ0FBQztJQUNwQixPQUFPLEdBQUc7UUFDTixVQUFVLEVBQUUsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsVUFBVSxtQ0FBSSx1QkFBdUI7UUFDekQsYUFBYSxFQUFFLE1BQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLGFBQWEsbUNBQUksR0FBRztRQUMzQyxZQUFZLEVBQUUsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsWUFBWSxtQ0FBSSxFQUFFO0tBQzNDLENBQUM7SUFFRixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQ2hDLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDbEMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztJQUVwQyxTQUFTLElBQUksQ0FBQyxLQUF3QixFQUFFLFFBQWtDO1FBQ3RFLE9BQU8sVUFBVSxHQUFHLElBQVc7WUFDM0IsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDVCxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ25DLEtBQUs7Z0JBQ0wsT0FBTyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7YUFDNUIsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDO0lBQ04sQ0FBQztJQUVELE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztJQUN2QyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDMUMsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRTdDLE1BQU0sR0FBRyxXQUFXLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUVELFNBQVM7QUFDVCxTQUFnQixxQkFBcUI7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNULGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixNQUFNLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLENBQUM7SUFDRCxLQUFLLEVBQUUsQ0FBQztJQUNSLFlBQVksR0FBRyxLQUFLLENBQUM7QUFDekIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTWNwQ29uc29sZUNhcHR1cmUg4oCUIOOCsuODvOODoOODl+ODrOODk+ODpeODvOaZguOBrmNvbnNvbGUubG9nL3dhcm4vZXJyb3LjgpJNQ1DjgrXjg7zjg5Djg7zjgavpgIHkv6HjgZnjgovjgIJcbiAqXG4gKiBNQ1DjgrXjg7zjg5Djg7zjga4gUE9TVCAvbG9nIOOCqOODs+ODieODneOCpOODs+ODiOOBq+ODkOODg+ODgemAgeS/oeOBmeOCi+OAglxuICogTUNQ44K144O844OQ44O85pyq6LW35YuV5pmC44Gv6buZ44Gj44Gm54Sh6KaW77yI5pys55Wq5b2x6Z+/44Gq44GX77yJ44CCXG4gKlxuICogVXNhZ2U6XG4gKiAgIGltcG9ydCB7IGluaXRNY3BDb25zb2xlQ2FwdHVyZSB9IGZyb20gXCIuL01jcENvbnNvbGVDYXB0dXJlXCI7XG4gKiAgIGluaXRNY3BDb25zb2xlQ2FwdHVyZSgpOyAvLyBvciBpbml0TWNwQ29uc29sZUNhcHR1cmUoeyBtY3BCYXNlVXJsOiBcImh0dHA6Ly8xMjcuMC4wLjE6MzAwMVwiIH0pO1xuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgTWNwQ29uc29sZUNhcHR1cmVDb25maWcge1xuICAgIC8qKiBNQ1DjgrXjg7zjg5Djg7zjga7jg5njg7zjgrlVUkwgKGRlZmF1bHQ6IFwiaHR0cDovLzEyNy4wLjAuMTozMDAwXCIpICovXG4gICAgbWNwQmFzZVVybD86IHN0cmluZztcbiAgICAvKiog44OQ44OD44OB6YCB5L+h6ZaT6ZqUbXMgKGRlZmF1bHQ6IDUwMCkgKi9cbiAgICBmbHVzaEludGVydmFsPzogbnVtYmVyO1xuICAgIC8qKiAx5Zue44Gu6YCB5L+h5pyA5aSn5Lu25pWwIChkZWZhdWx0OiA1MCkgKi9cbiAgICBtYXhCYXRjaFNpemU/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBMb2dFbnRyeSB7XG4gICAgdGltZXN0YW1wOiBzdHJpbmc7XG4gICAgbGV2ZWw6IFwibG9nXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIjtcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG59XG5cbmxldCBfYnVmZmVyOiBMb2dFbnRyeVtdID0gW107XG5sZXQgX3RpbWVyOiBhbnkgPSBudWxsO1xubGV0IF9pbml0aWFsaXplZCA9IGZhbHNlO1xubGV0IF9jb25maWc6IFJlcXVpcmVkPE1jcENvbnNvbGVDYXB0dXJlQ29uZmlnPjtcblxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzOiBhbnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGFyZ3MubWFwKGEgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGEgPT09IFwic3RyaW5nXCIpIHJldHVybiBhO1xuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gYCR7YS5tZXNzYWdlfVxcbiR7YS5zdGFjayB8fCBcIlwifWA7XG4gICAgICAgIHRyeSB7IHJldHVybiBKU09OLnN0cmluZ2lmeShhKTsgfSBjYXRjaCB7IHJldHVybiBTdHJpbmcoYSk7IH1cbiAgICB9KS5qb2luKFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gZmx1c2goKTogdm9pZCB7XG4gICAgaWYgKF9idWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgY29uc3QgZW50cmllcyA9IF9idWZmZXIuc3BsaWNlKDAsIF9jb25maWcubWF4QmF0Y2hTaXplKTtcbiAgICBmZXRjaChgJHtfY29uZmlnLm1jcEJhc2VVcmx9L2xvZ2AsIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShlbnRyaWVzKSxcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSk7XG59XG5cbi8qKiDjgrLjg7zjg6Dotbfli5XmmYLjgasx5Zue5ZG844G244CCY29uc29sZS5sb2cvd2Fybi9lcnJvcuOCkuODleODg+OCr+OBl+OBpk1DUOOBq+mAgeS/oemWi+WniyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRNY3BDb25zb2xlQ2FwdHVyZShjb25maWc/OiBNY3BDb25zb2xlQ2FwdHVyZUNvbmZpZyk6IHZvaWQge1xuICAgIGlmIChfaW5pdGlhbGl6ZWQpIHJldHVybjtcbiAgICBfaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIF9jb25maWcgPSB7XG4gICAgICAgIG1jcEJhc2VVcmw6IGNvbmZpZz8ubWNwQmFzZVVybCA/PyBcImh0dHA6Ly8xMjcuMC4wLjE6MzAwMFwiLFxuICAgICAgICBmbHVzaEludGVydmFsOiBjb25maWc/LmZsdXNoSW50ZXJ2YWwgPz8gNTAwLFxuICAgICAgICBtYXhCYXRjaFNpemU6IGNvbmZpZz8ubWF4QmF0Y2hTaXplID8/IDUwLFxuICAgIH07XG5cbiAgICBjb25zdCBvcmlnaW5hbExvZyA9IGNvbnNvbGUubG9nO1xuICAgIGNvbnN0IG9yaWdpbmFsV2FybiA9IGNvbnNvbGUud2FybjtcbiAgICBjb25zdCBvcmlnaW5hbEVycm9yID0gY29uc29sZS5lcnJvcjtcblxuICAgIGZ1bmN0aW9uIGhvb2sobGV2ZWw6IExvZ0VudHJ5W1wibGV2ZWxcIl0sIG9yaWdpbmFsOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgb3JpZ2luYWwuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gICAgICAgICAgICBfYnVmZmVyLnB1c2goe1xuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGxldmVsLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGZvcm1hdEFyZ3MoYXJncyksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyA9IGhvb2soXCJsb2dcIiwgb3JpZ2luYWxMb2cpO1xuICAgIGNvbnNvbGUud2FybiA9IGhvb2soXCJ3YXJuXCIsIG9yaWdpbmFsV2Fybik7XG4gICAgY29uc29sZS5lcnJvciA9IGhvb2soXCJlcnJvclwiLCBvcmlnaW5hbEVycm9yKTtcblxuICAgIF90aW1lciA9IHNldEludGVydmFsKGZsdXNoLCBfY29uZmlnLmZsdXNoSW50ZXJ2YWwpO1xuICAgIGNvbnNvbGUubG9nKFwiW01jcENvbnNvbGVDYXB0dXJlXSBpbml0aWFsaXplZFwiKTtcbn1cblxuLyoqIOWBnOatoiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BNY3BDb25zb2xlQ2FwdHVyZSgpOiB2b2lkIHtcbiAgICBpZiAoX3RpbWVyKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoX3RpbWVyKTtcbiAgICAgICAgX3RpbWVyID0gbnVsbDtcbiAgICB9XG4gICAgZmx1c2goKTtcbiAgICBfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbn1cbiJdfQ==