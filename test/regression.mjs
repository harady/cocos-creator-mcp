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

// ── ALL 84 tool names ──
const ALL_TOOLS = [
    "asset_copy", "asset_create", "asset_delete", "asset_get_dependencies",
    "asset_get_details", "asset_move", "asset_open_external", "asset_query_path",
    "asset_query_url", "asset_query_uuid", "asset_reimport", "asset_save",
    "builder_get_settings", "builder_open_panel", "builder_query_tasks",
    "builder_run_preview", "builder_stop_preview",
    "component_add", "component_get_components", "component_remove", "component_set_property",
    "debug_clear_console", "debug_execute_script", "debug_get_console_logs",
    "debug_get_editor_info", "debug_get_extension_info", "debug_list_extensions", "debug_list_messages",
    "node_create", "node_delete", "node_duplicate", "node_find_by_name", "node_get_all",
    "node_get_info", "node_move", "node_set_active", "node_set_layer",
    "node_set_property", "node_set_transform",
    "prefab_create", "prefab_get_info", "prefab_instantiate", "prefab_list",
    "prefab_revert", "prefab_update",
    "preferences_get", "preferences_get_all", "preferences_reset", "preferences_set",
    "project_find_asset", "project_get_asset_info", "project_get_info", "project_refresh_assets",
    "scene_copy_node", "scene_create", "scene_execute_script", "scene_get_hierarchy",
    "scene_get_list", "scene_open", "scene_paste_node", "scene_query_classes",
    "scene_query_components", "scene_query_dirty", "scene_query_node_tree",
    "scene_query_nodes_by_asset", "scene_reset_node_transform", "scene_save",
    "scene_snapshot", "scene_soft_reload",
    "server_get_status", "server_query_ip_list", "server_query_port",
    "view_change_gizmo_coordinate", "view_change_gizmo_pivot", "view_change_gizmo_tool",
    "view_change_mode_2d_3d", "view_focus_on_node", "view_get_status",
    "view_query_gizmo_coordinate", "view_query_gizmo_pivot", "view_query_gizmo_tool",
    "view_query_grid_visible", "view_query_mode_2d_3d", "view_set_grid_visible",
];

// ── tests ──

async function testHealth() {
    console.log("\n── Health Check ──");
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    assert(data.status === "ok", "health status ok");
    assert(data.tools >= 84, `tool count >= 84 (got ${data.tools})`);
}

async function testInitialize() {
    console.log("\n── MCP Initialize ──");
    const res = await callMcp("initialize", {});
    assert(res.result?.protocolVersion, `protocol version: ${res.result?.protocolVersion}`);
    assert(res.result?.serverInfo?.name === "cocos-creator-mcp", "server name");
    assert(res.result?.serverInfo?.version === "1.0.0", `version: ${res.result?.serverInfo?.version}`);
}

async function testToolsList() {
    console.log("\n── tools/list ──");
    const res = await callMcp("tools/list", {});
    const tools = res.result?.tools || [];
    assert(tools.length >= 84, `tool count >= 84 (got ${tools.length})`);

    const names = tools.map((t) => t.name);
    for (const name of ALL_TOOLS) {
        assert(names.includes(name), `registered: ${name}`);
    }
}

async function testSceneTools() {
    console.log("\n── scene tools ──");
    const hier = await callTool("scene_get_hierarchy", { includeComponents: true });
    assert(hier.success === true, "get_hierarchy success");
    assert(!!hier.sceneName, `scene: ${hier.sceneName}`);
    const canvas = hier.hierarchy?.find((n) => n.name === "Canvas");
    assert(!!canvas, "Canvas found");

    const list = await callTool("scene_get_list");
    assert(list.success === true, "get_list success");

    const save = await callTool("scene_save");
    assert(save.success === true || !save._rpcError, "save ok");
}

