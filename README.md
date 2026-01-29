# HMB (Html Module Builder) 企画書 v1.3

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
│   ├── header.html        # ルートモジュール
│   ├── footer.html        # ルートモジュール
│   └── components/        # コンポーネント名前空間
│       ├── card.html
│       ├── button.html
│       └── layout/        # サブ名前空間
│           └── sidebar.html
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

### 2. **モジュールのインクルード（名前空間ベースのみ）**
```html
<!-- ルートモジュール参照（modules直下） -->
<module src="header" />
<module src="footer" />

<!-- 名前空間付きモジュール参照（modules/内のパス） -->
<module src="components/card" />
<module src="components/layout/sidebar" />

<!-- 引数付きモジュール -->
<module src="components/card" 
        title="カードタイトル"
        description="説明文です"
        class="featured" />
```

**規則**:
- パス区切りには `/` を使用
- 拡張子 `.html` は省略可能
- 参照パスは常に `modules/` ディレクトリをルートとして解釈
- **相対パス (`./`, `../`) は使用不可**

### 3. **グローバル変数の置換**
```html
<!-- YAMLファイルの内容を参照 -->
<title>{{@site.name}} - ホーム</title>
<footer>&copy; {{@build.year}} {{@site.name}}</footer>

<!-- ネストされた変数の参照 -->
<meta name="author" content="{{@site.author.name}}">
```

### 4. **モジュール引数の置換**
```html
<!-- モジュールファイル内（例: modules/components/card.html） -->
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
| 記法 | 説明 | 解決先（例） |
|------|------|--------------|
| `<module src="name" />` | ルートモジュール | `modules/name.html` |
| `<module src="ns/name" />` | 名前空間付きモジュール | `modules/ns/name.html` |
| `<module src="ns/sub/name" />` | 深い名前空間 | `modules/ns/sub/name.html` |
| `<module src="name.html" />` | 拡張子付き（省略可） | `modules/name.html` |

## 🗂️ グローバル変数定義

変数ファイルは `modules/var/` ディレクトリに配置し、ファイル名が名前空間になります。

```yaml
# modules/var/site.yaml → {{@site.*}} で参照
name: "私のサイト"
url: "https://example.com"
author:
  name: "山田 太郎"
  email: "hello@example.com"
description: "シンプルで美しいウェブサイト"
```

## 🔄 モジュール検索の仕組み

### 検索ルール
1. パスが `/` で始まらない → `modules/` からの相対パスとして扱う
2. 拡張子 `.html` がない場合 → 自動的に追加して検索
3. ファイルが見つからない場合 → エラーを出力

### 例
```html
<!-- 常に modules/ からのパスとして解決 -->
<module src="header" />                 <!-- → modules/header.html -->
<module src="components/card" />        <!-- → modules/components/card.html -->
<module src="components/layout/sidebar" /><!-- → modules/components/layout/sidebar.html -->
<module src="header.html" />            <!-- → modules/header.html -->
```

## ⚙️ ビルドプロセス

### ステップ1: グローバル変数の読み込み
```javascript
// modules/var/ 内の全YAMLファイルを読み込み
variables = {
  site: {       // ← site.yamlの内容
    name: "私のサイト",
    url: "https://example.com",
    // ...
  },
  build: {      // ← build.yamlの内容
    year: 2024,
    // ...
  },
  // ... 他のYAMLファイル
}
```

### ステップ2: ページの処理
1. `pages/` 内の各HTMLファイルに対して：
   - `{{@名前空間.プロパティ}}` を対応するYAMLの値で置換
   - `<module src="名前空間/パス">` を解決（`modules/` からの絶対パス）
   - モジュール内の `{{引数名}}` を渡された引数で置換
2. その他のファイル（CSS、JS、画像など）はそのままコピー

### ステップ3: 出力
- 処理済みのファイルを `dist/` に出力
- 元のディレクトリ構造を維持

## 🎨 使用例

### ページファイル
```html
<!-- pages/index.html -->
<!DOCTYPE html>
<html lang="{{@site.language}}">
<head>
  <meta charset="UTF-8">
  <title>{{@site.name}} - ホーム</title>
  <meta name="description" content="{{@site.description}}">
</head>
<body>
  <module src="header" />
  
  <main>
    <h1>{{@site.name}}へようこそ</h1>
    <module src="components/card"
            title="新着情報"
            description="サイトがオープンしました！" />
  </main>
  
  <module src="footer" />
</body>
</html>
```

### モジュールファイル
```html
<!-- modules/header.html -->
<header>
  <h1>{{@site.name}}</h1>
  <nav>
    <a href="/">ホーム</a>
    <a href="/about.html">About</a>
  </nav>
</header>

<!-- modules/components/card.html -->
<div class="card">
  <h2>{{title}}</h2>
  <p>{{description}}</p>
</div>
```

## 🚀 CLIコマンド

```bash
# 基本ビルド
hmb build

# 開発モード（監視 + サーバー）
hmb dev

# プロジェクト初期化
hmb init [プロジェクト名]

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

## 📋 段階的実装計画

### Phase 1: 基本機能 (v0.1.0)
1. ファイルコピー（`pages/` → `dist/`）
2. 名前空間付きモジュールインクルード（`<module src="namespace/path">`）
3. グローバル変数置換（`{{@namespace.property}}`）
4. モジュール引数置換（`{{arg}}`）
5. 基本的なCLI（`hmb build`）

### Phase 2: 開発体験 (v0.2.0)
1. 開発サーバー（`hmb dev`）
2. ファイル監視と自動リビルド
3. エラーメッセージの改善（未定義変数、存在しないモジュールなど）

### Phase 3: 拡張機能 (v0.3.0)
1. 条件付きレンダリング（`<!-- @if ... -->`）
2. 動的変数（日付、ファイル情報など）
3. アセット最適化（オプション）

## 🎯 目標ユーザー

1. HTML/CSS中心の静的サイト制作者
2. 複雑なフレームワークを避けたい開発者
3. 教育用途（HTML部品化の基本を学ぶ）
4. 小〜中規模のコーポレートサイト

## 💡 特徴まとめ

- ✅ **学習コストほぼゼロ**: HTML知識だけで使える
- ✅ **透過性**: ビルドプロセスが完全に把握できる
- ✅ **一貫性**: モジュール参照は常に名前空間ベースのみ
- ✅ **整理された変数管理**: 名前空間ごとにYAMLファイルで管理
- ✅ **依存最小限**: Node.js標準モジュール中心
- ✅ **出力品質**: 完全な静的HTML、SEO最適

---

この仕様により、モジュール参照は `modules/` をルートとした明確な名前空間パスのみとなり、一貫性とシンプルさが大幅に向上します。まずはPhase 1の実装から始めましょう！
