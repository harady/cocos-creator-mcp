"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneTools = void 0;
exports.queryCurrentSceneDirty = queryCurrentSceneDirty;
exports.queryCurrentSceneInfo = queryCurrentSceneInfo;
exports.isCurrentSceneUntitled = isCurrentSceneUntitled;
exports.safeSaveScene = safeSaveScene;
exports.ensureSceneSafeToSwitch = ensureSceneSafeToSwitch;
const tool_base_1 = require("../tool-base");
const EXT_NAME = "cocos-creator-mcp";
/** シーン名から「untitled (保存先なし)」かどうかを判定 */
const UNTITLED_SCENE_NAMES = new Set(["scene-2d", "scene-3d", "Untitled", "NewScene", ""]);
/**
 * 現在のシーンの dirty 状態を取得。
 * CC バージョンによって query-dirty / query-is-dirty のどちらか（または両方）が存在するので両方試行。
 */
async function queryCurrentSceneDirty() {
    try {
        const r = await Editor.Message.request("scene", "query-dirty");
        return !!r;
    }
    catch ( /* try alternate */_a) { /* try alternate */ }
    try {
        const r = await Editor.Message.request("scene", "query-is-dirty");
        return !!r;
    }
    catch ( /* assume clean if both fail */_b) { /* assume clean if both fail */ }
    return false;
}
/**
 * 現在のシーン情報（名前・UUID）を取得。
 */
async function queryCurrentSceneInfo() {
    try {
        const result = await Editor.Message.request("scene", "execute-scene-script", { name: EXT_NAME, method: "getSceneHierarchy", args: [false] });
        return { sceneName: (result === null || result === void 0 ? void 0 : result.sceneName) || "", sceneUuid: (result === null || result === void 0 ? void 0 : result.sceneUuid) || "" };
    }
    catch (_a) {
        return { sceneName: "", sceneUuid: "" };
    }
}
/**
 * 現在のシーンが untitled (scene-2d 等) かを判定。
 */
async function isCurrentSceneUntitled() {
    const { sceneName } = await queryCurrentSceneInfo();
    return UNTITLED_SCENE_NAMES.has(sceneName);
}
/**
 * save-scene をダイアログ安全に呼び出す。
 *
 * - 現在のシーンが untitled (scene-2d 等) → no-op（ダイアログ防止）
 * - それ以外 → save-scene を実行
 *
 * 任意の MCP ツール内部で save-scene を呼ぶ場合は必ずこれ経由にする。
 * 直接 `Editor.Message.request("scene", "save-scene")` を呼ぶと、
 * 現在シーンが untitled のときにモーダルダイアログが出て MCP が固まる。
 *
 * @returns 実際に保存を実行したか
 */
async function safeSaveScene() {
    if (await isCurrentSceneUntitled()) {
        console.warn("[cocos-creator-mcp] safeSaveScene: current scene is untitled, " +
            "skipping save-scene to avoid modal dialog.");
        return false;
    }
    await Editor.Message.request("scene", "save-scene");
    return true;
}
/**
 * シーン切替系ツール（scene_open/close/new など）の前処理。
 *
 * - clean → OK
 * - dirty + 保存先ありのシーン → save-scene で自動保存
 * - dirty + untitled シーン → force=false なら明示エラー、force=true なら警告ログして続行
 *
 * 目的: "Save changes?" ダイアログで MCP がブロックされるのを防ぐ。
 * force=true は「ダイアログが出ないことをユーザーが知っている or 出ても構わない」ケース用。
 *
 * @throws Error force=false かつ dirty + untitled のとき
 */
