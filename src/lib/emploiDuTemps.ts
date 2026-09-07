export const JOURS_ORDRE = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
] as const;

export type Jour = (typeof JOURS_ORDRE)[number];

export const LIBELLES_JOUR: Record<Jour, string> = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

// Index (0 = lundi) du jour de la semaine d'une date.
export function indexJourSemaine(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// Format "HH:MM" (heure locale) d'une date.
export function heureLocale(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
