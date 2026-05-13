"use client";

import { useRef, useState, type DragEvent } from "react";
import { Spinner } from "./Spinner";

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
    <section>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        Upload je bankafschrift
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Sleep een Rabobank PDF-afschrift hierheen, of klik om te bladeren. Voor
        een nauwkeurig persoonlijk inflatiecijfer raden we twaalf maanden aan;
        één maand werkt ook, maar geeft een grovere schatting.
      </p>

      <label
        htmlFor="file-input"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed p-6 text-center text-sm transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {file ? (
          <>
            <span className="text-base font-medium text-gray-900">
              {file.name}
            </span>
            <span className="text-xs text-gray-500">{fmtSize(file.size)}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClearFile();
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
            >
              Ander bestand kiezen
            </button>
          </>
        ) : (
          <>
            <span className="text-base text-gray-700">
              Sleep PDF hierheen of klik om te bladeren
            </span>
            <span className="text-xs text-gray-500">
              Maximaal 10 MB, alleen PDF
            </span>
          </>
        )}
        <input
          ref={inputRef}
          id="file-input"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {localError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {localError}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
        >
          Terug
        </button>
        <div className="flex items-center gap-3">
          {loading && <Spinner label="PDF verwerken…" />}
          <button
            type="button"
            onClick={onProcess}
            disabled={!file || loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Verwerk afschrift
          </button>
        </div>
      </div>
    </section>
  );
}
