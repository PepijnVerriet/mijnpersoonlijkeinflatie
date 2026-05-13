import Link from "next/link";

export const metadata = {
  title: "Mijn Persoonlijke Inflatie",
  description:
    "Bereken je eigen inflatie op basis van je Rabobank-afschrift en CBS-cijfers.",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Mijn Persoonlijke Inflatie
        </h1>
        <p className="mt-6 text-base text-gray-700 sm:text-lg">
          Reken je eigen inflatiecijfer uit op basis van je werkelijke uitgaven.
          Upload één of meerdere maanden Rabobank-afschriften en zie hoe jouw
          inflatie zich verhoudt tot het officiële CBS-cijfer.
        </p>

        <div className="mt-10">
          <Link
            href="/check"
            className="inline-flex items-center justify-center rounded bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Begin je berekening
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-600">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Privacy
          </h2>
          <p className="leading-relaxed">
            We slaan geen persoonlijke financiële gegevens op. Je bankafschrift
            wordt tijdelijk verwerkt om je inflatie te berekenen en daarna
            direct verwijderd. Voor categorisatie gebruiken we Anthropic&apos;s
            Claude AI; daar worden alleen merchantnamen verzonden, geen
            bedragen of persoonlijke gegevens.
          </p>
        </div>
      </footer>
    </main>
  );
}
