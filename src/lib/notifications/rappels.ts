import { prisma } from "@/lib/prisma";
import type { TypeRappel } from "@/generated/prisma/client";

// Calcule la date/heure d'envoi d'un rappel a partir de la date du controle.
// Les heures par defaut (8h du matin, veille a 18h, matin meme a 6h30) ne sont
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
      d.setHours(6, 30, 0, 0);
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

// Genere les rappels par defaut de l'utilisateur pour un devoir donne, tant
// qu'il n'est pas marque comme fait. Idempotente : n'ajoute pas de rappel d'un
// type deja programme (elle est rappelee a chaque synchronisation MBN et quand
// le devoir repasse "a faire").
export async function genererRappelsPourDevoir(devoirId: string, utilisateurId: string) {
  const [devoir, utilisateur] = await Promise.all([
    prisma.devoir.findUnique({ where: { id: devoirId }, include: { controleGenere: true } }),
    prisma.utilisateur.findUnique({ where: { id: utilisateurId } }),
  ]);
  if (!devoir || !utilisateur) return;
  if (devoir.statut === "TERMINE") return;
  // Un devoir detecte comme controle est deja couvert par les rappels de controle.
  if (devoir.controleGenere) return;

  const existants = await prisma.notification.findMany({
    where: { devoirId },
    select: { type: true },
  });
  const typesExistants = new Set(existants.map((n) => n.type));

  for (const type of utilisateur.rappelsDevoirParDefaut) {
    if (typesExistants.has(type)) continue;

    const dateEnvoiPrevue = calculerDateEnvoi(devoir.date, type);
    if (!dateEnvoiPrevue || dateEnvoiPrevue.getTime() < Date.now()) continue;

    await prisma.notification.create({
      data: {
        utilisateurId,
        devoirId,
        type,
        dateEnvoiPrevue,
        canaux: utilisateur.canauxDevoirParDefaut,
      },
    });
  }
}

// Supprime les rappels de devoir non encore envoyes (devoir marque fait ou
// supprime).
export async function supprimerRappelsDevoirNonEnvoyes(devoirId: string) {
  await prisma.notification.deleteMany({ where: { devoirId, envoyee: false } });
}
