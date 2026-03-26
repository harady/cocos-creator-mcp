# Cocos Creator MCP

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server extension for Cocos Creator 3.8+.

AI assistants like Claude can control Cocos Creator editor through this extension — creating nodes, editing scenes, managing assets, and more.

## Features

- **Streamable HTTP (SSE)** — Native support for MCP's Streamable HTTP transport
- **JSON-RPC 2.0** — Standard MCP protocol compliance
- **Scene Tools** — Get hierarchy, open/save scenes, list scene files
- **Node Tools** — Create, delete, move, duplicate, find, and edit nodes
- **i18n** — English, Japanese, Chinese

## Quick Start

### 1. Install

Copy or symlink this extension into your Cocos Creator project:

```bash
# Symlink (recommended for development)
# Windows (run as Administrator)
mklink /D "your-project\extensions\cocos-creator-mcp" "path\to\cocos-creator-mcp"

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
5. Click **Start Server**

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

## Available Tools

### Scene (4 tools)

| Tool | Description |
|------|-------------|
| `scene_get_hierarchy` | Get the node tree of the current scene |
| `scene_open` | Open a scene by UUID or db:// path |
| `scene_save` | Save the current scene |
| `scene_get_list` | List all .scene files in the project |

### Node (9 tools)

| Tool | Description |
|------|-------------|
| `node_create` | Create a new node (with optional components) |
| `node_get_info` | Get detailed node info including components |
| `node_find_by_name` | Find nodes by name |
| `node_set_property` | Set node properties (name, active, position, etc.) |
| `node_set_transform` | Set position, rotation, scale at once |
| `node_delete` | Delete a node |
| `node_move` | Move a node to a new parent |
| `node_duplicate` | Duplicate a node |
| `node_get_all` | List all nodes in the scene |

## Configuration

Settings are stored in `{project}/settings/cocos-creator-mcp.json`:

```json
{
  "port": 3001,
  "autoStart": false
}
```

## Roadmap

- [x] **v0.1** — MCP server + scene/node tools (current)
- [ ] **v0.5** — Component, prefab, project, debug tools
- [ ] **v1.0** — Full tool coverage, npm publish

## Development

```bash
npm run watch   # Watch mode for development
npm run build   # One-time build
```

## Requirements

- Cocos Creator 3.8+
- Node.js 18+

## License

MIT
