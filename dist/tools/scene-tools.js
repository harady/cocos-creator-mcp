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
 * - dirty + untitled シーン → ダイアログを自動応答（"Don't Save"）して変更を破棄
 *
 * 目的: "Save changes?" ダイアログで MCP がブロックされるのを防ぐ。
 */
async function ensureSceneSafeToSwitch(force = false) {
    const isDirty = await queryCurrentSceneDirty();
    if (!isDirty)
        return;
    const { sceneName } = await queryCurrentSceneInfo();
    const isUntitled = UNTITLED_SCENE_NAMES.has(sceneName);
    if (isUntitled) {
        // untitled + dirty: ダイアログが出るとMCPがブロックされるので、
        // Electron dialog をパッチして「保存しない」を自動応答する。
        // パッチは次回のシーン切替（呼び出し元の scene_open 等）でダイアログが出る瞬間に効く。
        patchDialogForDiscard();
        console.warn(`[cocos-creator-mcp] ensureSceneSafeToSwitch: untitled scene "${sceneName}" ` +
            `is dirty — dialog will auto-respond "Don't Save" to avoid blocking MCP.`);
        return;
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
/**
 * Electron の dialog.showMessageBox(Sync) を一時的にパッチして、
 * 次回のダイアログで「保存しない (Don't Save)」を自動選択する。
 *
 * CocosCreator の "Save changes?" ダイアログは通常:
 *   buttons: ["Save", "Cancel", "Don't Save"] → index 2 = Don't Save
 * または:
 *   buttons: ["Save", "Don't Save", "Cancel"] → index 1 = Don't Save
 *
 * ボタンテキストから "Don't Save" / "not" / "discard" を探し、
 * 見つからなければ最後のボタン（通常 Don't Save）を選択する。
 */
function patchDialogForDiscard() {
    try {
        const electron = require("electron");
        const dialog = electron.dialog;
        const origSync = dialog.showMessageBoxSync;
        const origAsync = dialog.showMessageBox;
        function findDiscardIndex(buttons) {
            if (!buttons || buttons.length === 0)
                return 0;
            const idx = buttons.findIndex((b) => {
                const lower = b.toLowerCase();
                return lower.includes("don't save") || lower.includes("not")
                    || lower.includes("discard") || lower.includes("保存しない");
            });
            return idx >= 0 ? idx : buttons.length - 1;
        }
        // Sync version
        dialog.showMessageBoxSync = function (...args) {
            dialog.showMessageBoxSync = origSync; // 1回で復元
            const options = args.length > 1 ? args[1] : args[0];
            const buttons = (options === null || options === void 0 ? void 0 : options.buttons) || [];
            const result = findDiscardIndex(buttons);
            console.warn(`[cocos-creator-mcp] dialog auto-responded: button[${result}]="${buttons[result] || "?"}" (buttons: ${JSON.stringify(buttons)})`);
            return result;
        };
        // Async version
        dialog.showMessageBox = function (...args) {
            dialog.showMessageBox = origAsync; // 1回で復元
            const options = args.length > 1 ? args[1] : args[0];
            const buttons = (options === null || options === void 0 ? void 0 : options.buttons) || [];
            const result = findDiscardIndex(buttons);
            console.warn(`[cocos-creator-mcp] dialog auto-responded (async): button[${result}]="${buttons[result] || "?"}" (buttons: ${JSON.stringify(buttons)})`);
            return Promise.resolve({ response: result, checkboxChecked: false });
        };
        // 安全策: 5秒後に未使用なら復元（次のダイアログが出なかったケース）
        setTimeout(() => {
            if (dialog.showMessageBoxSync !== origSync) {
                dialog.showMessageBoxSync = origSync;
            }
            if (dialog.showMessageBox !== origAsync) {
                dialog.showMessageBox = origAsync;
            }
        }, 5000);
    }
    catch (e) {
        console.error(`[cocos-creator-mcp] patchDialogForDiscard failed: ${e.message || e}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBWUEsd0RBVUM7QUFLRCxzREFXQztBQUtELHdEQUdDO0FBY0Qsc0NBVUM7QUFXRCwwREFtQ0M7QUFuSEQsNENBQXVDO0FBRXZDLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBRXJDLHNDQUFzQztBQUN0QyxNQUFNLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFM0Y7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLHNCQUFzQjtJQUN4QyxJQUFJLENBQUM7UUFDRCxNQUFNLENBQUMsR0FBRyxNQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBZSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN4RSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBQUMsUUFBUSxtQkFBbUIsSUFBckIsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDL0IsSUFBSSxDQUFDO1FBQ0QsTUFBTSxDQUFDLEdBQUcsTUFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWUsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUMzRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBQUMsUUFBUSwrQkFBK0IsSUFBakMsQ0FBQyxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDM0MsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUVEOztHQUVHO0FBQ0ksS0FBSyxVQUFVLHFCQUFxQjtJQUN2QyxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBUSxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUM1QyxPQUFPLEVB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QUssQ0FBQyxDQUFDO1lBQ25GLE9BQU8sSUFBQSxjQUFFLEVBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFTyxLQUFLLENBQUMsWUFBWTtRQUN0QixJQUFJLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUU7Z0JBQ3JFLE9BQU8sRUFBRSx3QkFBd0I7YUFDcEMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxNQUFNLEdBQUcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7Z0JBQ1osSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUc7Z0JBQ3JCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTthQUNmLENBQUMsQ0FBQyxDQUFDO1lBQ0osT0FBTyxJQUFBLGNBQUUsRUFBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztZQUNkLE9BQU8sSUFBQSxlQUFHLEVBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBbkxELGdDQW1MQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xDYXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuXHJcbmNvbnN0IEVYVF9OQU1FID0gXCJjb2Nvcy1jcmVhdG9yLW1jcFwiO1xyXG5cclxuLyoqIOOCt+ODvOODs+WQjeOBi+OCieOAjHVudGl0bGVkICjkv53lrZjlhYjjgarjgZcp44CN44GL44Gp44GG44GL44KS5Yik5a6aICovXHJcbmNvbnN0IFVOVElUTEVEX1NDRU5FX05BTUVTID0gbmV3IFNldChbXCJzY2VuZS0yZFwiLCBcInNjZW5lLTNkXCIsIFwiVW50aXRsZWRcIiwgXCJOZXdTY2VuZVwiLCBcIlwiXSk7XHJcblxyXG4vKipcclxuICog54++5Zyo44Gu44K344O844Oz44GuIGRpcnR5IOeKtuaFi+OCkuWPluW+l+OAglxyXG4gKiBDQyDjg5Djg7zjgrjjg6fjg7PjgavjgojjgaPjgaYgcXVlcnktZGlydHkgLyBxdWVyeS1pcy1kaXJ0eSDjga7jganjgaHjgonjgYvvvIjjgb7jgZ/jga/kuKHmlrnvvInjgYzlrZjlnKjjgZnjgovjga7jgafkuKHmlrnoqabooYzjgIJcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBxdWVyeUN1cnJlbnRTY2VuZURpcnR5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktZGlydHlcIik7XHJcbiAgICAgICAgcmV0dXJuICEhcjtcclxuICAgIH0gY2F0Y2ggeyAvKiB0cnkgYWx0ZXJuYXRlICovIH1cclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgciA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWlzLWRpcnR5XCIpO1xyXG4gICAgICAgIHJldHVybiAhIXI7XHJcbiAgICB9IGNhdGNoIHsgLyogYXNzdW1lIGNsZWFuIGlmIGJvdGggZmFpbCAqLyB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDnj77lnKjjga7jgrfjg7zjg7Pmg4XloLHvvIjlkI3liY3jg7tVVUlE77yJ44KS5Y+W5b6X44CCXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlDdXJyZW50U2NlbmVJbmZvKCk6IFByb21pc2U8eyBzY2VuZU5hbWU6IHN0cmluZzsgc2NlbmVVdWlkOiBzdHJpbmcgfT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXHJcbiAgICAgICAgICAgIFwic2NlbmVcIixcclxuICAgICAgICAgICAgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICB7IG5hbWU6IEVYVF9OQU1FLCBtZXRob2Q6IFwiZ2V0U2NlbmVIaWVyYXJjaHlcIiwgYXJnczogW2ZhbHNlXSB9XHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4geyBzY2VuZU5hbWU6IHJlc3VsdD8uc2NlbmVOYW1lIHx8IFwiXCIsIHNjZW5lVXVpZDogcmVzdWx0Py5zY2VuZVV1aWQgfHwgXCJcIiB9O1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgICAgcmV0dXJuIHsgc2NlbmVOYW1lOiBcIlwiLCBzY2VuZVV1aWQ6IFwiXCIgfTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIOePvuWcqOOBruOCt+ODvOODs+OBjCB1bnRpdGxlZCAoc2NlbmUtMmQg562JKSDjgYvjgpLliKTlrprjgIJcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpc0N1cnJlbnRTY2VuZVVudGl0bGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgY29uc3QgeyBzY2VuZU5hbWUgfSA9IGF3YWl0IHF1ZXJ5Q3VycmVudFNjZW5lSW5mbygpO1xyXG4gICAgcmV0dXJuIFVOVElUTEVEX1NDRU5FX05BTUVTLmhhcyhzY2VuZU5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogc2F2ZS1zY2VuZSDjgpLjg4DjgqTjgqLjg63jgrDlronlhajjgavlkbzjgbPlh7rjgZnjgIJcclxuICpcclxuICogLSDnj77lnKjjga7jgrfjg7zjg7PjgYwgdW50aXRsZWQgKHNjZW5lLTJkIOetiSkg4oaSIG5vLW9w77yI44OA44Kk44Ki44Ot44Kw6Ziy5q2i77yJXHJcbiAqIC0g44Gd44KM5Lul5aSWIOKGkiBzYXZlLXNjZW5lIOOCkuWun+ihjFxyXG4gKlxyXG4gKiDku7vmhI/jga4gTUNQIOODhOODvOODq+WGhemDqOOBpyBzYXZlLXNjZW5lIOOCkuWRvOOBtuWgtOWQiOOBr+W/heOBmuOBk+OCjOe1jOeUseOBq+OBmeOCi+OAglxyXG4gKiDnm7TmjqUgYEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcInNhdmUtc2NlbmVcIilgIOOCkuWRvOOBtuOBqOOAgVxyXG4gKiDnj77lnKjjgrfjg7zjg7PjgYwgdW50aXRsZWQg44Gu44Go44GN44Gr44Oi44O844OA44Or44OA44Kk44Ki44Ot44Kw44GM5Ye644GmIE1DUCDjgYzlm7rjgb7jgovjgIJcclxuICpcclxuICogQHJldHVybnMg5a6f6Zqb44Gr5L+d5a2Y44KS5a6f6KGM44GX44Gf44GLXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2FmZVNhdmVTY2VuZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIGlmIChhd2FpdCBpc0N1cnJlbnRTY2VuZVVudGl0bGVkKCkpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgICAgIFwiW2NvY29zLWNyZWF0b3ItbWNwXSBzYWZlU2F2ZVNjZW5lOiBjdXJyZW50IHNjZW5lIGlzIHVudGl0bGVkLCBcIiArXHJcbiAgICAgICAgICAgIFwic2tpcHBpbmcgc2F2ZS1zY2VuZSB0byBhdm9pZCBtb2RhbCBkaWFsb2cuXCJcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNhdmUtc2NlbmVcIik7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOOCt+ODvOODs+WIh+abv+ezu+ODhOODvOODq++8iHNjZW5lX29wZW4vY2xvc2UvbmV3IOOBquOBqe+8ieOBruWJjeWHpueQhuOAglxyXG4gKlxyXG4gKiAtIGNsZWFuIOKGkiBPS1xyXG4gKiAtIGRpcnR5ICsg5L+d5a2Y5YWI44GC44KK44Gu44K344O844OzIOKGkiBzYXZlLXNjZW5lIOOBp+iHquWLleS/neWtmFxyXG4gKiAtIGRpcnR5ICsgdW50aXRsZWQg44K344O844OzIOKGkiDjg4DjgqTjgqLjg63jgrDjgpLoh6rli5Xlv5znrZTvvIhcIkRvbid0IFNhdmVcIu+8ieOBl+OBpuWkieabtOOCkuegtOajhFxyXG4gKlxyXG4gKiDnm67nmoQ6IFwiU2F2ZSBjaGFuZ2VzP1wiIOODgOOCpOOCouODreOCsOOBpyBNQ1Ag44GM44OW44Ot44OD44Kv44GV44KM44KL44Gu44KS6Ziy44GQ44CCXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlU2NlbmVTYWZlVG9Td2l0Y2goZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgaXNEaXJ0eSA9IGF3YWl0IHF1ZXJ5Q3VycmVudFNjZW5lRGlydHkoKTtcclxuICAgIGlmICghaXNEaXJ0eSkgcmV0dXJuO1xyXG5cclxuICAgIGNvbnN0IHsgc2NlbmVOYW1lIH0gPSBhd2FpdCBxdWVyeUN1cnJlbnRTY2VuZUluZm8oKTtcclxuICAgIGNvbnN0IGlzVW50aXRsZWQgPSBVTlRJVExFRF9TQ0VORV9OQU1FUy5oYXMoc2NlbmVOYW1lKTtcclxuXHJcbiAgICBpZiAoaXNVbnRpdGxlZCkge1xyXG4gICAgICAgIC8vIHVudGl0bGVkICsgZGlydHk6IOODgOOCpOOCouODreOCsOOBjOWHuuOCi+OBqE1DUOOBjOODluODreODg+OCr+OBleOCjOOCi+OBruOBp+OAgVxyXG4gICAgICAgIC8vIEVsZWN0cm9uIGRpYWxvZyDjgpLjg5Hjg4Pjg4HjgZfjgabjgIzkv53lrZjjgZfjgarjgYTjgI3jgpLoh6rli5Xlv5znrZTjgZnjgovjgIJcclxuICAgICAgICAvLyDjg5Hjg4Pjg4Hjga/mrKHlm57jga7jgrfjg7zjg7PliIfmm7/vvIjlkbzjgbPlh7rjgZflhYPjga4gc2NlbmVfb3BlbiDnrYnvvInjgafjg4DjgqTjgqLjg63jgrDjgYzlh7rjgovnnqzplpPjgavlirnjgY/jgIJcclxuICAgICAgICBwYXRjaERpYWxvZ0ZvckRpc2NhcmQoKTtcclxuICAgICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgICAgIGBbY29jb3MtY3JlYXRvci1tY3BdIGVuc3VyZVNjZW5lU2FmZVRvU3dpdGNoOiB1bnRpdGxlZCBzY2VuZSBcIiR7c2NlbmVOYW1lfVwiIGAgK1xyXG4gICAgICAgICAgICBgaXMgZGlydHkg4oCUIGRpYWxvZyB3aWxsIGF1dG8tcmVzcG9uZCBcIkRvbid0IFNhdmVcIiB0byBhdm9pZCBibG9ja2luZyBNQ1AuYFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgLy8g44GT44GT44Gr5p2l44KL5pmC54K544GnIHVudGl0bGVkIOOBp+OBr+OBquOBhO+8iOS4iuOBp+WIpOWumua4iOOBv++8ieOBruOBp+ebtOaOpSBzYXZlLXNjZW5lIE9LXHJcbiAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwic2F2ZS1zY2VuZVwiKTtcclxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgIGlmIChmb3JjZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXHJcbiAgICAgICAgICAgICAgICBgW2NvY29zLWNyZWF0b3ItbWNwXSBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaDogc2F2ZS1zY2VuZSBmYWlsZWQgYnV0IGZvcmNlPXRydWUg4oCUIHByb2NlZWRpbmcuIGAgK1xyXG4gICAgICAgICAgICAgICAgYEVycm9yOiAke2UubWVzc2FnZSB8fCBlfWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgIGBGYWlsZWQgdG8gYXV0by1zYXZlIGRpcnR5IHNjZW5lIFwiJHtzY2VuZU5hbWV9XCIgYmVmb3JlIHN3aXRjaDogJHtlLm1lc3NhZ2UgfHwgZX0uIGAgK1xyXG4gICAgICAgICAgICBgU2F2ZSBtYW51YWxseSBhbmQgcmV0cnksIG9yIHBhc3MgZm9yY2U9dHJ1ZSB0byBieXBhc3MuYFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFbGVjdHJvbiDjga4gZGlhbG9nLnNob3dNZXNzYWdlQm94KFN5bmMpIOOCkuS4gOaZgueahOOBq+ODkeODg+ODgeOBl+OBpuOAgVxyXG4gKiDmrKHlm57jga7jg4DjgqTjgqLjg63jgrDjgafjgIzkv53lrZjjgZfjgarjgYQgKERvbid0IFNhdmUp44CN44KS6Ieq5YuV6YG45oqe44GZ44KL44CCXHJcbiAqXHJcbiAqIENvY29zQ3JlYXRvciDjga4gXCJTYXZlIGNoYW5nZXM/XCIg44OA44Kk44Ki44Ot44Kw44Gv6YCa5bi4OlxyXG4gKiAgIGJ1dHRvbnM6IFtcIlNhdmVcIiwgXCJDYW5jZWxcIiwgXCJEb24ndCBTYXZlXCJdIOKGkiBpbmRleCAyID0gRG9uJ3QgU2F2ZVxyXG4gKiDjgb7jgZ/jga86XHJcbiAqICAgYnV0dG9uczogW1wiU2F2ZVwiLCBcIkRvbid0IFNhdmVcIiwgXCJDYW5jZWxcIl0g4oaSIGluZGV4IDEgPSBEb24ndCBTYXZlXHJcbiAqXHJcbiAqIOODnOOCv+ODs+ODhuOCreOCueODiOOBi+OCiSBcIkRvbid0IFNhdmVcIiAvIFwibm90XCIgLyBcImRpc2NhcmRcIiDjgpLmjqLjgZfjgIFcclxuICog6KaL44Gk44GL44KJ44Gq44GR44KM44Gw5pyA5b6M44Gu44Oc44K/44Oz77yI6YCa5bi4IERvbid0IFNhdmXvvInjgpLpgbjmip7jgZnjgovjgIJcclxuICovXHJcbmZ1bmN0aW9uIHBhdGNoRGlhbG9nRm9yRGlzY2FyZCgpOiB2b2lkIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgZWxlY3Ryb24gPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7XHJcbiAgICAgICAgY29uc3QgZGlhbG9nID0gZWxlY3Ryb24uZGlhbG9nO1xyXG4gICAgICAgIGNvbnN0IG9yaWdTeW5jID0gZGlhbG9nLnNob3dNZXNzYWdlQm94U3luYztcclxuICAgICAgICBjb25zdCBvcmlnQXN5bmMgPSBkaWFsb2cuc2hvd01lc3NhZ2VCb3g7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmREaXNjYXJkSW5kZXgoYnV0dG9uczogc3RyaW5nW10pOiBudW1iZXIge1xyXG4gICAgICAgICAgICBpZiAoIWJ1dHRvbnMgfHwgYnV0dG9ucy5sZW5ndGggPT09IDApIHJldHVybiAwO1xyXG4gICAgICAgICAgICBjb25zdCBpZHggPSBidXR0b25zLmZpbmRJbmRleCgoYjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb3dlciA9IGIudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsb3dlci5pbmNsdWRlcyhcImRvbid0IHNhdmVcIikgfHwgbG93ZXIuaW5jbHVkZXMoXCJub3RcIilcclxuICAgICAgICAgICAgICAgICAgICB8fCBsb3dlci5pbmNsdWRlcyhcImRpc2NhcmRcIikgfHwgbG93ZXIuaW5jbHVkZXMoXCLkv53lrZjjgZfjgarjgYRcIik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gaWR4ID49IDAgPyBpZHggOiBidXR0b25zLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBTeW5jIHZlcnNpb25cclxuICAgICAgICBkaWFsb2cuc2hvd01lc3NhZ2VCb3hTeW5jID0gZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIGRpYWxvZy5zaG93TWVzc2FnZUJveFN5bmMgPSBvcmlnU3luYzsgLy8gMeWbnuOBp+W+qeWFg1xyXG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gYXJncy5sZW5ndGggPiAxID8gYXJnc1sxXSA6IGFyZ3NbMF07XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBvcHRpb25zPy5idXR0b25zIHx8IFtdO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmaW5kRGlzY2FyZEluZGV4KGJ1dHRvbnMpO1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtjb2Nvcy1jcmVhdG9yLW1jcF0gZGlhbG9nIGF1dG8tcmVzcG9uZGVkOiBidXR0b25bJHtyZXN1bHR9XT1cIiR7YnV0dG9uc1tyZXN1bHRdIHx8IFwiP1wifVwiIChidXR0b25zOiAke0pTT04uc3RyaW5naWZ5KGJ1dHRvbnMpfSlgKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBBc3luYyB2ZXJzaW9uXHJcbiAgICAgICAgZGlhbG9nLnNob3dNZXNzYWdlQm94ID0gZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIGRpYWxvZy5zaG93TWVzc2FnZUJveCA9IG9yaWdBc3luYzsgLy8gMeWbnuOBp+W+qeWFg1xyXG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gYXJncy5sZW5ndGggPiAxID8gYXJnc1sxXSA6IGFyZ3NbMF07XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBvcHRpb25zPy5idXR0b25zIHx8IFtdO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmaW5kRGlzY2FyZEluZGV4KGJ1dHRvbnMpO1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtjb2Nvcy1jcmVhdG9yLW1jcF0gZGlhbG9nIGF1dG8tcmVzcG9uZGVkIChhc3luYyk6IGJ1dHRvblske3Jlc3VsdH1dPVwiJHtidXR0b25zW3Jlc3VsdF0gfHwgXCI/XCJ9XCIgKGJ1dHRvbnM6ICR7SlNPTi5zdHJpbmdpZnkoYnV0dG9ucyl9KWApO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgcmVzcG9uc2U6IHJlc3VsdCwgY2hlY2tib3hDaGVja2VkOiBmYWxzZSB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyDlronlhajnrZY6IDXnp5LlvozjgavmnKrkvb/nlKjjgarjgonlvqnlhYPvvIjmrKHjga7jg4DjgqTjgqLjg63jgrDjgYzlh7rjgarjgYvjgaPjgZ/jgrHjg7zjgrnvvIlcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGRpYWxvZy5zaG93TWVzc2FnZUJveFN5bmMgIT09IG9yaWdTeW5jKSB7XHJcbiAgICAgICAgICAgICAgICBkaWFsb2cuc2hvd01lc3NhZ2VCb3hTeW5jID0gb3JpZ1N5bmM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGRpYWxvZy5zaG93TWVzc2FnZUJveCAhPT0gb3JpZ0FzeW5jKSB7XHJcbiAgICAgICAgICAgICAgICBkaWFsb2cuc2hvd01lc3NhZ2VCb3ggPSBvcmlnQXN5bmM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCA1MDAwKTtcclxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtjb2Nvcy1jcmVhdG9yLW1jcF0gcGF0Y2hEaWFsb2dGb3JEaXNjYXJkIGZhaWxlZDogJHtlLm1lc3NhZ2UgfHwgZX1gKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNjZW5lVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJzY2VuZVwiO1xyXG5cclxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfZ2V0X2hpZXJhcmNoeVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IHRoZSBub2RlIGhpZXJhcmNoeSBvZiB0aGUgY3VycmVudCBzY2VuZS4gUmV0dXJucyB0cmVlIHN0cnVjdHVyZSB3aXRoIHV1aWQsIG5hbWUsIGFjdGl2ZSwgYW5kIG9wdGlvbmFsbHkgY29tcG9uZW50cy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDb21wb25lbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkluY2x1ZGUgY29tcG9uZW50IGluZm8gZm9yIGVhY2ggbm9kZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX29wZW5cIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk9wZW4gYSBzY2VuZSBieSBpdHMgYXNzZXQgVVVJRCBvciBkYXRhYmFzZSBwYXRoIChlLmcuICdkYjovL2Fzc2V0cy9zY2VuZXMvTWFpbi5zY2VuZScpLiBJZiB0aGUgY3VycmVudCBzY2VuZSBpcyBkaXJ0eSBhbmQgdW50aXRsZWQsIHJldHVybnMgYW4gZXJyb3IgaW5zdGVhZCBvZiB0cmlnZ2VyaW5nIGEgbW9kYWwgc2F2ZSBkaWFsb2cgdGhhdCB3b3VsZCBibG9jayBNQ1AuIFBhc3MgZm9yY2U9dHJ1ZSB0byBieXBhc3MgdGhpcyBndWFyZC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2NlbmUgVVVJRCBvciBkYjovLyBwYXRoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNraXAgZGlydHktc2NlbmUgcHJlZmxpZ2h0IGNoZWNrIChtYXkgdHJpZ2dlciBtb2RhbCBzYXZlIGRpYWxvZylcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJzY2VuZVwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfc2F2ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2F2ZSB0aGUgY3VycmVudGx5IG9wZW4gc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2dldF9saXN0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGFsbCBzY2VuZSBmaWxlcyBpbiB0aGUgcHJvamVjdC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfY2xvc2VcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNsb3NlIHRoZSBjdXJyZW50IHNjZW5lLiBJZiB0aGUgY3VycmVudCBzY2VuZSBpcyBkaXJ0eSBhbmQgdW50aXRsZWQsIHJldHVybnMgYW4gZXJyb3IgaW5zdGVhZCBvZiB0cmlnZ2VyaW5nIGEgbW9kYWwgc2F2ZSBkaWFsb2cuIFBhc3MgZm9yY2U9dHJ1ZSB0byBieXBhc3MuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JjZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTa2lwIGRpcnR5LXNjZW5lIHByZWZsaWdodCBjaGVjayAobWF5IHRyaWdnZXIgbW9kYWwgc2F2ZSBkaWFsb2cpXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfZ2V0X2N1cnJlbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgbmFtZSBhbmQgVVVJRCBvZiB0aGUgY3VycmVudGx5IG9wZW4gc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic2NlbmVfZ2V0X2hpZXJhcmNoeVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SGllcmFyY2h5KGFyZ3MuaW5jbHVkZUNvbXBvbmVudHMgPz8gZmFsc2UpO1xyXG4gICAgICAgICAgICBjYXNlIFwic2NlbmVfb3BlblwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3BlblNjZW5lKGFyZ3Muc2NlbmUsICEhYXJncy5mb3JjZSk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9zYXZlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zYXZlU2NlbmUoKTtcclxuICAgICAgICAgICAgY2FzZSBcInNjZW5lX2dldF9saXN0XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTY2VuZUxpc3QoKTtcclxuICAgICAgICAgICAgY2FzZSBcInNjZW5lX2Nsb3NlXCI6XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGVuc3VyZVNjZW5lU2FmZVRvU3dpdGNoKCEhYXJncy5mb3JjZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwiY2xvc2Utc2NlbmVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkgeyByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpOyB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9nZXRfY3VycmVudFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SGllcmFyY2h5KGZhbHNlKS50aGVuKChyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShyLmNvbnRlbnRbMF0udGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgc2NlbmVOYW1lOiBwYXJzZWQuc2NlbmVOYW1lLCBzY2VuZVV1aWQ6IHBhcnNlZC5zY2VuZVV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZSkgPT4gZXJyKFN0cmluZyhlKSkpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEhpZXJhcmNoeShpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXHJcbiAgICAgICAgICAgICAgICBcInNjZW5lXCIsXHJcbiAgICAgICAgICAgICAgICBcImV4ZWN1dGUtc2NlbmUtc2NyaXB0XCIsXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogRVhUX05BTUUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcImdldFNjZW5lSGllcmFyY2h5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW2luY2x1ZGVDb21wb25lbnRzXSxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHJlc3VsdCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrOiB1c2UgcXVlcnktbm9kZS10cmVlXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cmVlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwicXVlcnktbm9kZS10cmVlXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaGllcmFyY2h5OiB0cmVlIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlMjogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGUyLm1lc3NhZ2UgfHwgU3RyaW5nKGUyKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuU2NlbmUoc2NlbmU6IHN0cmluZywgZm9yY2U6IGJvb2xlYW4pOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBlbnN1cmVTY2VuZVNhZmVUb1N3aXRjaChmb3JjZSk7XHJcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcIm9wZW4tYXNzZXRcIiwgc2NlbmUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzY2VuZSB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlU2NlbmUoKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8g54++5Zyo44Gu44K344O844Oz44GM5L+d5a2Y5riI44G/44OV44Kh44Kk44Or44GL56K66KqN77yI5paw6KaP44K344O844Oz44Gu5aC05ZCI44Gv44OA44Kk44Ki44Ot44Kw44GM5Ye644KL44Gu44Gn44K544Kt44OD44OX77yJXHJcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lcyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0c1wiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiBcImRiOi8vYXNzZXRzLyoqLyouc2NlbmVcIixcclxuICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4gW10pO1xyXG5cclxuICAgICAgICAgICAgLy8g44K344O844Oz5ZCN44KS5Y+W5b6X44GX44Gm5pei5a2Y44K344O844Oz44GL5Yik5a6aXHJcbiAgICAgICAgICAgIGNvbnN0IGhpZXJhcmNoeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXHJcbiAgICAgICAgICAgICAgICBcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIixcclxuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJjb2Nvcy1jcmVhdG9yLW1jcFwiLCBtZXRob2Q6IFwiZ2V0U2NlbmVIaWVyYXJjaHlcIiwgYXJnczogW2ZhbHNlXSB9XHJcbiAgICAgICAgICAgICkuY2F0Y2goKCkgPT4gbnVsbCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzY2VuZU5hbWUgPSBoaWVyYXJjaHk/LnNjZW5lTmFtZTtcclxuICAgICAgICAgICAgY29uc3QgaXNOZXdTY2VuZSA9ICFzY2VuZU5hbWUgfHwgc2NlbmVOYW1lID09PSBcInNjZW5lLTJkXCIgfHwgc2NlbmVOYW1lID09PSBcIlVudGl0bGVkXCI7XHJcbiAgICAgICAgICAgIGlmIChpc05ld1NjZW5lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub3RlOiBcIk5ldy91bnRpdGxlZCBzY2VuZSwgc2tpcCBzYXZlIHRvIGF2b2lkIGRpYWxvZ1wiIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyDjgrfjg7zjg7PjgYxkaXJ0eeOBp+OBquOBhOWgtOWQiOOBr+S/neWtmOS4jeimgVxyXG4gICAgICAgICAgICBjb25zdCBpc0RpcnR5ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktaXMtZGlydHlcIikuY2F0Y2goKCkgPT4gdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmICghaXNEaXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgbm90ZTogXCJTY2VuZSBub3QgZGlydHksIHNraXAgc2F2ZVwiIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJzYXZlLXNjZW5lXCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFNjZW5lTGlzdCgpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IFwiZGI6Ly9hc3NldHMvKiovKi5zY2VuZVwiLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gKHJlc3VsdHMgfHwgW10pLm1hcCgoYTogYW55KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgdXVpZDogYS51dWlkLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogYS5wYXRoIHx8IGEudXJsLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogYS5uYW1lLFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNjZW5lcyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19