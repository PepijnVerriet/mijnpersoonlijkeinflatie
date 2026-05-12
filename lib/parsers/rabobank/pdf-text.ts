/**
 * PDF text extraction for Rabobank statements.
 *
 * Uses pdfjs-dist (legacy build, works in Node and the browser) and groups the
 * positioned text fragments into physical lines, keeping x-coordinates so the
 * caller can tell the debit column ("Mutaties af") from the credit column
 * ("Mutaties bij").
 */
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

import type { PdfTextLine } from "@/lib/parsers/types";

/** Fragments whose y-coordinates differ by less than this count as one line. */
const LINE_Y_TOLERANCE = 2;

/**
 * Extract every page's text as an ordered list of {@link PdfTextLine}s
 * (page-major, then top-to-bottom within a page).
 */
export async function extractTextLines(buffer: Buffer): Promise<PdfTextLine[]> {
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const lines: PdfTextLine[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    // Bucket fragments by (rounded) y; merge buckets that are within tolerance.
    const buckets: { y: number; items: { x: number; str: string }[] }[] = [];
    for (const item of content.items) {
      if (!("str" in item) || typeof item.str !== "string") continue;
      if (item.str.trim() === "") continue;
      const x = item.transform[4] as number;
      const y = Math.round(item.transform[5] as number);
      let bucket = buckets.find((b) => Math.abs(b.y - y) <= LINE_Y_TOLERANCE);
      if (!bucket) {
        bucket = { y, items: [] };
        buckets.push(bucket);
      }
      bucket.items.push({ x, str: item.str });
    }

    buckets.sort((a, b) => b.y - a.y);
    for (const bucket of buckets) {
      bucket.items.sort((a, b) => a.x - b.x);
      const text = bucket.items
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      lines.push({
        page: pageNum,
        y: bucket.y,
        items: bucket.items,
        text,
        leftX: bucket.items[0]?.x ?? 0,
      });
    }

    // Free per-page resources.
    page.cleanup();
  }

  await doc.destroy();
  return lines;
}
