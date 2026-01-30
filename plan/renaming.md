# パッケージ名変更計画 (v1.0.0に向けた整備)

npmでの公開に向け、パッケージ名を `hmb` から `html-module-builder` に変更します。
これは、パッケージの識別性を高め、npm上での衝突を避ける（または適切な名前空間を確保する）ためです。

## 概要

- **現在のパッケージ名**: `hmb`
- **新しいパッケージ名**: `html-module-builder`
- **CLIコマンド名**: `hmb` (変更なし - 短く使いやすい名前を維持)

## 変更内容

### 1. package.json
- `name` フィールドを `html-module-builder` に変更
- `bin` 設定は維持 (`"hmb": "./bin/hmb.js"`)

### 2. ドキュメント (README.md)
- インストール手順のコマンドを更新
    - `npm install html-module-builder`
    - `npx html-module-builder init ...` (または `npx hmb init` - npxはパッケージ名でも解決可能だが、bin名が確実)

### 3. CLI (bin/hmb.js)
- `program.name('hmb')` は維持（コマンド名としては `hmb` なので）
- `description` 内の表記を確認

## 影響範囲

- 既存の `hmb.config.js` 読み込みなどには影響なし（機能的な変更ではないため）
- ユーザーはインストール時にパッケージ名を長く指定する必要があるが、実行時は今まで通り `hmb` コマンドを使用可能。

## 手順
1. `package.json` の変更
2. `bin/hmb.js` のメタデータ確認・修正
3. `README.md` の更新
4. 動作確認 (`hmb --help` 等)
