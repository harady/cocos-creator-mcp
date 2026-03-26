import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

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
            const result = await (Editor.Message.request as any)("scene", "create-prefab", nodeUuid, path);
            return ok({ success: true, nodeUuid, path, result });
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }

    private async instantiatePrefab(prefabUuid: string, parent?: string): Promise<ToolResult> {
        try {
            const result = await Editor.Message.request("scene", "create-node", {
                parent: parent || undefined,
                assetUuid: prefabUuid,
            });
            return ok({ success: true, nodeUuid: result, prefabUuid });
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
}
