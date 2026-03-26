"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneTools = void 0;
const tool_base_1 = require("../tool-base");
const EXT_NAME = "cocos-creator-mcp";
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
    async execute(toolName, args) {
        var _a;
        switch (toolName) {
            case "scene_get_hierarchy":
                return this.getHierarchy((_a = args.includeComponents) !== null && _a !== void 0 ? _a : false);
            case "scene_open":
                return this.openScene(args.scene);
            case "scene_save":
                return this.saveScene();
            case "scene_get_list":
                return this.getSceneList();
            case "scene_close":
                try {
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
    async openScene(scene) {
        try {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBRXZDLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBRXJDLE1BQWEsVUFBVTtJQUF2QjtRQUNhLGlCQUFZLEdBQUcsT0FBTyxDQUFDO0lBb0twQyxDQUFDO0lBbEtHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLHFCQUFxQjtnQkFDM0IsV0FBVyxFQUFFLHlIQUF5SDtnQkFDdEksV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixpQkFBaUIsRUFBRTs0QkFDZixJQUFJLEVBQUUsU0FBUzs0QkFDZixXQUFXLEVBQUUsc0NBQXNDO3lCQUN0RDtxQkFDSjtpQkFDSjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLFdBQVcsRUFBRSx5RkFBeUY7Z0JBQ3RHLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsS0FBSyxFQUFFOzRCQUNILElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSwwQkFBMEI7eUJBQzFDO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQztpQkFDdEI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxZQUFZO2dCQUNsQixXQUFXLEVBQUUsZ0NBQWdDO2dCQUM3QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFLEVBQUU7aUJBQ2pCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixXQUFXLEVBQUUsc0NBQXNDO2dCQUNuRCxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFLEVBQUU7aUJB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QVk7UUFDdEIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFO2dCQUNyRSxPQUFPLEVBQUUsd0JBQXdCO2FBQ3BDLENBQUMsQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO2dCQUNaLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHO2dCQUNyQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7YUFDZixDQUFDLENBQUMsQ0FBQztZQUNKLE9BQU8sSUFBQSxjQUFFLEVBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDZCxPQUFPLElBQUEsZUFBRyxFQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQXJLRCxnQ0FxS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBUb29sUmVzdWx0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XHJcbmltcG9ydCB7IG9rLCBlcnIgfSBmcm9tIFwiLi4vdG9vbC1iYXNlXCI7XHJcblxyXG5jb25zdCBFWFRfTkFNRSA9IFwiY29jb3MtY3JlYXRvci1tY3BcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTY2VuZVRvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwic2NlbmVcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2dldF9oaWVyYXJjaHlcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgbm9kZSBoaWVyYXJjaHkgb2YgdGhlIGN1cnJlbnQgc2NlbmUuIFJldHVybnMgdHJlZSBzdHJ1Y3R1cmUgd2l0aCB1dWlkLCBuYW1lLCBhY3RpdmUsIGFuZCBvcHRpb25hbGx5IGNvbXBvbmVudHMuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQ29tcG9uZW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJJbmNsdWRlIGNvbXBvbmVudCBpbmZvIGZvciBlYWNoIG5vZGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9vcGVuXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPcGVuIGEgc2NlbmUgYnkgaXRzIGFzc2V0IFVVSUQgb3IgZGF0YWJhc2UgcGF0aCAoZS5nLiAnZGI6Ly9hc3NldHMvc2NlbmVzL01haW4uc2NlbmUnKS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2NlbmUgVVVJRCBvciBkYjovLyBwYXRoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wic2NlbmVcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX3NhdmVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNhdmUgdGhlIGN1cnJlbnRseSBvcGVuIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJzY2VuZV9nZXRfbGlzdFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiTGlzdCBhbGwgc2NlbmUgZmlsZXMgaW4gdGhlIHByb2plY3QuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInNjZW5lX2Nsb3NlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDbG9zZSB0aGUgY3VycmVudCBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7IHR5cGU6IFwib2JqZWN0XCIsIHByb3BlcnRpZXM6IHt9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic2NlbmVfZ2V0X2N1cnJlbnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCB0aGUgbmFtZSBhbmQgVVVJRCBvZiB0aGUgY3VycmVudGx5IG9wZW4gc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7fSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic2NlbmVfZ2V0X2hpZXJhcmNoeVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SGllcmFyY2h5KGFyZ3MuaW5jbHVkZUNvbXBvbmVudHMgPz8gZmFsc2UpO1xyXG4gICAgICAgICAgICBjYXNlIFwic2NlbmVfb3BlblwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub3BlblNjZW5lKGFyZ3Muc2NlbmUpO1xyXG4gICAgICAgICAgICBjYXNlIFwic2NlbmVfc2F2ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2F2ZVNjZW5lKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9nZXRfbGlzdFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2NlbmVMaXN0KCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzY2VuZV9jbG9zZVwiOlxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjbG9zZS1zY2VuZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgY2FzZSBcInNjZW5lX2dldF9jdXJyZW50XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRIaWVyYXJjaHkoZmFsc2UpLnRoZW4oKHIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHIuY29udGVudFswXS50ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBzY2VuZU5hbWU6IHBhcnNlZC5zY2VuZU5hbWUsIHNjZW5lVXVpZDogcGFyc2VkLnNjZW5lVXVpZCB9KTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlKSA9PiBlcnIoU3RyaW5nKGUpKSk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0SGllcmFyY2h5KGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcclxuICAgICAgICAgICAgICAgIFwic2NlbmVcIixcclxuICAgICAgICAgICAgICAgIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIixcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBFWFRfTkFNRSxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiZ2V0U2NlbmVIaWVyYXJjaHlcIixcclxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbaW5jbHVkZUNvbXBvbmVudHNdLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm4gb2socmVzdWx0KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHVzZSBxdWVyeS1ub2RlLXRyZWVcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlLXRyZWVcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBoaWVyYXJjaHk6IHRyZWUgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoZTIubWVzc2FnZSB8fCBTdHJpbmcoZTIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIG9wZW5TY2VuZShzY2VuZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwib3Blbi1hc3NldFwiLCBzY2VuZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHNjZW5lIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNhdmVTY2VuZSgpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyDnj77lnKjjga7jgrfjg7zjg7PjgYzkv53lrZjmuIjjgb/jg5XjgqHjgqTjg6vjgYvnorroqo3vvIjmlrDopo/jgrfjg7zjg7Pjga7loLTlkIjjga/jg4DjgqTjgqLjg63jgrDjgYzlh7rjgovjga7jgafjgrnjgq3jg4Pjg5fvvIlcclxuICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IFwiZGI6Ly9hc3NldHMvKiovKi5zY2VuZVwiLFxyXG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiBbXSk7XHJcblxyXG4gICAgICAgICAgICAvLyDjgrfjg7zjg7PlkI3jgpLlj5blvpfjgZfjgabml6LlrZjjgrfjg7zjg7PjgYvliKTlrppcclxuICAgICAgICAgICAgY29uc3QgaGllcmFyY2h5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcclxuICAgICAgICAgICAgICAgIFwic2NlbmVcIiwgXCJleGVjdXRlLXNjZW5lLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICAgICAgeyBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsIG1ldGhvZDogXCJnZXRTY2VuZUhpZXJhcmNoeVwiLCBhcmdzOiBbZmFsc2VdIH1cclxuICAgICAgICAgICAgKS5jYXRjaCgoKSA9PiBudWxsKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lTmFtZSA9IGhpZXJhcmNoeT8uc2NlbmVOYW1lO1xyXG4gICAgICAgICAgICBjb25zdCBpc05ld1NjZW5lID0gIXNjZW5lTmFtZSB8fCBzY2VuZU5hbWUgPT09IFwic2NlbmUtMmRcIiB8fCBzY2VuZU5hbWUgPT09IFwiVW50aXRsZWRcIjtcclxuICAgICAgICAgICAgaWYgKGlzTmV3U2NlbmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vdGU6IFwiTmV3L3VudGl0bGVkIHNjZW5lLCBza2lwIHNhdmUgdG8gYXZvaWQgZGlhbG9nXCIgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIOOCt+ODvOODs+OBjGRpcnR544Gn44Gq44GE5aC05ZCI44Gv5L+d5a2Y5LiN6KaBXHJcbiAgICAgICAgICAgIGNvbnN0IGlzRGlydHkgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1pcy1kaXJ0eVwiKS5jYXRjaCgoKSA9PiB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKCFpc0RpcnR5KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub3RlOiBcIlNjZW5lIG5vdCBkaXJ0eSwgc2tpcCBzYXZlXCIgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInNhdmUtc2NlbmVcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0U2NlbmVMaXN0KCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogXCJkYjovL2Fzc2V0cy8qKi8qLnNjZW5lXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBzY2VuZXMgPSAocmVzdWx0cyB8fCBbXSkubWFwKChhOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICB1dWlkOiBhLnV1aWQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiBhLnBhdGggfHwgYS51cmwsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBhLm5hbWUsXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgc2NlbmVzIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=