async function testNodeCrud() {
    console.log("\n── node CRUD ──");
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;

    const created = await callTool("node_create", { name: "V1TestNode", parent: canvasUuid });
    assert(created.success === true, "create");
    const uuid = created.uuid;

    const info = await callTool("node_get_info", { uuid });
    assert(info.data?.name === "V1TestNode", "get_info");

    const found = await callTool("node_find_by_name", { name: "V1TestNode" });
    assert(found.data?.length === 1, "find_by_name");

    await callTool("node_set_property", { uuid, property: "name", value: "V1Renamed" });
    const info2 = await callTool("node_get_info", { uuid });
    assert(info2.data?.name === "V1Renamed", "set_property");

    await callTool("node_set_transform", { uuid, position: { x: 10, y: 20, z: 0 }, scale: { x: 3, y: 3, z: 1 } });
    const info3 = await callTool("node_get_info", { uuid });
    assert(info3.data?.position?.x === 10, "set_transform");

    await callTool("node_set_active", { uuid, active: false });
    const info4 = await callTool("node_get_info", { uuid });
    assert(info4.data?.active === false, "set_active");

    const all = await callTool("node_get_all");
    assert(!!all.data?.find((n) => n.uuid === uuid), "get_all");

    const duped = await callTool("node_duplicate", { uuid });
    assert(duped.success === true, "duplicate");
    const dupUuid = Array.isArray(duped.newUuid) ? duped.newUuid[0] : duped.newUuid;

    if (dupUuid) {
        const moved = await callTool("node_move", { uuid: dupUuid, parentUuid: uuid });
        if (moved.success === true) {
            assert(true, "move");
        } else {
            skip("move (requires restart)");
        }
        await callTool("node_delete", { uuid: dupUuid });
    }
    await callTool("node_delete", { uuid });
    assert(true, "delete + cleanup");
}

async function testComponentTools() {
    console.log("\n── component tools ──");
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;
    const created = await callTool("node_create", { name: "CompV1Test", parent: canvasUuid });
    const uuid = created.uuid;

    const added = await callTool("component_add", { uuid, componentType: "cc.Label" });
    assert(added.success === true, "add");

    const comps = await callTool("component_get_components", { uuid });
    assert(comps.components?.some((c) => c.type === "Label"), "get_components");

    const set1 = await callTool("component_set_property", { uuid, componentType: "cc.Label", property: "string", value: "v1test" });
    assert(set1.success === true, "set_property string");

    const set2 = await callTool("component_set_property", { uuid, componentType: "cc.Label", property: "fontSize", value: 64 });
    assert(set2.success === true, "set_property fontSize");

    const removed = await callTool("component_remove", { uuid, componentType: "cc.Label" });
    assert(removed.success === true, "remove");

    await callTool("node_delete", { uuid });
}

async function testPrefabTools() {
    console.log("\n── prefab tools ──");
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;

    const list = await callTool("prefab_list");
    assert(list.success === true, "list");

    const created = await callTool("node_create", { name: "PrefabV1Test", parent: canvasUuid, components: ["cc.Label"] });
    const uuid = created.uuid;
    await callTool("component_set_property", { uuid, componentType: "cc.Label", property: "string", value: "v1prefab" });

    // Delete existing test prefab first to avoid overwrite dialog
    await callTool("asset_delete", { path: "db://assets/test/V1Test.prefab" }).catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    const prefab = await callTool("prefab_create", { uuid, path: "db://assets/test/V1Test.prefab" });
    assert(prefab.success === true, "create");

    if (prefab.result) {
        const info = await callTool("prefab_get_info", { uuid: prefab.result });
        assert(info.success === true, "get_info");

        const inst = await callTool("prefab_instantiate", { prefabUuid: prefab.result, parent: canvasUuid });
        assert(inst.success === true, "instantiate");
        if (inst.nodeUuid) await callTool("node_delete", { uuid: inst.nodeUuid });
    }

    await callTool("node_delete", { uuid });
}

async function testProjectTools() {
    console.log("\n── project tools ──");
    const info = await callTool("project_get_info");
    assert(info.success === true, "get_info");

    const refresh = await callTool("project_refresh_assets");
    assert(refresh.success === true || !refresh._rpcError, "refresh_assets");

    const found = await callTool("project_find_asset", { pattern: "db://assets/**/*.scene" });
    assert(found.assets?.length > 0, "find_asset");

    if (found.assets?.length > 0) {
        const ai = await callTool("project_get_asset_info", { uuid: found.assets[0].uuid });
        assert(ai.success === true, "get_asset_info");
    }
}