async function ensureSceneSafeToSwitch(force = false) {
    const isDirty = await queryCurrentSceneDirty();
    if (!isDirty)
        return;
    const { sceneName } = await queryCurrentSceneInfo();
    const isUntitled = UNTITLED_SCENE_NAMES.has(sceneName);
    if (isUntitled) {
        if (force) {
            console.warn(`[cocos-creator-mcp] ensureSceneSafeToSwitch: untitled scene "${sceneName}" ` +
                `is dirty but force=true — proceeding (modal dialog may appear).`);
            return;
        }
        throw new Error(`Cannot switch scenes: current scene "${sceneName || "(unnamed)"}" is untitled ` +
            `and has unsaved changes. Switching would trigger a modal "Save changes?" dialog ` +
            `that blocks the MCP server. Save the current scene first ` +
            `(File > Save Scene As, or scene_save on a named scene), or pass force=true to bypass.`);
    }
    try {
        // ここに来る時点で untitled ではない（上で判定済み）ので直接 save-scene OK
        await Editor.Message.request("scene", "save-scene");
    }
    catch (e) {
        if (force) {
            console.warn(`[cocos-creator-mcp] ensureSceneSafeToSwitch: save-scene failed but force=true — proceeding. ` +
                `Error: ${e.message || e}`);
            return;
        }
        throw new Error(`Failed to auto-save dirty scene "${sceneName}" before switch: ${e.message || e}. ` +
            `Save manually and retry, or pass force=true to bypass.`);
    }
}
class SceneTools {
    constructor() {
        this.categoryName = "scene";
    }
    getTools() {
        return [
            {
                name: "scene_get_hierarchy",
                description: "Get the node hierarchy of the current scene. Returns tree structure with uuid, name, active, and optionally components.",
                inputSchema: {
                    type: "object",
                    properties: {
                        includeComponents: {
                            type: "boolean",
                            description: "Include component info for each node",
                        },
                    },
                },
            },
            {
                name: "scene_open",
                description: "Open a scene by its asset UUID or database path (e.g. 'db://assets/scenes/Main.scene'). If the current scene is dirty and untitled, returns an error instead of triggering a modal save dialog that would block MCP. Pass force=true to bypass this guard.",
                inputSchema: {
                    type: "object",
                    properties: {
                        scene: {
                            type: "string",
                            description: "Scene UUID or db:// path",
                        },
                        force: {
                            type: "boolean",
                            description: "Skip dirty-scene preflight check (may trigger modal save dialog)",
                        },
                    },
                    required: ["scene"],
                },
            },
            {
                name: "scene_save",
                description: "Save the currently open scene.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "scene_get_list",
                description: "List all scene files in the project.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "scene_close",
                description: "Close the current scene. If the current scene is dirty and untitled, returns an error instead of triggering a modal save dialog. Pass force=true to bypass.",
                inputSchema: {
                    type: "object",
                    properties: {
                        force: {
                            type: "boolean",
                            description: "Skip dirty-scene preflight check (may trigger modal save dialog)",
                        },
                    },
                },
            },
            {
                name: "scene_get_current",
                description: "Get the name and UUID of the currently open scene.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }
    async execute(toolName, args) {
        var _a;
        switch (toolName) {
            case "scene_get_hierarchy":
                return this.getHierarchy((_a = args.includeComponents) !== null && _a !== void 0 ? _a : false);
            case "scene_open":
                return this.openScene(args.scene, !!args.force);
            case "scene_save":
                return this.saveScene();
            case "scene_get_list":
                return this.getSceneList();
            case "scene_close":
                try {
                    await ensureSceneSafeToSwitch(!!args.force);
                    await Editor.Message.request("scene", "close-scene");
                    return (0, tool_base_1.ok)({ success: true });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            case "scene_get_current":
                return this.getHierarchy(false).then((r) => {
                    const parsed = JSON.parse(r.content[0].text);
                    return (0, tool_base_1.ok)({ success: true, sceneName: parsed.sceneName, sceneUuid: parsed.sceneUuid });
                }).catch((e) => (0, tool_base_1.err)(String(e)));
            default:
                return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
        }
    }
    async getHierarchy(includeComponents) {
        try {
            const result = await Editor.Message.request("scene", "execute-scene-script", {
                name: EXT_NAME,
                method: "getSceneHierarchy",
                args: [includeComponents],
            });
            return (0, tool_base_1.ok)(result);
        }
        catch (e) {
            // Fallback: use query-node-tree
            try {
                const tree = await Editor.Message.request("scene", "query-node-tree");
                return (0, tool_base_1.ok)({ success: true, hierarchy: tree });
            }
            catch (e2) {
                return (0, tool_base_1.err)(e2.message || String(e2));
            }
        }
    }
    async openScene(scene, force) {
        try {
            await ensureSceneSafeToSwitch(force);
            await Editor.Message.request("asset-db", "open-asset", scene);
            return (0, tool_base_1.ok)({ success: true, scene });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async saveScene() {
        try {
            // 現在のシーンが保存済みファイルか確認（新規シーンの場合はダイアログが出るのでスキップ）
            const scenes = await Editor.Message.request("asset-db", "query-assets", {
                pattern: "db://assets/**/*.scene",
            }).catch(() => []);
            // シーン名を取得して既存シーンか判定
            const hierarchy = await Editor.Message.request("scene", "execute-scene-script", { name: "cocos-creator-mcp", method: "getSceneHierarchy", args: [false] }).catch(() => null);
            const sceneName = hierarchy === null || hierarchy === void 0 ? void 0 : hierarchy.sceneName;
            const isNewScene = !sceneName || sceneName === "scene-2d" || sceneName === "Untitled";
            if (isNewScene) {
                return (0, tool_base_1.ok)({ success: true, note: "New/untitled scene, skip save to avoid dialog" });
            }
            // シーンがdirtyでない場合は保存不要
            const isDirty = await Editor.Message.request("scene", "query-is-dirty").catch(() => true);
            if (!isDirty) {
                return (0, tool_base_1.ok)({ success: true, note: "Scene not dirty, skip save" });
            }
            const result = await Editor.Message.request("scene", "save-scene", false);
            return (0, tool_base_1.ok)({ success: true, result });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getSceneList() {
        try {
            const results = await Editor.Message.request("asset-db", "query-assets", {
                pattern: "db://assets/**/*.scene",
            });
            const scenes = (results || []).map((a) => ({
                uuid: a.uuid,
                path: a.path || a.url,
                name: a.name,
            }));
            return (0, tool_base_1.ok)({ success: true, scenes });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
}
exports.SceneTools = SceneTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBWUEsd0RBVUM7QUFLRCxzREFXQztBQUtELHdEQUdDO0FBY0Qsc0NBVUM7QUFjRCwwREF1Q0M7QUExSEQsNENBQXVDO0FBRXZDLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBRXJDLHNDQUFzQztBQUN0QyxNQUFNLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFM0Y7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLHNCQUFzQjtJQUN4QyxJQUFJLENBQUM7UUFDRCxNQUFNLENBQUMsR0FBRyxNQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBZSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN4RSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBQUMsUUFBUSxtQkFBbUIsSUFBckIsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDL0IsSUFBSSxDQUFDO1FBQ0QsTUFBTSxDQUFDLEdBQUcsTUFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWUsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUMzRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBQUMsUUFBUSwrQkFBK0IsSUFBakMsQ0FBQyxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDM0MsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUVEOztHQUVHO0FBQ0ksS0FBSyxVQUFVLHFCQUFxQjtJQUN2QyxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBUSxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUM1QyxPQUFPLEVB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QU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRTtnQkFDckUsT0FBTyxFQUFFLHdCQUF3QjthQUNwQyxDQUFDLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzVDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtnQkFDWixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRztnQkFDckIsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO2FBQ2YsQ0FBQyxDQUFDLENBQUM7WUFDSixPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsT0FBTyxJQUFBLGVBQUcsRUFBQyxDQUFDLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFuTEQsZ0NBbUxDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbENhdGVnb3J5LCBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3VsdCB9IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBvaywgZXJyIH0gZnJvbSBcIi4uL3Rvb2wtYmFzZVwiO1xyXG5cclxuY29uc3QgRVhUX05BTUUgPSBcImNvY29zLWNyZWF0b3ItbWNwXCI7XHJcblxyXG4vKiog44K344O844Oz5ZCN44GL44KJ44CMdW50aXRsZWQgKOS/neWtmOWFiOOBquOBlynjgI3jgYvjganjgYbjgYvjgpLliKTlrpogKi9cclxuY29uc3QgVU5USVRMRURfU0NFTkVfTkFNRVMgPSBuZXcgU2V0KFtcInNjZW5lLTJkXCIsIFwic2NlbmUtM2RcIiwgXCJVbnRpdGxlZFwiLCBcIk5ld1NjZW5lXCIsIFwiXCJdKTtcclxuXHJcbi8qKlxyXG4gKiDnj77lnKjjga7jgrfjg7zjg7Pjga4gZGlydHkg54q25oWL44KS5Y+W5b6X44CCXHJcbiAqIENDIOODkOODvOOCuOODp+ODs+OBq+OCiOOBo+OBpiBxdWVyeS1kaXJ0eSAvIHF1ZXJ5LWlzLWRpcnR5IOOBruOBqeOBoeOCieOBi++8iOOBvuOBn+OBr+S4oeaWue+8ieOBjOWtmOWcqOOBmeOCi+OBruOBp+S4oeaWueippuihjOOAglxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1ZXJ5Q3VycmVudFNjZW5lRGlydHkoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHIgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1kaXJ0eVwiKTtcclxuICAgICAgICByZXR1cm4gISFyO1xyXG4gICAgfSBjYXRjaCB7IC8qIHRyeSBhbHRlcm5hdGUgKi8gfVxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktaXMtZGlydHlcIik7XHJcbiAgICAgICAgcmV0dXJuICEhcjtcclxuICAgIH0gY2F0Y2ggeyAvKiBhc3N1bWUgY2xlYW4gaWYgYm90aCBmYWlsICovIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOePvuWcqOOBruOCt+ODvOODs+aDheWgse+8iOWQjeWJjeODu1VVSUTvvInjgpLlj5blvpfjgIJcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUN1cnJlbnRTY2VuZUluZm8oKTogUHJvbWlzZTx7IHNjZW5lTmFtZTogc3RyaW5nOyBzY2VuZVV1aWQ6IHN0cmluZyB9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcclxuICAgICAgICAgICAgXCJzY2VuZVwiLFxyXG4gICAgICAgICAgICBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsXHJcbiAgICAgICAgICAgIHsgbmFtZTogRVhUX05BTUUsIG1ldGhvZDogXCJnZXRTY2VuZUhpZXJhcmNoeVwiLCBhcmdzOiBbZmFsc2VdIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiB7IHNjZW5lTmFtZTogcmVzdWx0Py5zY2VuZU5hbWUgfHwgXCJcIiwgc2NlbmVVdWlkOiByZXN1bHQ/LnNjZW5lVXVpZCB8fCBcIlwiIH07XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgICByZXR1cm4geyBzY2VuZU5hbWU6IFwiXCIsIHNjZW5lVXVpZDogXCJcIiB9O1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICog54++5Zyo44Gu44K344O844Oz44GMIHVudGl0bGVkIChzY2VuZS0yZCDnrYkpIOOBi+OCkuWIpOWumuOAglxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzQ3VycmVudFNjZW5lVW50aXRsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBjb25zdCB7IHNjZW5lTmFtZSB9ID0gYXdhaXQgcXVlcnlDdXJyZW50U2NlbmVJbmZvKCk7XHJcbiAgICByZXR1cm4gVU5USVRMRURfU0NFTkVfTkFNRVMuaGFzKHNjZW5lTmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBzYXZlLXNjZW5lIOOCkuODgOOCpOOCouODreOCsOWuieWFqOOBq+WRvOOBs+WHuuOBmeOAglxyXG4gKlxyXG4gKiAtIOePvuWcqOOBruOCt+ODvOODs+OBjCB1bnRpdGxlZCAoc2NlbmUtMmQg562JKSDihpIgbm8tb3DvvIjjg4DjgqTjgqLjg63jgrDpmLLmraLvvIlcclxuICogLSDjgZ3jgozku6XlpJYg4oaSIHNhdmUtc2NlbmUg44KS5a6f6KGMXHJcbiAqXHJcbiAqIOS7u+aEj+OBriBNQ1Ag44OE44O844Or5YaF6YOo44GnIHNhdmUtc2NlbmUg44KS5ZG844G25aC05ZCI44Gv5b+F44Ga44GT44KM57WM55Sx44Gr44GZ44KL44CCXHJcbiAqIOebtOaOpSBgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwic2F2ZS1zY2VuZVwiKWAg44KS5ZG844G244Go44CBXHJcbiAqIOePvuWcqOOCt+ODvOODs+OBjCB1bnRpdGxlZCDjga7jgajjgY3jgavjg6Ljg7zjg4Djg6vjg4DjgqTjgqLjg63jgrDjgYzlh7rjgaYgTUNQIOOBjOWbuuOBvuOCi+OAglxyXG4gKlxyXG4gKiBAcmV0dXJucyDlrp/pmpvjgavkv53lrZjjgpLlrp/ooYzjgZfjgZ/jgYtcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYWZlU2F2ZVNjZW5lKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgaWYgKGF3YWl0IGlzQ3VycmVudFNjZW5lVW50aXRsZWQoKSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcclxuICAgICAgICAgICAgXCJbY29jb3MtY3JlYXRvci1tY3BdIHNhZmVTYXZlU2NlbmU6IGN1cnJlbnQgc2NlbmUgaXMgdW50aXRsZWQsIFwiICtcclxuICAgICAgICAgICAgXCJza2lwcGluZyBzYXZlLXNjZW5lIHRvIGF2b2lkIG1vZGFsIGRpYWxvZy5cIlxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2F2ZS1zY2VuZVwiKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG4vKipcclxuICog44K344O844Oz5YiH5pu/57O744OE44O844Or77yIc2NlbmVfb3Blbi9jbG9zZS9uZXcg44Gq44Gp77yJ44Gu5YmN5Yem55CG44CCXHJcbiAqXHJcbiAqIC0gY2xlYW4g4oaSIE9LXHJcbiAqIC0gZGlydHkgKyDkv53lrZjlhYjjgYLjgorjga7jgrfjg7zjg7Mg4oaSIHNhdmUtc2NlbmUg44Gn6Ieq5YuV5L+d5a2YXHJcbiAqIC0gZGlydHkgKyB1bnRpdGxlZCDjgrfjg7zjg7Mg4oaSIGZvcmNlPWZhbHNlIOOBquOCieaYjuekuuOCqOODqeODvOOAgWZvcmNlPXRydWUg44Gq44KJ6K2m5ZGK44Ot44Kw44GX44Gm57aa6KGMXHJcbiAqXHJcbiAqIOebrueahDogXCJTYXZlIGNoYW5nZXM/XCIg44OA44Kk44Ki44Ot44Kw44GnIE1DUCDjgYzjg5bjg63jg4Pjgq/jgZXjgozjgovjga7jgpLpmLLjgZDjgIJcclxuICogZm9yY2U9dHJ1ZSDjga/jgIzjg4DjgqTjgqLjg63jgrDjgYzlh7rjgarjgYTjgZPjgajjgpLjg6bjg7zjgrbjg7zjgYznn6XjgaPjgabjgYTjgosgb3Ig5Ye644Gm44KC5qeL44KP44Gq44GE44CN44Kx44O844K555So44CCXHJcbiAqXHJcbiAqIEB0aHJvd3MgRXJyb3IgZm9yY2U9ZmFsc2Ug44GL44GkIGRpcnR5ICsgdW50aXRsZWQg44Gu44Go44GNXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2goZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgaXNEaXJ0eSA9IGF3YWl0IHF1ZXJ5Q3VycmVudFNjZW5lRGlydHkoKTtcclxuICAgIGlmICghaXNEaXJ0eSkgcmV0dXJuO1xyXG5cclxuICAgIGNvbnN0IHsgc2NlbmVOYW1lIH0gPSBhd2FpdCBxdWVyeUN1cnJlbnRTY2VuZUluZm8oKTtcclxuICAgIGNvbnN0IGlzVW50aXRsZWQgPSBVTlRJVExFRF9TQ0VORV9OQU1FUy5oYXMoc2NlbmVOYW1lKTtcclxuXHJcbiAgICBpZiAoaXNVbnRpdGxlZCkge1xyXG4gICAgICAgIGlmIChmb3JjZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgICAgICAgICBgW2NvY29zLWNyZWF0b3ItbWNwXSBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaDogdW50aXRsZWQgc2NlbmUgXCIke3NjZW5lTmFtZX1cIiBgICtcclxuICAgICAgICAgICAgICAgIGBpcyBkaXJ0eSBidXQgZm9yY2U9dHJ1ZSDigJQgcHJvY2VlZGluZyAobW9kYWwgZGlhbG9nIG1heSBhcHBlYXIpLmBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgIGBDYW5ub3Qgc3dpdGNoIHNjZW5lczogY3VycmVudCBzY2VuZSBcIiR7c2NlbmVOYW1lIHx8IFwiKHVubmFtZWQpXCJ9XCIgaXMgdW50aXRsZWQgYCArXHJcbiAgICAgICAgICAgIGBhbmQgaGFzIHVuc2F2ZWQgY2hhbmdlcy4gU3dpdGNoaW5nIHdvdWxkIHRyaWdnZXIgYSBtb2RhbCBcIlNhdmUgY2hhbmdlcz9cIiBkaWFsb2cgYCArXHJcbiAgICAgICAgICAgIGB0aGF0IGJsb2NrcyB0aGUgTUNQIHNlcnZlci4gU2F2ZSB0aGUgY3VycmVudCBzY2VuZSBmaXJzdCBgICtcclxuICAgICAgICAgICAgYChGaWxlID4gU2F2ZSBTY2VuZSBBcywgb3Igc2NlbmVfc2F2ZSBvbiBhIG5hbWVkIHNjZW5lKSwgb3IgcGFzcyBmb3JjZT10cnVlIHRvIGJ5cGFzcy5gXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIOOBk+OBk+OBq+adpeOCi+aZgueCueOBpyB1bnRpdGxlZCDjgafjga/jgarjgYTvvIjkuIrjgafliKTlrprmuIjjgb/vvInjga7jgafnm7TmjqUgc2F2ZS1zY2VuZSBPS1xyXG4gICAgICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNhdmUtc2NlbmVcIik7XHJcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICBpZiAoZm9yY2UpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgICAgICAgICAgYFtjb2Nvcy1jcmVhdG9yLW1jcF0gZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2g6IHNhdmUtc2NlbmUgZmFpbGVkIGJ1dCBmb3JjZT10cnVlIOKAlCBwcm9jZWVkaW5nLiBgICtcclxuICAgICAgICAgICAgICAgIGBFcnJvcjogJHtlLm1lc3NhZ2UgfHwgZX1gXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICBgRmFpbGVkIHRvIGF1dG8tc2F2ZSBkaXJ0eSBzY2VuZSBcIiR7c2NlbmVOYW1lfVwiIGJlZm9yZSBzd2l0Y2g6ICR7ZS5tZXNzYWdlIHx8IGV9LiBgICtcclxuICAgICAgICAgICAgYFNhdmUgbWFudWFsbHkgYW5kIHJldHJ5LCBvciBwYXNzIGZvcmNlPXRydWUgdG8gYnlwYXNzLmBcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2NlbmVUb29scyBpbXBsZW1lbnRzIFRvb2xDYXRlZ29yeSB7XHJcbiAgICByZWFkb25seSBjYXRlZ29yeU5hbWUgPSBcInNjZW5lXCI7XHJcblxyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9nZXRfaGllcmFyY2h5XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGhlIG5vZGUgaGllcmFyY2h5IG9mIHRoZSBjdXJyZW50IHNjZW5lLiBSZXR1cm5zIHRyZWUgc3RydWN0dXJlIHdpdGggdXVpZCwgbmFtZSwgYWN0aXZlLCBhbmQgb3B0aW9uYWxseSBjb21wb25lbnRzLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNvbXBvbmVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSW5jbHVkZSBjb21wb25lbnQgaW5mbyBmb3IgZWFjaCBub2RlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfb3BlblwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiT3BlbiBhIHNjZW5lIGJ5IGl0cyBhc3NldCBVVUlEIG9yIGRhdGFiYXNlIHBhdGggKGUuZy4gJ2RiOi8vYXNzZXRzL3NjZW5lcy9NYWluLnNjZW5lJykuIElmIHRoZSBjdXJyZW50IHNjZW5lIGlzIGRpcnR5IGFuZCB1bnRpdGxlZCwgcmV0dXJucyBhbiBlcnJvciBpbnN0ZWFkIG9mIHRyaWdnZXJpbmcgYSBtb2RhbCBzYXZlIGRpYWxvZyB0aGF0IHdvdWxkIGJsb2NrIE1DUC4gUGFzcyBmb3JjZT10cnVlIHRvIGJ5cGFzcyB0aGlzIGd1YXJkLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTY2VuZSBVVUlEIG9yIGRiOi8vIHBhdGhcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2tpcCBkaXJ0eS1zY2VuZSBwcmVmbGlnaHQgY2hlY2sgKG1heSB0cmlnZ2VyIG1vZGFsIHNhdmUgZGlhbG9nKVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInNjZW5lXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9zYXZlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTYXZlIHRoZSBjdXJyZW50bHkgb3BlbiBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfZ2V0X2xpc3RcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkxpc3QgYWxsIHNjZW5lIGZpbGVzIGluIHRoZSBwcm9qZWN0LlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9jbG9zZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2xvc2UgdGhlIGN1cnJlbnQgc2NlbmUuIElmIHRoZSBjdXJyZW50IHNjZW5lIGlzIGRpcnR5IGFuZCB1bnRpdGxlZCwgcmV0dXJucyBhbiBlcnJvciBpbnN0ZWFkIG9mIHRyaWdnZXJpbmcgYSBtb2RhbCBzYXZlIGRpYWxvZy4gUGFzcyBmb3JjZT10cnVlIHRvIGJ5cGFzcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNraXAgZGlydHktc2NlbmUgcHJlZmxpZ2h0IGNoZWNrIChtYXkgdHJpZ2dlciBtb2RhbCBzYXZlIGRpYWxvZylcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9nZXRfY3VycmVudFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IHRoZSBuYW1lIGFuZCBVVUlEIG9mIHRoZSBjdXJyZW50bHkgb3BlbiBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9nZXRfaGllcmFyY2h5XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRIaWVyYXJjaHkoYXJncy5pbmNsdWRlQ29tcG9uZW50cyA/PyBmYWxzZSk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9vcGVuXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcGVuU2NlbmUoYXJncy5zY2VuZSwgISFhcmdzLmZvcmNlKTtcclxuICAgICAgICAgICAgY2FzZSBcInNjZW5lX3NhdmVcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNhdmVTY2VuZSgpO1xyXG4gICAgICAgICAgICBjYXNlIFwic2NlbmVfZ2V0X2xpc3RcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFNjZW5lTGlzdCgpO1xyXG4gICAgICAgICAgICBjYXNlIFwic2NlbmVfY2xvc2VcIjpcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2goISFhcmdzLmZvcmNlKTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjbG9zZS1zY2VuZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgY2FzZSBcInNjZW5lX2dldF9jdXJyZW50XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRIaWVyYXJjaHkoZmFsc2UpLnRoZW4oKHIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHIuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzY2VuZU5hbWU6IHBhcnNlZC5zY2VuZU5hbWUsIHNjZW5lVXVpZDogcGFyc2VkLnNjZW5lVXVpZCB9KTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlKSA9PiBlcnIoU3RyaW5nKGUpKSk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0SGllcmFyY2h5KGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcclxuICAgICAgICAgICAgICAgIFwic2NlbmVcIixcclxuICAgICAgICAgICAgICAgIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIixcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBFWFRfTkFNRSxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiZ2V0U2NlbmVIaWVyYXJjaHlcIixcclxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbaW5jbHVkZUNvbXBvbmVudHNdLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHVzZSBxdWVyeS1ub2RlLXRyZWVcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlLXRyZWVcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBoaWVyYXJjaHk6IHRyZWUgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoZTIubWVzc2FnZSB8fCBTdHJpbmcoZTIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIG9wZW5TY2VuZShzY2VuZTogc3RyaW5nLCBmb3JjZTogYm9vbGVhbik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGVuc3VyZVNjZW5lU2FmZVRvU3dpdGNoKGZvcmNlKTtcclxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwib3Blbi1hc3NldFwiLCBzY2VuZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNjZW5lIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNhdmVTY2VuZSgpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyDnj77lnKjjga7jgrfjg7zjg7PjgYzkv53lrZjmuIjjgb/jg5XjgqHjgqTjg6vjgYvnorroqo3vvIjmlrDopo/jgrfjg7zjg7Pjga7loLTlkIjjga/jg4DjgqTjgqLjg63jgrDjgYzlh7rjgovjga7jgafjgrnjgq3jg4Pjg5fvvIlcclxuICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IFwiZGI6Ly9hc3NldHMvKiovKi5zY2VuZVwiLFxyXG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiBbXSk7XHJcblxyXG4gICAgICAgICAgICAvLyDjgrfjg7zjg7PlkI3jgpLlj5blvpfjgZfjgabml6LlrZjjgrfjg7zjg7PjgYvliKTlrppcclxuICAgICAgICAgICAgY29uc3QgaGllcmFyY2h5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcclxuICAgICAgICAgICAgICAgIFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsIG1ldGhvZDogXCJnZXRTY2VuZUhpZXJhcmNoeVwiLCBhcmdzOiBbZmFsc2VdIH1cclxuICAgICAgICAgICAgKS5jYXRjaCgoKSA9PiBudWxsKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lTmFtZSA9IGhpZXJhcmNoeT8uc2NlbmVOYW1lO1xyXG4gICAgICAgICAgICBjb25zdCBpc05ld1NjZW5lID0gIXNjZW5lTmFtZSB8fCBzY2VuZU5hbWUgPT09IFwic2NlbmUtMmRcIiB8fCBzY2VuZU5hbWUgPT09IFwiVW50aXRsZWRcIjtcclxuICAgICAgICAgICAgaWYgKGlzTmV3U2NlbmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiTmV3L3VudGl0bGVkIHNjZW5lLCBza2lwIHNhdmUgdG8gYXZvaWQgZGlhbG9nXCIgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIOOCt+ODvOODs+OBjGRpcnR544Gn44Gq44GE5aC05ZCI44Gv5L+d5a2Y5LiN6KaBXHJcbiAgICAgICAgICAgIGNvbnN0IGlzRGlydHkgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1pcy1kaXJ0eVwiKS5jYXRjaCgoKSA9PiB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKCFpc0RpcnR5KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub3RlOiBcIlNjZW5lIG5vdCBkaXJ0eSwgc2tpcCBzYXZlXCIgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNhdmUtc2NlbmVcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0U2NlbmVMaXN0KCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogXCJkYjovL2Fzc2V0cy8qKi8qLnNjZW5lXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBzY2VuZXMgPSAocmVzdWx0cyB8fCBbXSkubWFwKChhOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICB1dWlkOiBhLnV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBhLnBhdGggfHwgYS51cmwsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBhLm5hbWUsXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgc2NlbmVzIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=