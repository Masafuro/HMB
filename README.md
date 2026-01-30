# HMB (Html Module Builder)

HTML/CSS制作者のための、最小限の静的サイトジェネレーター。

## 🎯 プロジェクト概要

**HMB (Html Module Builder)** は、HTML部品の再利用と静的サイト生成に特化したビルドツールです。
複雑なフレームワークや学習コストを避け、HTML/CSSの知識だけでコンポーネント指向の開発を可能にします。

## 🧠 設計哲学

1.  **シンプルさを最優先**: 新しい構文を最小限に抑える
2.  **透過性**: 入力から出力までの変換が完全に把握できる
3.  **HTML/CSS制作者の視点**: フロントエンド開発者が追加学習なしで使える

## 🚀 クイックスタート

```bash
# 新しいプロジェクトの作成
# 新しいプロジェクトの作成
npx html-module-builder init my-project

# ディレクトリへ移動
cd my-project

# 開発サーバーの起動 (http://localhost:3000)
npm run dev
```

## 📁 ディレクトリ構造

標準的なディレクトリ構造は以下の通りです。

```
プロジェクトルート/
├── pages/          # ページ群（全ファイルがdist/に出力される）
│   ├── index.html
│   └── about.html
├── modules/        # ビルド素材（出力先にはコピーされません）
│   ├── var/        # グローバル変数定義（YAMLファイル群）
│   │   └── site.yaml      # {{@site.*}} に対応
│   ├── header.html        # コンポーネント
│   └── footer.html
└── dist/           # ビルド出力（自動生成）
```

## 📝 記法ガイド

### 1. モジュールのインクルード
HTMLファイル内で他のHTMLファイルを読み込むことができます。パスは `modules/` ディレクトリが基準になります。

```html
<!-- ルートモジュール参照 (modules/header.html) -->
<module src="header" />

<!-- サブディレクトリ内のモジュール (modules/components/card.html) -->
<module src="components/card" />

<!-- 引数を渡す -->
<module src="components/card" title="About" description="ページ説明" />
```

### 2. 変数の参照
`modules/var/` に配置したYAMLファイルの内容をグローバル変数として利用できます。

```html
<!-- modules/var/site.yaml の name プロパティ -->
<title>{{@site.name}}</title>
```

**YAMLファイルの例 (`modules/var/site.yaml`):**
```yaml
name: "私の素敵なサイト"
author:
  name: "山田 太郎"
```

### 3. モジュール引数
モジュール側では `{{引数名}}` で受け取ります。

```html
<!-- modules/components/card.html -->
<div class="card">
  <h2>{{title}}</h2>
  <p>{{description}}</p>
</div>
```

### 4. 条件付きレンダリング
簡単な条件分岐が可能です。

```html
<!-- @if @site.show_banner -->
<div class="banner">セール開催中！</div>
<!-- @endif -->
```

### 5. 自動注入変数
ビルド時に自動的に注入される変数もあります。

- `{{@build.year}}`: ビルド時の西暦 (例: 2024)
- `{{@build.timestamp}}`: ビルド時のタイムスタンプ
- `{{@build.env}}`: 環境名 (`production` または `development`)

## 🛠 CLIコマンド

```bash
# プロジェクトの初期化
hmb init [プロジェクト名]

# ビルド実行 (dist/ に出力)
hmb build

# 開発モード (ファイル監視 + ローカルサーバー)
hmb dev

# 最適化ビルド (HTMLの圧縮などの最適化を行う)
hmb build --minify

# ヘルプ表示
hmb --help
```

## ⚙️ 設定 (オプション)

プロジェクトルートに `hmb.config.js` を置くことで、デフォルト設定を変更できます。

```javascript
// hmb.config.js
module.exports = {
  sourceDir: 'src/pages',     // ページのソースディレクトリ
  outputDir: 'public',        // 出力先ディレクトリ
  moduleDir: 'src/modules',   // モジュールディレクトリ
  devServer: {
    port: 8080                // 開発サーバーのポート
  },
  minify: true                // 常にMinifyするかどうか
};
```

## 💡 特徴まとめ

- ✅ **学習コストほぼゼロ**: HTML知識だけで使える
- ✅ **コンポーネント指向**: ヘッダーやフッター、カードなどを再利用
- ✅ **データ分離**: テキスト情報はYAMLで管理し、デザインと分離
- ✅ **Minify機能**: 余分な空白やコメントを削除して軽量化
- ✅ **依存最小限**: Node.js標準モジュール中心で軽量

## License

MIT
