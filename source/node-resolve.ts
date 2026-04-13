/**
 * Shared node UUID resolution — resolves nodeName to UUID via scene script.
 */

const EXT_NAME = "cocos-creator-mcp";

export interface ResolvedNode {
    uuid: string;
    name: string;
}

/**
 * Resolve a node UUID from either `uuid` or `nodeName` parameter.
 * If `uuid` is provided, it is returned as-is.
 * If `nodeName` is provided, searches the scene for a matching node.
 * Throws if neither is provided or no node is found.
 */
export async function resolveNodeUuid(args: { uuid?: string; nodeName?: string }): Promise<ResolvedNode> {
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
    if (!result?.success || !result?.data?.length) {
        throw new Error(`Node not found: "${args.nodeName}"`);
    }
    // 最初のマッチを使用
    const node = result.data[0];
    return { uuid: node.uuid, name: node.name || args.nodeName };
}
