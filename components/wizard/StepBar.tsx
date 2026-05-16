import type { WizardStep } from "@/lib/wizard/types";

interface StepEntry {
  id: WizardStep;
  label: string;
}

const STEPS: readonly StepEntry[] = [
  { id: "bank", label: "Bank" },
  { id: "upload", label: "Upload" },
  { id: "review", label: "Controleren" },
  { id: "correct", label: "Corrigeren" },
  { id: "result", label: "Resultaat" },
];

interface StepBarProps {
  current: WizardStep;
}

export function StepBar({ current }: StepBarProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  const currentLabel = STEPS[currentIdx]?.label ?? "";
  const total = STEPS.length;

  return (
    <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-bg px-[18px] py-3 text-[11.5px] text-ink-3 md:gap-3 md:px-8 md:py-3.5 md:text-[12.5px]">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.02em] text-ink-3 md:text-[10.5px]">
        Stap {currentIdx + 1} / {total}
      </span>
      <div className="flex flex-1 gap-[3px] overflow-hidden rounded-[2px]">
        {STEPS.map((_, i) => {
          const done = i <= currentIdx;
          return (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-[2px] transition-colors duration-300 ${
                done ? "bg-accent" : "bg-border"
              }`}
            />
          );
        })}
      </div>
      <span className="font-medium text-ink-2">{currentLabel}</span>
    </div>
  );
}
