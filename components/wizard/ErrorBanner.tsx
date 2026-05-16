interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mx-auto mt-6 flex max-w-[1180px] items-start justify-between gap-3 rounded-token border border-neg-soft bg-neg-soft px-4 py-3 text-sm text-neg"
    >
      <p className="leading-relaxed">{message}</p>
      <div className="flex shrink-0 gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-token-sm bg-neg px-3 py-1 text-[13px] font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-neg/40"
          >
            Probeer opnieuw
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Foutmelding sluiten"
            className="rounded-token-sm px-2 py-1 text-neg hover:bg-neg/10 focus:outline-none focus:ring-2 focus:ring-neg/40"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
