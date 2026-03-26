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
            // save-scene does not return a response, so use send (fire-and-forget)
            Editor.Message.send("scene", "save-scene");
            return ok({ success: true, message: "Save request sent" });
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
