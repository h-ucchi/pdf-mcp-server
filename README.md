# PDF Tools MCP Server

PDFファイルを操作するためのModel Context Protocol (MCP) サーバーです。Claude CodeなどのMCPクライアントから利用できます。

## 特徴

✨ **特定のページだけを除外したPDFファイルを簡単に作成できます**

他のPDFツールでは「特定のページを抽出」する機能は一般的ですが、このツールでは逆に「特定のページだけを除外」する機能を提供しています。例えば、31ページあるPDFから7ページ目だけを削除したい場合、残りの30ページをすべて指定する必要がなく、除外したいページ番号だけを指定できます。

## 機能

- **merge_pdfs** - 複数のPDFファイルを1つに結合
- **split_pdf** - PDFを1ページずつのファイルに分割
- **extract_pages** - PDFから特定のページを抽出
- **extract_text** - PDFからテキストを抽出
- **exclude_pages** ⭐ - PDFから特定のページを除外した新しいPDFを作成
- **get_pdf_info** - PDFの情報（ページ数、タイトル、作成者など）を取得

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/pdf-mcp-server.git
cd pdf-mcp-server

# 依存関係をインストール
npm install

# ビルド
npm run build
```

## 使い方

### Claude Codeでの利用

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

### MCPサーバーの確認

```bash
# 登録されているMCPサーバーを確認
claude mcp list
```

## 使用例

### ページの除外（特徴的な機能）
```
FindyAI+のPDFから7ページ目を除いたファイルを作成して
→ 31ページから7ページ目だけを削除した30ページのPDFが作成されます

PDFから3, 7, 15ページを除外して
→ 複数ページを一度に除外できます
```

### ページの抽出
```
FindyAI+のPDFから5ページ目を抽出して
```

### PDF結合
```
Desktop/pdf/フォルダ内の全PDFを結合して
```

### PDF分割
```
report.pdfを1ページずつ分割して
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

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 貢献

プルリクエストを歓迎します！バグ報告や機能提案は、Issueで受け付けています。

## 作者

あなたの名前

## 関連リンク

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://github.com/anthropics/claude-code)
