/**
 * MCP クライアントが JSON オブジェクトを文字列化して送信する問題への共通対策.
 * スキーマに type が未宣言のオブジェクト引数は文字列で届く場合がある.
 */
export function parseMaybeJson<T = any>(value: any): T {
    if (typeof value === "string") {
        try { return JSON.parse(value); } catch { /* string のまま */ }
    }
    return value;
}
