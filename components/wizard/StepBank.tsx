"use client";

import Link from "next/link";
import type { BankId } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowIcon, CheckIcon, WarnIcon } from "@/components/ui/icons";

interface StepBankProps {
  onSelect: (bank: BankId) => void;
}

type BankStatus = "live" | "soon" | "later";

interface BankOption {
  id: BankId;
  name: string;
  logo: string;
  status: BankStatus;
  note: string;
}

const BANKS: readonly BankOption[] = [
  { id: "rabobank", name: "Rabobank", logo: "RB", status: "live", note: "Volledig ondersteund" },
  { id: "ing", name: "ING", logo: "IN", status: "soon", note: "Binnenkort" },
  { id: "abnamro", name: "ABN AMRO", logo: "AB", status: "soon", note: "Op de planning" },
];

export function StepBank({ onSelect }: StepBankProps) {
  return (
    <section className="mx-auto max-w-[880px] px-[22px] py-8 md:px-12 md:py-16">
      <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
        Welke bank
      </span>
      <h1 className="m-0 mb-3.5 mt-3 font-serif text-[32px] font-medium tracking-[-0.02em] text-ink-1 md:text-[44px]">
        Van welke bank is je afschrift?
      </h1>
      <p className="m-0 mb-9 max-w-[560px] text-[15px] leading-[1.55] text-ink-2">
        De PDF-layouts verschillen per bank, dus we ondersteunen ze één voor één.
        Komt jouw bank er nog niet bij voor? Stuur ons een afschrift en we
        voegen hem toe.
      </p>

      <div className="mb-6 grid gap-2.5">
        {BANKS.map((b) => {
          const disabled = b.status !== "live";
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => !disabled && onSelect(b.id)}
              disabled={disabled}
              aria-label={
                disabled ? `${b.name} (binnenkort beschikbaar)` : `${b.name} kiezen`
              }
              className={`grid grid-cols-[44px_1fr_auto] items-center gap-[18px] rounded-token border bg-surface p-[18px] text-left transition-all md:px-6 md:py-5 ${
                disabled
                  ? "cursor-not-allowed border-border opacity-55"
                  : "cursor-pointer border-border hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              }`}
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-lg font-serif text-base font-medium tracking-[-0.02em] transition-colors ${
                  disabled
                    ? "bg-surface-2 text-ink-2"
                    : "bg-surface-2 text-ink-2"
                }`}
              >
                {b.logo}
              </div>
              <div>
                <div className="text-base font-medium tracking-[-0.01em] text-ink-1">
                  {b.name}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-3">{b.note}</div>
              </div>
              <div className="flex items-center gap-3">
                {b.status === "live" && (
                  <Badge tone="pos" dot>
                    beschikbaar
                  </Badge>
                )}
                {b.status === "soon" && <Badge tone="warn">binnenkort</Badge>}
                {b.status === "later" && <Badge>later</Badge>}
                {!disabled && (
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-on"
                    aria-hidden="true"
                  >
                    <CheckIcon size={12} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[auto_1fr] items-start gap-3.5 rounded-token border-0 bg-surface-2 p-[18px]">
        <div className="mt-0.5 text-ink-3">
          <WarnIcon size={14} />
        </div>
        <div>
          <div className="mb-1 text-[13.5px] font-medium text-ink-1">
            Waarom maar één bank in versie 1?
          </div>
          <div className="text-[13px] leading-[1.55] text-ink-3">
            Bankafschrift-PDFs zijn semi-gestructureerd. We perfectioneren eerst
            Rabobank — daarna voegen we andere banken toe zonder accuracy in te
            leveren.
          </div>
        </div>
      </div>

      <div className="mt-9 flex flex-wrap justify-between gap-3">
        <Link href="/">
          <Button variant="secondary">
            <ArrowIcon size={14} dir="left" /> Terug
          </Button>
        </Link>
        <Button variant="primary" onClick={() => onSelect("rabobank")}>
          Door naar upload <ArrowIcon size={14} />
        </Button>
      </div>
    </section>
  );
}
