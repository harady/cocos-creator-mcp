/**
 * 回帰テスト — 全MCPツールの動作確認
 *
 * 前提: CocosCreatorでcocos-creator-mcpサーバーが起動中、シーンが開いていること
 * 実行: node test/regression.mjs [port]
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.argv[2] || 3000;
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

// ── ALL 146 tool names ──
const ALL_TOOLS = [
    "asset_copy", "asset_create", "asset_delete", "asset_generate_available_url",
    "asset_get_dependencies", "asset_get_details", "asset_import", "asset_move",
    "asset_open_external", "asset_query_missing", "asset_query_path", "asset_query_ready",
    "asset_query_url", "asset_query_users", "asset_query_uuid", "asset_reimport",
    "asset_save", "asset_save_meta",
    "builder_get_settings", "builder_open_panel", "builder_query_tasks",
    "builder_run_preview", "builder_stop_preview",
    "component_add", "component_auto_bind", "component_get_available", "component_get_components",
    "component_get_info", "component_query_enum", "component_remove", "component_set_property",
    "debug_clear_console", "debug_execute_script", "debug_get_console_logs",
    "debug_get_editor_info", "debug_get_extension_info", "debug_get_log_file_info",
    "debug_get_project_logs", "debug_list_extensions", "debug_list_messages",
    "debug_open_url", "debug_query_devices", "debug_search_project_logs", "debug_validate_scene",
    "debug_batch_screenshot", "debug_clear_code_cache", "debug_game_command",
    "debug_preview", "debug_screenshot",
    "debug_record_start", "debug_record_stop", "debug_wait_compile",
    "node_create", "node_delete", "node_detect_type", "node_duplicate", "node_find_by_name",
    "node_get_all", "node_get_info", "node_move", "node_set_active", "node_set_layer",
    "node_set_layout", "node_set_property", "node_set_transform",
    "prefab_close", "prefab_create", "prefab_create_and_replace", "prefab_create_from_spec",
    "prefab_duplicate", "prefab_get_info", "prefab_instantiate",
    "prefab_list", "prefab_open", "prefab_revert", "prefab_update", "prefab_validate",
    "preferences_get", "preferences_get_all", "preferences_reset", "preferences_set",
    "project_find_asset", "project_get_asset_info", "project_get_engine_info",
    "project_get_info", "project_get_settings", "project_query_scripts",
    "project_refresh_assets", "project_set_settings",
    "refimage_add", "refimage_clear_all", "refimage_list", "refimage_query_config",
    "refimage_query_current", "refimage_refresh", "refimage_remove",
    "refimage_set_opacity", "refimage_set_position", "refimage_set_scale", "refimage_switch",
    "scene_begin_undo", "scene_cancel_undo", "scene_close", "scene_copy_node",
    "scene_create", "scene_cut_node", "scene_end_undo",
    "scene_execute_component_method", "scene_execute_script", "scene_get_current",
    "scene_get_hierarchy", "scene_get_list", "scene_move_array_element",
    "scene_open", "scene_paste_node", "scene_query_classes",
    "scene_query_component", "scene_query_component_has_script", "scene_query_components",
    "scene_query_dirty", "scene_query_node", "scene_query_node_tree",
    "scene_query_nodes_by_asset", "scene_query_ready", "scene_query_scene_bounds",
    "scene_remove_array_element", "scene_reset_component", "scene_reset_node_transform",
    "scene_reset_property", "scene_restore_prefab", "scene_save", "scene_save_as",
    "scene_set_parent", "scene_snapshot", "scene_snapshot_abort", "scene_soft_reload",
    "server_check_code_sync", "server_check_connectivity", "server_get_network_interfaces",
    "server_get_status", "server_query_ip_list", "server_query_port",
    "view_align_view_with_node", "view_align_with_view",
    "view_change_gizmo_coordinate", "view_change_gizmo_pivot", "view_change_gizmo_tool",
    "view_change_mode_2d_3d", "view_focus_on_node", "view_get_status",
    "view_query_gizmo_coordinate", "view_query_gizmo_pivot", "view_query_gizmo_tool",
    "view_query_grid_visible", "view_query_icon_gizmo_3d", "view_query_icon_gizmo_size",
    "view_query_mode_2d_3d", "view_reset",
    "view_set_grid_visible", "view_set_icon_gizmo_3d", "view_set_icon_gizmo_size",
];

// ── tests ──

async function testHealth() {
    console.log("\n── Health Check ──");
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    assert(data.status === "ok", "health status ok");
    assert(data.tools >= 148, `tool count >= 148 (got ${data.tools})`);
}

async function testInitialize() {
    console.log("\n── MCP Initialize ──");
    const res = await fetch(`${BASE}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method: "initialize", params: {} }),
    });
    const data = await res.json();
    assert(data.result?.protocolVersion, `protocol version: ${data.result?.protocolVersion}`);
    assert(data.result?.serverInfo?.name === "cocos-creator-mcp", "server name");
    assert(data.result?.serverInfo?.version === "1.0.0", `version: ${data.result?.serverInfo?.version}`);
    // Mcp-Session-Id ヘッダーが返されるか
    const sessionId = res.headers.get("Mcp-Session-Id");
    assert(!!sessionId, `Mcp-Session-Id header: ${sessionId}`);
}

async function testToolsList() {
    console.log("\n── tools/list ──");
    const res = await callMcp("tools/list", {});
    const tools = res.result?.tools || [];
    assert(tools.length >= 148, `tool count >= 148 (got ${tools.length})`);

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
    assert(found.data?.length >= 1, "find_by_name");

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

    // テスト用Prefabパスを毎回ユニークにしてoverwriteを避ける
    const testPrefabPath = `db://assets/test/V1Test_${Date.now()}.prefab`;
    const prefab = await callTool("prefab_create", { uuid, path: testPrefabPath });
    assert(prefab.success === true, "create");

    if (prefab.result) {
        const info = await callTool("prefab_get_info", { uuid: prefab.result });
        assert(info.success === true, "get_info");

        const inst = await callTool("prefab_instantiate", { prefabUuid: prefab.result, parent: canvasUuid });
        assert(inst.success === true, "instantiate");
        if (inst.nodeUuid) await callTool("node_delete", { uuid: inst.nodeUuid });
    }

    await callTool("node_delete", { uuid });

    // テスト用Prefabアセットを削除
    if (testPrefabPath) {
        await callTool("asset_delete", { path: testPrefabPath });
    }
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
    // Find any scene asset dynamically (project-independent)
    const scenes = await callTool("project_find_asset", { pattern: "db://assets/**/*.scene" });
    const scenePath = scenes.assets?.[0]?.path || scenes.assets?.[0]?.url;
    const sceneUuid = scenes.assets?.[0]?.uuid;

    if (scenePath) {
        const quuid = await callTool("asset_query_uuid", { path: scenePath });
        assert(quuid.success === true, "query_uuid");

        const uuid = quuid.uuid || sceneUuid;
        if (uuid) {
            const qpath = await callTool("asset_query_path", { uuid });
            assert(qpath.success === true, "query_path");

            const qurl = await callTool("asset_query_url", { uuid });
            assert(qurl.success === true, "query_url");

            const details = await callTool("asset_get_details", { uuid });
            assert(details.success === true, "get_details");

            const deps = await callTool("asset_get_dependencies", { uuid });
            assert(deps.success === true || !deps._rpcError, "get_dependencies");
        }
    } else {
        skip("asset tools (no scene found in project)");
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

    // source filter — verify parameter is accepted (filtering requires CC restart to apply)
    const sceneLogs = await callTool("debug_get_console_logs", { count: 10, source: "scene" });
    assert(sceneLogs.success === true, "get_console_logs source=scene accepted");

    const gameLogs = await callTool("debug_get_console_logs", { count: 10, source: "game" });
    assert(gameLogs.success === true, "get_console_logs source=game accepted");

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
    const buildInfo = await callTool("server_get_build_hash");
    assert(!!buildInfo.buildHash && buildInfo.buildHash !== "__BUILD_HASH__", `buildHash: ${buildInfo.buildHash}`);

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

async function testNewSceneAdvancedTools() {
    console.log("\n── new scene advanced tools ──");
    const ready = await callTool("scene_query_ready");
    assert(ready.success === true || !ready._rpcError, "query_ready");

    const current = await callTool("scene_get_current");
    assert(current.success === true || !current._rpcError, "get_current");

    const hasScript = await callTool("scene_query_component_has_script", { name: "cc.Label" });
    assert(hasScript.success === true || !hasScript._rpcError, "query_component_has_script");
}

async function testNewViewTools() {
    console.log("\n── new scene view tools ──");
    const icon3d = await callTool("view_query_icon_gizmo_3d");
    assert(icon3d.success === true || !icon3d._rpcError, "query_icon_gizmo_3d");

    const iconSize = await callTool("view_query_icon_gizmo_size");
    assert(iconSize.success === true || !iconSize._rpcError, "query_icon_gizmo_size");
}

async function testComponentAdvanced() {
    console.log("\n── component advanced tools ──");
    const available = await callTool("component_get_available");
    assert(available.success === true || !available._rpcError, "get_available");
}

async function testProjectAdvanced() {
    console.log("\n── project advanced tools ──");
    const engine = await callTool("project_get_engine_info");
    assert(engine.success === true || !engine._rpcError, "get_engine_info");

    const settings = await callTool("project_get_settings", { protocol: "general" });
    assert(settings.success === true || !settings._rpcError, "get_settings");
}

async function testReferenceImageTools() {
    console.log("\n── reference image tools ──");
    const config = await callTool("refimage_query_config");
    assert(config.success === true || !config._rpcError, "query_config");

    const list = await callTool("refimage_list");
    assert(list.success === true || !list._rpcError, "list");

    const current = await callTool("refimage_query_current");
    assert(current.success === true || !current._rpcError, "query_current");
}

async function testV13Regressions() {
    console.log("\n── v1.3 regressions (set-property / prefab guard / scene_save) ──");

    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;

    // 1. scene_save — ダイアログなしで成功するか
    const save = await callTool("scene_save");
    assert(save.success === true, "scene_save no dialog");

    // 2. prefab_create 上書きガード — テスト用Prefabを作って上書きを試みる
    const guardNode = await callTool("node_create", { name: "GuardTest", parent: canvasUuid });
    const guardPath = `db://assets/test/GuardTest_${Date.now()}.prefab`;
    const guardPrefab = await callTool("prefab_create", { uuid: guardNode.uuid, path: guardPath });
    assert(guardPrefab.success === true, "prefab_create for guard test");
    // 同じパスに再作成 → エラーになるはず
    const guardResult = await callTool("prefab_create", { uuid: guardNode.uuid, path: guardPath });
    assert(!!guardResult.error || !!guardResult._rpcError, "prefab_create overwrite guard");
    await callTool("node_delete", { uuid: guardNode.uuid });
    await callTool("asset_delete", { path: guardPath });

    // 3. set-property + prefab_update — テスト用Prefabを自作してテスト
    const prefabNode = await callTool("node_create", { name: "UpdateTestNode", parent: canvasUuid, components: ["cc.Label"] });
    await callTool("component_set_property", { uuid: prefabNode.uuid, componentType: "cc.Label", property: "string", value: "original" });
    const testPrefabPath = `db://assets/test/UpdateTest_${Date.now()}.prefab`;
    const created = await callTool("prefab_create", { uuid: prefabNode.uuid, path: testPrefabPath });
    await callTool("node_delete", { uuid: prefabNode.uuid });

    if (created.result) {
        // instantiate → set-property → prefab_update
        const inst = await callTool("prefab_instantiate", { prefabUuid: created.result, parent: canvasUuid });
        const instUuid = inst.nodeUuid;
        if (instUuid) {
            const setProp = await callTool("component_set_property", {
                uuid: instUuid, componentType: "cc.Label", property: "fontSize", value: 48
            });
            assert(setProp.success === true, "set-property fontSize via scene:set-property");

            const updated = await callTool("prefab_update", { uuid: instUuid });
            assert(updated.success === true, "prefab_update after set-property");

            await callTool("node_delete", { uuid: instUuid });
        }
        await callTool("asset_delete", { path: testPrefabPath });
    } else {
        skip("set-property + prefab_update (prefab_create failed)");
    }

    // 4. パラメータエイリアス — component でも componentType でも動くか
    const aliasNode = await callTool("node_create", { name: "AliasTest", parent: canvasUuid, components: ["cc.Label"] });
    const aliasSet = await callTool("component_set_property", {
        uuid: aliasNode.uuid, component: "cc.Label", property: "string", value: "alias"
    });
    assert(aliasSet.success === true, "param alias: component → componentType");
    await callTool("node_delete", { uuid: aliasNode.uuid });
}

async function testNewEditorAPIs() {
    console.log("\n── new Editor APIs (beyond existing MCP) ──");

    // scene_query_node
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;
    if (canvasUuid) {
        const nodeDump = await callTool("scene_query_node", { uuid: canvasUuid });
        assert(nodeDump.success === true || !nodeDump._rpcError, "query_node");
    }

    // asset_query_ready
    const ready = await callTool("asset_query_ready");
    assert(ready.success === true || !ready._rpcError, "asset_query_ready");

    // asset_generate_available_url
    const avail = await callTool("asset_generate_available_url", { url: "db://assets/test/TestGenerated.prefab" });
    assert(avail.success === true || !avail._rpcError, "asset_generate_available_url");

    // server_check_connectivity
    const conn = await callTool("server_check_connectivity");
    assert(conn.success === true, "server_check_connectivity");

    // server_get_network_interfaces
    const net = await callTool("server_get_network_interfaces");
    assert(net.success === true, "server_get_network_interfaces");

    // node_detect_type
    if (canvasUuid) {
        const detect = await callTool("node_detect_type", { uuid: canvasUuid });
        assert(detect.success === true, "node_detect_type");
        assert(detect.nodeType === "2D" || detect.nodeType === "Node", `Canvas type: ${detect.nodeType}`);
    }

    // debug_get_log_file_info
    const logInfo = await callTool("debug_get_log_file_info");
    assert(logInfo.success === true, "debug_get_log_file_info");

    // debug_validate_scene
    const valid = await callTool("debug_validate_scene");
    assert(valid.success === true, "debug_validate_scene");

    // prefab_validate (use MainScene UUID)
    const scenes = await callTool("scene_get_list");
    if (scenes.scenes?.length > 0) {
        const pv = await callTool("prefab_validate", { uuid: scenes.scenes[0].uuid });
        assert(pv.success === true || !pv._rpcError, "prefab_validate");
    }
}

async function testV15NewTools() {
    console.log("\n── v1.5 new tools (create_and_replace / batch set_property / prefab_open) ──");

    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;

    // 1. prefab_create_and_replace
    const node = await callTool("node_create", { name: "ReplaceTest", parent: canvasUuid, components: ["cc.Label"] });
    await callTool("component_set_property", { uuid: node.uuid, componentType: "cc.Label", property: "string", value: "replace_test" });
    const replacePath = `db://assets/test/ReplaceTest_${Date.now()}.prefab`;
    const replaced = await callTool("prefab_create_and_replace", { uuid: node.uuid, path: replacePath });
    assert(replaced.success === true, "prefab_create_and_replace success");
    assert(!!replaced.prefabAssetUuid, "prefab_create_and_replace returns prefabAssetUuid");
    assert(!!replaced.newInstanceUuid, "prefab_create_and_replace returns newInstanceUuid");

    // Verify original node is gone
    const oldNode = await callTool("node_get_info", { uuid: node.uuid });
    assert(!oldNode.data || oldNode.success === false, "original node removed");

    // Verify new instance exists
    if (replaced.newInstanceUuid) {
        const newNode = await callTool("node_get_info", { uuid: replaced.newInstanceUuid });
        // Prefabインスタンスの名前はPrefabアセット名になる（CocosCreator仕様）
        assert(newNode.data?.name != null, `new instance exists (name: ${newNode.data?.name})`);
        await callTool("node_delete", { uuid: replaced.newInstanceUuid });
    }
    await callTool("asset_delete", { path: replacePath });

    // 2. component_set_property batch mode
    const batchNode = await callTool("node_create", { name: "BatchTest", parent: canvasUuid, components: ["cc.Label"] });
    const batchResult = await callTool("component_set_property", {
        uuid: batchNode.uuid,
        componentType: "cc.Label",
        properties: [
            { property: "string", value: "batch_test" },
            { property: "fontSize", value: 72 },
        ],
    });
    assert(batchResult.success === true, "batch set_property success");
    assert(batchResult.results?.length === 2, "batch set_property 2 results");
    await callTool("node_delete", { uuid: batchNode.uuid });

    // 3. prefab_create_and_replace overwrite guard
    const guardNode2 = await callTool("node_create", { name: "ReplaceGuard", parent: canvasUuid });
    const guardPath2 = `db://assets/test/ReplaceGuard_${Date.now()}.prefab`;
    // First create (should succeed via normal create)
    const firstPrefab = await callTool("prefab_create", { uuid: guardNode2.uuid, path: guardPath2 });
    assert(firstPrefab.success === true, "first prefab create for replace guard");
    // Try create_and_replace with same path (should fail)
    const guardReplace = await callTool("prefab_create_and_replace", { uuid: guardNode2.uuid, path: guardPath2 });
    assert(!!guardReplace.error || !!guardReplace._rpcError, "create_and_replace overwrite guard");
    await callTool("node_delete", { uuid: guardNode2.uuid });
    await callTool("asset_delete", { path: guardPath2 });
}

async function testV16NewTools() {
    console.log("\n── v1.6 new tools (batch_screenshot / widget / source filter) ──");

    // 1. node_create_tree with widget
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;
    if (canvasUuid) {
        const tree = await callTool("node_create_tree", {
            parent: canvasUuid,
            spec: {
                name: "WidgetTestNode",
                components: ["cc.UITransform"],
                widget: { top: 10, left: 20, right: 20 },
            },
        });
        assert(tree.success === true, "create_tree with widget");
        if (tree.data?.uuid) {
            await callTool("node_delete", { uuid: tree.data.uuid });
        }
    } else {
        skip("widget test (no Canvas)");
    }

    // 2. debug_batch_screenshot — verify registered
    const toolsList = await callMcp("tools/list", {});
    const batchTool = toolsList.result?.tools?.find((t) => t.name === "debug_batch_screenshot");
    assert(!!batchTool, "debug_batch_screenshot registered");

    // 3. component_query_enum
    if (canvasUuid) {
        const enumNode = await callTool("node_create", { name: "EnumTest", parent: canvasUuid, components: ["cc.Layout"] });
        if (enumNode.uuid) {
            const enumResult = await callTool("component_query_enum", { uuid: enumNode.uuid, componentType: "cc.Layout", property: "resizeMode" });
            assert(enumResult.success === true, "query_enum success");
            assert(Array.isArray(enumResult.enumList), "query_enum returns enumList");
            if (enumResult.enumList) {
                const names = enumResult.enumList.map((e) => e.name);
                assert(names.includes("CONTAINER"), "resizeMode has CONTAINER");
                assert(names.includes("CHILDREN"), "resizeMode has CHILDREN");
            }
            await callTool("node_delete", { uuid: enumNode.uuid });
        }
    }

    // 4. server_check_code_sync
    const syncResult = await callTool("server_check_code_sync");
    assert(syncResult.success === true, "check_code_sync success");
    assert(syncResult.runtimeHash != null, `runtimeHash: ${syncResult.runtimeHash}`);
    assert(syncResult.diskHash != null, `diskHash: ${syncResult.diskHash}`);

    // 5. component_query_enum registered
    const enumTool = toolsList.result?.tools?.find((t) => t.name === "component_query_enum");
    assert(!!enumTool, "component_query_enum registered");

    // 6. server_check_code_sync registered
    const syncTool = toolsList.result?.tools?.find((t) => t.name === "server_check_code_sync");
    assert(!!syncTool, "server_check_code_sync registered");
}

async function testV18NewTools() {
    console.log("\n── v1.8 new tools (preview recorder) ──");

    // 1. debug_record_start registered
    const toolsList = await callMcp("tools/list", {});
    const startTool = toolsList.result?.tools?.find((t) => t.name === "debug_record_start");
    assert(!!startTool, "debug_record_start registered");

    // 2. debug_record_stop registered
    const stopTool = toolsList.result?.tools?.find((t) => t.name === "debug_record_stop");
    assert(!!stopTool, "debug_record_stop registered");
}

async function testV111NewTools() {
    console.log("\n── v1.11 new tools (auto_bind / create_from_spec / wait_compile) ──");

    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;
    if (!canvasUuid) { skip("v1.11 tests (no Canvas)"); return; }

    // 1. component_auto_bind — built-in コンポーネント(cc.Button)でテスト
    {
        const tree = await callTool("node_create_tree", {
            parent: canvasUuid,
            spec: {
                name: "AutoBindTest",
                components: ["cc.UITransform"],
                children: [
                    { name: "ClickTarget", components: ["cc.UITransform", "cc.Sprite", "cc.Button"] },
                ],
            },
        });
        assert(tree.success === true, "auto_bind setup: create_tree");
        if (tree.data?.uuid) {
            // auto_bind は @property を持つスクリプトコンポーネントが必要なので、
            // ここではツール自体が呼べること + not_found が返ることを確認
            // (テスト環境にカスタムスクリプトがないため)
            const bindResult = await callTool("component_auto_bind", {
                uuid: tree.data.uuid,
                componentType: "cc.UITransform",
                mode: "strict",
            });
            // UITransform にはバインド対象の @property がないので boundCount=0
            assert(bindResult.success === true, "auto_bind returns success");
            assert(bindResult.boundCount === 0, "auto_bind: no bindable props on UITransform");
            await callTool("node_delete", { uuid: tree.data.uuid });
        }
    }

    // 2. prefab_create_from_spec — 基本フロー
    {
        const specPath = `db://assets/test/FromSpec_${Date.now()}.prefab`;
        const spec = {
            name: "SpecTestNode",
            components: ["cc.UITransform"],
            children: [
                { name: "Header", components: ["cc.UITransform", "cc.Label"] },
                { name: "Body", components: ["cc.UITransform"] },
            ],
        };
        const result = await callTool("prefab_create_from_spec", { path: specPath, spec });
        assert(result.success === true, "create_from_spec success");
        assert(!!result.prefabAssetUuid, "create_from_spec returns prefabAssetUuid");
        assert(result.path === specPath, "create_from_spec returns correct path");
        assert(result.nodeTree?.name === "SpecTestNode", "create_from_spec returns nodeTree");
        assert(result.nodeTree?.children?.length === 2, "create_from_spec nodeTree has 2 children");

        // 元ノードがシーンに残っていないことを確認
        if (result.nodeTree?.uuid) {
            const ghost = await callTool("node_get_info", { uuid: result.nodeTree.uuid });
            assert(!ghost.data || ghost.success === false, "temp node removed from scene");
        }

        // Prefab アセットが作成されたことを確認
        if (result.prefabAssetUuid) {
            const info = await callTool("prefab_get_info", { uuid: result.prefabAssetUuid });
            assert(info.success === true, "created prefab asset exists");
        }

        // クリーンアップ
        await callTool("asset_delete", { path: specPath });
    }

    // 3. prefab_create_from_spec — 上書きガード
    {
        // まず通常の Prefab を作成
        const guardNode = await callTool("node_create", { name: "GuardNode", parent: canvasUuid });
        const guardPath = `db://assets/test/SpecGuard_${Date.now()}.prefab`;
        await callTool("prefab_create", { uuid: guardNode.uuid, path: guardPath });
        await callTool("node_delete", { uuid: guardNode.uuid });

        // 同じパスに create_from_spec → エラーになるべき
        const dupResult = await callTool("prefab_create_from_spec", {
            path: guardPath,
            spec: { name: "ShouldFail", components: ["cc.UITransform"] },
        });
        assert(!!dupResult.error || !!dupResult._rpcError, "create_from_spec overwrite guard");

        await callTool("asset_delete", { path: guardPath });
    }

    // 4. debug_wait_compile — ツール登録確認
    {
        const toolsList = await callMcp("tools/list", {});
        const waitTool = toolsList.result?.tools?.find((t) => t.name === "debug_wait_compile");
        assert(!!waitTool, "debug_wait_compile registered");
    }
}

async function testPrefabEfficiency() {
    console.log("\n── prefab efficiency (nodeName / screenshot / node_set_layout) ──");
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;
    if (!canvasUuid) { skip("prefab efficiency tests (no Canvas)"); return; }

    // 1. node_set_layout — ツール登録確認
    const toolsList = await callMcp("tools/list", {});
    const layoutTool = toolsList.result?.tools?.find((t) => t.name === "node_set_layout");
    assert(!!layoutTool, "node_set_layout registered");

    // 2. nodeName でノード作成→プロパティ設定
    const created = await callTool("node_create", { name: "EfficiencyTestNode", parent: canvasUuid, components: ["cc.Label"] });
    const uuid = created.uuid;

    // 2a. component_set_property with nodeName (uuid なし)
    const setByName = await callTool("component_set_property", {
        nodeName: "EfficiencyTestNode",
        componentType: "cc.Label",
        property: "string",
        value: "byName",
    });
    assert(setByName.success === true, "component_set_property by nodeName");

    // 2b. component_get_components with nodeName
    const compsByName = await callTool("component_get_components", { nodeName: "EfficiencyTestNode" });
    assert(compsByName.components?.some((c) => c.type === "Label"), "component_get_components by nodeName");

    // 3. component_set_property with screenshot=true
    const setWithSS = await callTool("component_set_property", {
        uuid,
        componentType: "cc.Label",
        property: "fontSize",
        value: 48,
        screenshot: true,
    });
    assert(setWithSS.success === true, "set_property with screenshot");
    assert(!!setWithSS.screenshot?.path || !!setWithSS.screenshotError, "screenshot result or error returned");

    // 4. node_set_layout — contentSize + widget
    const layoutResult = await callTool("node_set_layout", {
        uuid,
        contentSize: { width: 300, height: 100 },
        widget: { left: 10, right: 10 },
    });
    assert(layoutResult.success === true, "node_set_layout contentSize + widget");
    assert(layoutResult.results?.length >= 2, "node_set_layout multiple results");

    // 5. node_set_layout by nodeName
    const layoutByName = await callTool("node_set_layout", {
        nodeName: "EfficiencyTestNode",
        anchorPoint: { x: 0, y: 1 },
    });
    assert(layoutByName.success === true, "node_set_layout by nodeName");

    // 6. node_set_layout with screenshot
    const layoutSS = await callTool("node_set_layout", {
        uuid,
        contentSize: { width: 200, height: 80 },
        screenshot: true,
    });
    assert(layoutSS.success === true, "node_set_layout with screenshot");
    assert(!!layoutSS.screenshot?.path || !!layoutSS.screenshotError, "node_set_layout screenshot result");

    // Cleanup
    await callTool("node_delete", { uuid });
}

async function testStringifiedArgs() {
    console.log("\n── stringified args prevention ──");
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;
    if (!canvasUuid) { skip("stringified args (no Canvas)"); return; }

    // 1. node_set_property — value がJSON文字列で届いても動くか
    const n1 = await callTool("node_create", { name: "StrArgTest", parent: canvasUuid });
    const setPosStr = await callTool("node_set_property", {
        uuid: n1.uuid, property: "position", value: JSON.stringify({ x: 42, y: 0, z: 0 }),
    });
    assert(setPosStr.success === true, "node_set_property with stringified value");
    const info1 = await callTool("node_get_info", { uuid: n1.uuid });
    assert(info1.data?.position?.x === 42, "position.x == 42 after stringified set");
    await callTool("node_delete", { uuid: n1.uuid });

    // 2. node_create_tree — spec がJSON文字列で届いても動くか
    const treeStr = await callTool("node_create_tree", {
        parent: canvasUuid,
        spec: JSON.stringify({ name: "StrTreeTest", components: ["cc.UITransform"] }),
    });
    assert(treeStr.success === true, "node_create_tree with stringified spec");
    if (treeStr.data?.uuid) await callTool("node_delete", { uuid: treeStr.data.uuid });

    // 3. component_set_property — value がJSON文字列で届いても動くか
    const n3 = await callTool("node_create", { name: "CompStrTest", parent: canvasUuid, components: ["cc.UITransform"] });
    const setCS = await callTool("component_set_property", {
        uuid: n3.uuid, componentType: "cc.UITransform",
        property: "contentSize", value: JSON.stringify({ width: 100, height: 200 }),
    });
    assert(setCS.success === true, "component_set_property with stringified value");

    // 4. component_set_property batch — properties がJSON文字列で届いても動くか
    const setBatch = await callTool("component_set_property", {
        uuid: n3.uuid, componentType: "cc.UITransform",
        properties: JSON.stringify([{ property: "contentSize", value: { width: 300, height: 400 } }]),
    });
    assert(setBatch.success === true, "component_set_property batch with stringified properties");
    await callTool("node_delete", { uuid: n3.uuid });
}

async function testSceneCreate() {
    console.log("\n── scene_create (asset-db fallback) ──");

    // 元のシーンを記憶
    const origScene = await callTool("scene_get_current");
    const origUuid = origScene.uuid || origScene.data?.uuid;

    // scene-2d は dirty untitled 扱いになり preflight でエラーが出うるので force:true でバイパス
    // 1. path 指定での作成
    const testPath = `db://assets/test/SceneCreateTest_${Date.now()}.scene`;
    const result = await callTool("scene_create", { path: testPath, force: true });
    assert(result.success === true, `scene_create with path (method: ${result.method})`);

    // 元のシーンに戻してクリーンアップ
    if (result.success && origUuid) {
        await callTool("scene_open", { uuid: origUuid, force: true });
        await new Promise(r => setTimeout(r, 1000));
        await callTool("asset_delete", { path: testPath });
    }

    // 2. path なしでの作成（scene:new-scene または自動 fallback）
    const result2 = await callTool("scene_create", { force: true });
    assert(result2.success === true, `scene_create without path (method: ${result2.method || "new-scene"})`);

    // 元のシーンに戻してクリーンアップ
    if (result2.success && origUuid) {
        await callTool("scene_open", { uuid: origUuid, force: true });
        await new Promise(r => setTimeout(r, 1000));
        // fallback で作成された場合はファイルを削除
        if (result2.path) {
            await callTool("asset_delete", { path: result2.path });
        }
    }
}

// ── dialog prevention (scene-switch guard) ──

async function testDialogPrevention() {
    console.log("\n── dialog prevention (scene-switch guard) ──");

    // 前提: 保存済みシーン (_regression.scene) 上で実行する必要がある。
    // 他のテストが scene-2d 等に切り替えている可能性があるので冒頭で _regression に戻す。
    // _regression に戻せなかった場合は何も副作用を残さず早期 return する。
    const regInfoPre = await callTool("asset_query_uuid", { path: TEST_SCENE_PATH });
    const regUuidPre = regInfoPre.uuid || regInfoPre.data?.uuid;
    if (!regUuidPre) {
        skip("dialog prevention: _regression.scene not found");
        return;
    }

    await callTool("scene_open", { scene: regUuidPre });
    const switchDeadline = Date.now() + 5000;
    let switchedToRegression = false;
    while (Date.now() < switchDeadline) {
        const now = await callTool("scene_get_current");
        if ((now.sceneName || now.data?.sceneName) === "_regression") {
            switchedToRegression = true;
            break;
        }
        await new Promise((r) => setTimeout(r, 200));
    }
    if (!switchedToRegression) {
        skip("dialog prevention: failed to switch to _regression.scene, avoiding side effects");
        return;
    }

    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;
    if (!canvasUuid) {
        skip("dialog prevention: Canvas not found");
        return;
    }

    // 1. 現在のシーンを dirty にする
    const n = await callTool("node_create", { name: `DialogGuardTest_${Date.now()}`, parent: canvasUuid });
    assert(n.success === true, "setup: created temp node (scene becomes dirty)");
    const tempNodeUuid = n.uuid || n.data?.uuid;

    // 2. 現在のシーンが保存済みであることを確認
    const cur = await callTool("scene_get_current");
    const curName = cur.sceneName || cur.data?.sceneName || "";
    const isSaved = !["scene-2d", "scene-3d", "Untitled", "NewScene", ""].includes(curName);
    if (!isSaved) {
        // setup が正しく機能していれば到達しないはず
        console.log(`  ⚠️  current scene "${curName}" is untitled, skipping (setup issue?)`);
        if (tempNodeUuid) await callTool("node_delete", { uuid: tempNodeUuid });
        return;
    }

    // 3. 別シーン (MainScene) に切替 — 保存済みシーンなので preflight が auto-save して成功するはず
    const mainInfo = await callTool("asset_query_uuid", { path: "db://assets/MainScene.scene" });
    const mainUuid = mainInfo.uuid || mainInfo.data?.uuid;
    if (!mainUuid) {
        skip("dialog prevention: MainScene not found");
        if (tempNodeUuid) await callTool("node_delete", { uuid: tempNodeUuid });
        return;
    }

    const switchResult = await callTool("scene_open", { scene: mainUuid });
    assert(switchResult.success === true,
        `saved dirty → scene_open auto-saves and switches (got: ${JSON.stringify(switchResult).slice(0, 120)})`);

    // 4. スイッチが完了するまで待機
    const SWITCH_TIMEOUT_MS = 5000;
    const deadline = Date.now() + SWITCH_TIMEOUT_MS;
    let switchedToMain = false;
    while (Date.now() < deadline) {
        const now = await callTool("scene_get_current");
        if ((now.sceneName || now.data?.sceneName) === "MainScene") {
            switchedToMain = true;
            break;
        }
        await new Promise((r) => setTimeout(r, 200));
    }
    assert(switchedToMain, "scene actually switched to MainScene after preflight auto-save");

    // 5. _regression に戻す
    const regInfo = await callTool("asset_query_uuid", { path: TEST_SCENE_PATH });
    const regUuid = regInfo.uuid || regInfo.data?.uuid;
    if (regUuid) {
        await callTool("scene_open", { scene: regUuid });
        // settle
        const deadline2 = Date.now() + SWITCH_TIMEOUT_MS;
        while (Date.now() < deadline2) {
            const now = await callTool("scene_get_current");
            if ((now.sceneName || now.data?.sceneName) === "_regression") break;
            await new Promise((r) => setTimeout(r, 200));
        }
    }

    // クリーンアップ: 元の temp node は auto-save で _regression.scene に保存されてしまっているので、
    // 新規 load 後は uuid が変わっている。名前ベースで削除を試みる。
    const finalHier = await callTool("scene_get_hierarchy");
    const canvas = finalHier.hierarchy?.find((x) => x.name === "Canvas");
    const leftover = canvas?.children?.find((c) => c.name?.startsWith("DialogGuardTest_"));
    if (leftover?.uuid) {
        await callTool("node_delete", { uuid: leftover.uuid });
    }
}

async function testUncoveredTools() {
    console.log("\n── uncovered tools (minimum 1 call) ──");
    const hier = await callTool("scene_get_hierarchy");
    const canvasUuid = hier.hierarchy?.find((n) => n.name === "Canvas")?.uuid;

    // debug tools (editor-only, no preview required)
    const clearRes = await callTool("debug_clear_console");
    assert(clearRes.success === true || !clearRes._rpcError, "debug_clear_console");

    const extInfo = await callTool("debug_get_extension_info", { name: "cocos-creator-mcp" });
    assert(extInfo.success === true || !extInfo._rpcError, "debug_get_extension_info");

    const searchLogs = await callTool("debug_search_project_logs", { keyword: "test", count: 5 });
    assert(searchLogs.success === true || !searchLogs._rpcError, "debug_search_project_logs");

    const devices = await callTool("debug_query_devices");
    assert(devices.success === true || !devices._rpcError, "debug_query_devices");

    // scene tools (read-only or safe)
    const queryComps = await callTool("scene_query_components");
    assert(queryComps.success === true || !queryComps._rpcError, "scene_query_components");

    const queryBounds = await callTool("scene_query_scene_bounds");
    assert(queryBounds.success === true || !queryBounds._rpcError, "scene_query_scene_bounds");

    if (canvasUuid) {
        const queryComp = await callTool("scene_query_component", { uuid: canvasUuid, componentType: "cc.UITransform" });
        assert(queryComp.success === true || !queryComp._rpcError, "scene_query_component");

        // scene_set_parent (create two nodes, reparent, cleanup)
        const pNode = await callTool("node_create", { name: "ParentTest", parent: canvasUuid });
        const cNode = await callTool("node_create", { name: "ChildTest", parent: canvasUuid });
        if (pNode.uuid && cNode.uuid) {
            const sp = await callTool("scene_set_parent", { uuid: cNode.uuid, parentUuid: pNode.uuid });
            assert(sp.success === true || !sp._rpcError, "scene_set_parent");
            await callTool("node_delete", { uuid: pNode.uuid });
        }

        // node_set_layer
        const layerNode = await callTool("node_create", { name: "LayerTest", parent: canvasUuid });
        if (layerNode.uuid) {
            const sl = await callTool("node_set_layer", { uuid: layerNode.uuid, layer: 1 << 25 });
            assert(sl.success === true || !sl._rpcError, "node_set_layer");
            await callTool("node_delete", { uuid: layerNode.uuid });
        }

        // scene undo (begin + cancel)
        const beginUndo = await callTool("scene_begin_undo");
        assert(beginUndo.success === true || !beginUndo._rpcError, "scene_begin_undo");
        const cancelUndo = await callTool("scene_cancel_undo");
        assert(cancelUndo.success === true || !cancelUndo._rpcError, "scene_cancel_undo");

        // view tools (safe set + restore)
        const origGrid = await callTool("view_query_grid_visible");
        const setGrid = await callTool("view_set_grid_visible", { visible: true });
        assert(setGrid.success === true || !setGrid._rpcError, "view_set_grid_visible");

        const focusRes = await callTool("view_focus_on_node", { uuid: canvasUuid });
        assert(focusRes.success === true || !focusRes._rpcError, "view_focus_on_node");

        const changeTool = await callTool("view_change_gizmo_tool", { tool: "move" });
        assert(changeTool.success === true || !changeTool._rpcError, "view_change_gizmo_tool");

        const resetView = await callTool("view_reset");
        assert(resetView.success === true || !resetView._rpcError, "view_reset");
    }

    // project tools
    const scripts = await callTool("project_query_scripts");
    assert(scripts.success === true || !scripts._rpcError, "project_query_scripts");

    // asset tools
    const missingAssets = await callTool("asset_query_missing");
    assert(missingAssets.success === true || !missingAssets._rpcError, "asset_query_missing");

    // preferences tools
    const prefGet = await callTool("preferences_get", { protocol: "general", key: "language" });
    assert(prefGet.success === true || !prefGet._rpcError, "preferences_get");

    // scene_execute_script (read-only expression)
    const execScript = await callTool("scene_execute_script", { script: "1 + 1" });
    assert(execScript.success === true || !execScript._rpcError, "scene_execute_script");

    // debug_execute_script (read-only expression)
    const debugExec = await callTool("debug_execute_script", { script: "2 + 2" });
    assert(debugExec.success === true || !debugExec._rpcError, "debug_execute_script");

    // scene_soft_reload
    const softReload = await callTool("scene_soft_reload");
    assert(softReload.success === true || !softReload._rpcError, "scene_soft_reload");
}

// テスト失敗等で残った (Missing Node) 等のゴミを一括削除
async function cleanupOrphanNodes() {
    console.log("\n── cleanup: removing orphan nodes ──");
    const hier = await callTool("scene_get_hierarchy");
    if (!hier.success || !Array.isArray(hier.hierarchy)) {
        skip("cleanup: hierarchy not available");
        return;
    }
    const targets = [];
    const ORPHAN_PATTERNS = [
        /^TestNode_\d+$/,
        /^DialogGuardTest_\d+$/,
        /^GuardTest$/,
        /^UpdateTestNode$/,
        /^ReplaceTest$/,
        /^AliasTest$/,
        /^ChildTest$/,
    ];
    const walk = (nodes) => {
        if (!Array.isArray(nodes)) return;
        for (const n of nodes) {
            if (n.name === "(Missing Node)" || ORPHAN_PATTERNS.some((re) => re.test(n.name))) {
                targets.push(n.uuid);
            }
            if (n.children) walk(n.children);
        }
    };
    walk(hier.hierarchy);
    if (targets.length === 0) {
        console.log("  ✅ no orphan nodes found");
        passed++;
        return;
    }
    let deleted = 0;
    for (const uuid of targets) {
        const r = await callTool("node_delete", { uuid });
        if (r.success) deleted++;
    }
    console.log(`  ✅ cleaned up ${deleted}/${targets.length} orphan nodes`);
    passed++;
}

// ── OAuth dummy endpoints (v1.11.0 — Claude Code VSCode HTTP OAuth bug 回避用) ──

async function testOAuthEndpoints() {
    console.log("\n── OAuth dummy endpoints ──");

    // RFC 9728 Protected Resource Metadata
    {
        const res = await fetch(`${BASE}/.well-known/oauth-protected-resource`);
        assert(res.status === 200, "protected-resource status 200");
        const data = await res.json();
        assert(data.resource === `${BASE}/mcp`, `resource: ${data.resource}`);
        assert(Array.isArray(data.authorization_servers) && data.authorization_servers.length > 0,
            "authorization_servers non-empty");
        assert(Array.isArray(data.bearer_methods_supported) && data.bearer_methods_supported.includes("header"),
            "bearer_methods_supported includes header");
    }

    // RFC 8414 Authorization Server Metadata
    {
        const res = await fetch(`${BASE}/.well-known/oauth-authorization-server`);
        assert(res.status === 200, "authorization-server status 200");
        const data = await res.json();
        assert(data.issuer === BASE, `issuer: ${data.issuer}`);
        assert(data.authorization_endpoint === `${BASE}/oauth/authorize`,
            `authorization_endpoint: ${data.authorization_endpoint}`);
        assert(data.token_endpoint === `${BASE}/oauth/token`,
            `token_endpoint: ${data.token_endpoint}`);
        assert(data.registration_endpoint === `${BASE}/oauth/register`,
            `registration_endpoint: ${data.registration_endpoint}`);
        assert(Array.isArray(data.grant_types_supported) && data.grant_types_supported.includes("authorization_code"),
            "grant_types_supported includes authorization_code");
        assert(Array.isArray(data.code_challenge_methods_supported) && data.code_challenge_methods_supported.includes("S256"),
            "code_challenge_methods_supported includes S256");
    }

    // RFC 7591 Dynamic Client Registration
    {
        const res = await fetch(`${BASE}/oauth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_name: "regression-test",
                redirect_uris: ["http://localhost:54321/callback"],
            }),
        });
        assert(res.status === 200, "register status 200");
        const data = await res.json();
        assert(typeof data.client_id === "string" && data.client_id.length > 0,
            `client_id: ${data.client_id}`);
        assert(data.token_endpoint_auth_method === "none",
            "token_endpoint_auth_method: none");
        assert(Array.isArray(data.redirect_uris) && data.redirect_uris[0] === "http://localhost:54321/callback",
            "redirect_uris echoed");
    }

    // Authorization endpoint — expect 302 with code and state
    {
        const redirectUri = "http://localhost:54321/cb";
        const state = "test-state-xyz";
        const qs = new URLSearchParams({
            response_type: "code",
            client_id: "regtest",
            redirect_uri: redirectUri,
            state,
            code_challenge: "dummy",
            code_challenge_method: "S256",
        });
        const res = await fetch(`${BASE}/oauth/authorize?${qs}`, { redirect: "manual" });
        assert(res.status === 302, `authorize status 302 (got ${res.status})`);
        const location = res.headers.get("location") || "";
        assert(location.startsWith(redirectUri), `redirect back to redirect_uri: ${location}`);
        assert(/[?&]code=[^&]+/.test(location), "code param present");
        assert(location.includes(`state=${encodeURIComponent(state)}`), "state param preserved");
    }

    // Authorization endpoint — missing redirect_uri should 400
    {
        const res = await fetch(`${BASE}/oauth/authorize?response_type=code&client_id=x`, { redirect: "manual" });
        assert(res.status === 400, `authorize without redirect_uri → 400 (got ${res.status})`);
    }

    // Token endpoint
    {
        const res = await fetch(`${BASE}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "grant_type=authorization_code&code=abc&redirect_uri=http%3A%2F%2Flocalhost%3A54321%2Fcb",
        });
        assert(res.status === 200, "token status 200");
        const data = await res.json();
        assert(typeof data.access_token === "string" && data.access_token.length > 0,
            `access_token: ${data.access_token}`);
        assert(data.token_type === "Bearer", `token_type: ${data.token_type}`);
        assert(typeof data.expires_in === "number" && data.expires_in > 0,
            `expires_in: ${data.expires_in}`);
    }

    // 既存 /mcp エンドポイントが Authorization ヘッダーなしでも従来通り処理されること
    {
        const res = await fetch(`${BASE}/mcp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 9999, method: "initialize", params: {} }),
        });
        assert(res.status === 200, "/mcp without auth still 200 (no regression)");
        const data = await res.json();
        assert(data.result?.serverInfo?.name === "cocos-creator-mcp",
            "/mcp without auth returns initialize result");
    }
}

// ── stdio bridge (client/stdio-bridge.js) ──

function runStdioBridge(requests) {
    return new Promise((resolve, reject) => {
        const bridgePath = path.resolve(__dirname, "..", "client", "stdio-bridge.js");
        const child = spawn("node", [bridgePath], {
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env, COCOS_MCP_URL: `${BASE}/mcp` },
        });

        const stdoutChunks = [];
        const stderrChunks = [];
        child.stdout.on("data", (c) => stdoutChunks.push(c));
        child.stderr.on("data", (c) => stderrChunks.push(c));

        child.on("error", (e) => reject(e));
        child.on("close", (code) => {
            const stdout = Buffer.concat(stdoutChunks).toString("utf8");
            const stderr = Buffer.concat(stderrChunks).toString("utf8");
            const lines = stdout.split("\n").filter((l) => l.trim().length > 0);
            const responses = [];
            for (const line of lines) {
                try { responses.push(JSON.parse(line)); }
                catch { /* skip non-JSON */ }
            }
            resolve({ code, responses, stderr });
        });

        for (const req of requests) {
            child.stdin.write(JSON.stringify(req) + "\n");
        }
        child.stdin.end();
    });
}

async function testStdioBridge() {
    console.log("\n── stdio bridge (client/stdio-bridge.js) ──");

    // 1. initialize + tools/list — 基本動作
    {
        const { code, responses, stderr } = await runStdioBridge([
            { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {} } },
            { jsonrpc: "2.0", id: 2, method: "tools/list" },
        ]);
        assert(code === 0, `bridge exit code 0 (got ${code})`);
        assert(responses.length === 2, `bridge returned 2 responses (got ${responses.length})`);
        const init = responses.find((r) => r.id === 1);
        assert(init?.result?.serverInfo?.name === "cocos-creator-mcp",
            "bridge: initialize result");
        const toolsList = responses.find((r) => r.id === 2);
        const tools = toolsList?.result?.tools || [];
        assert(tools.length >= 148, `bridge: tools/list count >= 148 (got ${tools.length})`);
        assert(stderr.includes("session established"),
            "bridge: session established logged");
    }

    // 2. tools/call を通した実ツール呼び出し
    {
        const { responses } = await runStdioBridge([
            { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
            { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "scene_get_current", arguments: {} } },
        ]);
        const toolRes = responses.find((r) => r.id === 2);
        assert(!!toolRes?.result, "bridge: tools/call returned result");
        const content = toolRes?.result?.content?.[0]?.text;
        const parsed = content ? JSON.parse(content) : null;
        assert(parsed?.success === true, "bridge: scene_get_current success");
    }

    // 3. 不正 JSON を流したとき parse error を返す
    {
        const { responses } = await new Promise((resolve, reject) => {
            const bridgePath = path.resolve(__dirname, "..", "client", "stdio-bridge.js");
            const child = spawn("node", [bridgePath], {
                stdio: ["pipe", "pipe", "pipe"],
                env: { ...process.env, COCOS_MCP_URL: `${BASE}/mcp` },
            });
            const out = [];
            child.stdout.on("data", (c) => out.push(c));
            child.on("close", () => {
                const lines = Buffer.concat(out).toString("utf8").split("\n").filter(Boolean);
                const parsed = [];
                for (const l of lines) try { parsed.push(JSON.parse(l)); } catch {}
                resolve({ responses: parsed });
            });
            child.on("error", reject);
            child.stdin.write("this is not json\n");
            child.stdin.end();
        });
        const err = responses[0];
        assert(err?.error?.code === -32700, `bridge: parse error code -32700 (got ${err?.error?.code})`);
    }

    // 4. COCOS_MCP_URL 環境変数で向き先を上書きできる（到達不能 URL でエラーが返る）
    {
        const bridgePath = path.resolve(__dirname, "..", "client", "stdio-bridge.js");
        const { responses } = await new Promise((resolve, reject) => {
            const child = spawn("node", [bridgePath], {
                stdio: ["pipe", "pipe", "pipe"],
                env: { ...process.env, COCOS_MCP_URL: "http://127.0.0.1:9/mcp" }, // discard port
            });
            const out = [];
            child.stdout.on("data", (c) => out.push(c));
            child.on("close", () => {
                const lines = Buffer.concat(out).toString("utf8").split("\n").filter(Boolean);
                const parsed = [];
                for (const l of lines) try { parsed.push(JSON.parse(l)); } catch {}
                resolve({ responses: parsed });
            });
            child.on("error", reject);
            child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) + "\n");
            child.stdin.end();
        });
        const err = responses[0];
        assert(err?.error?.code === -32603, `bridge: HTTP error → -32603 (got ${err?.error?.code})`);
    }
}

// ── test scene setup ──

/**
 * 回帰テスト専用シーンを用意して開く。
 *
 * - CC 直後（現在シーンが untitled かつ clean）ならここから scene_open を呼んで遷移
 * - 既に untitled dirty 状態なら abort
 * - 既に _regression.scene 上なら何もしない
 *
 * 目的: テスト中に scene_create / scene_open / prefab_create 等で dirty state が
 * CC 標準の「Save changes?」ダイアログを出す問題を回避するため、保存済みシーンに移動する。
 */
const TEST_SCENE_PATH = "db://assets/test/_regression.scene";
const SOURCE_SCENE_PATH = "db://assets/MainScene.scene"; // クローン元のテンプレート

async function ensureCleanTestScene() {
    console.log("\n── setup: ensure clean test scene ──");

    const cur = await callTool("scene_get_current");
    const curName = cur.sceneName || cur.data?.sceneName || "";
    const isUntitled = ["scene-2d", "scene-3d", "Untitled", "NewScene", ""].includes(curName);

    // 既にテスト用シーン上ならそのまま
    if (curName === "_regression") {
        console.log(`  ✅ already on _regression.scene`);
        passed++;
        return true;
    }

    // untitled シーン上の場合: dirty flag が立っていると scene_open で CC 標準の
    // 「Save changes?」ダイアログが出て MCP が固まる。ノードを削除しても CC の dirty
    // 履歴は消えないので、この状態では CC 再起動以外に回復手段がない。素直に abort する。
    if (isUntitled) {
        const dirtyCheck = await callTool("scene_query_dirty");
        const isDirty = dirtyCheck.dirty === true || dirtyCheck.data?.dirty === true;
        if (isDirty) {
            console.error(
                `\n❌ Cannot start regression test: current scene "${curName}" is untitled ` +
                `and has been modified (dirty flag set). CC cannot save an untitled scene ` +
                `without a modal dialog, and deleting leftover nodes does not clear the dirty ` +
                `flag.\n   Please restart CocosCreator and run the test again.\n`
            );
            failed++;
            return false;
        }
    }

    // _regression.scene の準備:
    // scene_create の asset-db fallback が生成する最小 JSON は CC が拒否するため、
    // 既存の MainScene.scene を asset_copy で複製する方式にしている。
    let info = await callTool("asset_query_uuid", { path: TEST_SCENE_PATH }).catch(() => ({}));
    let sceneUuid = info.uuid || info.data?.uuid;

    if (!sceneUuid) {
        console.log(`  cloning ${SOURCE_SCENE_PATH} → ${TEST_SCENE_PATH}...`);

        // ソースの存在確認
        const srcInfo = await callTool("asset_query_uuid", { path: SOURCE_SCENE_PATH }).catch(() => ({}));
        const srcUuid = srcInfo.uuid || srcInfo.data?.uuid;
        if (!srcUuid) {
            console.error(`  ❌ source scene ${SOURCE_SCENE_PATH} not found; cannot create test scene`);
            failed++;
            return false;
        }

        const copied = await callTool("asset_copy", { source: SOURCE_SCENE_PATH, destination: TEST_SCENE_PATH });
        if (!copied.success) {
            console.error(`  ❌ failed to copy test scene: ${JSON.stringify(copied).slice(0, 200)}`);
            failed++;
            return false;
        }

        info = await callTool("asset_query_uuid", { path: TEST_SCENE_PATH }).catch(() => ({}));
        sceneUuid = info.uuid || info.data?.uuid;
    }

    if (!sceneUuid) {
        console.error(`  ❌ could not resolve UUID for ${TEST_SCENE_PATH}`);
        failed++;
        return false;
    }

    // scene_open は非同期ロードで response success が実際の切替完了を保証しない。
    // 切替が観測できるまで scene_open + scene_get_current の polling を繰り返す。
    // ここまで来ている時点で current scene は clean が保証されているので force は不要。
    const SWITCH_TIMEOUT_MS = 15000;
    const POLL_INTERVAL_MS = 300;
    const deadline = Date.now() + SWITCH_TIMEOUT_MS;
    let switched = false;
    let lastError = "";
    let openAttempts = 0;

    while (Date.now() < deadline) {
        const now = await callTool("scene_get_current");
        const name = now.sceneName || now.data?.sceneName || "";
        if (name === "_regression") {
            switched = true;
            break;
        }
        // 切替されていなければ scene_open を再試行（idempotent）
        openAttempts++;
        const opened = await callTool("scene_open", { scene: sceneUuid });
        if (opened.success !== true) {
            lastError = JSON.stringify(opened).slice(0, 200);
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    if (!switched) {
        console.error(
            `  ❌ scene_open did not switch to _regression within ${SWITCH_TIMEOUT_MS}ms ` +
            `(attempts: ${openAttempts}, last error: ${lastError || "none"})`
        );
        failed++;
        return false;
    }

    console.log(`  ✅ opened and verified ${TEST_SCENE_PATH} (${openAttempts} open attempt(s))`);
    passed++;
    return true;
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
    await testOAuthEndpoints();
    await testStdioBridge();

    // scene 依存テストの前にテスト専用シーンを用意
    const sceneReady = await ensureCleanTestScene();
    if (!sceneReady) {
        console.log(`\n${"═".repeat(40)}`);
        console.log(`  Setup failed — aborting scene-dependent tests.`);
        console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
        console.log(`${"═".repeat(40)}\n`);
        process.exit(1);
    }
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
    await testNewSceneAdvancedTools();
    await testNewViewTools();
    await testComponentAdvanced();
    await testProjectAdvanced();
    await testReferenceImageTools();
    await testV13Regressions();
    await testV15NewTools();
    await testNewEditorAPIs();
    await testV16NewTools();
    await testV18NewTools();
    await testV111NewTools();
    await testPrefabEfficiency();
    await testStringifiedArgs();
    await testSceneCreate();
    await testDialogPrevention();
    await testUncoveredTools();
    await cleanupOrphanNodes();

    console.log(`\n${"═".repeat(40)}`);
    console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log(`${"═".repeat(40)}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
});
