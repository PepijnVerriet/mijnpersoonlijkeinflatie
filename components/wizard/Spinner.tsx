interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"
        aria-hidden="true"
      />
      {label && <span className="text-sm text-ink-2">{label}</span>}
      <span className="sr-only">Bezig met laden…</span>
    </div>
  );
}
