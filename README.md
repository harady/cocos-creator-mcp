# Cocos Creator MCP

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server extension for Cocos Creator 3.8+.

AI assistants like Claude can control Cocos Creator editor through this extension — creating nodes, editing scenes, managing prefabs, building projects, and more.

## Features (v2.0.0)

- **~73 Tools** organized as `category_action` patterns — token-efficient for LLM clients
- **12 MCP Resources** (`cocos://`) — read-only data exposed via URI, separate from tools
- **`execute_editor_script`** — escape hatch for arbitrary editor-side JavaScript (async/await supported)
- **`read_console`** — unified Editor/Scene/Game console reader (captures compile errors, runtime errors, console.log)
- **Transparent value references** — `db://` asset paths, `{path}`/`{guid}` objects, enum names, `cc.Vec3/Color/Size` plain objects all auto-resolved
- **Streamable HTTP (SSE)** — Native MCP transport
- **JSON-RPC 2.0** — Standard MCP protocol
- **Prefab Property Persistence** — Component properties preserved across saves
- **Preview in Editor** / **Screenshot** / **Video Recording** / **Game Command Control**
- **Client Scripts** — Drop-in TypeScript files for game preview integration (`client/`)
- **Auto Start** / **Tool Call Logging** / **i18n** (en/ja/zh)
- **357+ Regression Test Assertions** — all real-invocation + side-effect verification

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

Pick one of the two transports below.

#### Option A — stdio bridge (recommended for Claude Code VSCode extension)

