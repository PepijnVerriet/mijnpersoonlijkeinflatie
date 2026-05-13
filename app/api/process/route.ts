import { NextResponse } from "next/server";
import { categorizeTransactions } from "@/lib/categorizer";
import {
  InMemoryCache,
  JsonFileCache,
  PRODUCTION_CACHE_PATH,
  type AiCache,
} from "@/lib/categorizer/ai/cache";
import { getAiProvider } from "@/lib/categorizer/ai/provider-factory";
import { parseRabobankPdf } from "@/lib/parsers/rabobank";
import type {
  ProcessResult,
  ProcessTransaction,
} from "@/lib/wizard/types";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

function err(message: string, status: number): Response {
  return NextResponse.json({ error: message }, { status });
}

function resolveCache(): AiCache {
  return process.env.AI_PROVIDER === "anthropic"
    ? new JsonFileCache(PRODUCTION_CACHE_PATH)
    : new InMemoryCache();
}

export async function POST(req: Request): Promise<Response> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return err("Verwacht multipart/form-data met een PDF-bestand.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return err("Geen bestand ontvangen onder veld 'file'.", 400);
  }
  if (file.size === 0) {
    return err("Het geüploade bestand is leeg.", 400);
  }
  if (file.size > MAX_PDF_BYTES) {
    return err("PDF is groter dan 10 MB.", 413);
  }

  const isPdfByName = /\.pdf$/i.test(file.name);
  const isPdfByType = file.type === "application/pdf" || file.type === "";
  if (!isPdfByName && !isPdfByType) {
    return err("Alleen PDF-bestanden zijn toegestaan.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let transactions;
  try {
    transactions = await parseRabobankPdf(buffer);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende parse-fout.";
    return err(`Kon PDF niet lezen: ${message}`, 422);
  }

  if (transactions.length === 0) {
    return err(
      "Geen transacties gevonden in deze PDF. Klopt het dat dit een Rabobank-rekeningafschrift is?",
      422,
    );
  }

  const provider = getAiProvider();
  const cache = resolveCache();
  const categorized = await categorizeTransactions(transactions, {
    aiProvider: provider,
    cache,
  });

  const out: ProcessTransaction[] = categorized.map((r, idx) => ({
    id: String(idx),
    date: r.transaction.date.toISOString(),
    amount: r.transaction.amount,
    merchant: r.transaction.merchant,
    description: r.transaction.description,
    category: r.category,
    categorySource: r.source,
  }));

  const result: ProcessResult = {
    bank: "rabobank",
    transactionCount: out.length,
    categorizedCount: out.filter((t) => t.category !== null).length,
    unknownCount: out.filter((t) => t.category === null).length,
    transactions: out,
  };

  return NextResponse.json(result, { status: 200 });
}
