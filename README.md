# Cocos Creator MCP

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server extension for Cocos Creator 3.8+.

AI assistants like Claude can control Cocos Creator editor through this extension — creating nodes, editing scenes, managing prefabs, and more.

## Features

- **27 Tools** — Scene, node, component, prefab, project, and debug operations
- **Streamable HTTP (SSE)** — Native support for MCP's Streamable HTTP transport
- **JSON-RPC 2.0** — Standard MCP protocol compliance
- **Prefab Property Persistence** — Component properties (Label.string, fontSize, etc.) are correctly preserved when saving prefabs
- **Auto Start** — Server starts automatically when the extension loads
- **i18n** — English, Japanese, Chinese
- **Regression Tests** — 78 assertions covering all 27 tools

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
# Health check
curl http://127.0.0.1:3001/health

# List all tools
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Available Tools

### Scene (4 tools)

| Tool | Description |
|------|-------------|
| `scene_get_hierarchy` | Get the node tree of the current scene (with optional component info) |
| `scene_open` | Open a scene by UUID or db:// path |
| `scene_save` | Save the current scene |
| `scene_get_list` | List all .scene files in the project |

### Node (9 tools)

| Tool | Description |
|------|-------------|
| `node_create` | Create a new node (with optional components like `cc.Label`, `cc.Sprite`) |
| `node_get_info` | Get detailed node info including position, scale, and components |
| `node_find_by_name` | Find all nodes matching a name |
| `node_set_property` | Set node properties (name, active, position, rotation, scale) |
| `node_set_transform` | Set position, rotation, and scale at once |
| `node_delete` | Delete a node by UUID |
| `node_move` | Move a node to a new parent |
| `node_duplicate` | Duplicate a node |
| `node_get_all` | Get a flat list of all nodes in the scene |

### Component (4 tools)

| Tool | Description |
|------|-------------|
| `component_add` | Add a component to a node (e.g. `cc.Label`, `cc.Sprite`, `cc.Button`) |
| `component_remove` | Remove a component from a node |
| `component_get_components` | Get all components on a node with their properties |
| `component_set_property` | Set a component property (e.g. Label.string, Label.fontSize, Sprite.color) |

### Prefab (4 tools)

| Tool | Description |
|------|-------------|
| `prefab_list` | List all prefab files in the project |
| `prefab_create` | Create a prefab from an existing node (properties are preserved) |
| `prefab_instantiate` | Instantiate a prefab into the scene |
| `prefab_get_info` | Get information about a prefab asset |

### Project (4 tools)

| Tool | Description |
|------|-------------|
| `project_get_info` | Get project information (name, path) |
| `project_refresh_assets` | Refresh the asset database to detect file changes |
| `project_get_asset_info` | Get information about an asset by UUID |
| `project_find_asset` | Find assets by glob pattern (e.g. `db://assets/**/*.ts`) |

### Debug (2 tools)

| Tool | Description |
|------|-------------|
| `debug_get_editor_info` | Get Cocos Creator editor version and environment info |
| `debug_list_messages` | List available Editor messages for a target module |

## Configuration

Settings are stored in `{project}/settings/cocos-creator-mcp.json`:

```json
{
  "port": 3001,
  "autoStart": true
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `port` | `3001` | HTTP server port |
| `autoStart` | `false` | Start server automatically when extension loads |

## Testing

Run the regression test suite (requires MCP server to be running in Cocos Creator):

```bash
node test/regression.mjs        # default port 3001
node test/regression.mjs 3000   # custom port
```

## Roadmap

- [x] **v0.1** — MCP server + scene/node tools (13 tools)
- [x] **v0.5** — Component, prefab, project, debug tools (27 tools, 78 test assertions)
- [ ] **v1.0** — Full tool coverage, npm publish

## Development

```bash
npm run watch   # Watch mode
npm run build   # One-time build
```

After building, reload the extension in Cocos Creator:
- **Extension Manager** — disable then re-enable (for tool registration changes)
- **Developer > Reload** — reloads main process
- **Full restart** — required for scene script changes

## Requirements

- Cocos Creator 3.8+
- Node.js 18+

## License

MIT
