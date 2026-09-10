import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Mode streamer (section 18 des reglages) : masque les informations
// personnelles a l'affichage (nom d'etablissement, nom/email du compte, noms
// des enseignants) sans rien changer en base - reversible a tout moment.
// Mis en cache par requete : plusieurs endroits d'un meme rendu (metadata,
// en-tete, page) le lisent pour le meme utilisateur.
export const estEnModeStreamer = cache(async (utilisateurId: string | undefined): Promise<boolean> => {
  if (!utilisateurId) return false;
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: { modeStreamer: true },
  });
  return utilisateur?.modeStreamer ?? false;
});
