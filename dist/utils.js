"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMaybeJson = parseMaybeJson;
/**
 * MCP クライアントが JSON オブジェクトを文字列化して送信する問題への共通対策.
 * スキーマに type が未宣言のオブジェクト引数は文字列で届く場合がある.
 */
function parseMaybeJson(value) {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch ( /* string のまま */_a) { /* string のまま */ }
    }
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSx3Q0FLQztBQVREOzs7R0FHRztBQUNILFNBQWdCLGNBQWMsQ0FBVSxLQUFVO0lBQzlDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDO1lBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUFDLFFBQVEsZ0JBQWdCLElBQWxCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIE1DUCDjgq/jg6njgqTjgqLjg7Pjg4jjgYwgSlNPTiDjgqrjg5bjgrjjgqfjgq/jg4jjgpLmloflrZfliJfljJbjgZfjgabpgIHkv6HjgZnjgovllY/poYzjgbjjga7lhbHpgJrlr77nrZYuXHJcbiAqIOOCueOCreODvOODnuOBqyB0eXBlIOOBjOacquWuo+iogOOBruOCquODluOCuOOCp+OCr+ODiOW8leaVsOOBr+aWh+Wtl+WIl+OBp+WxiuOBj+WgtOWQiOOBjOOBguOCiy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1heWJlSnNvbjxUID0gYW55Pih2YWx1ZTogYW55KTogVCB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgdHJ5IHsgcmV0dXJuIEpTT04ucGFyc2UodmFsdWUpOyB9IGNhdGNoIHsgLyogc3RyaW5nIOOBruOBvuOBviAqLyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuIl19