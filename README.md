# Cocos Creator MCP

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server extension for Cocos Creator 3.8+.

AI assistants like Claude can control Cocos Creator editor through this extension — creating nodes, editing scenes, managing prefabs, building projects, and more.

## Features

- **84 Tools** across 12 categories — comprehensive editor automation
- **Streamable HTTP (SSE)** — Native support for MCP's Streamable HTTP transport
- **JSON-RPC 2.0** — Standard MCP protocol compliance
- **Prefab Property Persistence** — Component properties are correctly preserved when saving prefabs
- **Auto Start** — Server starts automatically when the extension loads
- **i18n** — English, Japanese, Chinese
- **Regression Tests** — 142 assertions covering all tools

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
      "url": "http://127.0.0.1:3001/mcp"
    }
  }
}
```

### 5. Verify

```bash
curl http://127.0.0.1:3001/health
# {"status":"ok","tools":84}
```

## Available Tools (84)

### Scene (4)
| Tool | Description |
|------|-------------|
| `scene_get_hierarchy` | Get the node tree (with optional component info) |
| `scene_open` | Open a scene by UUID or db:// path |
| `scene_save` | Save the current scene |
| `scene_get_list` | List all .scene files |

### Scene Advanced (12)
| Tool | Description |
|------|-------------|
| `scene_execute_script` | Execute a custom scene script method |
| `scene_snapshot` | Take a snapshot for undo |
| `scene_query_dirty` | Check if scene has unsaved changes |
| `scene_query_classes` | List all available component classes |
| `scene_query_components` | Query components for a node |
| `scene_query_node_tree` | Get raw node tree from editor |
| `scene_query_nodes_by_asset` | Find nodes referencing an asset |
| `scene_soft_reload` | Soft reload scene |
| `scene_reset_node_transform` | Reset transform to default |
| `scene_copy_node` | Copy node to clipboard |
| `scene_paste_node` | Paste node from clipboard |
| `scene_create` | Create a new empty scene |

### Scene View (12)
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
| `view_focus_on_node` | Focus camera on node(s) |
| `view_get_status` | Get all view settings at once |

### Node (11)
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

### Component (4)
| Tool | Description |
|------|-------------|
| `component_add` | Add component (e.g. `cc.Label`, `cc.Sprite`) |
| `component_remove` | Remove component |
| `component_get_components` | List components on node |
| `component_set_property` | Set component property (Label.string, fontSize, etc.) |

### Prefab (6)
| Tool | Description |
|------|-------------|
| `prefab_list` | List all prefabs |
| `prefab_create` | Create prefab from node (properties preserved) |
| `prefab_instantiate` | Instantiate prefab into scene |
| `prefab_get_info` | Get prefab asset info |
| `prefab_update` | Apply prefab changes |
| `prefab_revert` | Revert prefab instance to original |

### Asset (12)
| Tool | Description |
|------|-------------|
| `asset_create` | Create new asset |
| `asset_delete` | Delete asset |
| `asset_move` | Move/rename asset |
| `asset_copy` | Copy asset |
| `asset_save` | Save asset |
| `asset_reimport` | Re-import asset |
| `asset_query_path` | Get file path for UUID |
| `asset_query_uuid` | Get UUID for path |
| `asset_query_url` | Get URL for UUID |
| `asset_get_details` | Get asset metadata |
| `asset_get_dependencies` | Get asset dependencies |
| `asset_open_external` | Open in external editor |

### Project (4)
| Tool | Description |
|------|-------------|
| `project_get_info` | Get project name and path |
| `project_refresh_assets` | Refresh asset database |
| `project_get_asset_info` | Get asset info by UUID |
| `project_find_asset` | Find assets by glob pattern |

### Preferences (4)
| Tool | Description |
|------|-------------|
| `preferences_get` | Get preference value |
| `preferences_set` | Set preference value |
| `preferences_get_all` | Get all preferences for a protocol |
| `preferences_reset` | Reset preference to default |

### Debug (7)
| Tool | Description |
|------|-------------|
| `debug_get_editor_info` | Get editor version and environment |
| `debug_list_messages` | List available Editor messages |
| `debug_execute_script` | Execute scene script method |
| `debug_get_console_logs` | Get console log entries |
| `debug_clear_console` | Clear editor console |
| `debug_list_extensions` | List installed extensions |
| `debug_get_extension_info` | Get extension details |

### Server (3)
| Tool | Description |
|------|-------------|
| `server_query_ip_list` | Get editor server IPs |
| `server_query_port` | Get editor server port |
| `server_get_status` | Get full server status |

### Builder (5)
| Tool | Description |
|------|-------------|
| `builder_open_panel` | Open Build panel |
| `builder_get_settings` | Get build configuration |
| `builder_query_tasks` | Query active build tasks |
| `builder_run_preview` | Start preview server |
| `builder_stop_preview` | Stop preview server |

## Configuration

Settings are stored in `{project}/settings/cocos-creator-mcp.json`:

```json
{
  "port": 3001,
  "autoStart": true
}
```

## Testing

```bash
node test/regression.mjs        # default port 3001
node test/regression.mjs 3000   # custom port
```

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
