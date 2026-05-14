type IconProps = { size?: number; className?: string };
type ArrowProps = IconProps & { dir?: "right" | "down" | "left" | "up" };

export function ArrowIcon({ size = 14, dir = "right", className }: ArrowProps) {
  const rotation = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
    >
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UploadIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      className={className}
    >
      <path d="M12 16V4M7 9l5-5 5 5M5 18.5h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ size = 13, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      className={className}
    >
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
    </svg>
  );
}

export function FileIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      className={className}
    >
      <path d="M4 2h5l3 3v9H4z" strokeLinejoin="round" />
      <path d="M9 2v3h3" strokeLinejoin="round" />
    </svg>
  );
}

export function WarnIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      className={className}
    >
      <path d="M8 2.5L14 13H2z" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11.2v.5" strokeLinecap="round" />
    </svg>
  );
}

export function SparkIcon({ size = 13, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={className}
    >
      <path d="M8 1.5l1.5 4 4 1.5-4 1.5L8 12.5 6.5 8.5 2.5 7l4-1.5z" strokeLinejoin="round" />
    </svg>
  );
}

export function RefreshIcon({ size = 13, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      className={className}
    >
      <path d="M13 4v3.5H9.5M3 12V8.5h3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4 7.5a4.2 4.2 0 0 1 7.6-1.5L13 7.5M12 8.5a4.2 4.2 0 0 1-7.6 1.5L3 8.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShareIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      className={className}
    >
      <circle cx="4" cy="8" r="1.8" />
      <circle cx="12" cy="4" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <path d="M5.5 7.2l5-2.4M5.5 8.8l5 2.4" strokeLinecap="round" />
    </svg>
  );
}

export function XIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" strokeLinecap="round" />
    </svg>
  );
}
