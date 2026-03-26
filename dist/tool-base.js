"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.err = err;
exports.validateUuid = validateUuid;
exports.checkUuid = checkUuid;
/** Helper to create a successful text result */
function ok(data) {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
}
/** Helper to create an error result */
function err(message) {
    return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
    };
}
/** Validate that a string looks like a CocosCreator UUID (not empty, reasonable format) */
function validateUuid(uuid, label = "uuid") {
    if (!uuid || typeof uuid !== "string") {
        return `${label} is required`;
    }
    if (uuid.trim().length === 0) {
        return `${label} cannot be empty`;
    }
    // CocosCreator UUIDs: either standard format (8-4-4-4-12) or compressed (22 chars with +/=)
    // Be permissive — just reject obviously wrong values
    if (uuid.length < 10) {
        return `${label} "${uuid}" is too short to be a valid UUID`;
    }
    return null; // valid
}
/** Validate UUID and return err() if invalid, null if valid */
function checkUuid(uuid, label = "uuid") {
    const error = validateUuid(uuid, label);
    return error ? err(error) : null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1iYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL3Rvb2wtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLGdCQUlDO0FBR0Qsa0JBS0M7QUFHRCxvQ0FhQztBQUdELDhCQUdDO0FBbkNELGdEQUFnRDtBQUNoRCxTQUFnQixFQUFFLENBQUMsSUFBUztJQUN4QixPQUFPO1FBQ0gsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztLQUNuRSxDQUFDO0FBQ04sQ0FBQztBQUVELHVDQUF1QztBQUN2QyxTQUFnQixHQUFHLENBQUMsT0FBZTtJQUMvQixPQUFPO1FBQ0gsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNyRSxPQUFPLEVBQUUsSUFBSTtLQUNoQixDQUFDO0FBQ04sQ0FBQztBQUVELDJGQUEyRjtBQUMzRixTQUFnQixZQUFZLENBQUMsSUFBWSxFQUFFLFFBQWdCLE1BQU07SUFDN0QsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUNwQyxPQUFPLEdBQUcsS0FBSyxjQUFjLENBQUM7SUFDbEMsQ0FBQztJQUNELElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUMzQixPQUFPLEdBQUcsS0FBSyxrQkFBa0IsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsNEZBQTRGO0lBQzVGLHFEQUFxRDtJQUNyRCxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFLENBQUM7UUFDbkIsT0FBTyxHQUFHLEtBQUssS0FBSyxJQUFJLG1DQUFtQyxDQUFDO0lBQ2hFLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxDQUFDLFFBQVE7QUFDekIsQ0FBQztBQUVELCtEQUErRDtBQUMvRCxTQUFnQixTQUFTLENBQUMsSUFBWSxFQUFFLFFBQWdCLE1BQU07SUFDMUQsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4QyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xSZXN1bHQgfSBmcm9tIFwiLi90eXBlc1wiO1xyXG5cclxuLyoqIEhlbHBlciB0byBjcmVhdGUgYSBzdWNjZXNzZnVsIHRleHQgcmVzdWx0ICovXHJcbmV4cG9ydCBmdW5jdGlvbiBvayhkYXRhOiBhbnkpOiBUb29sUmVzdWx0IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY29udGVudDogW3sgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpIH1dLFxyXG4gICAgfTtcclxufVxyXG5cclxuLyoqIEhlbHBlciB0byBjcmVhdGUgYW4gZXJyb3IgcmVzdWx0ICovXHJcbmV4cG9ydCBmdW5jdGlvbiBlcnIobWVzc2FnZTogc3RyaW5nKTogVG9vbFJlc3VsdCB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGNvbnRlbnQ6IFt7IHR5cGU6IFwidGV4dFwiLCB0ZXh0OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBtZXNzYWdlIH0pIH1dLFxyXG4gICAgICAgIGlzRXJyb3I6IHRydWUsXHJcbiAgICB9O1xyXG59XHJcblxyXG4vKiogVmFsaWRhdGUgdGhhdCBhIHN0cmluZyBsb29rcyBsaWtlIGEgQ29jb3NDcmVhdG9yIFVVSUQgKG5vdCBlbXB0eSwgcmVhc29uYWJsZSBmb3JtYXQpICovXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVV1aWQodXVpZDogc3RyaW5nLCBsYWJlbDogc3RyaW5nID0gXCJ1dWlkXCIpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIGlmICghdXVpZCB8fCB0eXBlb2YgdXVpZCAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgIHJldHVybiBgJHtsYWJlbH0gaXMgcmVxdWlyZWRgO1xyXG4gICAgfVxyXG4gICAgaWYgKHV1aWQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBgJHtsYWJlbH0gY2Fubm90IGJlIGVtcHR5YDtcclxuICAgIH1cclxuICAgIC8vIENvY29zQ3JlYXRvciBVVUlEczogZWl0aGVyIHN0YW5kYXJkIGZvcm1hdCAoOC00LTQtNC0xMikgb3IgY29tcHJlc3NlZCAoMjIgY2hhcnMgd2l0aCArLz0pXHJcbiAgICAvLyBCZSBwZXJtaXNzaXZlIOKAlCBqdXN0IHJlamVjdCBvYnZpb3VzbHkgd3JvbmcgdmFsdWVzXHJcbiAgICBpZiAodXVpZC5sZW5ndGggPCAxMCkge1xyXG4gICAgICAgIHJldHVybiBgJHtsYWJlbH0gXCIke3V1aWR9XCIgaXMgdG9vIHNob3J0IHRvIGJlIGEgdmFsaWQgVVVJRGA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDsgLy8gdmFsaWRcclxufVxyXG5cclxuLyoqIFZhbGlkYXRlIFVVSUQgYW5kIHJldHVybiBlcnIoKSBpZiBpbnZhbGlkLCBudWxsIGlmIHZhbGlkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVja1V1aWQodXVpZDogc3RyaW5nLCBsYWJlbDogc3RyaW5nID0gXCJ1dWlkXCIpOiBUb29sUmVzdWx0IHwgbnVsbCB7XHJcbiAgICBjb25zdCBlcnJvciA9IHZhbGlkYXRlVXVpZCh1dWlkLCBsYWJlbCk7XHJcbiAgICByZXR1cm4gZXJyb3IgPyBlcnIoZXJyb3IpIDogbnVsbDtcclxufVxyXG4iXX0=