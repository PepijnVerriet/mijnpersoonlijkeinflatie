import Link from "next/link";

export function Footer() {
  return (
    <footer className="flex flex-col items-start justify-between gap-6 border-t border-border bg-bg px-[18px] py-6 text-[12.5px] text-ink-3 md:flex-row md:px-8 md:py-8">
      <div className="flex flex-wrap gap-x-[18px] gap-y-2">
        <Link href="/faq" className="text-ink-3 no-underline hover:text-ink-1">
          Veelgestelde vragen
        </Link>
        <Link href="/privacy" className="text-ink-3 no-underline hover:text-ink-1">
          Privacy
        </Link>
        <Link
          href="/faq#methodologie"
          className="text-ink-3 no-underline hover:text-ink-1"
        >
          Methodologie
        </Link>
        <Link
          href="/faq#bronnen"
          className="text-ink-3 no-underline hover:text-ink-1"
        >
          Bronnen (CBS)
        </Link>
        <a
          href="https://www.linkedin.com/in/pepijn-verriet-2a6233159/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-3 no-underline hover:text-ink-1"
        >
          Contact
        </a>
      </div>
      <div className="text-left text-ink-4 md:text-right">
        Onafhankelijke insight-tool · Geen officieel CBS-cijfer · v1.0
      </div>
    </footer>
  );
}
