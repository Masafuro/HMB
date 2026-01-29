# HMB (Html Module Builder) 企画書 v1.1

## 🎯 プロジェクト概要

**HMB (Html Module Builder)** は、HTML部品の再利用と静的サイト生成に特化した、最小限のビルドツールです。複雑な設定や学習コストを極限まで削減し、HTML/CSSの知識だけで使いこなせることを目指します。

## 🧠 設計哲学

1. **シンプルさを最優先**: 新しい構文を最小限に抑える
2. **透過性**: 入力から出力までの変換が完全に把握できる
3. **段階的拡張**: 必要最小限から始め、必要に応じて機能追加
4. **HTML/CSS制作者の視点**: フロントエンド開発者が追加学習なしで使える

## 📁 必須ディレクトリ構造

```
プロジェクトルート/
├── pages/          # ページ群（全ファイルがdist/に出力される）
│   ├── index.html  # ページファイル
│   ├── about.html
│   ├── css/        # ページ固有のCSS
│   └── images/     # ページ固有の画像
├── modules/        # ビルド素材（出力されない）
│   ├── var/        # グローバル変数定義（YAMLファイル群）
│   │   ├── site.yaml      # {{@site.*}} に対応
│   │   ├── build.yaml     # {{@build.*}} に対応
│   │   ├── meta.yaml      # {{@meta.*}} に対応
│   │   └── social.yaml    # {{@social.*}} に対応
│   ├── header.html # 共通ヘッダー
│   ├── footer.html # 共通フッター
│   └── components/ # その他コンポーネント
└── dist/           # ビルド出力（自動生成）
    ├── index.html
    ├── about.html
    ├── css/
    └── images/
```

## 🔧 ビルドで実現すること

### 1. **ファイルのコピーと構造維持**
- `pages/` ディレクトリ以下の全ファイル・全ディレクトリを、同じ構造で `dist/` にコピーする
- `.html` ファイルは特別な処理を適用し、その他のファイル（`.css`, `.js`, 画像など）はそのままコピー

### 2. **モジュールのインクルード**
```html
<!-- ページファイル内 -->
<module src="header" />
<module src="components/card" />

<!-- モジュール引数の指定 -->
<module src="card" 
        title="カードタイトル"
        description="説明文です"
        class="featured" />
```

### 3. **グローバル変数の置換**
```html
<!-- YAMLファイルの内容を参照 -->
<title>{{@site.name}} - {{@site.title}}</title>
<footer>&copy; {{@build.year}} {{@site.name}}</footer>

<!-- ネストされた変数の参照 -->
<meta property="og:url" content="{{@site.url}}">
<meta name="author" content="{{@site.author.name}}">
```

### 4. **モジュール引数の置換**
```html
<!-- モジュールファイル内 -->
<div class="card {{class}}">
  <h2>{{title}}</h2>
  <p>{{description}}</p>
</div>
```

## 📝 記法一覧

### 変数参照
| 記法 | 説明 | 例 | 対応YAMLファイル |
|------|------|------|----------------|
| `{{@site.name}}` | site.yamlのnameプロパティ | `{{@site.name}}` | `modules/var/site.yaml` |
| `{{@build.year}}` | build.yamlのyearプロパティ | `{{@build.year}}` | `modules/var/build.yaml` |
| `{{@site.author.name}}` | ネストされたプロパティ | `{{@site.author.name}}` | `modules/var/site.yaml` |
| `{{argument}}` | モジュール引数 | `{{title}}` | - |

### モジュールインクルード
```html
<!-- 基本形 -->
<module src="component-name" />

<!-- 引数付き -->
<module src="card" title="タイトル" class="special" />

<!-- 相対パス -->
<module src="./local-component" />
<module src="../parent-component" />
```

## 🗂️ グローバル変数定義

### 変数ファイルの配置と対応関係
```
modules/var/
├── site.yaml      # {{@site.*}} に対応
├── build.yaml     # {{@build.*}} に対応
├── meta.yaml      # {{@meta.*}} に対応
└── social.yaml    # {{@social.*}} に対応
```

### 変数ファイルの例
```yaml
# modules/var/site.yaml → {{@site.*}} で参照可能
name: "私のサイト"
url: "https://example.com"
author:
  name: "山田 太郎"
  email: "hello@example.com"
description: "シンプルで美しいウェブサイト"
language: "ja"
```

```yaml
# modules/var/build.yaml → {{@build.*}} で参照可能
year: 2024
timestamp: "2024-01-20T12:00:00Z"
version: "1.0.0"
environment: "production"
```

```yaml
# modules/var/meta.yaml → {{@meta.*}} で参照可能
keywords: "web, site, simple"
og_type: "website"
twitter_card: "summary"
```

### 変数参照の仕組み
1. `{{@site.name}}` → `modules/var/site.yaml` の `name` プロパティ
2. `{{@build.year}}` → `modules/var/build.yaml` の `year` プロパティ
3. `{{@site.author.name}}` → `modules/var/site.yaml` の `author.name` プロパティ（ネスト対応）

## ⚙️ ビルドプロセス

### ステップ1: グローバル変数の読み込み
```javascript
// modules/var/ 内の全YAMLファイルを読み込み
// ファイル名が名前空間になる
variables = {
  site: {       // ← site.yamlの内容
    name: "私のサイト",
    url: "https://example.com",
    author: { name: "山田 太郎", email: "..." },
    ...
  },
  build: {      // ← build.yamlの内容
    year: 2024,
    timestamp: "...",
    version: "1.0.0"
  },
  meta: { ... },  // ← meta.yamlの内容
  social: { ... } // ← social.yamlの内容
}
```

