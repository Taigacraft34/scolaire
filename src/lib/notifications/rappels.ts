import { prisma } from "@/lib/prisma";
import type { TypeRappel } from "@/generated/prisma/client";

// Calcule la date/heure d'envoi d'un rappel a partir de la date du controle.
// Les heures par defaut (8h du matin, veille a 18h, matin meme a 7h) ne sont
// pas configurables individuellement pour l'instant.
function calculerDateEnvoi(dateControle: Date, type: TypeRappel): Date | null {
  const d = new Date(dateControle);
  switch (type) {
    case "J_MOINS_7":
      d.setDate(d.getDate() - 7);
      d.setHours(8, 0, 0, 0);
      return d;
    case "J_MOINS_3":
      d.setDate(d.getDate() - 3);
      d.setHours(8, 0, 0, 0);
      return d;
    case "J_MOINS_2":
      d.setDate(d.getDate() - 2);
      d.setHours(8, 0, 0, 0);
      return d;
    case "VEILLE":
      d.setDate(d.getDate() - 1);
      d.setHours(18, 0, 0, 0);
      return d;
    case "MATIN_MEME":
      d.setHours(7, 0, 0, 0);
      return d;
    case "PERSONNALISE":
      // Necessite une date personnalisee fournie separement ; non generee automatiquement.
      return null;
    default:
      return null;
  }
}

// Genere les rappels par defaut de l'utilisateur pour un controle donne.
// N'ecrase pas les rappels existants (utile a l'auto-detection et a la
// creation manuelle, appelees une seule fois par controle).
export async function genererRappelsPourControle(controleId: string, utilisateurId: string) {
  const [controle, utilisateur] = await Promise.all([
    prisma.controle.findUnique({ where: { id: controleId } }),
    prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
  ]);
  if (!controle || !utilisateur) return;

  for (const type of utilisateur.rappelsParDefaut) {
    const dateEnvoiPrevue = calculerDateEnvoi(controle.date, type);
    if (!dateEnvoiPrevue || dateEnvoiPrevue.getTime() < Date.now()) continue;

    await prisma.notification.create({
      data: {
        utilisateurId,
        controleId,
        type,
        dateEnvoiPrevue,
        canaux: utilisateur.canauxParDefaut,
      },
    });
  }
}
