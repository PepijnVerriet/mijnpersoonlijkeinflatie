import { Wizard } from "@/components/wizard/Wizard";

export const metadata = {
  title: "Bereken je inflatie | Mijn Persoonlijke Inflatie",
};

export default function CheckPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Wizard />
    </main>
  );
}
