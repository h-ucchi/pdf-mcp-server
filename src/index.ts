#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PDFDocument } from "pdf-lib";
import { readFile, writeFile, mkdir } from "fs/promises";

// @ts-ignore
import pdfParse from "pdf-parse";

const server = new Server(
  {
    name: "pdf-tools",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツールの定義
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "merge_pdfs",
      description: "複数のPDFファイルを1つに結合する",
      inputSchema: {
        type: "object",
        properties: {
          input_paths: {
            type: "array",
            items: { type: "string" },
            description: "結合するPDFファイルのパス（配列）",
          },
          output_path: {
            type: "string",
            description: "出力先のファイルパス",
          },
        },
        required: ["input_paths", "output_path"],
      },
    },
    {
      name: "split_pdf",
      description: "PDFを1ページずつのファイルに分割する",
      inputSchema: {
        type: "object",
        properties: {
          input_path: {
            type: "string",
            description: "分割するPDFファイルのパス",
          },
          output_dir: {
            type: "string",
            description: "分割したファイルの出力先フォルダ",
          },
        },
        required: ["input_path", "output_dir"],
      },
    },
    {
      name: "extract_pages",
      description: "PDFから特定のページを抽出する",
      inputSchema: {
        type: "object",
        properties: {
          input_path: {
            type: "string",
            description: "元のPDFファイルのパス",
          },
          pages: {
            type: "array",
            items: { type: "number" },
            description: "抽出するページ番号（1始まり）の配列",
          },
          output_path: {
            type: "string",
            description: "出力先のファイルパス",
          },
        },
        required: ["input_path", "pages", "output_path"],
      },
    },
    {
      name: "extract_text",
      description: "PDFからテキストを抽出する",
      inputSchema: {
        type: "object",
        properties: {
          input_path: {
            type: "string",
            description: "PDFファイルのパス",
          },
        },
        required: ["input_path"],
      },
    },
    {
      name: "exclude_pages",
      description: "PDFから特定のページを除外した新しいPDFを作成する",
      inputSchema: {
        type: "object",
        properties: {
          input_path: {
            type: "string",
            description: "元のPDFファイルのパス",
          },
          exclude_pages: {
            type: "array",
            items: { type: "number" },
            description: "除外するページ番号（1始まり）の配列",
          },
          output_path: {
            type: "string",
            description: "出力先のファイルパス",
          },
        },
        required: ["input_path", "exclude_pages", "output_path"],
      },
    },
    {
      name: "get_pdf_info",
      description: "PDFの情報（ページ数など）を取得する",
      inputSchema: {
        type: "object",
        properties: {
          input_path: {
            type: "string",
            description: "PDFファイルのパス",
          },
        },
        required: ["input_path"],
      },
    },
    {
      name: "reorder_pages",
      description: "PDFのページを指定した順序に並び替える",
      inputSchema: {
        type: "object",
        properties: {
          input_path: {
            type: "string",
            description: "元のPDFファイルのパス",
          },
          page_order: {
            type: "array",
            items: { type: "number" },
            description: "新しいページ順序（1始まり）の配列。例: [1, 3, 2, 5, 4]",
          },
          output_path: {
            type: "string",
            description: "出力先のファイルパス",
          },
        },
        required: ["input_path", "page_order", "output_path"],
      },
    },
  ],
}));

