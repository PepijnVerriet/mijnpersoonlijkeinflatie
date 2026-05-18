import { WarnIcon } from "@/components/ui/icons";

export function CbsFallbackBanner() {
  return (
    <section
      role="status"
      className="mx-auto max-w-[1180px] px-[22px] pt-4 md:px-12 md:pt-6"
    >
      <div className="flex items-center gap-3 rounded-token bg-warn-soft px-4 py-3 text-[13.5px] text-ink-2">
        <WarnIcon size={14} className="shrink-0 text-warn" />
        <span>CBS tijdelijk niet bereikbaar, demo-cijfers getoond.</span>
      </div>
    </section>
  );
}
