import type { JourSemaine, TypeSemaineCreneau } from "@/generated/prisma/client";
import { JOURS_ORDRE, creneauVisiblePourSemaine } from "./emploiDuTemps";

export interface CreneauMinimal {
  jour: JourSemaine;
  matiere: string;
  typeSemaine: TypeSemaineCreneau;
  rangS1Q: number | null;
}

// Reduit un nom de matiere a ses lettres/chiffres, sans accents ni casse, pour
// comparer un libelle d'emploi du temps (saisi librement) a un nom de matiere
// (souvent abrege ou accentue differemment).
function normaliserMatiere(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function memeMatiere(a: string, b: string): boolean {
  const na = normaliserMatiere(a);
  const nb = normaliserMatiere(b);
  if (!na || !nb) return false;
  return na === nb || na.startsWith(nb) || nb.startsWith(na);
}

// Date (a minuit, heure locale) du prochain cours de `matiereNom` situe
// STRICTEMENT apres `apartir` : les cours du jour meme sont ignores. On balaye
// les 8 prochaines semaines pour couvrir les creneaux en alternance (SIP / SP /
// S1Q). Renvoie null si aucun creneau ne correspond a la matiere.
export function prochaineDateCours(
  creneaux: CreneauMinimal[],
  matiereNom: string,
  apartir: Date = new Date(),
): Date | null {
  if (!matiereNom.trim()) return null;

  const pertinents = creneaux.filter((c) => memeMatiere(c.matiere, matiereNom));
  if (pertinents.length === 0) return null;

  const depart = new Date(apartir);
  depart.setHours(0, 0, 0, 0);

  for (let delta = 1; delta <= 56; delta++) {
    const jour = new Date(depart);
    jour.setDate(jour.getDate() + delta);
    const nomJour = JOURS_ORDRE[(jour.getDay() + 6) % 7]; // 0 = lundi
    const correspond = pertinents.some(
      (c) => c.jour === nomJour && creneauVisiblePourSemaine(c.typeSemaine, c.rangS1Q, jour),
    );
    if (correspond) return jour;
  }
  return null;
}

// Format "YYYY-MM-DD" en heure locale, pour un <input type="date">.
export function formatDateInput(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}
