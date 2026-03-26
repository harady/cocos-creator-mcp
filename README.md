# Cocos Creator MCP

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server extension for Cocos Creator 3.8+.

AI assistants like Claude can control Cocos Creator editor through this extension — creating nodes, editing scenes, managing prefabs, building projects, and more.

## Features

- **145 Tools** across 13 categories — comprehensive editor automation
- **Streamable HTTP (SSE)** — Native support for MCP's Streamable HTTP transport
- **JSON-RPC 2.0** — Standard MCP protocol compliance
- **Prefab Property Persistence** — Component properties are correctly preserved when saving prefabs
- **Auto Start** — Server starts automatically when the extension loads
- **Tool Call Logging** — All tool invocations logged with timing for debugging
- **UUID Validation** — Input validation helpers for better error messages
- **i18n** — English, Japanese, Chinese
- **Regression Tests** — 224 assertions covering all 145 tools

## Quick Start

### 1. Install

Copy or symlink this extension into your Cocos Creator project's `extensions/` directory:

```bash
# Windows (Junction — no admin required)
mklink /J "your-project\extensions\cocos-creator-mcp" "path\to\cocos-creator-mcp"

# macOS / Linux
ln -s /path/to/cocos-creator-mcp your-project/extensions/cocos-creator-mcp
```

### 2. Build

```bash
cd cocos-creator-mcp
npm install
npm run build
```

### 3. Enable in Cocos Creator

1. Open your project in Cocos Creator
2. Go to **Extension > Extension Manager**
3. Enable **Cocos Creator MCP**
4. Open the panel: **Extension > Cocos Creator MCP > Open Panel**
5. Click **Start Server** (or set `autoStart: true` in config)

### 4. Connect from Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "cocos-creator-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### 5. Verify

```bash
curl http://127.0.0.1:3000/health
# {"status":"ok","tools":145}
```

## Available Tools (145)

<details>
<summary><strong>Scene (6)</strong> — Scene lifecycle and hierarchy</summary>

| Tool | Description |
|------|-------------|
| `scene_get_hierarchy` | Get the node tree (with optional component info) |
| `scene_open` | Open a scene by UUID or db:// path |
| `scene_save` | Save the current scene |
| `scene_get_list` | List all .scene files |
| `scene_close` | Close the current scene |
| `scene_get_current` | Get name and UUID of the current scene |
</details>

<details>
<summary><strong>Scene Advanced (22)</strong> — Undo, clipboard, queries, property manipulation</summary>

| Tool | Description |
|------|-------------|
| `scene_execute_script` | Execute a custom scene script method |
| `scene_snapshot` | Take a snapshot for undo |
| `scene_snapshot_abort` | Abort the current undo snapshot |
| `scene_begin_undo` | Begin recording undo operations |
| `scene_end_undo` | End undo recording |
| `scene_cancel_undo` | Cancel undo recording |
| `scene_query_dirty` | Check if scene has unsaved changes |
| `scene_query_ready` | Check if scene is fully loaded |
| `scene_query_classes` | List all available component classes |
| `scene_query_components` | Query components for a node |
| `scene_query_component_has_script` | Check if a component has a script file |
| `scene_query_node_tree` | Get raw node tree from editor |
| `scene_query_node` | Get full property dump of a node |
| `scene_query_component` | Get full property dump of a component |
| `scene_query_nodes_by_asset` | Find nodes referencing an asset |
| `scene_query_scene_bounds` | Get scene bounding rect |
| `scene_soft_reload` | Soft reload scene |
| `scene_reset_node_transform` | Reset transform to default |
| `scene_reset_property` | Reset a specific property to default |
| `scene_reset_component` | Reset a component to defaults |
| `scene_copy_node` | Copy node to clipboard |
| `scene_paste_node` | Paste node from clipboard |
| `scene_cut_node` | Cut node to clipboard |
| `scene_create` | Create a new empty scene |
| `scene_save_as` | Save scene to a new file |
| `scene_set_parent` | Reparent node(s) with official API |
| `scene_restore_prefab` | Restore prefab node to original state |
| `scene_execute_component_method` | Call a method on a component |
| `scene_move_array_element` | Reorder array property element |
| `scene_remove_array_element` | Remove array property element |
</details>