### ステップ2: ページの処理
1. `pages/` 内の各HTMLファイルに対して：
   - `{{@名前空間.プロパティ}}` を対応するYAMLの値で置換
   - `<module src="...">` を解決（再帰的に処理）
   - モジュール内の `{{引数名}}` を渡された引数で置換
2. その他のファイル（CSS、JS、画像など）はそのままコピー

### ステップ3: 出力
- 処理済みのファイルを `dist/` に出力
- 元のディレクトリ構造を維持

## 🚀 CLIコマンド

```bash
# 基本ビルド
hmb build

# 開発モード（監視 + サーバー）
hmb dev

# プロジェクト初期化
hmb init [プロジェクト名]

# 変数確認
hmb vars

# ヘルプ
hmb --help
```

## ⚡ 設定ファイル（オプション）

```javascript
// hmb.config.js
module.exports = {
  // デフォルト値のオーバーライド
  sourceDir: 'src/pages',
  outputDir: 'public',
  moduleDir: 'src/modules',
  varDir: 'src/modules/var',  // グローバル変数ディレクトリ
  
  // ビルドオプション
  clean: true,      // ビルド前に出力ディレクトリをクリア
  verbose: false,   // 詳細ログ
  
  // 開発サーバー
  devServer: {
    port: 3000,
    open: true
  }
};
```

## 🎨 使用例

### ページファイル
```html
<!-- pages/index.html -->
<!DOCTYPE html>
<html lang="{{@site.language}}">
<head>
  <meta charset="UTF-8">
  <!-- site.yamlのnameとtitleを参照 -->
  <title>{{@site.name}} - ホーム</title>
  <!-- site.yamlのdescriptionを参照 -->
  <meta name="description" content="{{@site.description}}">
  <!-- meta.yamlのkeywordsを参照 -->
  <meta name="keywords" content="{{@meta.keywords}}">
</head>
<body>
  <!-- モジュールにsite.yamlの値を渡す -->
  <module src="header" site-name="{{@site.name}}" />
  
  <main>
    <h1>{{@site.name}}へようこそ</h1>
    
    <!-- build.yamlの情報を表示 -->
    <div class="info">
      <p>バージョン: {{@build.version}}</p>
      <p>ビルド年: {{@build.year}}</p>
    </div>
  </main>
  
  <!-- 複数のグローバル変数を組み合わせて使用 -->
  <module src="footer" 
          copyright-year="{{@build.year}}" 
          author="{{@site.author.name}}" />
</body>
</html>
```

### モジュールファイル
```html
<!-- modules/header.html -->
<header>
  <!-- ページから渡された引数を使用 -->
  <h1>{{site-name}}</h1>
  <nav>
    <a href="/">ホーム</a>
    <a href="/about.html">About</a>
  </nav>
</header>
```

## 🔍 変数解決の具体例

```yaml
# modules/var/site.yaml
name: "My Website"
author:
  name: "Taro Yamada"
  role: "Developer"
```

```html
<!-- ページ内での参照 -->
{{@site.name}}           → "My Website"
{{@site.author.name}}    → "Taro Yamada"
{{@site.author.role}}    → "Developer"
{{@site.nonexistent}}    → "" (空文字、警告を表示)
```

## 📋 段階的実装計画

### Phase 1: 基本機能 (v0.1.0)
1. ファイルコピー（`pages/` → `dist/`）
2. モジュールインクルード（`<module src="...">`）
3. グローバル変数置換（`{{@名前空間.プロパティ}}`）
4. モジュール引数置換（`{{引数名}}`）
5. 基本的なCLI（`hmb build`）

### Phase 2: 開発体験 (v0.2.0)
1. 開発サーバー（`hmb dev`）
2. ファイル監視と自動リビルド
3. エラーメッセージの改善（未定義変数の警告など）

### Phase 3: 拡張機能 (v0.3.0)
1. 条件付きレンダリング（`<!-- @if {{@build.environment}} == "production" -->`）
2. 動的変数（日付、ファイル情報など）
3. アセット最適化（オプション）

## 🧪 技術スタック

- **ランタイム**: Node.js (v14以上)
- **コア依存**: 最小限（fs, path など標準モジュール中心）
- **追加依存**: `js-yaml`（YAMLパース用）、`commander`（CLI用）
- **配布**: npmパッケージとして公開

## 🎯 目標ユーザー

1. HTML/CSS中心の静的サイト制作者
2. 複雑なフレームワークを避けたい開発者
3. 教育用途（HTML部品化の基本を学ぶ）
4. 小〜中規模のコーポレートサイト

## 💡 特徴まとめ

- ✅ **学習コストほぼゼロ**: HTML知識だけで使える
- ✅ **透過性**: ビルドプロセスが完全に把握できる
- ✅ **段階的導入**: 既存プロジェクトに一部から導入可能
- ✅ **依存最小限**: Node.js標準モジュール中心
- ✅ **出力品質**: 完全な静的HTML、SEO最適
- ✅ **整理された変数管理**: 名前空間ごとにYAMLファイルで管理

---

この仕様により、グローバル変数は `modules/var/` ディレクトリ内のYAMLファイルに整理され、`{{@ファイル名.プロパティ}}` という直感的な記法で参照できます。まずはPhase 1の実装から始めましょう！
