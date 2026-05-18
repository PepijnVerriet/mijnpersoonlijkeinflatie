import Link from "next/link";

export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-bg px-[18px] py-[14px] md:px-8 md:py-[18px]">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-serif text-sm font-medium tracking-[-0.01em] text-ink-1 no-underline md:text-base"
      >
        <span
          className="grid h-[22px] w-[22px] place-items-center rounded-[5px] bg-accent font-serif text-[13px] font-semibold italic text-accent-on"
          style={{ fontFeatureSettings: '"ss01"' }}
        >
          π
        </span>
        <span>Mijn Persoonlijke Inflatie</span>
      </Link>
      <nav className="hidden items-center gap-7 md:flex">
        <Link
          href="#"
          className="text-[13.5px] tracking-[-0.005em] text-ink-3 no-underline hover:text-ink-1"
        >
          Methodologie
        </Link>
        <Link
          href="/privacy"
          className="text-[13.5px] tracking-[-0.005em] text-ink-3 no-underline hover:text-ink-1"
        >
          Privacy
        </Link>
        <Link
          href="#"
          className="text-[13.5px] tracking-[-0.005em] text-ink-3 no-underline hover:text-ink-1"
        >
          Over
        </Link>
      </nav>
    </header>
  );
}