<details>
<summary><strong>Scene View (19)</strong> — Gizmo, camera, grid, viewport</summary>

| Tool | Description |
|------|-------------|
| `view_change_gizmo_tool` | Switch gizmo tool (move/rotate/scale/rect) |
| `view_query_gizmo_tool` | Get current gizmo tool |
| `view_change_gizmo_pivot` | Change pivot mode (center/pivot) |
| `view_query_gizmo_pivot` | Get current pivot mode |
| `view_change_gizmo_coordinate` | Change coordinate system (local/global) |
| `view_query_gizmo_coordinate` | Get current coordinate system |
| `view_change_mode_2d_3d` | Switch 2D/3D view |
| `view_query_mode_2d_3d` | Get current view mode |
| `view_set_grid_visible` | Show/hide grid |
| `view_query_grid_visible` | Check grid visibility |
| `view_set_icon_gizmo_3d` | Toggle 3D icon gizmos |
| `view_query_icon_gizmo_3d` | Check 3D icon gizmo state |
| `view_set_icon_gizmo_size` | Set icon gizmo size |
| `view_query_icon_gizmo_size` | Get icon gizmo size |
| `view_focus_on_node` | Focus camera on node(s) |
| `view_align_with_view` | Align node with camera view |
| `view_align_view_with_node` | Align camera with node |
| `view_get_status` | Get all view settings at once |
| `view_reset` | Reset scene view to default |
</details>

<details>
<summary><strong>Node (12)</strong> — Create, edit, move, delete nodes</summary>

| Tool | Description |
|------|-------------|
| `node_create` | Create node (with optional components) |
| `node_get_info` | Get node details (position, scale, components) |
| `node_find_by_name` | Find nodes by name |
| `node_set_property` | Set node property |
| `node_set_transform` | Set position/rotation/scale at once |
| `node_set_active` | Set node visibility |
| `node_set_layer` | Set node layer |
| `node_delete` | Delete node |
| `node_move` | Move node to new parent |
| `node_duplicate` | Duplicate node |
| `node_get_all` | List all nodes |
| `node_detect_type` | Detect node type (2D/3D/Node) |
</details>

<details>
<summary><strong>Component (6)</strong> — Add, remove, configure components</summary>

| Tool | Description |
|------|-------------|
| `component_add` | Add component (e.g. `cc.Label`, `cc.Sprite`) |
| `component_remove` | Remove component |
| `component_get_components` | List components on node |
| `component_set_property` | Set component property (Label.string, fontSize, etc.) |
| `component_get_info` | Get full component dump by UUID |
| `component_get_available` | List all available component classes |
</details>

<details>
<summary><strong>Prefab (8)</strong> — Prefab lifecycle and validation</summary>

| Tool | Description |
|------|-------------|
| `prefab_list` | List all prefabs |
| `prefab_create` | Create prefab from node (properties preserved) |
| `prefab_instantiate` | Instantiate prefab into scene |
| `prefab_get_info` | Get prefab asset info |
| `prefab_update` | Apply prefab changes |
| `prefab_revert` | Revert prefab instance to original |
| `prefab_duplicate` | Copy prefab to new path |
| `prefab_validate` | Validate prefab for broken references |
</details>

<details>
<summary><strong>Asset (18)</strong> — CRUD, queries, metadata, dependencies</summary>

| Tool | Description |
|------|-------------|
| `asset_create` | Create new asset |
| `asset_delete` | Delete asset |
| `asset_move` | Move/rename asset |
| `asset_copy` | Copy asset |
| `asset_save` | Save asset |
| `asset_reimport` | Re-import asset |
| `asset_import` | Import external file into project |
| `asset_query_path` | Get file path for UUID |
| `asset_query_uuid` | Get UUID for path |
| `asset_query_url` | Get URL for UUID |
| `asset_get_details` | Get asset metadata |
| `asset_get_dependencies` | Get asset dependencies |
| `asset_open_external` | Open in external editor |
| `asset_save_meta` | Save asset meta/importer settings |
| `asset_generate_available_url` | Generate non-conflicting asset path |
| `asset_query_ready` | Check if asset DB is ready |
| `asset_query_users` | Find assets that reference this asset |
| `asset_query_missing` | Check for missing references |
</details>

