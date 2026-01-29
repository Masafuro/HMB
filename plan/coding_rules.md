# HMB コーディング規約 (案)

プロジェクトの「シンプルさ」「最小限の依存」という哲学に基づき、以下のルールを提案します。

## 1. 基本方針

- **安定性重視**: ライブラリとしての信頼性を担保するため、実験的な機能や新しすぎる構文の使用を避ける。
- **言語仕様**: Node.js LTS (Active/Maintenance) でネイティブ動作する範囲の JavaScript (ES2018-2020程度)。
    - クラス構文や `const/let` は使用するが、プライベートフィールド (`#`) などの新しい機能は避ける。
- **モジュールシステム**: **CommonJS** (`require`/`module.exports`)
    - *理由*: ユーザー設定ファイル (`hmb.config.js`) が CommonJS 形式であり、設定の読み込みを簡単にするため。また、ビルドステップなしで実行可能にするため。
- **依存ライブラリ**: 必要最小限に留める。
    - 許可: `fs-extra`, `js-yaml`, `commander`, `chokidar`, `glob`
    - 禁止: 重厚なフレームワークや、トランスパイルが必要なライブラリ (TypeScript, Babel等は導入しない)

## 2. 命名規則

- **変数・関数**: `camelCase` (例: `buildSite`, `configPath`)
- **クラス**: `PascalCase` (例: `ModuleBuilder`, `ConfigLoader`)
- **定数**: `SNAKE_CASE` (例: `DEFAULT_CONFIG_PATH`)
- **プライベートプロパティ**: 接頭辞 `_` を付ける (例: `_loadConfig()`)
- **ファイル名**:
    - クラス定義: `PascalCase.js` (例: `Builder.js`)
    - ユーティリティ/その他: `kebab-case.js` (例: `file-utils.js`)

## 3. コードスタイル

- **インデント**: スペース2個
- **セミコロン**: あり (Always)
- **クォート**: シングルクォート (`'`) を優先
- **非同期処理**: `Promise` チェーンより `async/await` を使用する
- **厳格モード**: 各ファイル先頭に `'use strict';` を記述 (ESMでないため推奨)

## 4. エラーハンドリングとログ

- **例外**: 予期せぬエラーは `throw` するが、CLIのエントリーポイントで確実に `catch` し、ユーザーには分かりやすいメッセージを表示する（スタックトレースは `--verbose` オプション時のみなど）。
- **ログ**: `console.log` を直接使わず、専用のロガーユーティリティを通すことを推奨（将来的な色付けやログレベル制御のため）。

## 5. コメント / ドキュメント

- **JSDoc**: 主要なクラスやメソッドには JSDoc 形式のコメントを記述する。
    ```javascript
    /**
     * 指定されたパスのモジュールを読み込みます
     * @param {string} modulePath - モジュールの相対パス
     * @returns {Promise<string>} モジュールのHTMLコンテンツ
     */
    ```
- **TODO**: 実装待ちの箇所には `// TODO: [内容]` を残す。

## 6. ディレクトリ構造と責務

- `src/index.js`: ライブラリとしてのエントリーポイント
- `bin/hmb.js`: CLIとしてのエントリーポイント（引数解析のみ行い、処理は `src/` に委譲）
- `src/core/`: コアロジック (Builder, Parser等)
- `src/utils/`: 汎用関数
