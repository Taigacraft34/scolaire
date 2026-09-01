import type { JourSemaine, TypeSemaineCreneau } from "@/generated/prisma/client";

export const JOURS_ORDRE: JourSemaine[] = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
];

export const LIBELLES_JOUR: Record<JourSemaine, string> = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

export const LIBELLES_TYPE_SEMAINE: Record<TypeSemaineCreneau, string> = {
  CHAQUE_SEMAINE: "Chaque semaine",
  SIP: "SIP — semaine impaire",
  SP: "SP — semaine paire",
  S1Q: "S1Q — une semaine sur quatre",
};

// Numero de semaine ISO-8601 (lundi = premier jour, la semaine 1 est celle
// contenant le premier jeudi de l'annee).
export function numeroSemaineIso(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jourIso = d.getUTCDay() || 7; // lundi=1 ... dimanche=7
  d.setUTCDate(d.getUTCDate() + 4 - jourIso);
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - debutAnnee.getTime()) / 86400000 + 1) / 7);
}

// Determine si un creneau (selon sa frequence) doit apparaitre pour la
// semaine contenant `date`. rangS1Q vaut 1 a 4 et se cale sur numeroSemaineIso
// modulo 4 (pas d'ancrage sur une "semaine 1" d'annee scolaire particuliere).
export function creneauVisiblePourSemaine(
  typeSemaine: TypeSemaineCreneau,
  rangS1Q: number | null | undefined,
  date: Date,
): boolean {
  const numero = numeroSemaineIso(date);
  switch (typeSemaine) {
    case "CHAQUE_SEMAINE":
      return true;
    case "SIP":
      return numero % 2 === 1;
    case "SP":
      return numero % 2 === 0;
    case "S1Q":
      return rangS1Q != null && ((numero - 1) % 4) + 1 === rangS1Q;
    default:
      return true;
  }
}
