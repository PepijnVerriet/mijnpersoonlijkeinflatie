"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import {
  ArrowIcon,
  FileIcon,
  LockIcon,
  SparkIcon,
  UploadIcon,
  XIcon,
} from "@/components/ui/icons";
import { Spinner } from "./Spinner";

const RabobankExportVisual = dynamic(
  () => import("./RabobankExportVisual"),
  { ssr: false },
);

const MAX_BYTES = 10 * 1024 * 1024;

interface StepUploadProps {
  file: File | null;
  loading: boolean;
  onSelectFile: (file: File) => void;
  onClearFile: () => void;
  onProcess: () => void;
  onBack: () => void;
}

function fmtSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function validateFile(file: File): string | null {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
    return "Alleen PDF-bestanden zijn toegestaan.";
  }
  if (file.size === 0) return "Het bestand is leeg.";
  if (file.size > MAX_BYTES) return "PDF is groter dan 10 MB.";
  return null;
}

export function StepUpload({
  file,
  loading,
  onSelectFile,
  onClearFile,
  onProcess,
  onBack,
}: StepUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validateFile(f);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    onSelectFile(f);
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <section className="mx-auto max-w-[880px] px-[22px] py-8 md:px-12 md:py-16">
      <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
        Upload · Rabobank
      </span>
      <h1 className="m-0 mb-3.5 mt-3 font-serif text-[32px] font-medium tracking-[-0.02em] text-ink-1 md:text-[44px]">
        Upload je bankafschrift
      </h1>
      <p className="m-0 mb-8 max-w-[560px] text-[15px] leading-[1.55] text-ink-2">
        We raden twaalf maanden aan voor het meest accurate resultaat. Eén maand
        werkt ook, maar eenmalige uitgaven kunnen je cijfer dan vertekenen.
      </p>

      {file ? (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[18px] rounded-token border border-border bg-surface p-[22px]">
          <div className="grid h-[42px] w-[42px] place-items-center rounded-lg bg-surface-2 text-ink-2">
            <FileIcon size={18} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14.5px] font-medium text-ink-1">
              {file.name}
            </div>
            <div className="mt-0.5 font-mono text-[12.5px] text-ink-3">
              {fmtSize(file.size)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClearFile();
              if (inputRef.current) inputRef.current.value = "";
              setLocalError(null);
            }}
            disabled={loading}
          >
            <XIcon size={12} /> ander bestand
          </Button>
        </div>
      ) : (
        <label
          htmlFor="file-input"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`block cursor-pointer rounded-token-lg border-[1.5px] border-dashed p-12 text-center transition-colors md:p-[72px] ${
            dragOver
              ? "border-accent bg-accent-soft"
              : "border-border-strong bg-surface hover:border-accent/60 hover:bg-accent-soft/40"
          }`}
        >
          <div className="mx-auto mb-[18px] grid h-14 w-14 place-items-center rounded-xl bg-accent-soft text-accent">
            <UploadIcon size={22} />
          </div>
          <div className="mb-1.5 text-[17px] font-medium tracking-[-0.01em] text-ink-1">
            Sleep je PDF hierheen
          </div>
          <div className="text-[13.5px] text-ink-3">
            of{" "}
            <span className="text-accent underline underline-offset-2">
              klik om te bladeren
            </span>
          </div>
          <div className="mt-7 font-mono text-[11.5px] tracking-[0.04em] text-ink-4">
            PDF · max 10 MB · Rabobank-formaat
          </div>
          <input
            ref={inputRef}
            id="file-input"
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}

      {localError && (
        <p role="alert" className="mt-3 text-sm text-neg">
          {localError}
        </p>
      )}

      {!file && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowHowTo((s) => !s)}
            aria-expanded={showHowTo}
            className="text-[13.5px] text-accent underline underline-offset-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent-soft focus:ring-offset-2 rounded-sm"
          >
            {showHowTo
              ? "Verberg uitleg"
              : "Hoe download ik mijn Rabobank-afschrift?"}
          </button>
          {showHowTo && (
            <div className="mt-4 overflow-hidden rounded-token border border-border bg-surface">
              <RabobankExportVisual />
            </div>
          )}
        </div>
      )}

      <div className="mt-[22px] grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-token bg-surface-2 p-4">
          <div className="mt-0.5 text-accent">
            <LockIcon size={13} />
          </div>
          <div className="text-[12.5px] leading-[1.5] text-ink-2">
            Je PDF wordt in <strong className="font-medium">jouw browser</strong>{" "}
            uitgelezen. Niets gaat naar onze servers behalve geanonimiseerde
            merchant-namen.
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-token bg-surface-2 p-4">
          <div className="mt-0.5 text-accent">
            <SparkIcon size={13} />
          </div>
          <div className="text-[12.5px] leading-[1.5] text-ink-2">
            Heb je twaalf afschriften? In v1 verwerken we er één per upload.
            Meerdere maanden tegelijk komt eraan.
          </div>
        </div>
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          <ArrowIcon size={14} dir="left" /> Vorige
        </Button>
        <div className="flex items-center gap-3">
          {loading && <Spinner label="PDF verwerken…" />}
          <Button
            variant="primary"
            onClick={onProcess}
            disabled={!file || loading}
          >
            Verwerk transacties <ArrowIcon size={14} />
          </Button>
        </div>
      </div>
    </section>
  );
}
