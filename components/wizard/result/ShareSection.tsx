"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  DownloadIcon,
  LinkedInIcon,
  RefreshIcon,
  ShareIcon,
  WhatsAppIcon,
  XBrandIcon,
} from "@/components/ui/icons";
import {
  buildDownloadFilename,
  triggerAnchorDownload,
} from "@/lib/share/download";
import {
  buildLinkedInUrl,
  buildOgImageUrl,
  buildShareSentence,
  buildShareTargetUrl,
  buildWhatsAppUrl,
  buildXUrl,
  SHARE_BASE_URL,
  type ShareParams,
} from "@/lib/share/text";
import { useCanShare } from "@/lib/share/use-can-share";
import { useIsNarrowViewport } from "@/lib/share/use-narrow-viewport";

interface ShareSectionProps {
  params: ShareParams;
  onReset: () => void;
}

const chipClass =
  "inline-flex items-center gap-2 rounded-token-sm border border-border-strong bg-transparent px-4 py-2.5 text-[14px] text-ink-1 transition-colors hover:bg-surface-2 active:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed";

function resolveLocalOrigin(): string {
  // Used only for the OG-image URL behind the Download chip and the
  // Web Share file blob — both stay same-origin so dev builds download
  // the version of the card that the *current* code renders.
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_BASE_URL ?? SHARE_BASE_URL;
}

export function ShareSection({ params, onReset }: ShareSectionProps) {
  const canShare = useCanShare();
  const isNarrow = useIsNarrowViewport();
  // System-share button is only useful on mobile: desktop's share-sheet
  // (Chrome only) is a thin OS picker that most users don't recognise.
  const showSystemShare = canShare && isNarrow;
  const showChannelChips = !showSystemShare;

  const localOrigin = useMemo(resolveLocalOrigin, []);
  const [busy, setBusy] = useState<"download" | "system" | null>(null);

  const targetUrl = useMemo(
    () => buildShareTargetUrl(SHARE_BASE_URL, params),
    [params],
  );
  const sentence = useMemo(() => buildShareSentence(params), [params]);
  const ogImageUrl = useMemo(
    () => buildOgImageUrl(localOrigin, params),
    [localOrigin, params],
  );
  const filename = useMemo(
    () => buildDownloadFilename(params.monthsIncluded),
    [params.monthsIncluded],
  );

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Same-origin `download` attribute is enough on its own; we wrap it so
    // we can show a brief busy state while the (cached) PNG streams down.
    e.preventDefault();
    setBusy("download");
    try {
      triggerAnchorDownload(ogImageUrl, filename);
    } finally {
      setTimeout(() => setBusy(null), 600);
    }
  };

  const handleSystemShare = async () => {
    setBusy("system");
    try {
      const title = "Mijn persoonlijke inflatie";
      let file: File | undefined;
      try {
        const res = await fetch(ogImageUrl);
        if (res.ok) {
          const blob = await res.blob();
          file = new File([blob], filename, { type: "image/png" });
        }
      } catch {
        // Network or fetch failure — fall back to text-only share below.
      }

      const sharePayload: ShareData = {
        title,
        text: sentence,
        url: targetUrl,
      };

      const canShareWithFile =
        file !== undefined &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      try {
        if (canShareWithFile && file) {
          await navigator.share({ ...sharePayload, files: [file] });
        } else {
          await navigator.share(sharePayload);
        }
      } catch (err) {
        // User-cancelled share dialogs raise AbortError; swallow silently.
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          // eslint-disable-next-line no-console
          console.warn("Web Share API failed", err);
        }
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <section className="mx-auto max-w-[1180px] px-[22px] py-6 md:px-12 md:py-8">
        <div className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
          Deel je inflatie
        </div>
        <p className="m-0 mb-6 max-w-[600px] font-serif text-[16px] italic leading-[1.55] text-ink-2 md:text-[18px]">
          Maak het zichtbaar. Anderen kunnen hun eigen cijfer uitrekenen.
        </p>
        <div className="flex flex-wrap gap-2">
          {showChannelChips && (
            <>
              <a
                href={buildLinkedInUrl(targetUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className={chipClass}
              >
                <LinkedInIcon size={16} />
                <span>LinkedIn</span>
              </a>
              <a
                href={buildWhatsAppUrl(targetUrl, sentence)}
                target="_blank"
                rel="noopener noreferrer"
                className={chipClass}
              >
                <WhatsAppIcon size={16} />
                <span>WhatsApp</span>
              </a>
              <a
                href={buildXUrl(targetUrl, sentence)}
                target="_blank"
                rel="noopener noreferrer"
                className={chipClass}
              >
                <XBrandIcon size={14} />
                <span>X</span>
              </a>
            </>
          )}
          {showSystemShare && (
            <button
              type="button"
              onClick={handleSystemShare}
              disabled={busy === "system"}
              className={chipClass}
              aria-busy={busy === "system"}
            >
              <ShareIcon size={14} />
              <span>Deel</span>
            </button>
          )}
          <a
            href={ogImageUrl}
            download={filename}
            onClick={handleDownload}
            className={chipClass}
            aria-busy={busy === "download"}
          >
            <DownloadIcon size={16} />
            <span>Download</span>
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] border-t border-border px-[22px] py-5 pb-8 md:px-12 md:py-4 md:pb-14">
        <Button variant="secondary" onClick={onReset}>
          <RefreshIcon size={13} /> Opnieuw beginnen
        </Button>
      </section>
    </>
  );
}
