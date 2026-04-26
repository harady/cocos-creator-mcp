# Tool Topology — 設計ガイドライン

cocos-creator-mcp のツール体系をどう設計するかをまとめたドキュメント。LLM agent (Claude Code 等) からの利用を前提に、実装の方向性と圧縮の限界・補完戦略を定義する。

関連 Issue: [#27](https://github.com/harady/cocos-creator-mcp/issues/27) / [#28](https://github.com/harady/cocos-creator-mcp/issues/28) / [#29](https://github.com/harady/cocos-creator-mcp/issues/29)

## 設計の最適解

```
30〜50 個の category_action ツール
+ 1 つの execute_editor_script 脱出口
+ Resource API (読み出し専用)
```

この構成で、ツール数を抑えつつ「実用上 100% に近い」機能カバーを担保する。

## 背景: なぜツールを少なく保つか

LLM 視点で見ると、ツール数が増えると以下の問題が大きくなる:

1. **コンテキスト消費増加** — 全ツールの description が毎リクエスト LLM context に入る。150 ツールあると description だけで 1〜2 万トークン消費する
2. **選択精度の低下** — 似た名前のツールが並ぶと LLM が「ほぼ正解だけど微妙に違う」ツールを選びがち
3. **Description 重複の悪循環** — ツール数増 → 説明文を短く詰める → 区別がつきにくい → 選択ミス → 修正でさらにツール追加

逆に少なすぎても (20 切る程度):
- 1 ツールが万能になりすぎて、どの場面で何の引数を渡すか LLM が判断できない
- description が抽象的になりすぎる

**スイートスポットは 30〜50 ツール**。現代の主要 MCP (MCP for Unity = 30 tools + 18 resources、DaxianLee/cocos-mcp-server v1.5 = 50 tools) は皆ここに収束しつつある。

## ツール圧縮の三本柱

### 1. Reflection ベース汎用 set_property

機能ごとの個別ツール (`set_sprite_frame`, `set_label_text`, `set_widget`...) を **Reflection で 1 ツールに集約**:

```json
{
  "tool": "set_component_property",
  "arguments": {
    "target": "node-uuid",
    "component_type": "cc.Label",
    "property": "string",
    "value": "Hello"
  }
}
```

未知のプロパティでも触れる。これだけで 50〜100 ツール削減可能。

### 2. CRUD の action-code 統合

機能ごとに独立したツール (`create_node`, `delete_node`, `duplicate_node`, `move_node`, `paste_node`...) を **category_action 構造に集約**:

```json
{
  "tool": "node_lifecycle",
  "arguments": {
    "action": "create",
    "name": "MyNode",
    "parentUuid": "...",
    "nodeType": "2DNode"
  }
}
```

LLM はまず category (10 個ほど) を選び、次に action を選ぶ二段階になる。フラットに 100+ から選ぶより誤選択が減る。

### 3. Resource (読み) と Tool (書き) の分離

読み出し専用の操作 (get_node_info, get_scene_hierarchy 等) を **MCP resource URI に外出し**して Tool 表面から消す:

```
cocos-creator-mcp://scene/node/{uuid}/components
cocos-creator-mcp://scene/hierarchy
```

書き込み (Tool) と読み出し (Resource) が分離されることで、「状態確認 → 変更 → 再確認」のループがクリーンになる。

## ツール圧縮では減らせない領域

### 1. 異なる「ドメイン」の境界

シーン編集と APK ビルドを 1 ツールに混ぜると description が膨らみ LLM が混乱する。最低限以下のドメイン境界は割れる:

| カテゴリ | 例 |
|---|---|
| Scene/Node/Component | 編集 |
| Prefab | ライフサイクル + Stage 編集 |
| Asset | import/export/refresh |
| Build | project_build_system |
| Debug | console/logs/profiler |
| Editor 状態制御 | play/pause/stop |
| Documentation/Reflection | lookup |

最低 7〜8 ドメイン × 平均 3〜4 ツール = **24〜32 ツールが下限**。

### 2. パラメータスキーマが大きく違う操作

`prefab_edit(open_prefab_stage)` と `node_lifecycle(create)` を同一ツールに統合すると、action ごとにパラメータが完全にバラバラで description が膨らみ、結局 token も増えるし LLM の選択精度も下がる。**ドメインが似ていてもスキーマが大きく違えばツールを分ける**のが実用的。

### 3. LLM の選択を誘導したい特殊操作

- `read_console` (エラー取得)
- `find_nodes` (ノード検索)
- 公式ドキュメント lookup
- 型リフレクション

これらは「使ってほしい場面が明確」なので **専用ツール名で LLM に存在を認知させる方が動作精度が上がる**。汎用ツールに混ぜるとそもそも呼ばれなくなる。

### 4. 圧縮しすぎの逆効果

ツール数を 20 切ると description が抽象的になりすぎて LLM が呼び方を理解できなくなる。1 ツールの action 数が 10+ になると description に全 action を列挙する必要があり、結局 token が減らない。

## 残り 1〜10% を `execute_editor_script` 脱出口で逃がす

ツール体系で完全カバーが難しいケース:

1. **新規追加 API・experimental 機能** — エンジン更新直後、まだツール対応していない機能
2. **複合操作 (atomic transaction)** — 「scene 変更 + prefab 編集を一括で、エラーなら rollback」
3. **Editor 拡張固有の UI 操作** — カスタム Inspector 等
4. **パフォーマンス重視の bulk 操作** — 100 ノード一気に生成等
5. **ユーザー固有のワークフロー** — プロジェクト固有の自動化

これらに**毎回ツールを追加すると無限に肥大化**する。代わりに 1 つの脱出口を用意:

```json
{
  "tool": "execute_editor_script",
  "arguments": {
    "code": "const node = await Editor.Message.request('scene', 'query-node', uuid); ...",
    "timeout_ms": 5000
  }
}
```

**MCP for Unity の `execute_code` 相当**。任意 TypeScript/JavaScript を Editor のメインプロセスで実行できる。

### 期待効果

- ツール体系に取り込めない 1〜10% の機能を逃がせる
- 新機能対応のリリースサイクル待ちを回避できる (LLM が `execute_editor_script` でその場で対応)
- ユーザーごとの特殊ワークフローもこれで対応可能

### セキュリティ・安全性

- Editor のメインプロセス権限なので影響範囲が大きい点に注意
- ユーザー設定で disable できるようにする
- log 出力で何が実行されたか追跡可能にする

## 参考にする先行事例

| MCP | Tool 数 | Resource 数 | 設計思想 |
|---|---|---|---|
| **MCP for Unity** ([CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp)) | **30** | **18** | category_action + tool/resource 分離 + execute_code 脱出口 |
| DaxianLee/cocos-mcp-server v1.5 | **50** | - | category_action で集約 (token 50% 減) |
| harady/cocos-creator-mcp (現状) | 50+ | 数個 | 一部 action 統合済み・整理途上 |

**設計のメインリファレンスは MCP for Unity** (オープンソース、実装読める、resource 分離が成熟)。
**Cocos 固有のドメイン (Prefab フォーマット詳細・cid 等) は DaxianLee v1.5 README** を参考に。

## カテゴリ案 (たたき台)

- `scene_*`: scene_management, scene_hierarchy, scene_execution_control
- `node_*`: node_query, node_lifecycle, node_transform, node_hierarchy, node_property
- `component_*`: component_manage, component_script, component_query, set_component_property
- `prefab_*`: prefab_browse, prefab_lifecycle, prefab_instance, prefab_edit
- `asset_*`: asset_manage, asset_analyze, asset_query, asset_operations
- `project_*`: project_manage, project_build_system
- `debug_*`: debug_console, debug_logs, debug_system
- `preferences_*`: preferences_manage
- `server_*` / `broadcast_*`
- `execute_editor_script` (脱出口・1 ツール)

合計で 30〜50 ツール程度に収める想定。

## 移行戦略

- 既存ツールはエイリアスとして残し、内部で新ツールに dispatch
- 段階的に新ツール体系へ案内するドキュメントを整備
- 数バージョン後に旧ツールを deprecated に
