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

export function LinkedInIcon({ size = 16, className }: IconProps) {
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
      <rect x="2" y="2" width="12" height="12" rx="1.6" />
      <path
        d="M5 7v4M5 5.2v.1"
        strokeLinecap="round"
      />
      <path
        d="M8 11V7.5c0-.8.5-1.4 1.3-1.4.8 0 1.2.6 1.2 1.4V11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WhatsAppIcon({ size = 16, className }: IconProps) {
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
      <path
        d="M2.5 13.5l.9-2.6A5.5 5.5 0 1 1 5.6 13l-3.1.5z"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 6.4c.1-.3.3-.3.5-.3h.4c.1 0 .3 0 .4.3l.5 1.2c0 .1 0 .2 0 .3l-.3.4c-.1.1-.1.2 0 .3.2.3.6.8 1.1 1.1.4.3.7.4.8.4.1 0 .2 0 .3-.1l.4-.4c.1-.1.2-.1.3-.1l1.1.5c.1.1.2.2.2.3 0 .2 0 .9-.3 1.2-.3.3-1.4.6-2.4.2-.7-.3-1.4-.7-2-1.4-.7-.7-1.1-1.4-1.4-2.1-.4-1-.1-2 .2-2.4z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function XBrandIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M9.5 6.9L14.4 1.2h-1.2L9 6.2 5.6 1.2H1.6l5.1 7.5L1.6 14.8h1.2l4.5-5.3 3.6 5.3h4l-5.3-7.9zm-1.6 1.9l-.5-.7-4.1-5.9h1.8l3.3 4.7.5.7 4.3 6.1H11.4L7.9 8.8z" />
    </svg>
  );
}

export function DownloadIcon({ size = 16, className }: IconProps) {
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
      <path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13.5h10" strokeLinecap="round" />
    </svg>
  );
}
