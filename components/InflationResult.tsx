import type { PersonalInflationResult } from "@/lib/inflation/types";

interface InflationResultProps {
  result: PersonalInflationResult;
}

/** Toont de berekende persoonlijke inflatie t.o.v. het CBS-cijfer. */
export function InflationResult(_props: InflationResultProps) {
  // TODO: render the personal rate, the CBS rate, and per-category contributions.
  return null;
}
