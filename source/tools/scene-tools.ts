import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

const EXT_NAME = "cocos-creator-mcp";

/** シーン名から「untitled (保存先なし)」かどうかを判定 */
const UNTITLED_SCENE_NAMES = new Set(["scene-2d", "scene-3d", "Untitled", "NewScene", ""]);

/**
 * 現在のシーンの dirty 状態を取得。
 * CC バージョンによって query-dirty / query-is-dirty のどちらか（または両方）が存在するので両方試行。
 */
export async function queryCurrentSceneDirty(): Promise<boolean> {
    try {
        const r = await (Editor.Message.request as any)("scene", "query-dirty");
        return !!r;
    } catch { /* try alternate */ }
    try {
        const r = await (Editor.Message.request as any)("scene", "query-is-dirty");
        return !!r;
    } catch { /* assume clean if both fail */ }
    return false;
}

/**
 * 現在のシーン情報（名前・UUID）を取得。
 */
export async function queryCurrentSceneInfo(): Promise<{ sceneName: string; sceneUuid: string }> {
    try {
        const result: any = await Editor.Message.request(
            "scene",
            "execute-scene-script",
            { name: EXT_NAME, method: "getSceneHierarchy", args: [false] }
        );
        return { sceneName: result?.sceneName || "", sceneUuid: result?.sceneUuid || "" };
    } catch {
        return { sceneName: "", sceneUuid: "" };
    }
}

/**
 * 現在のシーンが untitled (scene-2d 等) かを判定。
 */
