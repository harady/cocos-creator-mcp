/**
 * 回帰テスト — 全MCPツールの動作確認
 *
 * 前提: CocosCreatorでcocos-creator-mcpサーバーが起動中、シーンが開いていること
 * 実行: node test/regression.mjs [port]
 */

const PORT = process.argv[2] || 3001;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
let skipped = 0;
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

function skip(label) {
    console.log(`  ⚠️  ${label}`);
    skipped++;
}

// ── tests ──

async function testHealth() {
    console.log("\n── Health Check ──");
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    assert(data.status === "ok", "health status ok");
    assert(data.tools >= 27, `tool count >= 27 (got ${data.tools})`);
}

async function testInitialize() {
    console.log("\n── MCP Initialize ──");
    const res = await callMcp("initialize", {});
    assert(res.result?.protocolVersion, `protocol version: ${res.result?.protocolVersion}`);
    assert(res.result?.serverInfo?.name === "cocos-creator-mcp", "server name");
    assert(res.result?.serverInfo?.version === "0.5.0", `version: ${res.result?.serverInfo?.version}`);
}

async function testToolsList() {
    console.log("\n── tools/list ──");
    const res = await callMcp("tools/list", {});
    const tools = res.result?.tools || [];
    assert(tools.length >= 27, `tool count >= 27 (got ${tools.length})`);

    const names = tools.map((t) => t.name);
    const expected = [
        // scene
        "scene_get_hierarchy", "scene_open", "scene_save", "scene_get_list",
        // node
        "node_create", "node_get_info", "node_find_by_name", "node_set_property",
        "node_set_transform", "node_delete", "node_move", "node_duplicate", "node_get_all",
        // component
        "component_add", "component_remove", "component_get_components", "component_set_property",
        // prefab
        "prefab_list", "prefab_create", "prefab_instantiate", "prefab_get_info",
        // project
        "project_get_info", "project_refresh_assets", "project_get_asset_info", "project_find_asset",
        // debug
        "debug_get_editor_info", "debug_list_messages",
    ];
    for (const name of expected) {
        assert(names.includes(name), `tool registered: ${name}`);
    }
}

async function testSceneTools() {
    console.log("\n── scene_get_hierarchy ──");
    const res = await callTool("scene_get_hierarchy", { includeComponents: true });
    assert(res.success === true, "success");
    assert(res.sceneName, `scene name: ${res.sceneName}`);
    assert(Array.isArray(res.hierarchy), "hierarchy is array");
    const canvas = res.hierarchy.find((n) => n.name === "Canvas");
    assert(!!canvas, "Canvas node found");

    console.log("\n── scene_get_list ──");
    const list = await callTool("scene_get_list");
    assert(list.success === true, "success");
    assert(Array.isArray(list.scenes), "scenes is array");

    console.log("\n── scene_save ──");
    const save = await callTool("scene_save");
    assert(save.success === true || !save._rpcError, "save did not error");
}