// 実際の処理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // 型ガード
  if (!args) {
    throw new Error("引数が指定されていません");
  }

  try {
    switch (name) {
      case "merge_pdfs":
        return await mergePDFs(
          args.input_paths as string[],
          args.output_path as string
        );

      case "split_pdf":
        return await splitPDF(
          args.input_path as string,
          args.output_dir as string
        );

      case "extract_pages":
        return await extractPages(
          args.input_path as string,
          args.pages as number[],
          args.output_path as string
        );

      case "extract_text":
        return await extractText(args.input_path as string);

      case "exclude_pages":
        return await excludePages(
          args.input_path as string,
          args.exclude_pages as number[],
          args.output_path as string
        );

      case "get_pdf_info":
        return await getPDFInfo(args.input_path as string);

      case "reorder_pages":
        return await reorderPages(
          args.input_path as string,
          args.page_order as number[],
          args.output_path as string
        );

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `エラー: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// PDF結合
async function mergePDFs(inputPaths: string[], outputPath: string) {
  const mergedPdf = await PDFDocument.create();

  for (const path of inputPaths) {
    const pdfBytes = await readFile(path);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  await writeFile(outputPath, mergedPdfBytes);

  return {
    content: [
      {
        type: "text",
        text: `✅ ${inputPaths.length}個のPDFを結合しました: ${outputPath}`,
      },
    ],
  };
}

// PDF分割
async function splitPDF(inputPath: string, outputDir: string) {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const pageCount = pdf.getPageCount();

  await mkdir(outputDir, { recursive: true });

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);

    const newPdfBytes = await newPdf.save();
    const outputPath = `${outputDir}/page_${i + 1}.pdf`;
    await writeFile(outputPath, newPdfBytes);
  }

  return {
    content: [
      {
        type: "text",
        text: `✅ ${pageCount}ページを分割しました: ${outputDir}`,
      },
    ],
  };
}

// ページ抽出
async function extractPages(inputPath: string, pages: number[], outputPath: string) {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const pageIndices = pages.map((p) => p - 1);
  const copiedPages = await newPdf.copyPages(pdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const newPdfBytes = await newPdf.save();
  await writeFile(outputPath, newPdfBytes);

  return {
    content: [
      {
        type: "text",
        text: `✅ ページ ${pages.join(", ")} を抽出しました: ${outputPath}`,
      },
    ],
  };
}

// テキスト抽出
async function extractText(inputPath: string) {
  const dataBuffer = await readFile(inputPath);
  const data = await pdfParse(dataBuffer);

  return {
    content: [
      {
        type: "text",
        text: `📄 抽出したテキスト:\n\n${data.text}`,
      },
    ],
  };
}

// ページ除外
async function excludePages(inputPath: string, excludePages: number[], outputPath: string) {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const totalPages = pdf.getPageCount();
  const newPdf = await PDFDocument.create();

  // 除外するページ以外の全ページを取得（1始まりを0始まりに変換）
  const excludeSet = new Set(excludePages.map(p => p - 1));
  const pagesToKeep = [];
  for (let i = 0; i < totalPages; i++) {
    if (!excludeSet.has(i)) {
      pagesToKeep.push(i);
    }
  }

  const copiedPages = await newPdf.copyPages(pdf, pagesToKeep);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const newPdfBytes = await newPdf.save();
  await writeFile(outputPath, newPdfBytes);

  return {
    content: [
      {
        type: "text",
        text: `✅ ページ ${excludePages.join(", ")} を除外しました（全${totalPages}ページ → ${pagesToKeep.length}ページ）: ${outputPath}`,
      },
    ],
  };
}

// PDF情報取得
async function getPDFInfo(inputPath: string) {
  const pdfBytes = await readFile(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const info = {
    ページ数: pdfDoc.getPageCount(),
    タイトル: pdfDoc.getTitle() || "なし",
    作成者: pdfDoc.getAuthor() || "なし",
    作成日: pdfDoc.getCreationDate()?.toISOString() || "なし",
  };

  return {
    content: [
      {
        type: "text",
        text: `📋 PDF情報:\n${JSON.stringify(info, null, 2)}`,
      },
    ],
  };
}

// ページ並び替え
async function reorderPages(inputPath: string, pageOrder: number[], outputPath: string) {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const totalPages = pdf.getPageCount();

  // ページ番号を1始まりから0始まりに変換
  const pageIndices = pageOrder.map((p) => p - 1);

  // 範囲チェック
  for (const index of pageIndices) {
    if (index < 0 || index >= totalPages) {
      throw new Error(`ページ番号が範囲外です: ${index + 1} (総ページ数: ${totalPages})`);
    }
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const newPdfBytes = await newPdf.save();
  await writeFile(outputPath, newPdfBytes);

  return {
    content: [
      {
        type: "text",
        text: `✅ ページを並び替えました: ${pageOrder.join(", ")} → ${outputPath}`,
      },
    ],
  };
}

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PDF Tools MCP Server started");
}

main();