// Rappels personnalisés récurrents : jours de la semaine numérotés 1 = lundi ...
// 7 = dimanche (comme jourSemaineFuseau), heure "HH:MM".

export const JOURS_SEMAINE = [
  { valeur: 1, libelle: "Lundi", court: "lun." },
  { valeur: 2, libelle: "Mardi", court: "mar." },
  { valeur: 3, libelle: "Mercredi", court: "mer." },
  { valeur: 4, libelle: "Jeudi", court: "jeu." },
  { valeur: 5, libelle: "Vendredi", court: "ven." },
  { valeur: 6, libelle: "Samedi", court: "sam." },
  { valeur: 7, libelle: "Dimanche", court: "dim." },
];

export const HEURE_RAPPEL_PAR_DEFAUT = "07:00";

const MOTIF_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function heureRappelValide(heure: string): boolean {
  return MOTIF_HEURE.test(heure);
}

export function libelleJours(jours: number[]): string {
  const tries = [...jours].sort((a, b) => a - b);
  if (tries.length === 7) return "Tous les jours";
  return tries
    .map((j) => JOURS_SEMAINE.find((jour) => jour.valeur === j)?.court)
    .filter(Boolean)
    .join(" ");
}
