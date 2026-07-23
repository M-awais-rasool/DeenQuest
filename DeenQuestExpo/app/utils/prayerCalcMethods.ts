import * as adhan from "adhan";
import type { CalcMethodId, Madhab } from "../types/prayer";

export interface CalcMethodMeta {
  id: CalcMethodId;
  label: string;
  /** Short region hint shown under the label in the picker. */
  hint: string;
}

/** Presets in a sensible display order. `id` maps to an adhan factory name. */
export const CALC_METHODS: CalcMethodMeta[] = [
  { id: "MuslimWorldLeague", label: "Muslim World League", hint: "Global default" },
  { id: "Karachi", label: "Karachi (Univ. of Islamic Sciences)", hint: "Pakistan, India, Bangladesh" },
  { id: "UmmAlQura", label: "Umm al-Qura", hint: "Saudi Arabia" },
  { id: "NorthAmerica", label: "ISNA", hint: "North America" },
  { id: "Egyptian", label: "Egyptian General Authority", hint: "Africa, Levant" },
  { id: "Dubai", label: "Dubai", hint: "UAE" },
  { id: "Qatar", label: "Qatar", hint: "Qatar" },
  { id: "Kuwait", label: "Kuwait", hint: "Kuwait" },
  { id: "Singapore", label: "Singapore", hint: "Singapore, SE Asia" },
  { id: "Turkey", label: "Diyanet", hint: "Turkey" },
  { id: "Tehran", label: "Tehran", hint: "Iran" },
  { id: "MoonsightingCommittee", label: "Moonsighting Committee", hint: "Global (Shafaq)" },
];

export const DEFAULT_METHOD: CalcMethodId = "MuslimWorldLeague";
export const DEFAULT_MADHAB: Madhab = "shafi";

/** Build adhan CalculationParameters for a method + madhab. Falls back to the
 *  default method if a persisted id is somehow unknown at runtime. */
export function buildParams(
  method: CalcMethodId,
  madhab: Madhab,
): adhan.CalculationParameters {
  const factory =
    adhan.CalculationMethod[method] ?? adhan.CalculationMethod[DEFAULT_METHOD];
  const params = factory();
  params.madhab = madhab === "hanafi" ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  return params;
}

export function methodLabel(id: CalcMethodId): string {
  return CALC_METHODS.find((m) => m.id === id)?.label ?? id;
}
