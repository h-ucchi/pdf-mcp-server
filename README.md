# PDF Tools MCP Server

PDFファイルを操作するためのModel Context Protocol (MCP) サーバーです。Claude Desktop、Claude CodeなどのMCPクライアントから利用できます。

## 特徴

✨ **特定のページだけを除外したPDFファイルを簡単に作成できます**

他のPDFツールでは「特定のページを抽出」する機能は一般的ですが、このツールでは逆に「特定のページだけを除外」する機能を提供しています。例えば、31ページあるPDFから7ページ目だけを削除したい場合、残りの30ページをすべて指定する必要がなく、除外したいページ番号だけを指定できます。

✨ **PDFのページを自由な順序に並び替えられます**

ページの並び替え機能により、PDFのページ順序を簡単に変更できます。スキャンミスで順番が入れ違ったページを修正したり、特定のページを先頭に持ってきたりする作業が直感的に行えます。

## 機能

- **merge_pdfs** - 複数のPDFファイルを1つに結合
- **split_pdf** - PDFを1ページずつのファイルに分割
- **extract_pages** - PDFから特定のページを抽出
- **extract_text** - PDFからテキストを抽出
- **exclude_pages** ⭐ - PDFから特定のページを除外した新しいPDFを作成
- **reorder_pages** - PDFのページを指定した順序に並び替える
- **get_pdf_info** - PDFの情報（ページ数、タイトル、作成者など）を取得

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/h-ucchi/pdf-mcp-server.git
cd pdf-mcp-server

# 依存関係をインストール
npm install

# ビルド
npm run build
```

## 使い方

### Claude Desktop（デスクトップアプリ）での利用

1. Claude Desktopの設定ファイルを開く

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

2. 以下の設定を追加

```json
{
  "mcpServers": {
    "pdf-tools": {
      "command": "node",
      "args": ["/絶対パス/pdf-mcp-server/build/index.js"]
    }
  }
}
```

**重要**: `/絶対パス/`の部分を実際のプロジェクトパスに置き換えてください。

3. Claude Desktopを再起動

4. Claude Desktopで自然言語でPDF操作を依頼

```
PDFから5ページ目を抽出して
複数のPDFを結合して
PDFの7ページ目を除外したファイルを作成して
```

### Claude Code（CLI）での利用

1. MCPサーバーを登録

```bash
claude mcp add --transport stdio pdf-tools -- node /path/to/pdf-mcp-server/build/index.js
```

2. Claude Codeで自然言語でPDF操作を依頼

```
PDFから5ページ目を抽出して
複数のPDFを結合して
PDFの7ページ目を除外したファイルを作成して
PDFの3, 7, 15ページを除いたファイルを作成して
```

3. MCPサーバーの確認

```bash
# 登録されているMCPサーバーを確認
claude mcp list
```

## 使用例

### ページの除外（特徴的な機能）
```
document.pdfから7ページ目を除いたファイルを作成して
→ 31ページから7ページ目だけを削除した30ページのPDFが作成されます

presentation.pdfから3, 7, 15ページを除外して
→ 複数ページを一度に除外できます
```

### ページの抽出
```
document.pdfから5ページ目を抽出して
```

### PDF結合
```
フォルダ内の全PDFを結合して
```

### PDF分割
```
report.pdfを1ページずつ分割して
```

### ページの並び替え
```
PDFの3ページ目と5ページ目を入れ替えて
→ ページの順序を自由に並び替えられます

5ページ目を先頭に持ってきて
→ [5, 1, 2, 3, 4, 6, 7, ...] の順に並び替えられます
```

## 技術スタック

- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) - MCP実装
- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF操作
- [pdf-parse](https://github.com/modesty/pdf-parse) - PDFテキスト抽出
- TypeScript

## 開発

```bash
# ビルド
npm run build

# 開発モード（ファイル監視）
npm run build -- --watch
```

## トラブルシューティング

### Claude Desktopで「Server disconnected」エラーが出る

**原因**: macOSのセキュリティ制限により、Claude DesktopがDesktopフォルダ内のファイルにアクセスできない場合があります。

**解決策**: プロジェクトをホームディレクトリに配置してください。

```bash
# プロジェクトをホームディレクトリに移動
mv ~/Desktop/pdf-mcp-server ~/pdf-mcp-server

# 設定ファイルのパスを更新
# ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "pdf-tools": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/pdf-mcp-server/build/index.js"]
    }
  }
}

# Claude Desktopを再起動
```

### ログの確認方法

Claude Desktopのログを確認して、詳細なエラー情報を取得できます。

```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp-server-pdf-tools.log

# Windows
type %USERPROFILE%\AppData\Local\Claude\Logs\mcp-server-pdf-tools.log
```

### MCPサーバーが起動するか確認

```bash
# ターミナルで直接実行してテスト
node /path/to/pdf-mcp-server/build/index.js
# "PDF Tools MCP Server started" と表示されれば正常
```

## 関連リンク

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://github.com/anthropics/claude-code)
