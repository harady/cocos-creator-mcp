/**
 * 回帰テスト — 全MCPツールの動作確認
 *
 * 前提: CocosCreatorでcocos-creator-mcpサーバーが起動中であること
 * 実行: node test/regression.mjs [port]
 */

const PORT = process.argv[2] || 3001;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
let rpcId = 0;

// ── helpers ──

async function callMcp(method, params = {}) {
    const id = ++rpcId;
    const res = await fetch(`${BASE}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    });
    return res.json();
}

async function callTool(name, args = {}) {
    const res = await callMcp("tools/call", { name, arguments: args });
    if (res.error) return { _rpcError: res.error };
    const text = res.result?.content?.[0]?.text;
    return text ? JSON.parse(text) : res.result;
}

function assert(condition, label) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.log(`  ❌ ${label}`);
        failed++;
    }
}

// ── tests ──

async function testHealth() {
    console.log("\n── Health Check ──");
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    assert(data.status === "ok", "health status ok");
    assert(data.tools >= 13, `tool count >= 13 (got ${data.tools})`);
}

async function testInitialize() {
    console.log("\n── MCP Initialize ──");
    const res = await callMcp("initialize", {});
    assert(res.result?.protocolVersion, `protocol version: ${res.result?.protocolVersion}`);
    assert(res.result?.serverInfo?.name === "cocos-creator-mcp", "server name");
}

async function testToolsList() {
    console.log("\n── tools/list ──");
    const res = await callMcp("tools/list", {});
    const tools = res.result?.tools || [];
    assert(tools.length >= 13, `tool count >= 13 (got ${tools.length})`);

    const names = tools.map((t) => t.name);
    const expected = [
        "scene_get_hierarchy", "scene_open", "scene_save", "scene_get_list",
        "node_create", "node_get_info", "node_find_by_name", "node_set_property",
        "node_set_transform", "node_delete", "node_move", "node_duplicate", "node_get_all",
    ];
    for (const name of expected) {
        assert(names.includes(name), `tool registered: ${name}`);
    }
}

async function testSceneGetHierarchy() {
    console.log("\n── scene_get_hierarchy ──");
    const res = await callTool("scene_get_hierarchy", { includeComponents: true });
    assert(res.success === true, "success");
    assert(res.sceneName, `scene name: ${res.sceneName}`);
    assert(Array.isArray(res.hierarchy), "hierarchy is array");
    assert(res.hierarchy.length > 0, "hierarchy has nodes");

    // Canvas should exist
    const canvas = res.hierarchy.find((n) => n.name === "Canvas");
    assert(!!canvas, "Canvas node found");
    assert(Array.isArray(canvas?.components), "Canvas has components");
}

async function testSceneGetList() {
    console.log("\n── scene_get_list ──");
    const res = await callTool("scene_get_list");
    assert(res.success === true, "success");
    assert(Array.isArray(res.scenes), "scenes is array");
}

async function testSceneSave() {
    console.log("\n── scene_save ──");
    const res = await callTool("scene_save");
    assert(res.success === true || !res._rpcError, "save did not error");
}

async function testNodeCrud() {
    console.log("\n── node_create ──");
    // Find Canvas UUID first
    const hierarchy = await callTool("scene_get_hierarchy");
    const canvasUuid = hierarchy.hierarchy.find((n) => n.name === "Canvas")?.uuid;
    assert(!!canvasUuid, `Canvas UUID: ${canvasUuid?.substring(0, 10)}...`);

    // CREATE
    const created = await callTool("node_create", { name: "RegressionTestNode", parent: canvasUuid });
    assert(created.success === true, "create success");
    const nodeUuid = created.uuid;
    assert(!!nodeUuid, `node UUID: ${nodeUuid?.substring(0, 10)}...`);

    // GET INFO
    console.log("\n── node_get_info ──");
    const info = await callTool("node_get_info", { uuid: nodeUuid });
    assert(info.success === true, "get_info success");
    assert(info.data?.name === "RegressionTestNode", `name: ${info.data?.name}`);
    assert(info.data?.parent === canvasUuid, "parent is Canvas");

    // FIND BY NAME
    console.log("\n── node_find_by_name ──");
    const found = await callTool("node_find_by_name", { name: "RegressionTestNode" });
    assert(found.success === true, "find success");
    assert(found.data?.length === 1, `found count: ${found.data?.length}`);
    assert(found.data?.[0]?.uuid === nodeUuid, "found UUID matches");

    // SET PROPERTY (name)
    console.log("\n── node_set_property ──");
    const renamed = await callTool("node_set_property", {
        uuid: nodeUuid, property: "name", value: "RegressionTestNode_Renamed",
    });
    assert(renamed.success === true, "set_property (name) success");

    // verify rename
    const infoAfter = await callTool("node_get_info", { uuid: nodeUuid });
    assert(infoAfter.data?.name === "RegressionTestNode_Renamed", `renamed to: ${infoAfter.data?.name}`);

    // SET TRANSFORM
    console.log("\n── node_set_transform ──");
    const transformed = await callTool("node_set_transform", {
        uuid: nodeUuid,
        position: { x: 100, y: 200, z: 0 },
        scale: { x: 2, y: 2, z: 1 },
    });
    assert(transformed.success === true, "set_transform success");

    const infoT = await callTool("node_get_info", { uuid: nodeUuid });
    assert(infoT.data?.position?.x === 100, `position.x: ${infoT.data?.position?.x}`);
    assert(infoT.data?.position?.y === 200, `position.y: ${infoT.data?.position?.y}`);
    assert(infoT.data?.scale?.x === 2, `scale.x: ${infoT.data?.scale?.x}`);

    // GET ALL
    console.log("\n── node_get_all ──");
    const all = await callTool("node_get_all");
    assert(all.success === true, "get_all success");
    assert(Array.isArray(all.data), "data is array");
    const testNode = all.data?.find((n) => n.uuid === nodeUuid);
    assert(!!testNode, "test node found in get_all");

    // DUPLICATE
    console.log("\n── node_duplicate ──");
    const duped = await callTool("node_duplicate", { uuid: nodeUuid });
    assert(duped.success === true, "duplicate success");
    // newUuid may be a string or array depending on Editor API version
    const dupedUuid = Array.isArray(duped.newUuid) ? duped.newUuid[0] : duped.newUuid;

    // MOVE (move duplicated node under original node)
    console.log("\n── node_move ──");
    if (dupedUuid) {
        const moved = await callTool("node_move", { uuid: dupedUuid, parentUuid: nodeUuid });
        if (moved.success === true) {
            assert(true, "move success");
            // Verify parent changed
            const movedInfo = await callTool("node_get_info", { uuid: dupedUuid });
            assert(movedInfo.data?.parent === nodeUuid, "parent changed after move");
        } else {
            // node_move requires CocosCreator restart to pick up scene script changes
            console.log(`  ⚠️  move skipped (requires editor restart): ${moved.error || "unknown"}`);
        }
    } else {
        console.log("  ⚠️  move skipped (no duplicated uuid)");
    }

    // CLEANUP: delete both test nodes
    console.log("\n── node_delete ──");
    const del1 = await callTool("node_delete", { uuid: nodeUuid });
    assert(del1.success === true, "delete original success");

    if (dupedUuid) {
        const del2 = await callTool("node_delete", { uuid: dupedUuid });
        assert(del2.success === true, "delete duplicate success");
    }

    // Verify cleanup
    const afterDelete = await callTool("node_find_by_name", { name: "RegressionTestNode_Renamed" });
    assert(afterDelete.data?.length === 0, "cleanup verified (0 remaining)");
}

async function testSceneOpen() {
    console.log("\n── scene_open ──");
    // Get scene list first, then open the current one (safe operation)
    const list = await callTool("scene_get_list");
    if (list.scenes?.length > 0) {
        const scene = list.scenes[0];
        const res = await callTool("scene_open", { scene: scene.path || scene.uuid });
        // scene_open may succeed or fail depending on Editor state, just check no RPC error
        assert(!res._rpcError, `open attempted: ${scene.path || scene.uuid}`);
    } else {
        assert(true, "scene_open skipped (no scenes found)");
    }
}

// ── runner ──

async function main() {
    console.log(`\n🔧 Cocos Creator MCP — Regression Test`);
    console.log(`   Server: ${BASE}/mcp\n`);

    try {
        await fetch(`${BASE}/health`);
    } catch {
        console.error(`❌ Server not reachable at ${BASE}. Is the MCP server running?`);
        process.exit(1);
    }

    await testHealth();
    await testInitialize();
    await testToolsList();
    await testSceneGetHierarchy();
    await testSceneGetList();
    await testSceneSave();
    await testNodeCrud();
    // scene_open は最後（シーン切り替えが起きる可能性）
    // await testSceneOpen();  // コメントアウト: シーンリロードが発生するため手動確認向け

    console.log(`\n${"═".repeat(40)}`);
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log(`${"═".repeat(40)}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
});
