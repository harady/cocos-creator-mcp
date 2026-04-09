import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

const EXT_NAME = "cocos-creator-mcp";

export class PrefabTools implements ToolCategory {
    readonly categoryName = "prefab";

    getTools(): ToolDefinition[] {
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

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
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
                    await (Editor.Message.request as any)("asset-db", "copy-asset", args.source, args.destination);
                    return ok({ success: true, source: args.source, destination: args.destination });
                } catch (e: any) { return err(e.message || String(e)); }
            }
            case "prefab_validate": {
                try {
                    const info = await (Editor.Message.request as any)("asset-db", "query-asset-info", args.uuid);
                    const deps = await (Editor.Message.request as any)("asset-db", "query-depends", args.uuid).catch(() => []);
                    return ok({ success: true, uuid: args.uuid, info, dependencies: deps, valid: !!info });
                } catch (e: any) { return err(e.message || String(e)); }
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
                return err(`Unknown tool: ${toolName}`);
        }
    }

    private async listPrefabs(): Promise<ToolResult> {
        try {
            const results = await Editor.Message.request("asset-db", "query-assets", {
                pattern: "db://assets/**/*.prefab",
            });
            const prefabs = (results || []).map((a: any) => ({
                uuid: a.uuid,
                path: a.path || a.url,
                name: a.name,
            }));
            return ok({ success: true, prefabs });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async createPrefab(nodeUuid: string, path: string): Promise<ToolResult> {
        try {
            // 既存Prefabがある場合は警告を返す（上書きダイアログでタイムアウトするため）
            const existing = await this.assetExists(path);
            if (existing) {
                return err(
                    `Prefab already exists at "${path}". Use prefab_update instead to update an existing prefab. ` +
                    `Workflow: 1) prefab_instantiate to place in scene, 2) modify properties, 3) prefab_update to save.`
                );
            }
            const result = await (Editor.Message.request as any)("scene", "create-prefab", nodeUuid, path);
            return ok({ success: true, nodeUuid, path, result });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async assetExists(path: string): Promise<boolean> {
        try {
            const pattern = path.replace(/\.prefab$/, "") + ".*";
            const results = await Editor.Message.request("asset-db", "query-assets", { pattern });
            return (results || []).length > 0;
        } catch {
            try {
                const info = await (Editor.Message.request as any)("asset-db", "query-asset-info", path);
                return !!info;
            } catch {
                return false;
            }
        }
    }

    private async instantiatePrefab(prefabUuid: string, parent?: string): Promise<ToolResult> {
        try {
            const nodeUuid = await Editor.Message.request("scene", "create-node", {
                parent: parent || undefined,
                assetUuid: prefabUuid,
            });

            // Prefab 編集モード中の場合、ネスト Prefab として親に登録
            if (parent) {
                try {
                    await this.sceneScript("registerNestedPrefabInstance", [parent, nodeUuid, prefabUuid]);
                } catch { /* Prefab 編集モードでない場合は無視 */ }
            }

            return ok({ success: true, nodeUuid, prefabUuid });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }


    private async updatePrefab(nodeUuid: string): Promise<ToolResult> {
        try {
            const result = await (Editor.Message.request as any)("scene", "apply-prefab", nodeUuid);
            return ok({ success: true, nodeUuid, result });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async revertPrefab(nodeUuid: string): Promise<ToolResult> {
        try {
            const result = await (Editor.Message.request as any)("scene", "revert-prefab", nodeUuid);
            return ok({ success: true, nodeUuid, result });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async getPrefabInfo(uuid: string): Promise<ToolResult> {
        try {
            const info = await (Editor.Message.request as any)("asset-db", "query-asset-info", uuid);
            return ok({ success: true, info });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async createAndReplace(nodeUuid: string, path: string): Promise<ToolResult> {
        try {
            // 1. Check if prefab already exists
            const existing = await this.assetExists(path);
            if (existing) {
                return err(
                    `Prefab already exists at "${path}". Delete it first or use a different path.`
                );
            }

            // 2. Get node info (parent, sibling index, transform) before creating prefab
            const nodeInfo = await this.sceneScript("getNodeInfo", [nodeUuid]);
            if (!nodeInfo?.success) {
                return err(`Node ${nodeUuid} not found`);
            }
            const parentUuid = nodeInfo.data?.parent;

            // 3. Create prefab from the node
            const prefabAssetUuid = await (Editor.Message.request as any)("scene", "create-prefab", nodeUuid, path);
            if (!prefabAssetUuid) {
                return err("create-prefab returned no asset UUID");
            }

            // 4. Delete the original node
            await (Editor.Message.request as any)("scene", "remove-node", { uuid: nodeUuid });

            // 5. Instantiate the prefab at the same parent
            const newNodeUuid = await Editor.Message.request("scene", "create-node", {
                parent: parentUuid || undefined,
                assetUuid: prefabAssetUuid,
            });

            return ok({
                success: true,
                prefabAssetUuid,
                prefabPath: path,
                originalNodeUuid: nodeUuid,
                newInstanceUuid: newNodeUuid,
            });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async openPrefab(uuid?: string, path?: string): Promise<ToolResult> {
        try {
            // Resolve UUID from path if needed
            let assetUuid = uuid;
            if (!assetUuid && path) {
                const info = await (Editor.Message.request as any)("asset-db", "query-asset-info", path);
                assetUuid = info?.uuid;
            }
            if (!assetUuid) {
                return err("Either uuid or path is required");
            }

            // Open prefab in editing mode (equivalent to double-click)
            await (Editor.Message.request as any)("asset-db", "open-asset", assetUuid);
            // Wait for prefab editing mode to initialize
            await new Promise(r => setTimeout(r, 1000));

            return ok({ success: true, uuid: assetUuid, mode: "prefab-edit" });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async closePrefab(save: boolean, sceneUuid?: string): Promise<ToolResult> {
        try {
            // 1. Save prefab if requested
            if (save) {
                await (Editor.Message.send as any)("scene", "save-scene");
                await new Promise(r => setTimeout(r, 500));
            }

            // 2. Determine which scene to return to
            let targetScene = sceneUuid;
            if (!targetScene) {
                // Try project's start scene
                try {
                    targetScene = await (Editor as any).Profile.getConfig("preview", "general.start_scene", "local");
                } catch { /* ignore */ }

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
                await (Editor.Message.request as any)("scene", "open-scene", targetScene);
                await new Promise(r => setTimeout(r, 1000));
            }

            return ok({ success: true, returnedToScene: targetScene });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async sceneScript(method: string, args: any[]): Promise<any> {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: "cocos-creator-mcp",
            method,
            args,
        });
    }
}
