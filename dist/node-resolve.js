"use strict";
/**
 * Shared node UUID resolution — resolves nodeName to UUID via scene script.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveNodeUuid = resolveNodeUuid;
const EXT_NAME = "cocos-creator-mcp";
/**
 * Resolve a node UUID from either `uuid` or `nodeName` parameter.
 * If `uuid` is provided, it is returned as-is.
 * If `nodeName` is provided, searches the scene for a matching node.
 * Throws if neither is provided or no node is found.
 */
async function resolveNodeUuid(args) {
    var _a;
    if (args.uuid) {
        return { uuid: args.uuid, name: "" };
    }
    if (!args.nodeName) {
        throw new Error("Either 'uuid' or 'nodeName' is required");
    }
    const result = await Editor.Message.request("scene", "execute-scene-script", {
        name: EXT_NAME,
        method: "findNodesByName",
        args: [args.nodeName],
    });
    if (!(result === null || result === void 0 ? void 0 : result.success) || !((_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.length)) {
        throw new Error(`Node not found: "${args.nodeName}"`);
    }
    // 最初のマッチを使用
    const node = result.data[0];
    return { uuid: node.uuid, name: node.name || args.nodeName };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1yZXNvbHZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL25vZGUtcmVzb2x2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBZUgsMENBa0JDO0FBL0JELE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBT3JDOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLGVBQWUsQ0FBQyxJQUEwQzs7SUFDNUUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWixPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7UUFDekUsSUFBSSxFQUFFLFFBQVE7UUFDZCxNQUFNLEVBQUUsaUJBQWlCO1FBQ3pCLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7S0FDeEIsQ0FBQyxDQUFDO0lBQ0gsSUFBSSxDQUFDLENBQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLE9BQU8sQ0FBQSxJQUFJLENBQUMsQ0FBQSxNQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxJQUFJLDBDQUFFLE1BQU0sQ0FBQSxFQUFFLENBQUM7UUFDNUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUNELFlBQVk7SUFDWixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVCLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDakUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBTaGFyZWQgbm9kZSBVVUlEIHJlc29sdXRpb24g4oCUIHJlc29sdmVzIG5vZGVOYW1lIHRvIFVVSUQgdmlhIHNjZW5lIHNjcmlwdC5cclxuICovXHJcblxyXG5jb25zdCBFWFRfTkFNRSA9IFwiY29jb3MtY3JlYXRvci1tY3BcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZWROb2RlIHtcclxuICAgIHV1aWQ6IHN0cmluZztcclxuICAgIG5hbWU6IHN0cmluZztcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmUgYSBub2RlIFVVSUQgZnJvbSBlaXRoZXIgYHV1aWRgIG9yIGBub2RlTmFtZWAgcGFyYW1ldGVyLlxyXG4gKiBJZiBgdXVpZGAgaXMgcHJvdmlkZWQsIGl0IGlzIHJldHVybmVkIGFzLWlzLlxyXG4gKiBJZiBgbm9kZU5hbWVgIGlzIHByb3ZpZGVkLCBzZWFyY2hlcyB0aGUgc2NlbmUgZm9yIGEgbWF0Y2hpbmcgbm9kZS5cclxuICogVGhyb3dzIGlmIG5laXRoZXIgaXMgcHJvdmlkZWQgb3Igbm8gbm9kZSBpcyBmb3VuZC5cclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlTm9kZVV1aWQoYXJnczogeyB1dWlkPzogc3RyaW5nOyBub2RlTmFtZT86IHN0cmluZyB9KTogUHJvbWlzZTxSZXNvbHZlZE5vZGU+IHtcclxuICAgIGlmIChhcmdzLnV1aWQpIHtcclxuICAgICAgICByZXR1cm4geyB1dWlkOiBhcmdzLnV1aWQsIG5hbWU6IFwiXCIgfTtcclxuICAgIH1cclxuICAgIGlmICghYXJncy5ub2RlTmFtZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVpdGhlciAndXVpZCcgb3IgJ25vZGVOYW1lJyBpcyByZXF1aXJlZFwiKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsIHtcclxuICAgICAgICBuYW1lOiBFWFRfTkFNRSxcclxuICAgICAgICBtZXRob2Q6IFwiZmluZE5vZGVzQnlOYW1lXCIsXHJcbiAgICAgICAgYXJnczogW2FyZ3Mubm9kZU5hbWVdLFxyXG4gICAgfSk7XHJcbiAgICBpZiAoIXJlc3VsdD8uc3VjY2VzcyB8fCAhcmVzdWx0Py5kYXRhPy5sZW5ndGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGUgbm90IGZvdW5kOiBcIiR7YXJncy5ub2RlTmFtZX1cImApO1xyXG4gICAgfVxyXG4gICAgLy8g5pyA5Yid44Gu44Oe44OD44OB44KS5L2/55SoXHJcbiAgICBjb25zdCBub2RlID0gcmVzdWx0LmRhdGFbMF07XHJcbiAgICByZXR1cm4geyB1dWlkOiBub2RlLnV1aWQsIG5hbWU6IG5vZGUubmFtZSB8fCBhcmdzLm5vZGVOYW1lIH07XHJcbn1cclxuIl19