<details>
<summary><strong>Project (8)</strong> — Project info, settings, engine</summary>

| Tool | Description |
|------|-------------|
| `project_get_info` | Get project name and path |
| `project_refresh_assets` | Refresh asset database |
| `project_get_asset_info` | Get asset info by UUID |
| `project_find_asset` | Find assets by glob pattern |
| `project_get_settings` | Get project settings |
| `project_set_settings` | Set a project setting |
| `project_get_engine_info` | Get engine version and paths |
| `project_query_scripts` | Query all script plugins |
</details>

<details>
<summary><strong>Preferences (4)</strong> — Editor preferences</summary>

| Tool | Description |
|------|-------------|
| `preferences_get` | Get preference value |
| `preferences_set` | Set preference value |
| `preferences_get_all` | Get all preferences for a protocol |
| `preferences_reset` | Reset preference to default |
</details>

<details>
<summary><strong>Debug (13)</strong> — Editor info, logs, extensions, validation</summary>

| Tool | Description |
|------|-------------|
| `debug_get_editor_info` | Get editor version and environment |
| `debug_list_messages` | List available Editor messages |
| `debug_execute_script` | Execute scene script method |
| `debug_get_console_logs` | Get console log entries |
| `debug_clear_console` | Clear editor console |
| `debug_list_extensions` | List installed extensions |
| `debug_get_extension_info` | Get extension details |
| `debug_get_project_logs` | Read project log entries |
| `debug_search_project_logs` | Search patterns in project logs |
| `debug_get_log_file_info` | Get log file metadata |
| `debug_validate_scene` | Validate scene for common issues |
| `debug_query_devices` | List connected devices |
| `debug_open_url` | Open URL in system browser |
</details>

<details>
<summary><strong>Server (5)</strong> — Editor server and network</summary>

| Tool | Description |
|------|-------------|
| `server_query_ip_list` | Get editor server IPs |
| `server_query_port` | Get editor server port |
| `server_get_status` | Get full server status |
| `server_check_connectivity` | Check if editor server is reachable |
| `server_get_network_interfaces` | Get network interface details |
</details>

<details>
<summary><strong>Builder (5)</strong> — Build and preview</summary>

| Tool | Description |
|------|-------------|
| `builder_open_panel` | Open Build panel |
| `builder_get_settings` | Get build configuration |
| `builder_query_tasks` | Query active build tasks |
| `builder_run_preview` | Start preview server |
| `builder_stop_preview` | Stop preview server |
</details>

<details>
<summary><strong>Reference Image (11)</strong> — Scene overlay images</summary>

| Tool | Description |
|------|-------------|
| `refimage_add` | Add a reference image |
| `refimage_remove` | Remove a reference image |
| `refimage_list` | List all reference images |
| `refimage_clear_all` | Remove all reference images |
| `refimage_switch` | Switch active reference image |
| `refimage_set_position` | Set image position |
| `refimage_set_scale` | Set image scale |
| `refimage_set_opacity` | Set image opacity |
| `refimage_query_config` | Get reference image config |
| `refimage_query_current` | Get current active image info |
| `refimage_refresh` | Refresh image display |
</details>

## Configuration

Settings are stored in `{project}/settings/cocos-creator-mcp.json`:

```json
{
  "port": 3000,
  "autoStart": true
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `port` | `3000` | HTTP server port |
| `autoStart` | `false` | Start server automatically when extension loads |

## Testing

```bash
node test/regression.mjs         # default port 3000
node test/regression.mjs 3001    # custom port
```

## Version History

- **v0.1** — MCP server + scene/node tools (13 tools)
- **v0.5** — Component, prefab, project, debug tools (27 tools)
- **v1.0** — Full tool coverage (145 tools, 13 categories, 224 test assertions)

## Development

```bash
npm run watch   # Watch mode
npm run build   # One-time build
```

After building, reload the extension in Cocos Creator:
- **Extension Manager** — disable then re-enable
- **Developer > Reload** — reloads main process
- **Full restart** — required for scene script or new category changes

## Requirements

- Cocos Creator 3.8+
- Node.js 18+

## License

MIT
