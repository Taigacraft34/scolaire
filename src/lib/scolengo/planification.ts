import { prisma } from "@/lib/prisma";
import { synchroniserUtilisateur } from "./sync";

const SEUILS_MS: Partial<Record<string, number>> = {
  HORAIRE: 60 * 60 * 1000,
  TOUTES_LES_6H: 6 * 60 * 60 * 1000,
  QUOTIDIENNE: 24 * 60 * 60 * 1000,
};

// Appelee par une tache planifiee externe : synchronise chaque utilisateur
// dont la frequence configuree (section 17) est echue depuis la derniere
// synchronisation (manuelle ou automatique).
export async function synchroniserUtilisateursDus() {
  const maintenant = new Date();

  const utilisateurs = await prisma.utilisateur.findMany({
    where: {
      actif: true,
      frequenceSynchronisation: { not: "MANUELLE" },
      scolengoTokenChiffre: { not: null },
    },
  });

  let synchronises = 0;
  const erreurs: string[] = [];

  for (const utilisateur of utilisateurs) {
    const seuilMs = SEUILS_MS[utilisateur.frequenceSynchronisation];
    if (!seuilMs) continue;

    const derniereSynchro = await prisma.synchronisation.findFirst({
      where: { utilisateurId: utilisateur.id },
      orderBy: { demarreeLe: "desc" },
    });

    const due = !derniereSynchro || maintenant.getTime() - derniereSynchro.demarreeLe.getTime() >= seuilMs;
    if (!due) continue;

    try {
      await synchroniserUtilisateur(utilisateur.id);
      synchronises++;
    } catch (e) {
      erreurs.push(`${utilisateur.email} : ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { synchronises, verifies: utilisateurs.length, erreurs };
}
