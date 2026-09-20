# Changelog

All notable changes to **cocos-creator-mcp**.

## [2.0.2] - 2026-09-21 — Cocos Creator 3.8.3 compatibility

Thanks to [@mouzhi](https://github.com/mouzhi) for [#33](https://github.com/harady/cocos-creator-mcp/pull/33).

### Fixed

- **`scene_create` now works on Creator 3.8.x.** Three separate defects were fixed:
  - `crypto.randomUUID?.()` threw on Creator 3.8.3, whose embedded Node 14.16 has no global `crypto` at all. UUIDs are now generated with `crypto.randomBytes` (RFC 4122 v4).
  - The generated scene JSON referenced `SceneGlobals` and its `ambient` / `shadows` / `_skybox` / `fog` children two indices too high, so every generated scene was malformed and failed to load.
  - A failed `open-scene` was swallowed and the tool reported success anyway. The active scene UUID is now verified after opening, and a failed open returns an error while leaving the created asset in place for inspection.
- **Resource URIs accept percent-encoded UUIDs.** Cocos short UUIDs can contain `/` and `+`; template parameters are now decoded exactly once, so `cocos://node/${encodeURIComponent(uuid)}/components` resolves. Invalid percent encoding yields no match instead of an exception.

### Added

- `npm run test:compat` — standalone regression checks (`test/scene-create-compat.cjs`, `test/resource-uri-compat.cjs`) that run without a live editor, and under the Node 14.16 runtime embedded in Creator 3.8.3.

### Notes

- Clients must percent-encode UUID values in resource template URIs. Plain UUIDs without `/` or `+` are unaffected.
- `Requirements` clarified: Node.js 18+ is needed to build the extension and run the HTTP regression client; the installed extension itself runs inside Creator's embedded Node runtime.

## [2.0.1] - 2026-07-25 — Patch

### Fixed

- **`prefab_edit` with `action: "close"` silently skipped the save.** Edits are now persisted on close ([#32](https://github.com/harady/cocos-creator-mcp/pull/32), thanks to [@Brandonyy](https://github.com/Brandonyy)).

## [2.0.0] - 2026-05-28 — MAJOR (breaking)

### Summary

166 → ~64 tools (-61%). Tool topology consolidated into `category_action` patterns. Read-only operations split out into MCP **Resources** (`cocos://`). New escape hatch `execute_editor_script`. Unified `read_console`. Transparent value references in `component_set_property`. Major asset-ref serialization bug fixed in `prefab_create` (mode=from_spec). Full test rewrite (real-invocation + side-effect verification, ~358 assertions).

### Added

- **`read_console`** — single tool for Editor / Scene / Game console with type/source filters and compile-error detection via `project.log` fallback. Replaces `debug_get_console_logs` + `debug_clear_console`.
- **`execute_editor_script`** — escape hatch for arbitrary editor-side JavaScript (async/await, timeout, cc.Node / cc.Component summary serialization, circular-ref handling).
- **12 MCP Resources** (`cocos://`) — read-only data via URI, separate from tools:
  - `cocos://scene/current`, `cocos://scene/list`, `cocos://scene/hierarchy`
  - `cocos://node/{uuid}`, `cocos://node/{uuid}/components`
  - `cocos://component/{uuid}`
  - `cocos://prefab/list`, `cocos://prefab/{uuid}`
  - `cocos://project/info`, `cocos://project/engine`
  - `cocos://editor/info`
  - `cocos://asset/{uuid}`
- **Aggregated category_action tools** (`scene_manage`, `scene_clipboard`, `scene_undo`, `scene_array`, `scene_reset`, `scene_query`, `node_manage`, `component_manage`, `prefab_edit`, `prefab_create` (mode), `asset_manage`, `asset_query`, `view_gizmo`, `view_settings`, `view_camera`, `refimage_manage`, `refimage_set`, `refimage_query`, `preferences_manage`, `builder_manage`, `server_status`, `debug_logs`, `debug_extension`, `debug_record`, `debug_screenshot` (target)).
- **`component_set_property` value reference forms** — `"db://..."` asset paths, `{path}` / `{guid}` objects, enum names (`"HORIZONTAL"`), `cc.Vec3 / Vec2 / Vec4 / Color / Size` plain objects all auto-resolved.
- **`@path:Canvas/Bg`** node-path resolution in `component_set_property` (existed in v1, now documented).
- **357 real-invocation regression test assertions** (was 200+ tools/list-registration-only).

### Changed (breaking)

- Tool names — many renamed under `category_action` pattern. See [MIGRATION.md](./MIGRATION.md) for the full mapping.
- `node_move` parameter rename: `parentUuid` → `parent` (now `node_manage(action: "move", uuid, parent)`).
- `scene_open` parameter rename: `uuid` → `scene` (now `scene_manage(action: "open", scene)`).
- `view_focus_on_node` parameter rename: `uuid` (single) → `uuids` (array) (now `view_camera(action: "focus_on_nodes", uuids)`).
- `debug_search_project_logs.keyword` → `debug_logs(action: "search", pattern)`.

### Removed (breaking)

Replaced by **MCP Resources**:
- `scene_query_node`, `scene_query_node_tree`, `scene_query_component`
- `component_get_components`, `component_get_info`
- `prefab_list`, `prefab_get_info`
- `project_get_info`, `project_get_engine_info`
- `debug_get_editor_info`

Consolidated / deprecated:
- `node_set_layer` — use `node_set_property(property: "layer", value)` instead.
- `debug_get_console_logs`, `debug_clear_console` — use `read_console(action: "get"|"clear")`.

### Fixed

- **`prefab_create_from_spec` asset-ref serialization bug** — properties in `spec.properties` are now reapplied via Editor API after node tree build, so asset refs serialize as `{__uuid__, __expectedType__}` correctly. The README post-processing workaround is no longer needed.
- **Widget `_alignFlags` mask** — already fixed in v1.14.0, regression tested in v2.0.0.
- **`view_settings(get_grid/get_mode)` / `view_camera(*)` on 3.8.x** — Editor APIs that don't exist in CC 3.8.x now graceful no-op with `note` field instead of throwing.

### Migration

See [MIGRATION.md](./MIGRATION.md) for the complete v1 → v2 mapping table.

## [1.14.0] - 2026-04-14

Widget `_alignFlags` auto-recalc bug fix; `node_create` component addition now waits for editor reflection.

## [1.13.0] - 2026-04-14

`nodeName` parameter on component / get_components / auto_bind (no UUID required); `screenshot` auto-return option; `node_set_layout` unified tool; dialog auto-response for untitled+dirty scenes.

## [1.12.0] - 2026-04-12

`component_auto_bind` (auto-match `@property` fields to node names); `debug_wait_compile`; `prefab_create_from_spec` (node tree + auto-bind + prefab_create in one call).

## [1.11.0] and earlier

See [README.md Version History](./README.md#version-history) for the full v1.x changelog.
