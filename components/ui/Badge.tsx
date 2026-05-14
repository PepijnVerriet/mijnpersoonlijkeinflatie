import type { ReactNode } from "react";

type Tone = "default" | "accent" | "warn" | "pos" | "neg";

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const tones: Record<Tone, string> = {
  default: "bg-surface-2 text-ink-2",
  accent: "bg-accent-soft text-accent",
  warn: "bg-warn-soft text-warn",
  pos: "bg-pos-soft text-pos",
  neg: "bg-neg-soft text-neg",
};

export function Badge({
  tone = "default",
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[22px] px-[9px] rounded text-[11px] font-medium tracking-[0.01em] ${tones[tone]} ${className}`}
    >
      {dot && (
        <span
          className="rounded-full bg-current"
          style={{ width: 5, height: 5 }}
        />
      )}
      {children}
    </span>
  );
}
