export interface SeanceMinimale {
  debut: string | Date; // DateTime Prisma (transmis tel quel ou serialise)
  matiere: string;
}

// Reduit un nom de matiere a ses lettres/chiffres, sans accents ni casse, pour
// comparer un libelle d'emploi du temps a un nom de matiere (souvent abrege ou
// accentue differemment d'une source a l'autre).
function normaliserMatiere(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

export function memeMatiere(a: string, b: string): boolean {
  const na = normaliserMatiere(a);
  const nb = normaliserMatiere(b);
  if (!na || !nb) return false;
  return na === nb || na.startsWith(nb) || nb.startsWith(na);
}

// Date (a minuit, heure locale) du prochain cours de `matiereNom` : la premiere
// seance de cette matiere qui commence a partir de demain (les cours du jour
// meme sont ignores). Renvoie null si aucune seance ne correspond.
export function prochaineDateCours(
  seances: SeanceMinimale[],
  matiereNom: string,
  apartir: Date = new Date(),
): Date | null {
  if (!matiereNom.trim()) return null;

  const demain = new Date(apartir);
  demain.setHours(0, 0, 0, 0);
  demain.setDate(demain.getDate() + 1);

  let meilleure: Date | null = null;
  for (const seance of seances) {
    if (!memeMatiere(seance.matiere, matiereNom)) continue;
    const debut = new Date(seance.debut);
    if (debut < demain) continue;
    if (!meilleure || debut < meilleure) meilleure = debut;
  }
  if (!meilleure) return null;

  meilleure.setHours(0, 0, 0, 0);
  return meilleure;
}

// Format "YYYY-MM-DD" en heure locale, pour un <input type="date">.
export function formatDateInput(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}