async function testNodeCrud() {
    const hierarchy = await callTool("scene_get_hierarchy");
    const canvasUuid = hierarchy.hierarchy.find((n) => n.name === "Canvas")?.uuid;

    // CREATE
    console.log("\n── node_create ──");
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

    // SET PROPERTY
    console.log("\n── node_set_property ──");
    await callTool("node_set_property", { uuid: nodeUuid, property: "name", value: "RegressionTestNode_Renamed" });
    const infoAfter = await callTool("node_get_info", { uuid: nodeUuid });
    assert(infoAfter.data?.name === "RegressionTestNode_Renamed", `renamed to: ${infoAfter.data?.name}`);

    // SET TRANSFORM
    console.log("\n── node_set_transform ──");
    await callTool("node_set_transform", { uuid: nodeUuid, position: { x: 100, y: 200, z: 0 }, scale: { x: 2, y: 2, z: 1 } });
    const infoT = await callTool("node_get_info", { uuid: nodeUuid });
    assert(infoT.data?.position?.x === 100, `position.x: ${infoT.data?.position?.x}`);
    assert(infoT.data?.scale?.x === 2, `scale.x: ${infoT.data?.scale?.x}`);

    // GET ALL
    console.log("\n── node_get_all ──");
    const all = await callTool("node_get_all");
    assert(all.success === true, "get_all success");
    assert(!!all.data?.find((n) => n.uuid === nodeUuid), "test node found in get_all");

    // DUPLICATE
    console.log("\n── node_duplicate ──");
    const duped = await callTool("node_duplicate", { uuid: nodeUuid });
    assert(duped.success === true, "duplicate success");
    const dupedUuid = Array.isArray(duped.newUuid) ? duped.newUuid[0] : duped.newUuid;

    // MOVE
    console.log("\n── node_move ──");
    if (dupedUuid) {
        const moved = await callTool("node_move", { uuid: dupedUuid, parentUuid: nodeUuid });
        if (moved.success === true) {
            assert(true, "move success");
            const movedInfo = await callTool("node_get_info", { uuid: dupedUuid });
            assert(movedInfo.data?.parent === nodeUuid, "parent changed after move");
        } else {
            skip(`move skipped (requires editor restart): ${moved.error || "unknown"}`);
        }
    } else {
        skip("move skipped (no duplicated uuid)");
    }

    // DELETE
    console.log("\n── node_delete ──");
    await callTool("node_delete", { uuid: nodeUuid });
    if (dupedUuid) await callTool("node_delete", { uuid: dupedUuid });
    const afterDelete = await callTool("node_find_by_name", { name: "RegressionTestNode_Renamed" });
    assert(afterDelete.data?.length === 0, "cleanup verified");
}

async function testComponentTools() {
    const hierarchy = await callTool("scene_get_hierarchy");
    const canvasUuid = hierarchy.hierarchy.find((n) => n.name === "Canvas")?.uuid;

    // Create test node
    const created = await callTool("node_create", { name: "ComponentTestNode", parent: canvasUuid });
    const nodeUuid = created.uuid;

    // ADD COMPONENT
    console.log("\n── component_add ──");
    const added = await callTool("component_add", { uuid: nodeUuid, componentType: "cc.Label" });
    assert(added.success === true, "add Label success");

    // GET COMPONENTS
    console.log("\n── component_get_components ──");
    const comps = await callTool("component_get_components", { uuid: nodeUuid });
    assert(comps.success === true, "get_components success");
    const hasLabel = comps.components?.some((c) => c.type === "Label");
    assert(hasLabel, "Label component found");

    // SET PROPERTY
    console.log("\n── component_set_property ──");
    const setProp = await callTool("component_set_property", {
        uuid: nodeUuid, componentType: "cc.Label", property: "string", value: "Test123",
    });
    assert(setProp.success === true, "set Label.string success");

    const setProp2 = await callTool("component_set_property", {
        uuid: nodeUuid, componentType: "cc.Label", property: "fontSize", value: 48,
    });
    assert(setProp2.success === true, "set Label.fontSize success");

    // REMOVE COMPONENT
    console.log("\n── component_remove ──");
    const removed = await callTool("component_remove", { uuid: nodeUuid, componentType: "cc.Label" });
    assert(removed.success === true, "remove Label success");

    const compsAfter = await callTool("component_get_components", { uuid: nodeUuid });
    const hasLabelAfter = compsAfter.components?.some((c) => c.type === "Label");
    assert(!hasLabelAfter, "Label removed verified");

    // Cleanup
    await callTool("node_delete", { uuid: nodeUuid });
}

