"use client";

import { useState } from "react";

const ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Hoe veilig is het om mijn bankafschrift te uploaden?",
    a: "Je PDF wordt in jouw browser-sessie verwerkt en bij het sluiten van de tab volledig vergeten. Wij bewaren geen kopie, draaien geen analyses, sturen niets door naar derden. Voor de AI-categorisatie reizen alleen de namen van handelaars — geen bedragen, geen jouw naam, geen rekeningnummers.",
  },
  {
    q: "Wat als ik geen Rabobank heb?",
    a: "In versie 1 ondersteunen we alleen Rabobank-afschriften omdat de PDF-layouts per bank verschillen. ING en ABN AMRO staan op de planning. Geef je e-mail op die pagina op om bericht te krijgen wanneer jouw bank werkt.",
  },
  {
    q: "Hoe accuraat is dit cijfer?",
    a: "Bij twaalf maanden upload zit je doorgaans binnen 0,3 procentpunt van je 'echte' persoonlijke inflatie. Bij één maand is de marge groter door eenmalige aankopen. Het is een goede benadering — geen audit-grade cijfer.",
  },
  {
    q: "Kan ik dit gebruiken voor mijn belastingaangifte?",
    a: "Nee. Dit is een persoonlijke insight-tool. Het cijfer is geen officieel CBS-cijfer en heeft geen juridische status.",
  },
  {
    q: "Wat gebeurt er na de berekening?",
    a: "Je krijgt je persoonlijke percentage plus een breakdown per categorie. Je kunt het resultaat delen of opnieuw beginnen. Er wordt verder niets opgeslagen — als je over twee weken terugkomt, moet je opnieuw uploaden.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number>(0);

  return (
    <div>
      <div className="mb-7 flex items-end justify-between">
        <h2 className="m-0 font-serif text-[28px] font-medium tracking-[-0.02em] md:text-[36px]">
          Veelgestelde vragen
        </h2>
      </div>
      <div className="border-t border-border">
        {ITEMS.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-border">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-5 text-left text-[15px] font-medium tracking-[-0.01em] text-ink-1 md:text-base"
              >
                <span>{it.q}</span>
                <span
                  className="font-serif text-[22px] font-normal text-ink-3 transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              <div
                className="overflow-hidden transition-[max-height,padding] duration-300 ease-out"
                style={{
                  maxHeight: isOpen ? 240 : 0,
                  paddingBottom: isOpen ? 22 : 0,
                }}
              >
                <p className="m-0 max-w-[760px] text-sm leading-[1.6] text-ink-2">
                  {it.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