The Claude Code VSCode extension currently has a bug where it unconditionally
tries OAuth Dynamic Client Registration for HTTP-type MCP servers and fails
with `SDK auth failed` (see upstream issues
[#26917](https://github.com/anthropics/claude-code/issues/26917),
[#38102](https://github.com/anthropics/claude-code/issues/38102),
[#29697](https://github.com/anthropics/claude-code/issues/29697)).
To avoid it entirely, use the bundled stdio bridge. It speaks JSON-RPC on
stdin/stdout and forwards to the HTTP server internally.

```json
{
  "mcpServers": {
    "cocos-creator-mcp": {
      "command": "node",
      "args": [
        "<ABSOLUTE_PATH_TO>/cocos-creator-mcp/client/stdio-bridge.js"
      ]
    }
  }
}
```

Optional env var: `COCOS_MCP_URL` (default `http://127.0.0.1:3000/mcp`).

#### Option B — direct HTTP

Works with Claude Code CLI, Cursor, Cline, and other clients that don't force
OAuth on HTTP MCP. The server ships minimal dummy OAuth endpoints
(`/.well-known/oauth-*`, `/oauth/register|authorize|token`) so OAuth-requiring
clients can still complete a pro-forma flow on localhost.

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

> The dummy OAuth endpoints will be removed once upstream issues
> ([#26917](https://github.com/anthropics/claude-code/issues/26917),
> [#38102](https://github.com/anthropics/claude-code/issues/38102))
> are resolved or real authentication is introduced.

### 5. Verify

```bash
curl http://127.0.0.1:3000/health
# {"status":"ok","tools":64}
```

## Available Tools (~64)

The post-v2.0.0 layout. Each category is consolidated into a single tool that switches behavior via the `category_action` pattern (a 61% reduction from v1's 166 tools).

<details>
<summary><strong>Scene (12)</strong></summary>

- `scene_manage(open/save/close/list/current/hierarchy)`
- `scene_clipboard(copy/paste/cut)`
- `scene_undo(snapshot/snapshot_abort/begin/end/cancel)`
- `scene_array(move/remove)`
- `scene_reset(transform/property/component/restore_prefab)`
- `scene_query(dirty/ready/classes/components/component_has_script/nodes_by_asset/scene_bounds)`
- `scene_create`, `scene_save_as`, `scene_set_parent`, `scene_soft_reload`
- `scene_execute_script`, `scene_execute_component_method`
</details>

<details>
<summary><strong>View (3)</strong> — Scene view (gizmo / settings / camera)</summary>

- `view_gizmo(set_tool|get_tool|set_pivot|get_pivot|set_coordinate|get_coordinate)`
- `view_settings(set_mode|get_mode|set_grid|get_grid|set_icon3d|get_icon3d|set_icon_size|get_icon_size|status|reset)`
- `view_camera(focus_on_nodes|align_with_view|align_view_with_node)`

Note: Editor APIs not supported on 3.8.x degrade to a graceful no-op (returning a `note`).
</details>

<details>
<summary><strong>Node (10)</strong></summary>

- `node_manage(create/delete/duplicate/move)`
- `node_create_tree` — build a node hierarchy in a single call
- `node_set_property`, `node_set_transform`, `node_set_active`, `node_set_layout`
- `node_get_info`, `node_find_by_name`, `node_get_all`, `node_detect_type`
</details>

<details>
<summary><strong>Component (3)</strong></summary>

- `component_manage(add/remove/available/enum)`
- `component_set_property` — Reflection-based. Supports asset path / `{path}` / `{guid}` / enum name / `cc.Vec3`/`Color`/`Size` plain object forms (see Value Reference Forms section)
- `component_auto_bind` — auto-match `@property` fields to descendant nodes by name
</details>

<details>
<summary><strong>Prefab (7)</strong></summary>

- `prefab_edit(open/close)`
- `prefab_create(mode: simple/replace/from_spec)` — extract / extract-and-replace / build-from-spec all unified
- `prefab_instantiate`, `prefab_update`, `prefab_revert`, `prefab_duplicate`, `prefab_validate`
</details>

<details>
<summary><strong>Asset (2)</strong></summary>

- `asset_manage(create/delete/move/copy/save/reimport/import/save_meta/open_external)`
- `asset_query(path/uuid/url/details/dependencies/users/missing/ready/generate_url)`
</details>

<details>
<summary><strong>Project (6)</strong></summary>

- `project_refresh_assets`, `project_get_asset_info`, `project_find_asset`
- `project_get_settings`, `project_set_settings`, `project_query_scripts`

For project name / path / engine info, use the `cocos://project/*` resources.
</details>

<details>
<summary><strong>Debug (15)</strong></summary>

**Console / scripts:** `read_console`, `execute_editor_script`, `debug_execute_script`, `debug_list_messages`.
**Logs / extension / record:** `debug_logs(get/search/info)`, `debug_extension(list/info/reload)`, `debug_record(start/stop)`.
**Editor / preview:** `debug_validate_scene`, `debug_clear_code_cache`, `debug_wait_compile`, `debug_query_devices`, `debug_open_url`, `debug_preview`, `debug_screenshot(target: window/pages)`, `debug_game_command`.
</details>

<details>
<summary><strong>Preferences / Builder / Server (3)</strong></summary>

- `preferences_manage(get/set/get_all/reset)`
- `builder_manage(open_panel/get_settings/query_tasks/run_preview/stop_preview)`
- `server_status(get/ips/port/build_hash/connectivity/interfaces/code_sync)`
</details>

<details>
<summary><strong>Reference Image (3)</strong></summary>

- `refimage_manage(add/remove/clear_all/switch/refresh)`
- `refimage_set(position/scale/opacity)`
- `refimage_query(list/current)`
</details>

## Available Resources (12)

MCP resources are read-only data sources exposed via URI, separate from tools. Listed via `resources/list` and `resources/templates/list`, fetched via `resources/read`.

| URI | Returns |
|---|---|
| `cocos://scene/current` | Current scene name + uuid |
| `cocos://scene/list` | All .scene files |
| `cocos://scene/hierarchy` | Current scene's node tree |
| `cocos://node/{uuid}` | Full property dump of a node |
| `cocos://node/{uuid}/components` | Component summary list |
| `cocos://component/{uuid}` | Full property dump of a component |
| `cocos://prefab/list` | All prefabs |
| `cocos://prefab/{uuid}` | Prefab asset info |
| `cocos://project/info` | Project name + path |
| `cocos://project/engine` | Engine version + path |
| `cocos://editor/info` | Cocos Creator editor info |
| `cocos://asset/{uuid}` | Asset details |

## Client Scripts

The `client/` directory contains TypeScript files for runtime communication between the game preview and the MCP server. Since the extension is installed in `extensions/`, these files can be imported directly — no copying needed.

### McpConsoleCapture

Captures `console.log/warn/error` from the game preview and sends them to the MCP server.

```typescript
// Import from extensions/ (adjust relative path as needed)
import { initMcpConsoleCapture } from "../../extensions/cocos-creator-mcp/client/McpConsoleCapture";
initMcpConsoleCapture();
```

### McpDebugClient

Enables AI-driven game control: screenshots, node clicking, and custom commands.

```typescript
import { initMcpDebugClient } from "../../extensions/cocos-creator-mcp/client/McpDebugClient";

initMcpDebugClient({
    customCommands: {
        // Add project-specific commands
        state: () => ({ success: true, data: { dump: MyDb.dump() } }),
        navigate: async (args) => {
            await MyRouter.goTo(args.page);
            return { success: true };
        },
    },
});
```

**Built-in commands** (no setup needed):
- `screenshot` — Capture game screen via RenderTexture
- `click` — Click a node by name

**Custom commands** (project-specific):
- Register any handler via `customCommands` option
- Called via `debug_game_command` MCP tool

Both scripts silently ignore when the MCP server is not running, so they are safe to leave in development builds.

## Console Log Capture (Details)

`read_console` captures logs from three sources (`editor` / `scene` / `game`):

### Scene Process Logs (automatic)

Console output from scene scripts (`console.log/warn/error` in the scene renderer process) is automatically captured. No setup required.

### Game Preview Logs (opt-in)

Game code runs in a browser during preview, which is a separate process. To capture game preview logs, your game code needs to send logs to the MCP server's `/log` endpoint.

**Setup:**

Add a console capture script to your game project:

```typescript
const MCP_LOG_URL = "http://127.0.0.1:3000/log";
const FLUSH_INTERVAL = 500;

let buffer: Array<{ timestamp: string; level: string; message: string }> = [];

function hook(level: string, original: (...args: any[]) => void) {
    return function (...args: any[]) {
        original.apply(console, args);
        buffer.push({
            timestamp: new Date().toISOString(),
            level,
            message: args.map(a => typeof a === "string" ? a : JSON.stringify(a)).join(" "),
        });
    };
}

console.log = hook("log", console.log);
console.warn = hook("warn", console.warn);
console.error = hook("error", console.error);

setInterval(() => {
    if (buffer.length === 0) return;
    const entries = buffer.splice(0, 50);
    fetch(MCP_LOG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
    }).catch(() => {}); // silently ignore if MCP server is not running
}, FLUSH_INTERVAL);
```

**`POST /log` format:**

```json
[
  { "timestamp": "2026-03-26T12:00:00.000Z", "level": "log", "message": "Hello" },
  { "timestamp": "2026-03-26T12:00:01.000Z", "level": "error", "message": "Something failed" }
]
```

Editor / scene / game entries are merged chronologically when retrieved via `read_console(action="get")`. Each entry includes a `source` field (`"editor"` / `"scene"` / `"game"`). Filter via `types: ["error", "warn"]`, `sources: ["scene"]`, `count`, `since`, `search`, or `includeStacktrace`. Clear with `read_console(action="clear")`.

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

Scene creation and resource URI compatibility checks (no running editor required):

```bash
npm run build
node test/scene-create-compat.cjs
node test/resource-uri-compat.cjs
```

These checks also run with the Node 14.16 runtime embedded in Creator 3.8.3.
For resource templates, percent-encode UUID values (for example,
`cocos://node/${encodeURIComponent(uuid)}/components`): Cocos short UUIDs can contain `/` and `+`.

```bash
node test/regression.mjs         # default port 3000
node test/regression.mjs 3001    # custom port
```

## Version History

- **v0.1** — MCP server + scene/node tools (13 tools)
- **v0.5** — Component, prefab, project, debug tools (27 tools)
- **v1.0** — Full tool coverage (145 tools, 13 categories, 224 test assertions)
- **v1.1** — Console log capture (scene process auto-capture + game preview via `/log` endpoint)
- **v1.2** — AI autonomous development: Preview in Editor, screenshot capture, game command control, code cache clear, scene save fix. Client scripts for game preview integration (`client/`)
- **v1.3** — `scene:set-property` for prefab save support, prefab_create overwrite guard, param alias (`component` → `componentType`)
- **v1.5** — `prefab_create_and_replace`, batch `set_property`, `prefab_open`
- **v1.6** — `debug_batch_screenshot`, widget support in `create_tree`, `component_query_enum`, `server_check_code_sync`
- **v1.8.0** — Preview Recorder panel: `debug_record_start` / `debug_record_stop` (MediaRecorder via canvas.captureStream, MP4/WebM, quality presets)
- **v1.8.1** — Fix: `component_set_property` cc.Asset references (cc.Font etc.) falling back to cc.Node when type is unspecified
- **v1.8.2** — Preview Recorder: screenshot button (webp/png toggle, max width), section-based UI layout
- **v1.9.0** — Preview Recorder auto-archive of old recordings + preflight "preview not running" check
- **v1.10.0** — `scene_create` asset-db fallback, stringified args preventive validation, test coverage expansion
- **v1.11.0** — HTTP MCP OAuth workaround (stdio bridge + dummy OAuth endpoints for Claude Code VSCode upstream bug) + dialog prevention for scene switching tools (`force` param, `ensureSceneSafeToSwitch`, `safeSaveScene`) + regression tests for both
- **v1.12.0** — Prefab authoring efficiency: `component_auto_bind` (auto-match `@property` fields to node names), `debug_wait_compile` (wait for TS compile to finish), `prefab_create_from_spec` (create node tree + auto-bind + prefab_create in one call)
- **v1.13.0** — `nodeName` parameter on component/get_components/auto_bind (no UUID required), `screenshot` auto-return option on `component_set_property` / `node_set_layout`, `node_set_layout` unified tool (UITransform + Widget + color/opacity in one call), dialog auto-response for untitled+dirty scenes, shared screenshot / node-resolve utilities
- **v1.14.0** — Widget `_alignFlags` auto-recalc bug fix: `setProperty` / `setProperties` / `node_set_layout` now re-query `isAlign*` values from scene and rebuild `_alignFlags` bitmask after isAlign updates (Editor bug where bitmask was not updated automatically, causing prefabs to save with `_alignFlags: 45` stuck state). Also `node_create` component addition now waits for editor reflection (`waitForComponent`) to fix flaky tests
- **v2.0.0** (BREAKING) — Major tool topology refactor: 166 → ~64 tools (-61%).
  - New: `read_console` (Editor + Scene + Game console with type/source filters, compile error detection via project.log fallback), `execute_editor_script` (escape hatch for arbitrary editor JS), 12 MCP Resources (`cocos://scene/*`, `cocos://node/{uuid}`, `cocos://component/{uuid}`, `cocos://prefab/*`, `cocos://project/*`, `cocos://editor/info`, `cocos://asset/{uuid}`).
  - Enhanced `component_set_property`: transparent value references — `db://...` asset paths, `{path}` / `{guid}` objects, enum names, `cc.Vec3/Vec2/Vec4/Color/Size` plain objects all auto-resolved.
  - Aggregated tools into `category_action` patterns: `scene_manage`, `scene_clipboard`, `scene_undo`, `scene_array`, `scene_reset`, `scene_view_*`, `node_manage`, `component_manage`, `prefab_edit`, `asset_manage`, `asset_query`, `view_gizmo/settings/camera`, `refimage_manage/set/query`, `preferences_manage`, `builder_manage`, `server_status`, `debug_logs/extension/record`.
  - Fixed `prefab_create_from_spec` asset-ref serialization bug — properties are now reapplied via Editor API after node tree build, so asset refs serialize as `{__uuid__, __expectedType__}` correctly. The post-processing workaround is no longer needed.
  - Removed: read-only tools that have resource equivalents (`scene_query_node`, `scene_query_node_tree`, `scene_query_component`, `component_get_components`, `component_get_info`, `prefab_list`, `prefab_get_info`, `project_get_info`, `project_get_engine_info`, `debug_get_editor_info`) and v2 deprecated (`debug_get_console_logs`, `debug_clear_console`).
  - See [MIGRATION.md](./MIGRATION.md) for the v1 → v2 mapping table. See [CHANGELOG.md](./CHANGELOG.md) for the full change log.

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
- Node.js 18+ for building the extension and running the HTTP regression client. The installed extension runs inside Creator's embedded Node runtime (including Node 14.16 in Creator 3.8.3).

## Value Reference Forms (v2.0.0)

`component_set_property` accepts multiple convenient forms for asset references, node references, enums, and structured value types. The MCP server resolves each to the correct Editor dump format internally.

### Asset references

```jsonc
// All four forms are equivalent for a SpriteFrame field:
{ "value": "<uuid>" }                                 // raw UUID
{ "value": "db://assets/textures/foo.png" }           // asset path string
{ "value": { "path": "db://assets/textures/foo.png" } }  // {path}
{ "value": { "guid": "<uuid>" } }                     // {guid}
```

### Node / component references

```jsonc
// Resolves to a node by descendant path under the active scene root:
{ "value": "@path:Canvas/Background" }

// Or pass a node UUID directly — the property type is inferred from the schema:
{ "value": "<node-uuid>" }
```

### Enum values

```jsonc
// Name (v2.0.0) — looked up against the property's enumList:
{ "value": "HORIZONTAL" }

// Numeric (still supported):
{ "value": 1 }
```

### Structured value types (v2.0.0)

```jsonc
// cc.Vec3 / cc.Vec2 / cc.Vec4 — pass plain coordinates:
{ "value": { "x": 100, "y": 50, "z": 0 } }

// cc.Color — RGBA in 0-255 range:
{ "value": { "r": 255, "g": 0, "b": 0, "a": 255 } }

// cc.Size — width/height (or x/y) are both accepted:
{ "value": { "width": 200, "height": 100 } }
```

These also work inside `prefab_create_from_spec`'s `spec.properties` because the asset-ref serialization bug was fixed in v2.0.0 (properties are now reapplied via the Editor API after the node tree is built).

## Known Limitations

- **`scene_create`**: On Creator 3.8.x, where `scene:new-scene` is unavailable, the tool creates a minimal 2D scene through the asset database. Both explicit paths and the automatically generated path are supported. The tool verifies that the created scene opened successfully; a failed open returns an error while leaving the created asset available for inspection. See [#13](https://github.com/harady/cocos-creator-mcp/issues/13) for background.

- ~~**`prefab_create_from_spec` — asset refs are saved as raw UUID strings**~~ **(fixed in v2.0.0)** — Properties in `spec.properties` are now reapplied via the Editor API (`component_set_property`) after `buildNodeTree` completes, so asset refs serialize as `{__uuid__, __expectedType__}` correctly. The old workaround of post-processing `.prefab` files is no longer needed.

## License

MIT
