"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabTools = void 0;
const tool_base_1 = require("../tool-base");
class PrefabTools {
    constructor() {
        this.categoryName = "prefab";
    }
    getTools() {
        return [
            {
                name: "prefab_list",
                description: "List all prefab files in the project.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "prefab_create",
                description: "Create a prefab from an existing node in the scene. The node remains in the scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID to create prefab from" },
                        path: { type: "string", description: "db:// path for the prefab (e.g. 'db://assets/prefabs/MyPrefab.prefab')" },
                    },
                    required: ["uuid", "path"],
                },
            },
            {
                name: "prefab_instantiate",
                description: "Instantiate a prefab into the scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        prefabUuid: { type: "string", description: "Prefab asset UUID" },
                        parent: { type: "string", description: "Parent node UUID (optional, defaults to scene root)" },
                    },
                    required: ["prefabUuid"],
                },
            },
            {
                name: "prefab_get_info",
                description: "Get information about a prefab asset (name, path, UUID).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Prefab asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "prefab_update",
                description: "Update (re-save) a prefab from its instance node in the scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID of the prefab instance in the scene" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "prefab_duplicate",
                description: "Duplicate a prefab asset to a new path.",
                inputSchema: {
                    type: "object",
                    properties: {
                        source: { type: "string", description: "Source prefab db:// path" },
                        destination: { type: "string", description: "Destination db:// path" },
                    },
                    required: ["source", "destination"],
                },
            },
            {
                name: "prefab_validate",
                description: "Validate a prefab for missing references or broken links.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Prefab asset UUID" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "prefab_revert",
                description: "Revert a prefab instance node to its original prefab state.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID of the prefab instance" },
                    },
                    required: ["uuid"],
                },
            },
            {
                name: "prefab_create_and_replace",
                description: "Create a prefab from a node AND replace the original node with a prefab instance. This is the recommended way to extract a nested prefab — one command instead of create → delete → instantiate.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Node UUID to create prefab from" },
                        path: { type: "string", description: "db:// path for the prefab (e.g. 'db://assets/prefabs/MyPrefab.prefab')" },
                    },
                    required: ["uuid", "path"],
                },
            },
            {
                name: "prefab_open",
                description: "Open a prefab in editing mode. Equivalent to double-clicking the prefab in CocosCreator. Save the current scene first if needed.",
                inputSchema: {
                    type: "object",
                    properties: {
                        uuid: { type: "string", description: "Prefab asset UUID" },
                        path: { type: "string", description: "Prefab db:// path (alternative to uuid)" },
                    },
                },
            },
            {
                name: "prefab_close",
                description: "Save and close the current prefab editing mode, then return to the main scene.",
                inputSchema: {
                    type: "object",
                    properties: {
                        save: { type: "boolean", description: "Save prefab before closing (default true)" },
                        sceneUuid: { type: "string", description: "Scene UUID to return to (default: project's start scene or first scene)" },
                    },
                },
            },
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case "prefab_list":
                return this.listPrefabs();
            case "prefab_create":
                return this.createPrefab(args.uuid, args.path);
            case "prefab_instantiate":
                return this.instantiatePrefab(args.prefabUuid, args.parent);
            case "prefab_get_info":
                return this.getPrefabInfo(args.uuid);
            case "prefab_update":
                return this.updatePrefab(args.uuid);
            case "prefab_duplicate": {
                try {
                    await Editor.Message.request("asset-db", "copy-asset", args.source, args.destination);
                    return (0, tool_base_1.ok)({ success: true, source: args.source, destination: args.destination });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "prefab_validate": {
                try {
                    const info = await Editor.Message.request("asset-db", "query-asset-info", args.uuid);
                    const deps = await Editor.Message.request("asset-db", "query-depends", args.uuid).catch(() => []);
                    return (0, tool_base_1.ok)({ success: true, uuid: args.uuid, info, dependencies: deps, valid: !!info });
                }
                catch (e) {
                    return (0, tool_base_1.err)(e.message || String(e));
                }
            }
            case "prefab_revert":
                return this.revertPrefab(args.uuid);
            case "prefab_create_and_replace":
                return this.createAndReplace(args.uuid, args.path);
            case "prefab_open":
                return this.openPrefab(args.uuid, args.path);
            case "prefab_close":
                return this.closePrefab(args.save !== false, args.sceneUuid);
            default:
                return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
        }
    }
    async listPrefabs() {
        try {
            const results = await Editor.Message.request("asset-db", "query-assets", {
                pattern: "db://assets/**/*.prefab",
            });
            const prefabs = (results || []).map((a) => ({
                uuid: a.uuid,
                path: a.path || a.url,
                name: a.name,
            }));
            return (0, tool_base_1.ok)({ success: true, prefabs });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async createPrefab(nodeUuid, path) {
        try {
            // 既存Prefabがある場合は警告を返す（上書きダイアログでタイムアウトするため）
            const existing = await this.assetExists(path);
            if (existing) {
                return (0, tool_base_1.err)(`Prefab already exists at "${path}". Use prefab_update instead to update an existing prefab. ` +
                    `Workflow: 1) prefab_instantiate to place in scene, 2) modify properties, 3) prefab_update to save.`);
            }
            const result = await Editor.Message.request("scene", "create-prefab", nodeUuid, path);
            return (0, tool_base_1.ok)({ success: true, nodeUuid, path, result });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async assetExists(path) {
        try {
            const pattern = path.replace(/\.prefab$/, "") + ".*";
            const results = await Editor.Message.request("asset-db", "query-assets", { pattern });
            return (results || []).length > 0;
        }
        catch (_a) {
            try {
                const info = await Editor.Message.request("asset-db", "query-asset-info", path);
                return !!info;
            }
            catch (_b) {
                return false;
            }
        }
    }
    async instantiatePrefab(prefabUuid, parent) {
        try {
            const result = await Editor.Message.request("scene", "create-node", {
                parent: parent || undefined,
                assetUuid: prefabUuid,
            });
            return (0, tool_base_1.ok)({ success: true, nodeUuid: result, prefabUuid });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async updatePrefab(nodeUuid) {
        try {
            const result = await Editor.Message.request("scene", "apply-prefab", nodeUuid);
            return (0, tool_base_1.ok)({ success: true, nodeUuid, result });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async revertPrefab(nodeUuid) {
        try {
            const result = await Editor.Message.request("scene", "revert-prefab", nodeUuid);
            return (0, tool_base_1.ok)({ success: true, nodeUuid, result });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async getPrefabInfo(uuid) {
        try {
            const info = await Editor.Message.request("asset-db", "query-asset-info", uuid);
            return (0, tool_base_1.ok)({ success: true, info });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async createAndReplace(nodeUuid, path) {
        var _a;
        try {
            // 1. Check if prefab already exists
            const existing = await this.assetExists(path);
            if (existing) {
                return (0, tool_base_1.err)(`Prefab already exists at "${path}". Delete it first or use a different path.`);
            }
            // 2. Get node info (parent, sibling index, transform) before creating prefab
            const nodeInfo = await this.sceneScript("getNodeInfo", [nodeUuid]);
            if (!(nodeInfo === null || nodeInfo === void 0 ? void 0 : nodeInfo.success)) {
                return (0, tool_base_1.err)(`Node ${nodeUuid} not found`);
            }
            const parentUuid = (_a = nodeInfo.data) === null || _a === void 0 ? void 0 : _a.parent;
            // 3. Create prefab from the node
            const prefabAssetUuid = await Editor.Message.request("scene", "create-prefab", nodeUuid, path);
            if (!prefabAssetUuid) {
                return (0, tool_base_1.err)("create-prefab returned no asset UUID");
            }
            // 4. Delete the original node
            await Editor.Message.request("scene", "remove-node", { uuid: nodeUuid });
            // 5. Instantiate the prefab at the same parent
            const newNodeUuid = await Editor.Message.request("scene", "create-node", {
                parent: parentUuid || undefined,
                assetUuid: prefabAssetUuid,
            });
            return (0, tool_base_1.ok)({
                success: true,
                prefabAssetUuid,
                prefabPath: path,
                originalNodeUuid: nodeUuid,
                newInstanceUuid: newNodeUuid,
            });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async openPrefab(uuid, path) {
        try {
            // Resolve UUID from path if needed
            let assetUuid = uuid;
            if (!assetUuid && path) {
                const info = await Editor.Message.request("asset-db", "query-asset-info", path);
                assetUuid = info === null || info === void 0 ? void 0 : info.uuid;
            }
            if (!assetUuid) {
                return (0, tool_base_1.err)("Either uuid or path is required");
            }
            // Open prefab in editing mode (equivalent to double-click)
            await Editor.Message.request("asset-db", "open-asset", assetUuid);
            // Wait for prefab editing mode to initialize
            await new Promise(r => setTimeout(r, 1000));
            return (0, tool_base_1.ok)({ success: true, uuid: assetUuid, mode: "prefab-edit" });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async closePrefab(save, sceneUuid) {
        try {
            // 1. Save prefab if requested
            if (save) {
                await Editor.Message.send("scene", "save-scene");
                await new Promise(r => setTimeout(r, 500));
            }
            // 2. Determine which scene to return to
            let targetScene = sceneUuid;
            if (!targetScene) {
                // Try project's start scene
                try {
                    targetScene = await Editor.Profile.getConfig("preview", "general.start_scene", "local");
                }
                catch ( /* ignore */_a) { /* ignore */ }
                // Fallback to first scene
                if (!targetScene || targetScene === "current_scene") {
                    const scenes = await Editor.Message.request("asset-db", "query-assets", {
                        ccType: "cc.SceneAsset",
                        pattern: "db://assets/**/*",
                    });
                    if (Array.isArray(scenes) && scenes.length > 0) {
                        targetScene = scenes[0].uuid;
                    }
                }
            }
            // 3. Open the scene
            if (targetScene) {
                await Editor.Message.request("scene", "open-scene", targetScene);
                await new Promise(r => setTimeout(r, 1000));
            }
            return (0, tool_base_1.ok)({ success: true, returnedToScene: targetScene });
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
    async sceneScript(method, args) {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: "cocos-creator-mcp",
            method,
            args,
        });
    }
}
exports.PrefabTools = PrefabTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3ByZWZhYi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0Q0FBdUM7QUFFdkMsTUFBYSxXQUFXO0lBQXhCO1FBQ2EsaUJBQVksR0FBRyxRQUFRLENBQUM7SUFnWHJDLENBQUM7SUE5V0csUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsV0FBVyxFQUFFLHVDQUF1QztnQkFDcEQsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGVBQWU7Z0JBQ3JCLFdBQVcsRUFBRSxvRkFBb0Y7Z0JBQ2pHLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsaUNBQWlDLEVBQUU7d0JBQ3hFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHdFQUF3RSxFQUFFO3FCQUNsSDtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO2lCQUM3QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG9CQUFvQjtnQkFDMUIsV0FBVyxFQUFFLHNDQUFzQztnQkFDbkQsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRTt3QkFDaEUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUscURBQXFELEVBQUU7cUJBQ2pHO29CQUNELFFBQVEsRUFBRSxDQUFDLFlBQVks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QyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNqQyxDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBRUQsb0JBQW9CO1lBQ3BCLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2QsTUFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWUsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2hELENBQUM7WUFFRCxPQUFPLElBQUEsY0FBRSxFQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztZQUNkLE9BQU8sSUFBQSxlQUFHLEVBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztJQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYyxFQUFFLElBQVc7UUFDakQsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7WUFDM0QsSUFBSSxFQUFFLG1CQUFtQjtZQUN6QixNQUFNO1lBQ04sSUFBSTtTQUNQLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQWpYRCxrQ0FpWEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sQ2F0ZWdvcnksIFRvb2xEZWZpbml0aW9uLCBUb29sUmVzdWx0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XHJcbmltcG9ydCB7IG9rLCBlcnIgfSBmcm9tIFwiLi4vdG9vbC1iYXNlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJlZmFiVG9vbHMgaW1wbGVtZW50cyBUb29sQ2F0ZWdvcnkge1xyXG4gICAgcmVhZG9ubHkgY2F0ZWdvcnlOYW1lID0gXCJwcmVmYWJcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9saXN0XCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMaXN0IGFsbCBwcmVmYWIgZmlsZXMgaW4gdGhlIHByb2plY3QuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9jcmVhdGVcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNyZWF0ZSBhIHByZWZhYiBmcm9tIGFuIGV4aXN0aW5nIG5vZGUgaW4gdGhlIHNjZW5lLiBUaGUgbm9kZSByZW1haW5zIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIHRvIGNyZWF0ZSBwcmVmYWIgZnJvbVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBmb3IgdGhlIHByZWZhYiAoZS5nLiAnZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWInKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9pbnN0YW50aWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSW5zdGFudGlhdGUgYSBwcmVmYWIgaW50byB0aGUgc2NlbmUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZhYiBhc3NldCBVVUlEXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlBhcmVudCBub2RlIFVVSUQgKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBzY2VuZSByb290KVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1wicHJlZmFiVXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX2dldF9pbmZvXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBwcmVmYWIgYXNzZXQgKG5hbWUsIHBhdGgsIFVVSUQpLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgYXNzZXQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX3VwZGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVXBkYXRlIChyZS1zYXZlKSBhIHByZWZhYiBmcm9tIGl0cyBpbnN0YW5jZSBub2RlIGluIHRoZSBzY2VuZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIG9mIHRoZSBwcmVmYWIgaW5zdGFuY2UgaW4gdGhlIHNjZW5lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfZHVwbGljYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJEdXBsaWNhdGUgYSBwcmVmYWIgYXNzZXQgdG8gYSBuZXcgcGF0aC5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJTb3VyY2UgcHJlZmFiIGRiOi8vIHBhdGhcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJEZXN0aW5hdGlvbiBkYjovLyBwYXRoXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJzb3VyY2VcIiwgXCJkZXN0aW5hdGlvblwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmFiX3ZhbGlkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJWYWxpZGF0ZSBhIHByZWZhYiBmb3IgbWlzc2luZyByZWZlcmVuY2VzIG9yIGJyb2tlbiBsaW5rcy5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmFiIGFzc2V0IFVVSURcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInV1aWRcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9yZXZlcnRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJldmVydCBhIHByZWZhYiBpbnN0YW5jZSBub2RlIHRvIGl0cyBvcmlnaW5hbCBwcmVmYWIgc3RhdGUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIk5vZGUgVVVJRCBvZiB0aGUgcHJlZmFiIGluc3RhbmNlXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJ1dWlkXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfY3JlYXRlX2FuZF9yZXBsYWNlXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDcmVhdGUgYSBwcmVmYWIgZnJvbSBhIG5vZGUgQU5EIHJlcGxhY2UgdGhlIG9yaWdpbmFsIG5vZGUgd2l0aCBhIHByZWZhYiBpbnN0YW5jZS4gVGhpcyBpcyB0aGUgcmVjb21tZW5kZWQgd2F5IHRvIGV4dHJhY3QgYSBuZXN0ZWQgcHJlZmFiIOKAlCBvbmUgY29tbWFuZCBpbnN0ZWFkIG9mIGNyZWF0ZSDihpIgZGVsZXRlIOKGkiBpbnN0YW50aWF0ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiTm9kZSBVVUlEIHRvIGNyZWF0ZSBwcmVmYWIgZnJvbVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiZGI6Ly8gcGF0aCBmb3IgdGhlIHByZWZhYiAoZS5nLiAnZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWInKVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogW1widXVpZFwiLCBcInBhdGhcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZhYl9vcGVuXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPcGVuIGEgcHJlZmFiIGluIGVkaXRpbmcgbW9kZS4gRXF1aXZhbGVudCB0byBkb3VibGUtY2xpY2tpbmcgdGhlIHByZWZhYiBpbiBDb2Nvc0NyZWF0b3IuIFNhdmUgdGhlIGN1cnJlbnQgc2NlbmUgZmlyc3QgaWYgbmVlZGVkLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcmVmYWIgYXNzZXQgVVVJRFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmFiIGRiOi8vIHBhdGggKGFsdGVybmF0aXZlIHRvIHV1aWQpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmYWJfY2xvc2VcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNhdmUgYW5kIGNsb3NlIHRoZSBjdXJyZW50IHByZWZhYiBlZGl0aW5nIG1vZGUsIHRoZW4gcmV0dXJuIHRvIHRoZSBtYWluIHNjZW5lLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZTogeyB0eXBlOiBcImJvb2xlYW5cIiwgZGVzY3JpcHRpb246IFwiU2F2ZSBwcmVmYWIgYmVmb3JlIGNsb3NpbmcgKGRlZmF1bHQgdHJ1ZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2VuZVV1aWQ6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiU2NlbmUgVVVJRCB0byByZXR1cm4gdG8gKGRlZmF1bHQ6IHByb2plY3QncyBzdGFydCBzY2VuZSBvciBmaXJzdCBzY2VuZSlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2xpc3RcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpc3RQcmVmYWJzKCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVQcmVmYWIoYXJncy51dWlkLCBhcmdzLnBhdGgpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX2luc3RhbnRpYXRlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW50aWF0ZVByZWZhYihhcmdzLnByZWZhYlV1aWQsIGFyZ3MucGFyZW50KTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9nZXRfaW5mb1wiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJlZmFiSW5mbyhhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX3VwZGF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlUHJlZmFiKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfZHVwbGljYXRlXCI6IHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwiY29weS1hc3NldFwiLCBhcmdzLnNvdXJjZSwgYXJncy5kZXN0aW5hdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgc291cmNlOiBhcmdzLnNvdXJjZSwgZGVzdGluYXRpb246IGFyZ3MuZGVzdGluYXRpb24gfSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHsgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfdmFsaWRhdGVcIjoge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCBhcmdzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlcHMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1kZXBlbmRzXCIsIGFyZ3MudXVpZCkuY2F0Y2goKCkgPT4gW10pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFyZ3MudXVpZCwgaW5mbywgZGVwZW5kZW5jaWVzOiBkZXBzLCB2YWxpZDogISFpbmZvIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7IHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwicHJlZmFiX3JldmVydFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJ0UHJlZmFiKGFyZ3MudXVpZCk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJwcmVmYWJfY3JlYXRlX2FuZF9yZXBsYWNlXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVBbmRSZXBsYWNlKGFyZ3MudXVpZCwgYXJncy5wYXRoKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9vcGVuXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcGVuUHJlZmFiKGFyZ3MudXVpZCwgYXJncy5wYXRoKTtcclxuICAgICAgICAgICAgY2FzZSBcInByZWZhYl9jbG9zZVwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xvc2VQcmVmYWIoYXJncy5zYXZlICE9PSBmYWxzZSwgYXJncy5zY2VuZVV1aWQpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGxpc3RQcmVmYWJzKCk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogXCJkYjovL2Fzc2V0cy8qKi8qLnByZWZhYlwiLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29uc3QgcHJlZmFicyA9IChyZXN1bHRzIHx8IFtdKS5tYXAoKGE6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgIHV1aWQ6IGEudXVpZCxcclxuICAgICAgICAgICAgICAgIHBhdGg6IGEucGF0aCB8fCBhLnVybCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IGEubmFtZSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwcmVmYWJzIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVByZWZhYihub2RlVXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyDml6LlrZhQcmVmYWLjgYzjgYLjgovloLTlkIjjga/orablkYrjgpLov5TjgZnvvIjkuIrmm7jjgY3jg4DjgqTjgqLjg63jgrDjgafjgr/jgqTjg6DjgqLjgqbjg4jjgZnjgovjgZ/jgoHvvIlcclxuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLmFzc2V0RXhpc3RzKHBhdGgpO1xyXG4gICAgICAgICAgICBpZiAoZXhpc3RpbmcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXHJcbiAgICAgICAgICAgICAgICAgICAgYFByZWZhYiBhbHJlYWR5IGV4aXN0cyBhdCBcIiR7cGF0aH1cIi4gVXNlIHByZWZhYl91cGRhdGUgaW5zdGVhZCB0byB1cGRhdGUgYW4gZXhpc3RpbmcgcHJlZmFiLiBgICtcclxuICAgICAgICAgICAgICAgICAgICBgV29ya2Zsb3c6IDEpIHByZWZhYl9pbnN0YW50aWF0ZSB0byBwbGFjZSBpbiBzY2VuZSwgMikgbW9kaWZ5IHByb3BlcnRpZXMsIDMpIHByZWZhYl91cGRhdGUgdG8gc2F2ZS5gXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcImNyZWF0ZS1wcmVmYWJcIiwgbm9kZVV1aWQsIHBhdGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlVXVpZCwgcGF0aCwgcmVzdWx0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGFzc2V0RXhpc3RzKHBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSBwYXRoLnJlcGxhY2UoL1xcLnByZWZhYiQvLCBcIlwiKSArIFwiLipcIjtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0c1wiLCB7IHBhdHRlcm4gfSk7XHJcbiAgICAgICAgICAgIHJldHVybiAocmVzdWx0cyB8fCBbXSkubGVuZ3RoID4gMDtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldC1pbmZvXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICEhaW5mbztcclxuICAgICAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBpbnN0YW50aWF0ZVByZWZhYihwcmVmYWJVdWlkOiBzdHJpbmcsIHBhcmVudD86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJzY2VuZVwiLCBcImNyZWF0ZS1ub2RlXCIsIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudDogcGFyZW50IHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogcHJlZmFiVXVpZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGVVdWlkOiByZXN1bHQsIHByZWZhYlV1aWQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdXBkYXRlUHJlZmFiKG5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJhcHBseS1wcmVmYWJcIiwgbm9kZVV1aWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBub2RlVXVpZCwgcmVzdWx0IH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJldmVydFByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzdWx0PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicmV2ZXJ0LXByZWZhYlwiLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIG5vZGVVdWlkLCByZXN1bHQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0UHJlZmFiSW5mbyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXQtaW5mb1wiLCB1dWlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgaW5mbyB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVBbmRSZXBsYWNlKG5vZGVVdWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIDEuIENoZWNrIGlmIHByZWZhYiBhbHJlYWR5IGV4aXN0c1xyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuYXNzZXRFeGlzdHMocGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChleGlzdGluZykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycihcclxuICAgICAgICAgICAgICAgICAgICBgUHJlZmFiIGFscmVhZHkgZXhpc3RzIGF0IFwiJHtwYXRofVwiLiBEZWxldGUgaXQgZmlyc3Qgb3IgdXNlIGEgZGlmZmVyZW50IHBhdGguYFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMi4gR2V0IG5vZGUgaW5mbyAocGFyZW50LCBzaWJsaW5nIGluZGV4LCB0cmFuc2Zvcm0pIGJlZm9yZSBjcmVhdGluZyBwcmVmYWJcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCB0aGlzLnNjZW5lU2NyaXB0KFwiZ2V0Tm9kZUluZm9cIiwgW25vZGVVdWlkXSk7XHJcbiAgICAgICAgICAgIGlmICghbm9kZUluZm8/LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYE5vZGUgJHtub2RlVXVpZH0gbm90IGZvdW5kYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgcGFyZW50VXVpZCA9IG5vZGVJbmZvLmRhdGE/LnBhcmVudDtcclxuXHJcbiAgICAgICAgICAgIC8vIDMuIENyZWF0ZSBwcmVmYWIgZnJvbSB0aGUgbm9kZVxyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJBc3NldFV1aWQgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJjcmVhdGUtcHJlZmFiXCIsIG5vZGVVdWlkLCBwYXRoKTtcclxuICAgICAgICAgICAgaWYgKCFwcmVmYWJBc3NldFV1aWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlcnIoXCJjcmVhdGUtcHJlZmFiIHJldHVybmVkIG5vIGFzc2V0IFVVSURcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIDQuIERlbGV0ZSB0aGUgb3JpZ2luYWwgbm9kZVxyXG4gICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJyZW1vdmUtbm9kZVwiLCB7IHV1aWQ6IG5vZGVVdWlkIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gNS4gSW5zdGFudGlhdGUgdGhlIHByZWZhYiBhdCB0aGUgc2FtZSBwYXJlbnRcclxuICAgICAgICAgICAgY29uc3QgbmV3Tm9kZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwic2NlbmVcIiwgXCJjcmVhdGUtbm9kZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudFV1aWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBwcmVmYWJBc3NldFV1aWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9rKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwcmVmYWJBc3NldFV1aWQsXHJcbiAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBwYXRoLFxyXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxOb2RlVXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZVV1aWQ6IG5ld05vZGVVdWlkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVycihlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuUHJlZmFiKHV1aWQ/OiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXN1bHQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBSZXNvbHZlIFVVSUQgZnJvbSBwYXRoIGlmIG5lZWRlZFxyXG4gICAgICAgICAgICBsZXQgYXNzZXRVdWlkID0gdXVpZDtcclxuICAgICAgICAgICAgaWYgKCFhc3NldFV1aWQgJiYgcGF0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICBhc3NldFV1aWQgPSBpbmZvPy51dWlkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghYXNzZXRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyKFwiRWl0aGVyIHV1aWQgb3IgcGF0aCBpcyByZXF1aXJlZFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gT3BlbiBwcmVmYWIgaW4gZWRpdGluZyBtb2RlIChlcXVpdmFsZW50IHRvIGRvdWJsZS1jbGljaylcclxuICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwib3Blbi1hc3NldFwiLCBhc3NldFV1aWQpO1xyXG4gICAgICAgICAgICAvLyBXYWl0IGZvciBwcmVmYWIgZWRpdGluZyBtb2RlIHRvIGluaXRpYWxpemVcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHV1aWQ6IGFzc2V0VXVpZCwgbW9kZTogXCJwcmVmYWItZWRpdFwiIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNsb3NlUHJlZmFiKHNhdmU6IGJvb2xlYW4sIHNjZW5lVXVpZD86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIDEuIFNhdmUgcHJlZmFiIGlmIHJlcXVlc3RlZFxyXG4gICAgICAgICAgICBpZiAoc2F2ZSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgKEVkaXRvci5NZXNzYWdlLnNlbmQgYXMgYW55KShcInNjZW5lXCIsIFwic2F2ZS1zY2VuZVwiKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCA1MDApKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMi4gRGV0ZXJtaW5lIHdoaWNoIHNjZW5lIHRvIHJldHVybiB0b1xyXG4gICAgICAgICAgICBsZXQgdGFyZ2V0U2NlbmUgPSBzY2VuZVV1aWQ7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0U2NlbmUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRyeSBwcm9qZWN0J3Mgc3RhcnQgc2NlbmVcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0U2NlbmUgPSBhd2FpdCAoRWRpdG9yIGFzIGFueSkuUHJvZmlsZS5nZXRDb25maWcoXCJwcmV2aWV3XCIsIFwiZ2VuZXJhbC5zdGFydF9zY2VuZVwiLCBcImxvY2FsXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gZmlyc3Qgc2NlbmVcclxuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0U2NlbmUgfHwgdGFyZ2V0U2NlbmUgPT09IFwiY3VycmVudF9zY2VuZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2NUeXBlOiBcImNjLlNjZW5lQXNzZXRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogXCJkYjovL2Fzc2V0cy8qKi8qXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NlbmVzKSAmJiBzY2VuZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRTY2VuZSA9IHNjZW5lc1swXS51dWlkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gMy4gT3BlbiB0aGUgc2NlbmVcclxuICAgICAgICAgICAgaWYgKHRhcmdldFNjZW5lKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJvcGVuLXNjZW5lXCIsIHRhcmdldFNjZW5lKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvayh7IHN1Y2Nlc3M6IHRydWUsIHJldHVybmVkVG9TY2VuZTogdGFyZ2V0U2NlbmUgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnIoZS5tZXNzYWdlIHx8IFN0cmluZyhlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2NlbmVTY3JpcHQobWV0aG9kOiBzdHJpbmcsIGFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcInNjZW5lXCIsIFwiZXhlY3V0ZS1zY2VuZS1zY3JpcHRcIiwge1xyXG4gICAgICAgICAgICBuYW1lOiBcImNvY29zLWNyZWF0b3ItbWNwXCIsXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgYXJncyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=