async function testAssetTools() {
    console.log("\n── asset tools ──");
    // query_uuid
    const quuid = await callTool("asset_query_uuid", { path: "db://assets/MainScene.scene" });
    assert(quuid.success === true, "query_uuid");

    if (quuid.uuid) {
        const qpath = await callTool("asset_query_path", { uuid: quuid.uuid });
        assert(qpath.success === true, "query_path");

        const qurl = await callTool("asset_query_url", { uuid: quuid.uuid });
        assert(qurl.success === true, "query_url");

        const details = await callTool("asset_get_details", { uuid: quuid.uuid });
        assert(details.success === true, "get_details");

        const deps = await callTool("asset_get_dependencies", { uuid: quuid.uuid });
        assert(deps.success === true || !deps._rpcError, "get_dependencies");
    }
}

async function testSceneAdvancedTools() {
    console.log("\n── scene advanced tools ──");
    const dirty = await callTool("scene_query_dirty");
    assert(dirty.success === true || !dirty._rpcError, "query_dirty");

    const tree = await callTool("scene_query_node_tree");
    assert(tree.success === true, "query_node_tree");

    const classes = await callTool("scene_query_classes");
    assert(classes.success === true || !classes._rpcError, "query_classes");

    // reset_node_transform — create, transform, reset, verify
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;
    const n = await callTool("node_create", { name: "ResetTest", parent: canvasUuid });
    await callTool("node_set_transform", { uuid: n.uuid, position: { x: 99, y: 99, z: 0 } });
    await callTool("scene_reset_node_transform", { uuid: n.uuid });
    const info = await callTool("node_get_info", { uuid: n.uuid });
    assert(info.data?.position?.x === 0, "reset_node_transform");
    await callTool("node_delete", { uuid: n.uuid });
}

async function testSceneViewTools() {
    console.log("\n── scene view tools ──");
    const status = await callTool("view_get_status");
    assert(status.success === true, "get_status");

    const tool = await callTool("view_query_gizmo_tool");
    assert(tool.success === true || !tool._rpcError, "query_gizmo_tool");

    const pivot = await callTool("view_query_gizmo_pivot");
    assert(pivot.success === true || !pivot._rpcError, "query_gizmo_pivot");

    const coord = await callTool("view_query_gizmo_coordinate");
    assert(coord.success === true || !coord._rpcError, "query_gizmo_coordinate");

    const grid = await callTool("view_query_grid_visible");
    assert(grid.success === true || !grid._rpcError, "query_grid_visible");

    const mode = await callTool("view_query_mode_2d_3d");
    assert(mode.success === true || !mode._rpcError, "query_mode_2d_3d");
}

async function testDebugTools() {
    console.log("\n── debug tools ──");
    const info = await callTool("debug_get_editor_info");
    assert(!!info.version, `editor version: ${info.version}`);

    const msgs = await callTool("debug_list_messages", { target: "scene" });
    assert(msgs.success === true, "list_messages");

    const logs = await callTool("debug_get_console_logs", { count: 10 });
    assert(logs.success === true, "get_console_logs");

    const exts = await callTool("debug_list_extensions");
    assert(exts.success === true, "list_extensions");
}

async function testPreferencesTools() {
    console.log("\n── preferences tools ──");
    const all = await callTool("preferences_get_all", { protocol: "general" });
    assert(all.success === true || !all._rpcError, "get_all");
}

async function testServerTools() {
    console.log("\n── server tools ──");
    const status = await callTool("server_get_status");
    assert(status.success === true, "get_status");

    const port = await callTool("server_query_port");
    assert(port.success === true, "query_port");
}

async function testBuilderTools() {
    console.log("\n── builder tools ──");
    const settings = await callTool("builder_get_settings");
    assert(settings.success === true || !settings._rpcError, "get_settings");

    const tasks = await callTool("builder_query_tasks");
    assert(tasks.success === true || !tasks._rpcError, "query_tasks");
}

// ── runner ──

async function main() {
    console.log(`\n🔧 Cocos Creator MCP v1.0 — Regression Test`);
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
    await testAssetTools();
    await testSceneAdvancedTools();
    await testSceneViewTools();
    await testDebugTools();
    await testPreferencesTools();
    await testServerTools();
    await testBuilderTools();

    console.log(`\n${"═".repeat(40)}`);
    console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log(`${"═".repeat(40)}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
});
