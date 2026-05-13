interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start justify-between gap-3 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800"
    >
      <p className="leading-relaxed">{message}</p>
      <div className="flex shrink-0 gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Probeer opnieuw
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Foutmelding sluiten"
            className="rounded px-2 py-1 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
