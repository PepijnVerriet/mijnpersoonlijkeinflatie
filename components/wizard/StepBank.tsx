"use client";

import type { BankId } from "@/lib/types";

interface StepBankProps {
  onSelect: (bank: BankId) => void;
}

interface BankOption {
  id: BankId;
  name: string;
  available: boolean;
}

const BANKS: readonly BankOption[] = [
  { id: "rabobank", name: "Rabobank", available: true },
  { id: "ing", name: "ING", available: false },
  { id: "abnamro", name: "ABN AMRO", available: false },
];

export function StepBank({ onSelect }: StepBankProps) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Welke bank?</h2>
      <p className="mb-6 text-sm text-gray-600">
        Kies de bank waar je het rekeningafschrift van wil uploaden. We
        ondersteunen voorlopig alleen Rabobank PDF-afschriften.
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BANKS.map((bank) => (
          <li key={bank.id}>
            <button
              type="button"
              disabled={!bank.available}
              onClick={() => bank.available && onSelect(bank.id)}
              aria-label={
                bank.available
                  ? `${bank.name} kiezen`
                  : `${bank.name} (binnenkort beschikbaar)`
              }
              className={
                bank.available
                  ? "w-full rounded border border-gray-300 bg-white p-4 text-left text-gray-900 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  : "w-full cursor-not-allowed rounded border border-gray-200 bg-gray-50 p-4 text-left text-gray-400"
              }
            >
              <span className="block text-base font-medium">{bank.name}</span>
              <span className="mt-1 block text-xs">
                {bank.available ? "PDF-afschrift" : "Binnenkort beschikbaar"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