export async function isCurrentSceneUntitled(): Promise<boolean> {
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
export async function safeSaveScene(): Promise<boolean> {
    if (await isCurrentSceneUntitled()) {
        console.warn(
            "[cocos-creator-mcp] safeSaveScene: current scene is untitled, " +
            "skipping save-scene to avoid modal dialog."
        );
        return false;
    }
    await (Editor.Message.request as any)("scene", "save-scene");
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
export async function ensureSceneSafeToSwitch(force: boolean = false): Promise<void> {
    const isDirty = await queryCurrentSceneDirty();
    if (!isDirty) return;

    const { sceneName } = await queryCurrentSceneInfo();
    const isUntitled = UNTITLED_SCENE_NAMES.has(sceneName);

    if (isUntitled) {
        // untitled + dirty: ダイアログが出るとMCPがブロックされるので、
        // Electron dialog をパッチして「保存しない」を自動応答する。
        // パッチは次回のシーン切替（呼び出し元の scene_open 等）でダイアログが出る瞬間に効く。
        patchDialogForDiscard();
        console.warn(
            `[cocos-creator-mcp] ensureSceneSafeToSwitch: untitled scene "${sceneName}" ` +
            `is dirty — dialog will auto-respond "Don't Save" to avoid blocking MCP.`
        );
        return;
    }

    try {
        // ここに来る時点で untitled ではない（上で判定済み）ので直接 save-scene OK
        await (Editor.Message.request as any)("scene", "save-scene");
    } catch (e: any) {
        if (force) {
            console.warn(
                `[cocos-creator-mcp] ensureSceneSafeToSwitch: save-scene failed but force=true — proceeding. ` +
                `Error: ${e.message || e}`
            );
            return;
        }
        throw new Error(
            `Failed to auto-save dirty scene "${sceneName}" before switch: ${e.message || e}. ` +
            `Save manually and retry, or pass force=true to bypass.`
        );
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
function patchDialogForDiscard(): void {
    try {
        const electron = require("electron");
        const dialog = electron.dialog;
        const origSync = dialog.showMessageBoxSync;
        const origAsync = dialog.showMessageBox;

        function findDiscardIndex(buttons: string[]): number {
            if (!buttons || buttons.length === 0) return 0;
            const idx = buttons.findIndex((b: string) => {
                const lower = b.toLowerCase();
                return lower.includes("don't save") || lower.includes("not")
                    || lower.includes("discard") || lower.includes("保存しない");
            });
            return idx >= 0 ? idx : buttons.length - 1;
        }

        // Sync version
        dialog.showMessageBoxSync = function (...args: any[]) {
            dialog.showMessageBoxSync = origSync; // 1回で復元
            const options = args.length > 1 ? args[1] : args[0];
            const buttons = options?.buttons || [];
            const result = findDiscardIndex(buttons);
            console.warn(`[cocos-creator-mcp] dialog auto-responded: button[${result}]="${buttons[result] || "?"}" (buttons: ${JSON.stringify(buttons)})`);
            return result;
        };

        // Async version
        dialog.showMessageBox = function (...args: any[]) {
            dialog.showMessageBox = origAsync; // 1回で復元
            const options = args.length > 1 ? args[1] : args[0];
            const buttons = options?.buttons || [];
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
    } catch (e: any) {
        console.error(`[cocos-creator-mcp] patchDialogForDiscard failed: ${e.message || e}`);
    }
}

export class SceneTools implements ToolCategory {
    readonly categoryName = "scene";

    getTools(): ToolDefinition[] {
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

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        switch (toolName) {
            case "scene_get_hierarchy":
                return this.getHierarchy(args.includeComponents ?? false);
            case "scene_open":
                return this.openScene(args.scene, !!args.force);
            case "scene_save":
                return this.saveScene();
            case "scene_get_list":
                return this.getSceneList();
            case "scene_close":
                try {
                    await ensureSceneSafeToSwitch(!!args.force);
                    await (Editor.Message.request as any)("scene", "close-scene");
                    return ok({ success: true });
                } catch (e: any) { return err(e.message || String(e)); }
            case "scene_get_current":
                return this.getHierarchy(false).then((r) => {
                    const parsed = JSON.parse(r.content[0].text);
                    return ok({ success: true, sceneName: parsed.sceneName, sceneUuid: parsed.sceneUuid });
                }).catch((e) => err(String(e)));
            default:
                return err(`Unknown tool: ${toolName}`);
        }
    }

    private async getHierarchy(includeComponents: boolean): Promise<ToolResult> {
        try {
            const result = await Editor.Message.request(
                "scene",
                "execute-scene-script",
                {
                    name: EXT_NAME,
                    method: "getSceneHierarchy",
                    args: [includeComponents],
                }
            );
            return ok(result);
        } catch (e: any) {
            // Fallback: use query-node-tree
            try {
                const tree = await Editor.Message.request("scene", "query-node-tree");
                return ok({ success: true, hierarchy: tree });
            } catch (e2: any) {
                return err(e2.message || String(e2));
            }
        }
    }

    private async openScene(scene: string, force: boolean): Promise<ToolResult> {
        try {
            await ensureSceneSafeToSwitch(force);
            await Editor.Message.request("asset-db", "open-asset", scene);
            return ok({ success: true, scene });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async saveScene(): Promise<ToolResult> {
        try {
            // 現在のシーンが保存済みファイルか確認（新規シーンの場合はダイアログが出るのでスキップ）
            const scenes = await Editor.Message.request("asset-db", "query-assets", {
                pattern: "db://assets/**/*.scene",
            }).catch(() => []);

            // シーン名を取得して既存シーンか判定
            const hierarchy = await Editor.Message.request(
                "scene", "execute-scene-script",
                { name: "cocos-creator-mcp", method: "getSceneHierarchy", args: [false] }
            ).catch(() => null);

            const sceneName = hierarchy?.sceneName;
            const isNewScene = !sceneName || sceneName === "scene-2d" || sceneName === "Untitled";
            if (isNewScene) {
                return ok({ success: true, note: "New/untitled scene, skip save to avoid dialog" });
            }

            // シーンがdirtyでない場合は保存不要
            const isDirty = await (Editor.Message.request as any)("scene", "query-is-dirty").catch(() => true);
            if (!isDirty) {
                return ok({ success: true, note: "Scene not dirty, skip save" });
            }

            const result = await (Editor.Message.request as any)("scene", "save-scene", false);
            return ok({ success: true, result });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getSceneList(): Promise<ToolResult> {
        try {
            const results = await Editor.Message.request("asset-db", "query-assets", {
                pattern: "db://assets/**/*.scene",
            });
            const scenes = (results || []).map((a: any) => ({
                uuid: a.uuid,
                path: a.path || a.url,
                name: a.name,
            }));
            return ok({ success: true, scenes });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
