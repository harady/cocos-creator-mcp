import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

const EXT_NAME = "cocos-creator-mcp";

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
                description: "Open a scene by its asset UUID or database path (e.g. 'db://assets/scenes/Main.scene').",
                inputSchema: {
                    type: "object",
                    properties: {
                        scene: {
                            type: "string",
                            description: "Scene UUID or db:// path",
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
                description: "Close the current scene.",
                inputSchema: { type: "object", properties: {} },
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
                return this.openScene(args.scene);
            case "scene_save":
                return this.saveScene();
            case "scene_get_list":
                return this.getSceneList();
            case "scene_close":
                try {
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

    private async openScene(scene: string): Promise<ToolResult> {
        try {
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