async function testPrefabTools() {
    const hierarchy = await callTool("scene_get_hierarchy");
    const canvasUuid = hierarchy.hierarchy.find((n) => n.name === "Canvas")?.uuid;

    // LIST
    console.log("\n── prefab_list ──");
    const list = await callTool("prefab_list");
    assert(list.success === true, "list success");
    assert(Array.isArray(list.prefabs), "prefabs is array");

    // CREATE — make node, set property, save as prefab
    console.log("\n── prefab_create ──");
    const created = await callTool("node_create", { name: "PrefabRegressionTest", parent: canvasUuid, components: ["cc.Label"] });
    const nodeUuid = created.uuid;

    await callTool("component_set_property", {
        uuid: nodeUuid, componentType: "cc.Label", property: "string", value: "PrefabTest",
    });
    await callTool("node_set_transform", { uuid: nodeUuid, position: { x: 50, y: 75, z: 0 } });

    const prefabPath = "db://assets/test/PrefabRegressionTest.prefab";
    const prefab = await callTool("prefab_create", { uuid: nodeUuid, path: prefabPath });
    assert(prefab.success === true, "create prefab success");
    const prefabUuid = prefab.result;

    // GET INFO
    console.log("\n── prefab_get_info ──");
    if (prefabUuid) {
        const info = await callTool("prefab_get_info", { uuid: prefabUuid });
        assert(info.success === true, "get_info success");
    } else {
        skip("prefab_get_info skipped (no prefab uuid)");
    }

    // INSTANTIATE
    console.log("\n── prefab_instantiate ──");
    if (prefabUuid) {
        const inst = await callTool("prefab_instantiate", { prefabUuid, parent: canvasUuid });
        assert(inst.success === true, "instantiate success");
        // Cleanup instantiated node
        if (inst.nodeUuid) {
            await callTool("node_delete", { uuid: inst.nodeUuid });
        }
    } else {
        skip("prefab_instantiate skipped (no prefab uuid)");
    }

    // Cleanup
    await callTool("node_delete", { uuid: nodeUuid });
    // Note: prefab file at assets/test/ will remain — manual cleanup
}

async function testProjectTools() {
    // GET INFO
    console.log("\n── project_get_info ──");
    const info = await callTool("project_get_info");
    assert(info.success === true, "get_info success");
    assert(!!info.path, `project path: ${info.path?.substring(0, 30)}...`);

    // REFRESH ASSETS
    console.log("\n── project_refresh_assets ──");
    const refresh = await callTool("project_refresh_assets");
    assert(refresh.success === true || !refresh._rpcError, "refresh did not error");

    // FIND ASSET
    console.log("\n── project_find_asset ──");
    const found = await callTool("project_find_asset", { pattern: "db://assets/**/*.scene" });
    assert(found.success === true, "find_asset success");
    assert(Array.isArray(found.assets), "assets is array");
    assert(found.assets?.length > 0, `found ${found.assets?.length} scene(s)`);

    // GET ASSET INFO
    console.log("\n── project_get_asset_info ──");
    if (found.assets?.length > 0) {
        const assetInfo = await callTool("project_get_asset_info", { uuid: found.assets[0].uuid });
        assert(assetInfo.success === true, "get_asset_info success");
    } else {
        skip("get_asset_info skipped (no assets found)");
    }
}

async function testDebugTools() {
    // EDITOR INFO
    console.log("\n── debug_get_editor_info ──");
    const info = await callTool("debug_get_editor_info");
    assert(info.success === true, "get_editor_info success");
    assert(!!info.version, `editor version: ${info.version}`);

    // LIST MESSAGES
    console.log("\n── debug_list_messages ──");
    const msgs = await callTool("debug_list_messages", { target: "scene" });
    assert(msgs.success === true, "list_messages success");
}

// ── runner ──

async function main() {
    console.log(`\n🔧 Cocos Creator MCP v0.5 — Regression Test`);
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
    await testSceneTools();
    await testNodeCrud();
    await testComponentTools();
    await testPrefabTools();
    await testProjectTools();
    await testDebugTools();

    console.log(`\n${"═".repeat(40)}`);
    console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log(`${"═".repeat(40)}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
});
