import type { WizardStep } from "@/lib/wizard/types";

interface StepEntry {
  id: WizardStep;
  label: string;
  /** When false the step is still under construction; we mark it cursively. */
  available: boolean;
}

const STEPS: readonly StepEntry[] = [
  { id: "bank", label: "Bank", available: true },
  { id: "upload", label: "Upload", available: true },
  { id: "review", label: "Controleren", available: true },
  { id: "correct", label: "Corrigeren", available: true },
  // `result` is reachable but the inflation visualisation lands in 4e-1c;
  // we keep the available flag true so the indicator highlights it cleanly.
  { id: "result", label: "Resultaat", available: true },
];

interface ProgressIndicatorProps {
  current: WizardStep;
}

export function ProgressIndicator({ current }: ProgressIndicatorProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Wizard voortgang" className="mb-8">
      <ol className="flex flex-wrap gap-2 sm:gap-4">
        {STEPS.map((step, idx) => {
          const isActive = step.id === current;
          const isPast = idx < currentIdx;
          const baseStyle =
            "flex items-center gap-2 rounded px-2 py-1 text-xs sm:text-sm";
          const stateStyle = !step.available
            ? "italic text-gray-400"
            : isActive
              ? "bg-blue-600 text-white"
              : isPast
                ? "text-blue-700"
                : "text-gray-500";
          return (
            <li
              key={step.id}
              aria-current={isActive ? "step" : undefined}
              className={`${baseStyle} ${stateStyle}`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isActive
                    ? "bg-white text-blue-600"
                    : isPast
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              <span>
                {step.label}
                {!step.available && (
                  <span className="ml-1 text-[10px]">(binnenkort)</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
